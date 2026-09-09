import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { createPapiPayment } from "../../../../lib/papi";

function getSiteUrl() {
  return process.env.PAPI_SITE_URL || "https://zenin-market.vercel.app";
}

export async function POST(request) {
  try {
    const body = await request.json();
    const orderId = body.orderId;
    if (!orderId) {
      return NextResponse.json({ ok: false, error: "orderId manquant." }, { status: 400 });
    }

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("id, total, customer_name, status, payment_reference")
      .eq("id", orderId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error: "Erreur base de données : " + error.message }, { status: 500 });
    }
    if (!order) {
      return NextResponse.json({ ok: false, error: "Commande introuvable." }, { status: 404 });
    }

    if (order.status === "paye") {
      return NextResponse.json({ ok: false, error: "Cette commande est déjà payée." }, { status: 400 });
    }

    const siteUrl = getSiteUrl();
    const paymentReference = order.payment_reference || `PAY-${order.id}-${Date.now().toString(36).toUpperCase()}`;

    const { paymentUrl } = await createPapiPayment({
      amount: Math.round(Number(order.total)),
      successUrl: `${siteUrl}/payment/success?ref=${paymentReference}`,
      failureUrl: `${siteUrl}/payment/failure?ref=${paymentReference}`,
      callbackUrl: `${siteUrl}/api/payment/papi-webhook`,
      clientEmail: undefined,
      description: `Commande Zenin Market ${order.id}`,
    });

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({ payment_reference: paymentReference, status: "en_attente" })
      .eq("id", order.id);

    if (updateError) {
      return NextResponse.json({ ok: false, error: "Erreur mise à jour commande : " + updateError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, paymentUrl });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Erreur serveur : " + (e?.message || String(e)) }, { status: 500 });
  }
}
