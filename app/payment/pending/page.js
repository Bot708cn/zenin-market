"use client";

import React from "react";
import Link from "next/link";

export default function PaymentPendingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#05070A", color: "#EAF1FF", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif", padding: 20 }}>
      <div style={{ textAlign: "center", maxWidth: 380 }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, margin: "0 0 10px" }}>Votre paiement est en cours de confirmation.</h1>
        <p style={{ color: "#7C89A6", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>Ça ne prend généralement que quelques instants.</p>
        <Link href="/" style={{ display: "inline-block", padding: "12px 24px", borderRadius: 10, border: "1px solid #1C2436", background: "#0D1220", color: "#EAF1FF", fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
          Retour à la boutique
        </Link>
      </div>
    </div>
  );
}
