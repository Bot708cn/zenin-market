"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { ShoppingBag, X, Plus, Minus, Check, Copy, ArrowRight, ArrowLeft, Search, LayoutGrid, Shirt, Package, Sparkles, Gem } from "lucide-react";
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
  return <img src="/logo-full.png" alt="Zenin Market" style={{ height: size * 1.9, width: "auto", display: "block", objectFit: "contain" }} />;
}

const GlobalStyle = () => (
  <style>{`
    * { box-sizing: border-box; }
    body { margin: 0; }
    ::selection { background: #1E5CFF; color: #fff; }
    button { font-family: inherit; cursor: pointer; transition: transform 0.15s ease, opacity 0.15s ease; }
    button:active { transform: scale(0.96); }
    input, select { font-family: inherit; }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(14px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.94); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes slideInRight {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
    @keyframes pulseGlow {
      0%, 100% { opacity: 0.55; }
      50% { opacity: 1; }
    }
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes popIn {
      0% { transform: scale(1); }
      40% { transform: scale(1.35); }
      100% { transform: scale(1); }
    }

    .zn-fade-up { animation: fadeInUp 0.5s ease both; }
    .zn-fade-in { animation: fadeIn 0.3s ease both; }
    .zn-scale-in { animation: scaleIn 0.25s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
    .zn-slide-in { animation: slideInRight 0.28s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
    .zn-pop { animation: popIn 0.35s ease; }

    .zn-card {
      transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
    }
    .zn-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 28px rgba(30,92,255,0.18);
      border-color: #2A4A8A;
    }
    .zn-card:hover .zn-card-img {
      transform: scale(1.06);
    }
    .zn-card-img {
      transition: transform 0.4s ease;
    }

    .zn-skeleton {
      background: linear-gradient(90deg, #0D1220 25%, #16203a 37%, #0D1220 63%);
      background-size: 400% 100%;
      animation: shimmer 1.4s ease infinite;
    }
  `}</style>
);

export default function StorePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("home"); // home | checkout | confirm
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [filter, setFilter] = useState("Tous");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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

  const categories = [
    { key: "Tous", label: "Tous", icon: LayoutGrid },
    { key: "T-shirts", label: "T-shirts", icon: Shirt },
    { key: "Shorts", label: "Shorts", icon: Package },
    { key: "Cosmétiques", label: "Cosmétiques", icon: Sparkles },
    { key: "Bijoux", label: "Bijoux", icon: Gem },
  ];
  const byCategory = filter === "Tous" ? products : products.filter((p) => p.category === filter);
  const filtered = searchQuery.trim()
    ? byCategory.filter((p) => p.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : byCategory;

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
        payment_method: "papi",
        items: cartDetailed.map((c) => ({ name: c.product.name, size: c.size, qty: c.qty, price: c.product.price })),
        total,
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      setSubmitting(false);
      alert("Erreur lors de l'enregistrement de la commande : " + (data.error || "réessaie."));
      return;
    }

    // Commande créée — on lance maintenant le paiement Papi et on redirige
    const payRes = await fetch("/api/payment/create-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: id }),
    });
    const payData = await payRes.json();
    setSubmitting(false);

    if (!payData.ok || !payData.paymentUrl) {
      alert("Erreur lors de la création du paiement : " + (payData.error || "réessaie."));
      return;
    }

    setCart([]);
    window.location.href = payData.paymentUrl;
  }

  const selectedMethod = MOBILE_MONEY.find((m) => m.key === form.method);

  return (
    <div style={{ minHeight: "100vh", background: "#05070A", color: "#EAF1FF", fontFamily: "'Inter', sans-serif", position: "relative" }}>
      <GlobalStyle />
      <video
        autoPlay muted loop playsInline
        src="https://res.cloudinary.com/qubuogpp/video/upload/v1788823649/0a3bf7d7-7db3-4ff5-9b9d-39b1e821bba2.mp4"
        style={{
          position: "fixed", inset: 0, width: "100%", height: "100%", objectFit: "cover",
          opacity: 0.18, zIndex: 0, pointerEvents: "none",
        }}
      />
      <div style={{ position: "fixed", inset: 0, background: "linear-gradient(180deg, #05070A 0%, rgba(5,7,10,0.6) 40%, rgba(5,7,10,0.85) 100%)", zIndex: 0, pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 1 }}>
      <header
        style={{
          position: "sticky", top: 0, zIndex: 20, display: "flex", flexDirection: "column",
          background: "rgba(5,7,10,0.85)", backdropFilter: "blur(10px)", borderBottom: "1px solid #1C2436",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px" }}>
          <button
            onClick={() => setView("home")}
            style={{ background: "none", border: "none", padding: 0 }}
          >
            <Logo />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setSearchOpen((v) => !v)}
              style={{
                background: searchOpen ? "linear-gradient(135deg,#4FD0FF,#1E5CFF)" : "#0D1220",
                border: "1px solid #1C2436", borderRadius: 999,
                width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Search size={18} color={searchOpen ? "#05070A" : "#EAF1FF"} />
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
                  key={count}
                  className="zn-pop"
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
          </div>
        </div>
        {searchOpen && (
          <div className="zn-fade-in" style={{ padding: "0 20px 14px" }}>
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un article..."
              style={{
                width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #1C2436",
                background: "#0D1220", color: "#EAF1FF", fontSize: 14,
              }}
            />
          </div>
        )}
      </header>

      {view === "home" && (
        <>
          <section
            style={{
              position: "relative", padding: "72px 20px 56px", overflow: "hidden",
              textAlign: "center", borderBottom: "1px solid #1C2436",
            }}
          >
            <video
              autoPlay muted loop playsInline
              src="https://res.cloudinary.com/qubuogpp/video/upload/3bc14a33-99ff-46e1-b010-735abdaee246.mp4"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.75 }}
            />
            <div
              style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(180deg, rgba(5,7,10,0.15) 0%, rgba(5,7,10,0.55) 75%, #05070A 100%), radial-gradient(60% 50% at 50% 0%, rgba(30,92,255,0.15), transparent 70%)",
                pointerEvents: "none",
                animation: "pulseGlow 5s ease-in-out infinite",
              }}
            />
            <div className="zn-fade-up" style={{ position: "relative" }}>
              <img src="/logo-wordmark.png" alt="Zenin Market" style={{ height: "clamp(70px, 18vw, 130px)", width: "auto", margin: "0 auto 12px", display: "block" }} />
              <p
                style={{
                  fontFamily: "'Inter', sans-serif", fontWeight: 500, color: "#9FB0C9",
                  fontSize: "clamp(13px, 3vw, 16px)", lineHeight: 1.4, margin: 0,
                }}
              >
                Tout ce dont vous avez besoin, au même endroit. 🇲🇬{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg,#4FD0FF,#1E5CFF)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 700,
                  }}
                >
                  livré chez toi.
                </span>
              </p>
            </div>
          </section>

          <div style={{ padding: "22px 20px 6px" }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, margin: "0 0 14px" }}>Catégories</h2>
            <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 4 }}>
              {categories.map((c) => {
                const Icon = c.icon;
                const active = filter === c.key;
                return (
                  <button
                    key={c.key}
                    onClick={() => setFilter(c.key)}
                    style={{
                      background: "none", border: "none", display: "flex", flexDirection: "column",
                      alignItems: "center", gap: 8, flexShrink: 0, width: 66,
                    }}
                  >
                    <div
                      style={{
                        width: 58, height: 58, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                        background: active ? "linear-gradient(135deg,#4FD0FF,#1E5CFF)" : "#0D1220",
                        border: "1px solid " + (active ? "transparent" : "#1C2436"),
                        boxShadow: active ? "0 0 22px rgba(30,92,255,0.55)" : "none",
                        transition: "all 0.25s ease",
                      }}
                    >
                      <Icon size={22} color={active ? "#05070A" : "#7C89A6"} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: active ? "#EAF1FF" : "#7C89A6" }}>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <section style={{ padding: "16px 20px 40px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="zn-skeleton" style={{ borderRadius: 14, aspectRatio: "0.78", border: "1px solid #1C2436" }} />
              ))}
            </section>
          ) : filtered.length === 0 ? (
            <p className="zn-fade-in" style={{ textAlign: "center", color: "#7C89A6", padding: 40 }}>Aucun article pour l'instant.</p>
          ) : (
            <section style={{ padding: "16px 20px 40px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {filtered.map((p, i) => (
                <ProductCard key={p.id} product={p} onAdd={addToCart} onOpenDetail={setSelectedProduct} index={i} />
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
          <div onClick={() => setCartOpen(false)} className="zn-fade-in" style={{ position: "absolute", inset: 0, background: "rgba(5,7,10,0.7)" }} />
          <div
            className="zn-slide-in"
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
    </div>
  );
}

function ProductCard({ product, onAdd, onOpenDetail, index = 0 }) {
  const [size, setSize] = useState(product.sizes?.[0] || "");
  return (
    <div
      className="zn-card zn-fade-up"
      style={{ background: "#0D1220", border: "1px solid #1C2436", borderRadius: 14, overflow: "hidden", animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <button
        onClick={() => onOpenDetail(product)}
        style={{ display: "block", width: "100%", padding: 0, border: "none", background: "none", position: "relative" }}
      >
        <div style={{ aspectRatio: "0.82", overflow: "hidden", background: "#1C2436" }}>
          <img className="zn-card-img" src={product.images?.[0]} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        {((product.images?.length || 0) > 1 || product.video) && (
          <span style={{ position: "absolute", top: 8, right: 8, background: "rgba(5,7,10,0.75)", color: "#9FD9FF", fontSize: 10, fontWeight: 600, padding: "3px 7px", borderRadius: 999 }}>
            {product.video ? "Vidéo" : `${product.images.length} photos`}
          </span>
        )}
      </button>
      <div style={{ padding: "9px 10px" }}>
        <button onClick={() => onOpenDetail(product)} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", padding: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3, marginBottom: 3 }}>{product.name}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#9FD9FF", marginBottom: 8 }}>{fmt(product.price)}</div>
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
    <div className="zn-fade-in" style={{ position: "fixed", inset: 0, zIndex: 40, background: "#05070A", overflowY: "auto" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 5, display: "flex", justifyContent: "flex-end", padding: 14, background: "linear-gradient(180deg, rgba(5,7,10,0.9), transparent)" }}>
        <button onClick={onClose} style={{ background: "rgba(13,18,32,0.9)", border: "1px solid #1C2436", borderRadius: 999, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", color: "#EAF1FF" }}>
          <X size={18} />
        </button>
      </div>

      <div className="zn-scale-in" style={{ maxWidth: 480, margin: "-46px auto 0", padding: "0 0 40px" }}>
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
            style={{ width: "100%", padding: "15px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#4FD0FF,#1E5CFF)", color: "#05070A", fontWeight: 700, fontSize: 14, marginBottom: 12 }}
          >
            Ajouter au panier
          </button>

          {product.category !== "Cosmétiques" && (
            <TryOnPanel product={product} />
          )}
        </div>
      </div>
    </div>
  );
}

function TryOnPanel({ product }) {
  const [open, setOpen] = useState(false);
  const [userPhoto, setUserPhoto] = useState(null);
  const [userPhotoPreview, setUserPhotoPreview] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUserPhoto(file);
    setUserPhotoPreview(URL.createObjectURL(file));
    setResultImage(null);
    setError("");
  }

  async function generate() {
    if (!userPhoto) return;
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("userPhoto", userPhoto);
      formData.append("productImageUrl", product.images?.[0]);
      formData.append("productName", product.name);
      const res = await fetch("/api/try-on", { method: "POST", body: formData });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Échec de la génération. Réessaie.");
      } else {
        setResultImage(data.image);
      }
    } catch (e) {
      setError("Erreur de connexion. Réessaie.");
    }
    setLoading(false);
  }

  return (
    <div style={{ border: "1px solid #1C2436", borderRadius: 12, padding: 14, background: "#0D1220" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "none", border: "none", color: "#9FD9FF", fontWeight: 600, fontSize: 13, padding: 0,
        }}
      >
        ✨ Essayer virtuellement
        <span style={{ color: "#7C89A6", fontSize: 18 }}>{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="zn-fade-in" style={{ marginTop: 14 }}>
          {!resultImage && (
            <>
              {userPhotoPreview ? (
                <img src={userPhotoPreview} alt="" style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 10, marginBottom: 10 }} />
              ) : (
                <p style={{ fontSize: 12, color: "#7C89A6", marginBottom: 10, lineHeight: 1.5 }}>
                  Upload une photo de toi (de face, bien éclairée) pour voir à quoi ressemblerait cet article sur toi.
                </p>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                style={{
                  width: "100%", padding: "11px", borderRadius: 10, border: "1px dashed #1C2436",
                  background: "#05070A", color: "#7C89A6", fontSize: 13, marginBottom: 10,
                }}
              >
                {userPhoto ? "Changer la photo" : "Choisir une photo"}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />

              {error && <div style={{ color: "#FF7C7C", fontSize: 12, marginBottom: 10 }}>{error}</div>}

              <button
                onClick={generate}
                disabled={!userPhoto || loading}
                style={{
                  width: "100%", padding: "13px", borderRadius: 10, border: "none",
                  background: "linear-gradient(135deg,#4FD0FF,#1E5CFF)", color: "#05070A",
                  fontWeight: 700, fontSize: 13, opacity: !userPhoto || loading ? 0.5 : 1,
                }}
              >
                {loading ? "Génération en cours... (~10-20s)" : "Générer l'aperçu"}
              </button>
            </>
          )}

          {resultImage && (
            <div className="zn-scale-in">
              <img src={resultImage} alt="Aperçu essayage virtuel" style={{ width: "100%", borderRadius: 10, marginBottom: 10 }} />
              <div style={{ display: "flex", gap: 8 }}>
                <a
                  href={resultImage}
                  download="zenin-market-essayage.png"
                  style={{
                    flex: 1, textAlign: "center", padding: "11px", borderRadius: 10, border: "1px solid #1C2436",
                    background: "#05070A", color: "#EAF1FF", fontSize: 12, fontWeight: 600, textDecoration: "none",
                  }}
                >
                  Télécharger
                </a>
                <button
                  onClick={() => { setResultImage(null); setUserPhoto(null); setUserPhotoPreview(null); }}
                  style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1px solid #1C2436", background: "none", color: "#7C89A6", fontSize: 12, fontWeight: 600 }}
                >
                  Réessayer
                </button>
              </div>
            </div>
          )}

          <p style={{ fontSize: 10, color: "#4C5568", marginTop: 10, lineHeight: 1.4 }}>
            Aperçu généré par IA à titre indicatif — le rendu réel peut varier.
          </p>
        </div>
      )}
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
          <div style={{ fontSize: 12, color: "#7C89A6", marginBottom: 10 }}>Paiement sécurisé par Papi</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {["Mvola", "Orange Money", "Airtel Money", "Visa"].map((m) => (
              <span
                key={m}
                style={{
                  fontSize: 11, fontWeight: 600, color: "#9FD9FF", background: "#0D1220",
                  border: "1px solid #1C2436", borderRadius: 999, padding: "6px 12px",
                }}
              >
                {m}
              </span>
            ))}
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
          {submitting ? "Préparation du paiement..." : "Payer maintenant"}
        </button>
        <p style={{ fontSize: 11, color: "#4C5568", textAlign: "center", marginTop: 10 }}>
          Tu seras redirigé vers Papi pour choisir ton moyen de paiement.
        </p>
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
    <div className="zn-fade-up" style={{ padding: "80px 20px", textAlign: "center", maxWidth: 420, margin: "0 auto" }}>
      <div className="zn-scale-in" style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#4FD0FF,#1E5CFF)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
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
