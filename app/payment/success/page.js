"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

export default function PaymentSuccessPage() {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (!ref) {
      setStatus("pending");
      return;
    }
    fetch(`/api/payment/status?ref=${encodeURIComponent(ref)}`)
      .then((r) => r.json())
      .then((data) => {
        setStatus(data.ok && data.status === "paye" ? "confirmed" : "pending");
      })
      .catch(() => setStatus("pending"));
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#05070A", color: "#EAF1FF", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif", padding: 20 }}>
      <div style={{ textAlign: "center", maxWidth: 380 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#4FD0FF,#1E5CFF)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <Check size={28} color="#05070A" />
        </div>
        {status === "confirmed" ? (
          <>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, margin: "0 0 10px" }}>Paiement réussi 🎉</h1>
            <p style={{ color: "#7C89A6", fontSize: 14, lineHeight: 1.6 }}>Votre commande est confirmée.</p>
          </>
        ) : (
          <>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, margin: "0 0 10px" }}>Paiement en cours de confirmation</h1>
            <p style={{ color: "#7C89A6", fontSize: 14, lineHeight: 1.6 }}>On vérifie encore ton paiement — ça ne prend généralement que quelques instants. Rafraîchis cette page dans un moment si besoin.</p>
          </>
        )}
        <Link href="/" style={{ display: "inline-block", marginTop: 24, padding: "12px 24px", borderRadius: 10, border: "1px solid #1C2436", background: "#0D1220", color: "#EAF1FF", fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
          Retour à la boutique
        </Link>
      </div>
    </div>
  );
}
