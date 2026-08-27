"use client";

import React, { useState, useEffect } from "react";
import { Lock, Mail, ArrowRight } from "lucide-react";
import AdminDashboard from "./dashboard-content";

const SESSION_KEY = "zenin_admin_session";

export default function SecureAdminEntry() {
  const [authed, setAuthed] = useState(false);
  const [pseudo, setPseudo] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAuthed(true);
        setPseudo(parsed.pseudo || "");
      } catch (e) {}
    }
    setChecking(false);
  }, []);

  function handleSuccess(pseudoValue) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ pseudo: pseudoValue }));
    setPseudo(pseudoValue);
    setAuthed(true);
  }

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthed(false);
    setPseudo("");
  }

  if (checking) return null;

  if (!authed) {
    return <LoginFlow onSuccess={handleSuccess} />;
  }

  return <AdminDashboard pseudo={pseudo} onLogout={handleLogout} />;
}

function LoginFlow({ onSuccess }) {
  const [step, setStep] = useState("credentials"); // credentials | universal
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [universalPassword, setUniversalPassword] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitCredentials() {
    if (!email || !password) {
      setError("Merci de remplir les deux champs.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "credentials", email, password }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Identifiants incorrects.");
        setLoading(false);
        return;
      }
      setPseudo(data.pseudo);
      setStep("universal");
    } catch (e) {
      setError("Erreur de connexion. Réessaie.");
    }
    setLoading(false);
  }

  async function submitUniversal() {
    if (!universalPassword) {
      setError("Merci d'entrer le mot de passe universel.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "universal", password: universalPassword }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Mot de passe universel incorrect.");
        setLoading(false);
        return;
      }
      onSuccess(pseudo);
    } catch (e) {
      setError("Erreur de connexion. Réessaie.");
    }
    setLoading(false);
  }

  return (
    <div
      style={{
        minHeight: "100vh", background: "#05070A", color: "#EAF1FF",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Inter', sans-serif", padding: 20,
      }}
    >
      <style>{`* { box-sizing: border-box; } button { font-family: inherit; cursor: pointer; } input { font-family: inherit; }`}</style>

      <div style={{ width: "100%", maxWidth: 360, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <img src="/logo.jpg" alt="" style={{ height: 60, width: "auto" }} />
        </div>

        {step === "credentials" ? (
          <>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, margin: "0 0 6px" }}>
              Connexion admin
            </h2>
            <p style={{ color: "#7C89A6", fontSize: 13, marginBottom: 24 }}>Accès réservé</p>

            <div style={{ position: "relative", marginBottom: 12 }}>
              <Mail size={15} style={{ position: "absolute", left: 14, top: 14, color: "#7C89A6" }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && submitCredentials()}
                style={{
                  width: "100%", padding: "12px 14px 12px 38px", borderRadius: 10,
                  border: "1px solid #1C2436", background: "#0D1220", color: "#EAF1FF", fontSize: 14,
                }}
              />
            </div>

            <div style={{ position: "relative", marginBottom: 14 }}>
              <Lock size={15} style={{ position: "absolute", left: 14, top: 14, color: "#7C89A6" }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe personnel"
                onKeyDown={(e) => e.key === "Enter" && submitCredentials()}
                style={{
                  width: "100%", padding: "12px 14px 12px 38px", borderRadius: 10,
                  border: "1px solid #1C2436", background: "#0D1220", color: "#EAF1FF", fontSize: 14,
                }}
              />
            </div>

            {error && <div style={{ color: "#FF7C7C", fontSize: 12, marginBottom: 12 }}>{error}</div>}

            <button
              onClick={submitCredentials}
              disabled={loading}
              style={{
                width: "100%", padding: "13px", borderRadius: 10, border: "none",
                background: "linear-gradient(135deg,#4FD0FF,#1E5CFF)", color: "#05070A",
                fontWeight: 700, fontSize: 14, opacity: loading ? 0.6 : 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {loading ? "Vérification..." : "Continuer"} {!loading && <ArrowRight size={15} />}
            </button>
          </>
        ) : (
          <>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, margin: "0 0 6px" }}>
              Bienvenue {pseudo}
            </h2>
            <p style={{ color: "#7C89A6", fontSize: 13, marginBottom: 24 }}>
              Veuillez entrer le mot de passe universel
            </p>

            <div style={{ position: "relative", marginBottom: 14 }}>
              <Lock size={15} style={{ position: "absolute", left: 14, top: 14, color: "#7C89A6" }} />
              <input
                type="password"
                value={universalPassword}
                onChange={(e) => setUniversalPassword(e.target.value)}
                placeholder="Mot de passe universel"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && submitUniversal()}
                style={{
                  width: "100%", padding: "12px 14px 12px 38px", borderRadius: 10,
                  border: "1px solid #1C2436", background: "#0D1220", color: "#EAF1FF", fontSize: 14,
                }}
              />
            </div>

            {error && <div style={{ color: "#FF7C7C", fontSize: 12, marginBottom: 12 }}>{error}</div>}

            <button
              onClick={submitUniversal}
              disabled={loading}
              style={{
                width: "100%", padding: "13px", borderRadius: 10, border: "none",
                background: "linear-gradient(135deg,#4FD0FF,#1E5CFF)", color: "#05070A",
                fontWeight: 700, fontSize: 14, opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Vérification..." : "Entrer"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
