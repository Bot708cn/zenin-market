import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { signSession, verifySession } from "../../../lib/adminSession";
import { SESSION_COOKIE_NAME } from "../../../lib/requireAdmin";

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

    // Jeton intermédiaire prouvant que l'étape 1 est passée — le navigateur
    // n'a plus besoin de renvoyer l'email lui-même à l'étape 2 (ce qui
    // pouvait être modifié par l'autocomplétion du clavier).
    const stepToken = signSession({ email: data.email, pseudo: data.pseudo, purpose: "step1" });

    return NextResponse.json({ ok: true, pseudo: data.pseudo, stepToken });
  }

  // Étape 2 : vérifier le mot de passe universel, puis poser le cookie de session
  if (body.step === "universal") {
    const { password, stepToken } = body;
    const universalPassword = process.env.ADMIN_UNIVERSAL_PASSWORD;

    const verified = verifySession(stepToken);
    if (!verified || verified.purpose !== "step1") {
      return NextResponse.json({ ok: false, error: "Session invalide, recommence depuis le début." }, { status: 401 });
    }

    if (!password || password !== universalPassword) {
      return NextResponse.json({ ok: false, error: "Mot de passe universel incorrect." }, { status: 401 });
    }

    const token = signSession({ email: verified.email, pseudo: verified.pseudo });

    const response = NextResponse.json({ ok: true, pseudo: verified.pseudo });
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 jours
    });
    return response;
  }

  return NextResponse.json({ ok: false, error: "Requête invalide." }, { status: 400 });
}
