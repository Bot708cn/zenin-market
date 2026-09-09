import { NextResponse } from "next/server";

const GEMINI_MODEL = "gemini-3.1-flash-image";

async function urlToBase64(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Impossible de récupérer la photo de l'article.");
  const contentType = res.headers.get("content-type") || "image/jpeg";
  const arrayBuffer = await res.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  return { base64, mimeType: contentType };
}

export async function POST(request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "Clé API Gemini non configurée sur le serveur." }, { status: 500 });
  }

  const formData = await request.formData();
  const userPhoto = formData.get("userPhoto");
  const productImageUrl = formData.get("productImageUrl");
  const productName = formData.get("productName") || "cet article";

  if (!userPhoto || !productImageUrl) {
    return NextResponse.json({ ok: false, error: "Photo manquante." }, { status: 400 });
  }

  try {
    const userArrayBuffer = await userPhoto.arrayBuffer();
    const userBase64 = Buffer.from(userArrayBuffer).toString("base64");
    const userMimeType = userPhoto.type || "image/jpeg";

    const { base64: productBase64, mimeType: productMimeType } = await urlToBase64(productImageUrl);

    const prompt = `Tu reçois deux images : la première montre une personne, la seconde montre un article vestimentaire ("${productName}"). Génère une photo réaliste et de haute qualité de cette même personne (visage, corps, pose, carnation, environnement) portant naturellement cet article. Garde l'identité, les proportions et le cadrage de la personne inchangés. Rends l'article avec ses couleurs et détails fidèles à l'image d'origine. Résultat : une seule photo réaliste, bien éclairée, style photo de mode.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                { inline_data: { mime_type: userMimeType, data: userBase64 } },
                { inline_data: { mime_type: productMimeType, data: productBase64 } },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const message = data?.error?.message || "Erreur lors de la génération.";
      return NextResponse.json({ ok: false, error: message }, { status: response.status });
    }

    const parts = data?.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p) => p.inlineData || p.inline_data);
    const inlineData = imagePart?.inlineData || imagePart?.inline_data;

    if (!inlineData) {
      return NextResponse.json({ ok: false, error: "Aucune image générée. Réessaie avec une autre photo." }, { status: 500 });
    }

    const resultMimeType = inlineData.mimeType || inlineData.mime_type || "image/png";
    const resultUrl = `data:${resultMimeType};base64,${inlineData.data}`;

    return NextResponse.json({ ok: true, image: resultUrl });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || "Erreur inattendue." }, { status: 500 });
  }
}
