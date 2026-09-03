"use client";

import React, { useState, useEffect, useRef } from "react";
import { Package, ClipboardList, LogOut, Trash2, Pencil, Plus, X, ArrowLeft } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

const fmt = (n) => Number(n).toLocaleString("fr-FR") + " Ar";
const fmtDate = (d) => new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

const STATUS_LABELS = {
  en_attente: "En attente paiement",
  paye: "Payé",
  commande_fournisseur: "Commandé fournisseur",
  expedie: "Expédié",
  livre: "Livré",
};
const STATUS_ORDER = ["en_attente", "paye", "commande_fournisseur", "expedie", "livre"];

export default function AdminDashboard({ pseudo, onLogout }) {
  const [tab, setTab] = useState("orders");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    setLoading(true);
    const [{ data: prod }, { data: ord }] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
    ]);
    setProducts(prod || []);
    setOrders(ord || []);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#05070A", color: "#EAF1FF", fontFamily: "'Inter', sans-serif" }}>
      <style>{`* { box-sizing: border-box; } button { font-family: inherit; cursor: pointer; } input, select { font-family: inherit; }`}</style>

      <header
        style={{
          position: "sticky", top: 0, zIndex: 20, display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px", background: "rgba(5,7,10,0.9)", borderBottom: "1px solid #1C2436",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/logo.jpg" alt="" style={{ height: 22 * 1.9, width: "auto" }} />
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14 }}>Admin{pseudo ? ` — ${pseudo}` : ""}</span>
        </div>
        <button onClick={onLogout} style={{ background: "none", border: "1px solid #1C2436", borderRadius: 8, padding: "6px 10px", color: "#7C89A6", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <LogOut size={13} /> Déconnexion
        </button>
      </header>

      <div style={{ display: "flex", gap: 8, padding: "16px 20px 0" }}>
        <TabButton icon={<ClipboardList size={14} />} label={"Commandes" + (orders.length ? ` (${orders.length})` : "")} active={tab === "orders"} onClick={() => setTab("orders")} />
        <TabButton icon={<Package size={14} />} label={`Articles (${products.length})`} active={tab === "products"} onClick={() => setTab("products")} />
      </div>

      {loading ? (
        <p style={{ textAlign: "center", color: "#7C89A6", padding: 40 }}>Chargement...</p>
      ) : tab === "orders" ? (
        <OrdersPanel orders={orders} onChanged={loadAll} />
      ) : (
        <ProductsPanel products={products} onChanged={loadAll} />
      )}
    </div>
  );
}

function TabButton({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 999,
        border: "1px solid " + (active ? "transparent" : "#1C2436"),
        background: active ? "linear-gradient(135deg,#4FD0FF,#1E5CFF)" : "#0D1220",
        color: active ? "#05070A" : "#7C89A6", fontWeight: 600, fontSize: 12,
      }}
    >
      {icon} {label}
    </button>
  );
}

function OrdersPanel({ orders, onChanged }) {
  async function updateStatus(id, status) {
    await supabase.from("orders").update({ status }).eq("id", id);
    onChanged();
  }

  return (
    <div style={{ padding: "16px 20px 60px" }}>
      {orders.length === 0 && (
        <div style={{ textAlign: "center", color: "#7C89A6", fontSize: 14, marginTop: 60 }}>
          Aucune commande pour l'instant.
          <br />Les commandes passées sur la boutique apparaîtront ici.
        </div>
      )}
      {orders.map((o) => (
        <div key={o.id} style={{ background: "#0D1220", border: "1px solid #1C2436", borderRadius: 12, padding: 14, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{o.id}</div>
              <div style={{ fontSize: 11, color: "#7C89A6" }}>{fmtDate(o.created_at)}</div>
            </div>
            <div style={{ fontWeight: 700, color: "#9FD9FF", fontSize: 14 }}>{fmt(o.total)}</div>
          </div>

          <div style={{ fontSize: 12, color: "#EAF1FF", marginBottom: 4 }}>{o.customer_name} · {o.customer_phone}</div>
          <div style={{ fontSize: 12, color: "#7C89A6", marginBottom: 10 }}>{o.customer_address}, {o.customer_city}</div>

          <div style={{ fontSize: 12, color: "#7C89A6", marginBottom: 10 }}>
            {(o.items || []).map((it, i) => (
              <div key={i}>{it.qty} × {it.name}{it.size ? ` (${it.size})` : ""}</div>
            ))}
          </div>

          <select
            value={o.status}
            onChange={(e) => updateStatus(o.id, e.target.value)}
            style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid #1C2436", background: "#05070A", color: "#9FD9FF", fontSize: 12, fontWeight: 600 }}
          >
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

function ProductsPanel({ products, onChanged }) {
  const [editing, setEditing] = useState(null); // product object or "new"

  async function remove(id) {
    if (!confirm("Supprimer cet article ?")) return;
    await supabase.from("products").delete().eq("id", id);
    onChanged();
  }

  if (editing) {
    return (
      <ProductForm
        initial={editing === "new" ? null : editing}
        onDone={() => { setEditing(null); onChanged(); }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div style={{ padding: "16px 20px 60px" }}>
      <button
        onClick={() => setEditing("new")}
        style={{ width: "100%", padding: "13px", borderRadius: 10, border: "1px dashed #1E5CFF", background: "rgba(30,92,255,0.08)", color: "#9FD9FF", fontWeight: 600, fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
      >
        <Plus size={15} /> Ajouter un article
      </button>

      {products.map((p) => (
        <div key={p.id} style={{ display: "flex", gap: 10, background: "#0D1220", border: "1px solid #1C2436", borderRadius: 12, padding: 10, marginBottom: 10 }}>
          <img src={p.images?.[0]} alt="" style={{ width: 54, height: 54, borderRadius: 8, objectFit: "cover" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
            <div style={{ fontSize: 12, color: "#7C89A6" }}>{p.category} · {(p.sizes || []).join(", ")}</div>
            <div style={{ fontSize: 13, color: "#9FD9FF", fontWeight: 700 }}>{fmt(p.price)}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <button onClick={() => setEditing(p)} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #1C2436", background: "none", color: "#9FD9FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Pencil size={13} />
            </button>
            <button onClick={() => remove(p.id)} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #1C2436", background: "none", color: "#FF7C7C", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductForm({ initial, onDone, onCancel }) {
  const [name, setName] = useState(initial?.name || "");
  const [price, setPrice] = useState(initial?.price || "");
  const [category, setCategory] = useState(initial?.category || "T-shirts");
  const [sizes, setSizes] = useState((initial?.sizes || []).join(", "));
  const [description, setDescription] = useState(initial?.description || "");
  const [images, setImages] = useState(initial?.images || []);
  const [video, setVideo] = useState(initial?.video || null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  async function uploadFile(file, folder) {
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("product-media").upload(path, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from("product-media").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleImageFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setUploading(true);
    setError("");
    try {
      const urls = [];
      for (const file of files) {
        urls.push(await uploadFile(file, "images"));
      }
      setImages((prev) => [...prev, ...urls]);
    } catch (e) {
      setError("Échec de l'envoi de la photo : " + e.message);
    }
    setUploading(false);
  }

  async function handleVideoFile(fileList) {
    const file = fileList?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const url = await uploadFile(file, "videos");
      setVideo(url);
    } catch (e) {
      setError("Échec de l'envoi de la vidéo : " + e.message);
    }
    setUploading(false);
  }

  function removeImage(idx) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  async function submit() {
    if (!name || !price) return;
    if (images.length === 0) {
      setError("Ajoute au moins une photo.");
      return;
    }
    setError("");
    setSaving(true);
    const payload = {
      name,
      price: Number(price),
      category,
      sizes: sizes.split(",").map((s) => s.trim()).filter(Boolean),
      images,
      video,
      description,
    };
    let dbError;
    if (initial?.id) {
      ({ error: dbError } = await supabase.from("products").update(payload).eq("id", initial.id));
    } else {
      ({ error: dbError } = await supabase.from("products").insert(payload));
    }
    setSaving(false);
    if (dbError) {
      setError("Échec de l'enregistrement : " + dbError.message);
      return;
    }
    onDone();
  }

  return (
    <div style={{ padding: "16px 20px 60px", maxWidth: 480 }}>
      <button onClick={onCancel} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#7C89A6", fontSize: 13, marginBottom: 18, padding: 0 }}>
        <ArrowLeft size={15} /> Retour aux articles
      </button>
      <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, margin: "0 0 16px" }}>
        {initial ? "Modifier l'article" : "Nouvel article"}
      </h2>
      <div>
        <Field label="Nom de l'article" value={name} onChange={setName} required />
        <Field label="Prix (Ar)" value={price} onChange={setPrice} required placeholder="25000" />
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: "#7C89A6", display: "block", marginBottom: 6 }}>Catégorie</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #1C2436", background: "#0D1220", color: "#EAF1FF", fontSize: 14 }}>
            <option value="T-shirts">T-shirts</option>
            <option value="Shorts">Shorts</option>
            <option value="Cosmétiques">Cosmétiques</option>
            <option value="Bijoux">Bijoux</option>
          </select>
        </div>
        <Field label="Tailles (optionnel — séparées par des virgules)" value={sizes} onChange={setSizes} placeholder="S, M, L, XL — laisse vide si non applicable" />

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: "#7C89A6", display: "block", marginBottom: 6 }}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Décris l'article, la matière, la coupe..."
            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #1C2436", background: "#0D1220", color: "#EAF1FF", fontSize: 14, resize: "vertical", fontFamily: "'Inter', sans-serif" }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: "#7C89A6", display: "block", marginBottom: 8 }}>Photos</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: images.length ? 10 : 0 }}>
            {images.map((src, i) => (
              <div key={i} style={{ position: "relative", width: 70, height: 70 }}>
                <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#0D1220", border: "1px solid #1C2436", color: "#FF7C7C", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
                >
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => imageInputRef.current && imageInputRef.current.click()}
            disabled={uploading}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px",
              borderRadius: 10, border: "1px dashed #1C2436", background: "#0D1220", color: "#7C89A6", fontSize: 13, width: "100%",
            }}
          >
            <Plus size={15} /> {uploading ? "Envoi en cours..." : "Ajouter des photos"}
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => { handleImageFiles(e.target.files); e.target.value = ""; }}
            style={{ display: "none" }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: "#7C89A6", display: "block", marginBottom: 8 }}>Vidéo (optionnel)</label>
          {video ? (
            <div style={{ position: "relative", marginBottom: 10 }}>
              <video src={video} controls style={{ width: "100%", borderRadius: 10, maxHeight: 200 }} />
              <button
                type="button"
                onClick={() => setVideo(null)}
                style={{ position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: "50%", background: "rgba(5,7,10,0.8)", border: "1px solid #1C2436", color: "#FF7C7C", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => videoInputRef.current && videoInputRef.current.click()}
              disabled={uploading}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px",
                borderRadius: 10, border: "1px dashed #1C2436", background: "#0D1220", color: "#7C89A6", fontSize: 13, width: "100%",
              }}
            >
              <Plus size={15} /> {uploading ? "Envoi en cours..." : "Ajouter une vidéo"}
            </button>
          )}
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={(e) => { handleVideoFile(e.target.files); e.target.value = ""; }}
            style={{ display: "none" }}
          />
        </div>

        {error && <div style={{ color: "#FF7C7C", fontSize: 12, marginBottom: 12 }}>{error}</div>}

        <button
          type="button"
          onClick={submit}
          disabled={saving || uploading}
          style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#4FD0FF,#1E5CFF)", color: "#05070A", fontWeight: 700, fontSize: 14, marginTop: 8, opacity: saving || uploading ? 0.6 : 1 }}
        >
          {saving ? "Enregistrement..." : "Enregistrer"}
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
