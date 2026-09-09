import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get("ref");
  if (!ref) {
    return NextResponse.json({ ok: false, error: "ref manquant." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("status")
    .eq("payment_reference", ref)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ ok: false, error: "Commande introuvable." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, status: data.status });
}
