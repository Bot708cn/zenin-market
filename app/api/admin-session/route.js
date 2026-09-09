import { NextResponse } from "next/server";
import { getAdminSession } from "../../../lib/requireAdmin";

export async function GET() {
  const session = getAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({ ok: true, pseudo: session.pseudo });
}
