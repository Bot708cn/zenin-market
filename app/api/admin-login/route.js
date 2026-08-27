import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export async function POST(request) {
  const body = await request.json();

  // Étape 1 : vérifier l'email + mot de passe personnel
  if (body.step === "credentials") {
    const { email, password } = body;
    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "Email et mot de passe requis." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("admin_users")
      .select("email, password, pseudo")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (error || !data || data.password !== password) {
      return NextResponse.json({ ok: false, error: "Email ou mot de passe incorrect." }, { status: 401 });
    }

    return NextResponse.json({ ok: true, pseudo: data.pseudo });
  }

  // Étape 2 : vérifier le mot de passe universel
  if (body.step === "universal") {
    const { password } = body;
    const universalPassword = process.env.ADMIN_UNIVERSAL_PASSWORD;

    if (!password || password !== universalPassword) {
      return NextResponse.json({ ok: false, error: "Mot de passe universel incorrect." }, { status: 401 });
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "Requête invalide." }, { status: 400 });
}
