import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";
import { getAdminSession } from "../../../../../lib/requireAdmin";

export async function PATCH(request, { params }) {
  const session = getAdminSession();
  if (!session) return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });

  const { status } = await request.json();
  const { error } = await supabaseAdmin.from("orders").update({ status }).eq("id", params.id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const session = getAdminSession();
  if (!session) return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });

  const { error } = await supabaseAdmin.from("orders").delete().eq("id", params.id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
