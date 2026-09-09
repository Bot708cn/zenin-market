import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { getAdminSession } from "../../../../lib/requireAdmin";

export async function POST(request) {
  const session = getAdminSession();
  if (!session) return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  const folder = formData.get("folder") || "images";

  if (!file) return NextResponse.json({ ok: false, error: "Aucun fichier reçu." }, { status: 400 });

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const ext = (file.name || "fichier").split(".").pop();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from("product-media")
    .upload(path, buffer, { contentType: file.type });

  if (uploadError) return NextResponse.json({ ok: false, error: uploadError.message }, { status: 500 });

  const { data } = supabaseAdmin.storage.from("product-media").getPublicUrl(path);
  return NextResponse.json({ ok: true, url: data.publicUrl });
}
