"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { ShoppingBag, X, Plus, Minus, Check, Copy, ArrowRight, ArrowLeft } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const MOBILE_MONEY = [
  { key: "mvola", label: "Mvola", number: "038 25 298 89" },
  { key: "orange", label: "Orange Money", number: "038 25 298 89" },
  { key: "airtel", label: "Airtel Money", number: "038 25 298 89" },
];
const PAYMENT_ACCOUNT_NAME = "Marie Anna";
const PAYMENT_CONDITIONS = "Envoie le montant exact, aucun remboursement après envoi. Merci de vérifier le numéro avant d'envoyer, erreurs non remboursées.";

const fmt = (n) => Number(n).toLocaleString("fr-FR") + " Ar";

function Logo({ size = 26 }) {
  return <img src="/logo.jpg" alt="Zenin Market" style={{ height: size * 1.9, width: "auto", display: "block", objectFit: "contain" }} />;
}

const GlobalStyle = () => (
  <style>{`
    * { box-sizing: border-box; }
    body { margin: 0; }
    ::selection { background: #1E5CFF; color: #fff; }
    button { font-family: inherit; cursor: pointer; }
    input, select { font-family: inherit; }
  `}</style>
);

export default function StorePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("home"); // home | checkout | confirm
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [filter, setFilter] = useState("Tous");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "", city: "", method: "mvola" });
  const [copied, setCopied] = useState(false);
  const [lastOrderId, setLastOrderId] = useState(null);
  const [formError, setFormError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (!error) setProducts(data || []);
      setLoading(false);
    }
    loadProducts();
  }, []);

  const categories = ["Tous", "T-shirts", "Shorts", "Cosmétiques", "Bijoux"];
  const filtered = filter === "Tous" ? products : products.filter((p) => p.category === filter);

  const cartDetailed = useMemo(
    () => cart.map((c) => ({ ...c, product: products.find((p) => p.id === c.id) })).filter((c) => c.product),
    [cart, products]
  );
  const total = cartDetailed.reduce((s, c) => s + Number(c.product.price) * c.qty, 0);
  const count = cart.reduce((s, c) => s + c.qty, 0);

  function addToCart(product, size) {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.id === product.id && c.size === size);
      if (idx >= 0) {
        const next = [...prev];
        next[idx].qty += 1;
        return next;
      }
      return [...prev, { id: product.id, size, qty: 1 }];
    });
    setCartOpen(true);
  }

  function changeQty(id, size, delta) {
    setCart((prev) =>
      prev.map((c) => (c.id === id && c.size === size ? { ...c, qty: c.qty + delta } : c)).filter((c) => c.qty > 0)
    );
  }

  async function submitOrder() {
    if (!form.name || !form.phone || !form.address || !form.city) {
      setFormError(true);
      return;
    }
    setFormError(false);
    setSubmitting(true);
    const id = "ZM-" + Math.random().toString(36).slice(2, 7).toUpperCase();
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        customer_name: form.name,
        customer_phone: form.phone,
        customer_address: form.address,
        customer_city: form.city,
        payment_method: form.method,
        items: cartDetailed.map((c) => ({ name: c.product.name, size: c.size, qty: c.qty, price: c.product.price })),
        total,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!data.ok) {
      alert("Erreur lors de l'enregistrement de la commande : " + (data.error || "réessaie."));
      return;
    }
    setLastOrderId(id);
    setView("confirm");
    setCartOpen(false);
    setCart([]);
  }

  const selectedMethod = MOBILE_MONEY.find((m) => m.key === form.method);

  return (
    <div style={{ minHeight: "100vh", background: "#05070A", color: "#EAF1FF", fontFamily: "'Inter', sans-serif" }}>
      <GlobalStyle />
      <header
        style={{
          position: "sticky", top: 0, zIndex: 20, display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "16px 20px", background: "rgba(5,7,10,0.85)",
          backdropFilter: "blur(10px)", borderBottom: "1px solid #1C2436",
        }}
      >
        <button
          onClick={() => setView("home")}
          style={{ background: "none", border: "none", padding: 0 }}
        >
          <Logo />
        </button>
        <button
          onClick={() => setCartOpen(true)}
          style={{
            position: "relative", background: "#0D1220", border: "1px solid #1C2436", borderRadius: 999,
            width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <ShoppingBag size={18} color="#EAF1FF" />
          {count > 0 && (
            <span
              style={{
                position: "absolute", top: -4, right: -4, background: "linear-gradient(135deg,#4FD0FF,#1E5CFF)",
                color: "#05070A", fontSize: 11, fontWeight: 700, borderRadius: 999, width: 18, height: 18,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {count}
            </span>
          )}
        </button>
      </header>

      {view === "home" && (
        <>
          <section
            style={{
              position: "relative", padding: "72px 20px 56px", overflow: "hidden",
              textAlign: "center", borderBottom: "1px solid #1C2436",
            }}
          >
            <div
              style={{
                position: "absolute", inset: 0,
                background: "radial-gradient(60% 50% at 50% 0%, rgba(30,92,255,0.22), transparent 70%)",
                pointerEvents: "none",
              }}
            />
            <div style={{ position: "relative" }}>
              <h1
                style={{
                  fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
                  fontSize: "clamp(28px, 6vw, 44px)", lineHeight: 1.15, margin: "0 0 14px",
                }}
              >
                Tout ce dont vous avez besoin, au même endroit. 🇲🇬
                <br />
                <span
                  style={{
                    background: "linear-gradient(135deg,#4FD0FF,#1E5CFF)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  }}
                >
                  livré chez toi.
                </span>
              </h1>
            </div>
          </section>

          <div style={{ display: "flex", gap: 8, padding: "20px 20px 4px", overflowX: "auto" }}>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                style={{
                  padding: "8px 16px", borderRadius: 999,
                  border: "1px solid " + (filter === c ? "transparent" : "#1C2436"),
                  background: filter === c ? "linear-gradient(135deg,#4FD0FF,#1E5CFF)" : "#0D1220",
                  color: filter === c ? "#05070A" : "#7C89A6", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap",
                }}
              >
                {c}
              </button>
            ))}
          </div>

          {loading ? (
            <p style={{ textAlign: "center", color: "#7C89A6", padding: 40 }}>Chargement du catalogue...</p>
          ) : filtered.length === 0 ? (
            <p style={{ textAlign: "center", color: "#7C89A6", padding: 40 }}>Aucun article pour l'instant.</p>
          ) : (
            <section style={{ padding: "16px 20px 40px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} onAdd={addToCart} onOpenDetail={setSelectedProduct} />
              ))}
            </section>
          )}
        </>
      )}

      {view === "checkout" && (
        <CheckoutView
          cartDetailed={cartDetailed} total={total} form={form} setForm={setForm}
          onBack={() => setView("home")} onSubmit={submitOrder} methods={MOBILE_MONEY}
          selectedMethod={selectedMethod} copied={copied} setCopied={setCopied}
          formError={formError} submitting={submitting}
        />
      )}

      {view === "confirm" && (
        <ConfirmView orderId={lastOrderId} onHome={() => setView("home")} />
      )}

      {selectedProduct && (
        <ProductDetail product={selectedProduct} onClose={() => setSelectedProduct(null)} onAdd={addToCart} />
      )}

      {cartOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 30, display: "flex", justifyContent: "flex-end" }}>
          <div onClick={() => setCartOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(5,7,10,0.7)" }} />
          <div
            style={{
              position: "relative", width: "min(360px, 88vw)", height: "100%", background: "#0D1220",
              borderLeft: "1px solid #1C2436", display: "flex", flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 18, borderBottom: "1px solid #1C2436" }}>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}>Panier ({count})</span>
              <button onClick={() => setCartOpen(false)} style={{ background: "none", border: "none", color: "#7C89A6" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
              {cartDetailed.length === 0 && (
                <p style={{ color: "#7C89A6", fontSize: 14, textAlign: "center", marginTop: 40 }}>Ton panier est vide.</p>
              )}
              {cartDetailed.map((c) => (
                <div key={c.id + c.size} style={{ display: "flex", gap: 10, marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid #1C2436" }}>
                  <img src={c.product.images?.[0]} alt="" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{c.product.name}</div>
                    {c.size && <div style={{ fontSize: 12, color: "#7C89A6", marginBottom: 6 }}>Taille {c.size}</div>}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button onClick={() => changeQty(c.id, c.size, -1)} style={{ width: 22, height: 22, borderRadius: 6, border: "1px solid #1C2436", background: "none", color: "#EAF1FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Minus size={12} />
                        </button>
                        <span style={{ fontSize: 13, minWidth: 14, textAlign: "center" }}>{c.qty}</span>
                        <button onClick={() => changeQty(c.id, c.size, 1)} style={{ width: 22, height: 22, borderRadius: 6, border: "1px solid #1C2436", background: "none", color: "#EAF1FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Plus size={12} />
                        </button>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#9FD9FF" }}>{fmt(c.product.price * c.qty)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {cartDetailed.length > 0 && (
              <div style={{ padding: 18, borderTop: "1px solid #1C2436" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                  <span style={{ color: "#7C89A6", fontSize: 14 }}>Total</span>
                  <span style={{ fontWeight: 700, fontSize: 17 }}>{fmt(total)}</span>
                </div>
                <button
                  onClick={() => { setView("checkout"); setCartOpen(false); }}
                  style={{
                    width: "100%", padding: "14px", borderRadius: 12, border: "none",
                    background: "linear-gradient(135deg,#4FD0FF,#1E5CFF)", color: "#05070A",
                    fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >
                  Commander <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, onAdd, onOpenDetail }) {
  const [size, setSize] = useState(product.sizes?.[0] || "");
  return (
    <div style={{ background: "#0D1220", border: "1px solid #1C2436", borderRadius: 14, overflow: "hidden" }}>
      <button
        onClick={() => onOpenDetail(product)}
        style={{ display: "block", width: "100%", padding: 0, border: "none", background: "none", position: "relative" }}
      >
        <div style={{ aspectRatio: "1", overflow: "hidden", background: "#1C2436" }}>
          <img src={product.images?.[0]} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        {((product.images?.length || 0) > 1 || product.video) && (
          <span style={{ position: "absolute", top: 8, right: 8, background: "rgba(5,7,10,0.75)", color: "#9FD9FF", fontSize: 10, fontWeight: 600, padding: "3px 7px", borderRadius: 999 }}>
            {product.video ? "Vidéo" : `${product.images.length} photos`}
          </span>
        )}
      </button>
      <div style={{ padding: 12 }}>
        <button onClick={() => onOpenDetail(product)} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", padding: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3, marginBottom: 4 }}>{product.name}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#9FD9FF", marginBottom: 10 }}>{fmt(product.price)}</div>
        </button>
        {(product.sizes || []).length > 0 && (
          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            style={{ width: "100%", padding: "8px 10px", marginBottom: 8, borderRadius: 8, border: "1px solid #1C2436", background: "#05070A", color: "#EAF1FF", fontSize: 12 }}
          >
            {(product.sizes || []).map((s) => (
              <option key={s} value={s}>Taille {s}</option>
            ))}
          </select>
        )}
        <button
          onClick={() => onAdd(product, size)}
          style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #1E5CFF", background: "rgba(30,92,255,0.12)", color: "#9FD9FF", fontWeight: 600, fontSize: 12 }}
        >
          Ajouter au panier
        </button>
      </div>
    </div>
  );
}

function ProductDetail({ product, onClose, onAdd }) {
  const [activeMedia, setActiveMedia] = useState(0);
  const [size, setSize] = useState(product.sizes?.[0] || "");

  const media = [
    ...(product.video ? [{ type: "video", src: product.video }] : []),
    ...(product.images || []).map((src) => ({ type: "image", src })),
  ];
  const current = media[activeMedia] || media[0];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 40, background: "#05070A", overflowY: "auto" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 5, display: "flex", justifyContent: "flex-end", padding: 14, background: "linear-gradient(180deg, rgba(5,7,10,0.9), transparent)" }}>
        <button onClick={onClose} style={{ background: "rgba(13,18,32,0.9)", border: "1px solid #1C2436", borderRadius: 999, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", color: "#EAF1FF" }}>
          <X size={18} />
        </button>
      </div>

      <div style={{ maxWidth: 480, margin: "-46px auto 0", padding: "0 0 40px" }}>
        <div style={{ aspectRatio: "1", background: "#1C2436", overflow: "hidden" }}>
          {current?.type === "video" ? (
            <video src={current.src} controls autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <img src={current?.src} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
        </div>

        {media.length > 1 && (
          <div style={{ display: "flex", gap: 8, padding: "10px 16px", overflowX: "auto" }}>
            {media.map((m, i) => (
              <button
                key={i}
                onClick={() => setActiveMedia(i)}
                style={{
                  width: 56, height: 56, borderRadius: 8, overflow: "hidden", flexShrink: 0, padding: 0,
                  border: "2px solid " + (i === activeMedia ? "#4FD0FF" : "#1C2436"), position: "relative", background: "#1C2436",
                }}
              >
                {m.type === "video" ? (
                  <video src={m.src} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
                ) : (
                  <img src={m.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
              </button>
            ))}
          </div>
        )}

        <div style={{ padding: "10px 20px 0" }}>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 24, lineHeight: 1.2, margin: "0 0 8px" }}>{product.name}</h2>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#9FD9FF", marginBottom: 14 }}>{fmt(product.price)}</div>

          {product.description && (
            <p style={{ fontFamily: "'Kaushan Script', cursive", fontSize: 20, lineHeight: 1.5, color: "#C9D6EE", margin: "0 0 20px" }}>
              {product.description}
            </p>
          )}

          {(product.sizes || []).length > 0 && (
            <>
              <div style={{ fontSize: 12, color: "#7C89A6", marginBottom: 8 }}>Taille</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 22 }}>
                {(product.sizes || []).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    style={{
                      padding: "9px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                      border: "1px solid " + (size === s ? "transparent" : "#1C2436"),
                      background: size === s ? "linear-gradient(135deg,#4FD0FF,#1E5CFF)" : "#0D1220",
                      color: size === s ? "#05070A" : "#EAF1FF",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </>
          )}

          <button
            onClick={() => { onAdd(product, size); onClose(); }}
            style={{ width: "100%", padding: "15px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#4FD0FF,#1E5CFF)", color: "#05070A", fontWeight: 700, fontSize: 14 }}
          >
            Ajouter au panier
          </button>
        </div>
      </div>
    </div>
  );
}

function CheckoutView({ cartDetailed, total, form, setForm, onBack, onSubmit, methods, selectedMethod, copied, setCopied, formError, submitting }) {
  return (
    <div style={{ padding: "18px 20px 60px", maxWidth: 480, margin: "0 auto" }}>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#7C89A6", fontSize: 13, marginBottom: 18, padding: 0 }}>
        <ArrowLeft size={15} /> Retour au catalogue
      </button>

      <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, margin: "0 0 18px" }}>Finaliser la commande</h2>

      <div style={{ background: "#0D1220", border: "1px solid #1C2436", borderRadius: 12, padding: 14, marginBottom: 20 }}>
        {cartDetailed.map((c) => (
          <div key={c.id + c.size} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
            <span style={{ color: "#7C89A6" }}>{c.qty} × {c.product.name}{c.size ? ` (${c.size})` : ""}</span>
            <span>{fmt(c.product.price * c.qty)}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTop: "1px solid #1C2436", fontWeight: 700 }}>
          <span>Total</span>
          <span style={{ color: "#9FD9FF" }}>{fmt(total)}</span>
        </div>
      </div>

      <div>
        <Field label="Nom complet" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <Field label="Téléphone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required placeholder="03X XX XXX XX" />
        <Field label="Adresse de livraison" value={form.address} onChange={(v) => setForm({ ...form, address: v })} required />
        <Field label="Ville" value={form.city} onChange={(v) => setForm({ ...form, city: v })} required />

        <div style={{ marginTop: 6, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#7C89A6", marginBottom: 8 }}>Moyen de paiement</div>
          <div style={{ display: "flex", gap: 8 }}>
            {methods.map((m) => (
              <button
                type="button" key={m.key} onClick={() => setForm({ ...form, method: m.key })}
                style={{
                  flex: 1, padding: "10px 6px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                  border: "1px solid " + (form.method === m.key ? "transparent" : "#1C2436"),
                  background: form.method === m.key ? "linear-gradient(135deg,#4FD0FF,#1E5CFF)" : "#0D1220",
                  color: form.method === m.key ? "#05070A" : "#EAF1FF",
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: "rgba(30,92,255,0.10)", border: "1px solid #1E5CFF", borderRadius: 12, padding: 14, marginBottom: 18 }}>
          <div style={{ fontSize: 12, color: "#9FD9FF", marginBottom: 8 }}>1. Envoie {fmt(total)} via {selectedMethod.label} au numéro :</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, letterSpacing: 1 }}>{selectedMethod.number}</span>
            <button
              type="button"
              onClick={() => { navigator.clipboard?.writeText(selectedMethod.number); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
              style={{ background: "none", border: "1px solid #1C2436", borderRadius: 8, padding: "6px 10px", color: "#EAF1FF", fontSize: 11, display: "flex", alignItems: "center", gap: 5 }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copié" : "Copier"}
            </button>
          </div>
          <div style={{ fontSize: 12, color: "#9FD9FF", marginTop: 4 }}>Au nom de : {PAYMENT_ACCOUNT_NAME}</div>
          <div style={{ fontSize: 11, color: "#7C89A6", marginTop: 10, lineHeight: 1.5 }}>{PAYMENT_CONDITIONS}</div>
          <div style={{ fontSize: 12, color: "#7C89A6", marginTop: 12 }}>
            2. Après paiement, envoie ta capture d'écran de confirmation sur notre page Facebook Zenin Market — on valide et on lance ta commande.
          </div>
        </div>

        {formError && (
          <div style={{ color: "#FF7C7C", fontSize: 12, marginBottom: 12, textAlign: "center" }}>
            Merci de remplir tous les champs avant de continuer.
          </div>
        )}

        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          style={{ width: "100%", padding: "15px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#4FD0FF,#1E5CFF)", color: "#05070A", fontWeight: 700, fontSize: 14, opacity: submitting ? 0.6 : 1 }}
        >
          {submitting ? "Enregistrement..." : "Confirmer ma commande"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, required, placeholder }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 12, color: "#7C89A6", display: "block", marginBottom: 6 }}>{label}</label>
      <input
        value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder}
        style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #1C2436", background: "#0D1220", color: "#EAF1FF", fontSize: 14 }}
      />
    </div>
  );
}

function ConfirmView({ orderId, onHome }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ padding: "80px 20px", textAlign: "center", maxWidth: 420, margin: "0 auto" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#4FD0FF,#1E5CFF)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
        <Check size={28} color="#05070A" />
      </div>
      <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, margin: "0 0 10px" }}>Commande enregistrée</h2>
      {orderId && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 14 }}>
          <span style={{ color: "#9FD9FF", fontSize: 13, fontWeight: 600 }}>Référence : {orderId}</span>
          <button
            onClick={() => { navigator.clipboard?.writeText(orderId); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            style={{ background: "none", border: "1px solid #1C2436", borderRadius: 8, padding: "5px 9px", color: "#EAF1FF", fontSize: 11, display: "flex", alignItems: "center", gap: 5 }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copié" : "Copier"}
          </button>
        </div>
      )}
      <p style={{ color: "#7C89A6", fontSize: 14, lineHeight: 1.6, marginBottom: 26 }}>
        N'oublie pas d'envoyer ta preuve de paiement sur notre page Facebook Zenin Market pour qu'on valide ta commande et lance la livraison.
      </p>
      <button onClick={onHome} style={{ padding: "12px 24px", borderRadius: 10, border: "1px solid #1C2436", background: "#0D1220", color: "#EAF1FF", fontWeight: 600, fontSize: 13 }}>
        Retour au catalogue
      </button>
    </div>
  );
}
