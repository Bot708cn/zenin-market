const PAPI_BASE_URL = "https://api.papi.mg";

export async function createPapiPayment({ amount, successUrl, failureUrl, callbackUrl, clientEmail, description }) {
  const apiKey = process.env.PAPI_API_KEY;
  if (!apiKey) {
    throw new Error("PAPI_API_KEY non configurée sur le serveur.");
  }

  const res = await fetch(`${PAPI_BASE_URL}/clients/payment-form`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      AuthentificationKey: apiKey,
    },
    body: JSON.stringify({
      amount,
      change: { currency: "MGA", rate: 1 },
      successUrl,
      failureUrl,
      callbackUrl,
      clientEmail,
      paymentDescription: description,
    }),
  });

  const rawText = await res.text();
  let data;
  try {
    data = JSON.parse(rawText);
  } catch (e) {
    throw new Error(`Papi a renvoyé une réponse non-JSON (statut ${res.status}) : ${rawText.slice(0, 300)}`);
  }

  if (!res.ok) {
    throw new Error(data?.message || data?.error || `Échec Papi (statut ${res.status}) : ${JSON.stringify(data).slice(0, 300)}`);
  }

  const paymentUrl = data?.data?.url;
  if (!paymentUrl) {
    throw new Error("Papi n'a renvoyé aucun lien de paiement. Réponse : " + JSON.stringify(data).slice(0, 300));
  }

  return { paymentUrl, raw: data };
}
