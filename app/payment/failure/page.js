"use client";

import React from "react";
import Link from "next/link";
import { X } from "lucide-react";

export default function PaymentFailurePage() {
  return (
    <div style={{ minHeight: "100vh", background: "#05070A", color: "#EAF1FF", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif", padding: 20 }}>
      <div style={{ textAlign: "center", maxWidth: 380 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#3A1418", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <X size={28} color="#FF7C7C" />
        </div>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, margin: "0 0 10px" }}>Le paiement n'a pas abouti.</h1>
        <p style={{ color: "#7C89A6", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>Aucun montant n'a été débité. Tu peux réessayer quand tu veux.</p>
        <Link href="/" style={{ display: "inline-block", padding: "12px 24px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#4FD0FF,#1E5CFF)", color: "#05070A", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
          Réessayer
        </Link>
      </div>
    </div>
  );
}
