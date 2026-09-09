import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

// NOTE IMPORTANTE : le format exact du payload envoyé par Papi sur ce webhook
// n'a pas pu être confirmé via la documentation officielle au moment de
// l'implémentation. Ce webhook enregistre donc systématiquement le payload
// brut reçu (colonne payment_webhook_raw) pour permettre un ajustement précis
// après le premier test réel en sandbox.

function extractField(payload, candidates) {
  for (const key of candidates) {
    const value = key.split(".").reduce((obj, k) => (obj && typeof obj === "object" ? obj[k] : undefined), payload);
    if (value !== undefined && value !== null) return value;
  }
  return null;
}

export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Payload JSON invalide." }, { status: 400 });
  }

  console.log("[Papi webhook] Payload reçu :", JSON.stringify(payload));

  const reference = extractField(payload, [
    "paymentReference", "reference", "clientReference", "data.reference", "data.paymentReference",
  ]);
  const rawStatus = extractField(payload, [
    "status", "paymentStatus", "data.status", "data.paymentStatus",
  ]);
  const papiReference = extractField(payload, ["id", "paymentId", "data.id", "data.paymentId"]);
  const method = extractField(payload, ["paymentMethod", "method", "data.paymentMethod", "data.method"]);
  const amount = extractField(payload, ["amount", "data.amount"]);

  if (!reference) {
    console.error("[Papi webhook] Aucune référence de commande trouvée dans le payload.");
    return NextResponse.json({ ok: false, error: "Référence introuvable dans le payload." }, { status: 400 });
  }

  const { data: order, error: findError } = await supabaseAdmin
    .from("orders")
    .select("id, total, status, payment_reference")
    .eq("payment_reference", reference)
    .maybeSingle();

  if (findError || !order) {
    console.error("[Papi webhook] Commande introuvable pour la référence :", reference);
    return NextResponse.json({ ok: false, error: "Commande introuvable." }, { status: 404 });
  }

  if (order.status === "paye") {
    return NextResponse.json({ ok: true, note: "Déjà traitée." });
  }

  const statusText = String(rawStatus || "").toUpperCase();
  const isSuccess = ["SUCCESS", "PAID", "COMPLETED", "SUCCESSFUL"].includes(statusText);
  const isFailure = ["FAILED", "FAILURE", "CANCELLED", "EXPIRED"].includes(statusText);

  if (amount !== null && Number(amount) !== Number(order.total)) {
    console.error("[Papi webhook] Montant incohérent :", amount, "attendu :", order.total);
    return NextResponse.json({ ok: false, error: "Montant incohérent." }, { status: 400 });
  }

  const update = {
    payment_webhook_raw: payload,
    papi_reference: papiReference || null,
    payment_method: method || null,
  };

  if (isSuccess) {
    update.status = "paye";
    update.paid_at = new Date().toISOString();
  } else if (isFailure) {
    update.status = "echec_paiement";
  }

  await supabaseAdmin.from("orders").update(update).eq("id", order.id);

  return NextResponse.json({ ok: true });
}
