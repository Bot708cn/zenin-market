import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { getAdminSession } from "../../../../lib/requireAdmin";

export async function GET() {
  const session = getAdminSession();
  if (!session) return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });

  const { data, error } = await supabaseAdmin.from("products").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, products: data });
}

export async function POST(request) {
  const session = getAdminSession();
  if (!session) return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });

  const payload = await request.json();
  const { error } = await supabaseAdmin.from("products").insert(payload);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
