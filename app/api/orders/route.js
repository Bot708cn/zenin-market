import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export async function POST(request) {
  const body = await request.json();
  const { id, customer_name, customer_phone, customer_address, customer_city, payment_method, items, total } = body;

  if (!id || !customer_name || !customer_phone || !customer_address || !customer_city || !items || !total) {
    return NextResponse.json({ ok: false, error: "Champs manquants." }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("orders").insert({
    id,
    status: "en_attente",
    customer_name,
    customer_phone,
    customer_address,
    customer_city,
    payment_method,
    items,
    total,
  });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
