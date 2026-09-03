import crypto from "crypto";

const SECRET = process.env.ADMIN_SESSION_SECRET;
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 jours

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function safeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function signSession(payload) {
  const data = { ...payload, exp: Date.now() + SESSION_DURATION_MS };
  const body = base64url(JSON.stringify(data));
  const sig = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifySession(token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expectedSig = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  if (!safeEqual(sig, expectedSig)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}
