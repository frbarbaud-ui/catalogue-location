import { useState, useEffect } from "react";

const SUPABASE_URL = "https://sluhsttgjrrgufoarrce.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWhzdHRnanJyZ3Vmb2FycmNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NDU2MDAsImV4cCI6MjA4MzAyMTYwMH0.IHBlOmzRaHGSYtGPjgTRz3s7Fu3SUaA7o6ltz7DUdAY";

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

async function query(table, params = "") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, { headers });
  return res.json();
}

const CAT_COLORS = {
  Sound: { bg: "#0d1f0d", border: "#4ade80", text: "#4ade80", icon: "🔊" },
  Light: { bg: "#1f0d1f", border: "#f472b6", text: "#f472b6", icon: "💡" },
  Video: { bg: "#0d0d1f", border: "#60a5fa", text: "#60a5fa", icon: "🎬" },
  Rigging: { bg: "#1f150d", border: "#fb923c", text: "#fb923c", icon: "🏗️" },
  Electricity: { bg: "#1f1f0d", border: "#facc15", text: "#facc15", icon: "⚡" },
  Accessories: { bg: "#171717", border: "#a8a29e", text: "#a8a29e", icon: "🔧" },
};

export default function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [parentCats, setParentCats] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedParent, setSelectedParent] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("catalog");
  const [stats, setStats] = useState({});

  useEffect(() => {
    Promise.all([
      query("rental_categories", "order=sort_order"),
      query("rental_suppliers", "order=name"),
      query("rental_products", "select=*,rental_suppliers(name,website),rental_categories(name,parent_id)&order=brand,model"),
    ]).then(([cats, sups, prods]) => {
      setCategories(cats);
      setParentCats(cats.filter((c) => !c.parent_id));
      setSuppliers(sups);
      setProducts(prods);
      const s = {};
      prods.forEach((p) => {
        const sup = p.rental_suppliers?.name || "Unknown";
        s[sup] = (s[sup] || 0) + 1;
      });
      setStats(s);
      setLoading(false);
    });
  }, []);

  const subCats = categories.filter((c) => c.parent_id === selectedParent);

  const filtered = products.filter((p) => {
    if (selectedSub && p.category_id !== selectedSub) return false;
    if (selectedParent && !selectedSub) {
      const subs = categories.filter((c) => c.parent_id === selectedParent).map((c) => c.id);
      if (!subs.includes(p.category_id)) return false;
    }
    if (selectedSupplier && p.supplier_id !== selectedSupplier) return false;
    if (showNew && !p.is_new) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (p.brand || "").toLowerCase().includes(q) ||
        (p.model || "").toLowerCase().includes(q) ||
        (p.reference || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q) ||
        (p.rental_suppliers?.name || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getParentName = (catId) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return null;
    const parent = categories.find((c) => c.id === cat.parent_id);
    return parent?.name || null;
  };

  const getCatColor = (catId) => {
    const name = getParentName(catId);
    return CAT_COLORS[name] || CAT_COLORS.Accessories;
  };

  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16, animation: "pulse 1.5s infinite" }}>📡</div>
          <div style={{ fontSize: 13, letterSpacing: 4, textTransform: "uppercase", color: "#555" }}>
            Chargement du catalogue...
          </div>
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,sans-serif}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:#0a0a0a}
        ::-webkit-scrollbar-thumb{background:#333;border-radius:3px}
        input:focus{outline:none;border-color:#444!important}
        .btn{transition:all .15s;cursor:pointer;border:1px solid #282828;background:#111;color:#999;padding:6px 14px;border-radius:6px;font-size:13px;white-space:nowrap;font-family:inherit}
        .btn:hover{border-color:#444;color:#fff}
        .btn.on{border-color:var(--ac);color:var(--ac);background:var(--abg)}
        .row{transition:background .1s}
        .row:hover{background:#161616!important}
        .badge{background:#dc2626;color:#fff;font-size:9px;font-weight:700;padding:2px 5px;border-radius:3px;letter-spacing:.5px}
        .card{transition:all .15s;cursor:pointer;border:1px solid #1a1a1a;border-radius:10px;padding:16px;background:#111}
        .card:hover{transform:translateY(-1px);border-color:#333}
        .tab{cursor:pointer;padding:7px 18px;border-radius:6px;font-size:13px;font-weight:600;transition:all .15s;border:none;font-family:inherit}
        .tab.on{background:#fff;color:#000}
        .tab:not(.on){color:#666;background:transparent}
        .tab:not(.on):hover{color:#ccc}
        @media(max-width:768px){
          .grid-row{grid-template-columns:40px 1fr!important}
          .hide-mobile{display:none!important}
        }
      `}</style>

      {/* HEADER */}
      <header style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -1, fontFamily: "monospace" }}>
            <span style={{ color: "#dc2626" }}>RENTAL</span>
            <span style={{ color: "#333" }}>_</span>
            <span style={{ color: "#fff" }}>DB</span>
          </div>
          <div style={{ display: "flex", gap: 3, background: "#111", borderRadius: 7, padding: 3 }}>
            <button className={`tab ${view === "catalog" ? "on" : ""}`} onClick={() => setView("catalog")}>
              Catalogue
            </button>
            <button className={`tab ${view === "suppliers" ? "on" : ""}`} onClick={() => setView("suppliers")}>
              Prestataires
            </button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 11, color: "#555", fontFamily: "monospace" }}>
          <span>{suppliers.length} prestataires</span>
          <span style={{ color: "#282828" }}>|</span>
          <span>{products.length} produits</span>
        </div>
      </header>

      {view === "catalog" ? (
        <main style={{ padding: "16px 20px" }}>
          {/* SEARCH */}
          <div style={{ position: "relative", marginBottom: 16 }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher marque, modèle, référence, prestataire..."
              style={styles.searchInput}
            />
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, opacity: 0.35 }}>
              🔍
            </span>
          </div>

          {/* PARENT CATS */}
          <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button
              className={`btn ${!selectedParent ? "on" : ""}`}
              style={{ "--ac": "#fff", "--abg": "#1a1a1a" }}
              onClick={() => { setSelectedParent(null); setSelectedSub(null); }}
            >Tout</button>
            {parentCats.map((c) => {
              const col = CAT_COLORS[c.name] || CAT_COLORS.Accessories;
              return (
                <button
                  key={c.id}
                  className={`btn ${selectedParent === c.id ? "on" : ""}`}
                  style={{ "--ac": col.border, "--abg": col.bg }}
                  onClick={() => { setSelectedParent(selectedParent === c.id ? null : c.id); setSelectedSub(null); }}
                >{col.icon} {c.name}</button>
              );
            })}
            <div style={{ flex: 1 }} />
            <button
              className={`btn ${showNew ? "on" : ""}`}
              style={{ "--ac": "#dc2626", "--abg": "#1a0808" }}
              onClick={() => setShowNew(!showNew)}
            >🆕 NEW</button>
          </div>

          {/* SUB CATS */}
          {selectedParent && subCats.length > 0 && (
            <div style={{ display: "flex", gap: 5, marginBottom: 12, flexWrap: "wrap", paddingLeft: 6 }}>
              <button
                className={`btn ${!selectedSub ? "on" : ""}`}
                style={{ "--ac": "#fff", "--abg": "#151515", fontSize: 11, padding: "3px 9px" }}
                onClick={() => setSelectedSub(null)}
              >Tout</button>
              {subCats.map((c) => (
                <button
                  key={c.id}
                  className={`btn ${selectedSub === c.id ? "on" : ""}`}
                  style={{ "--ac": "#fff", "--abg": "#151515", fontSize: 11, padding: "3px 9px" }}
                  onClick={() => setSelectedSub(selectedSub === c.id ? null : c.id)}
                >{c.name}</button>
              ))}
            </div>
          )}

          {/* SUPPLIER FILTER */}
          {Object.keys(stats).length > 1 && (
            <div style={{ display: "flex", gap: 5, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 10, color: "#444", marginRight: 2, fontFamily: "monospace" }}>PRESTATAIRE:</span>
              <button
                className={`btn ${!selectedSupplier ? "on" : ""}`}
                style={{ "--ac": "#fff", "--abg": "#151515", fontSize: 10, padding: "2px 7px" }}
                onClick={() => setSelectedSupplier(null)}
              >Tous</button>
              {suppliers.filter((s) => stats[s.name]).map((s) => (
                <button
                  key={s.id}
                  className={`btn ${selectedSupplier === s.id ? "on" : ""}`}
                  style={{ "--ac": "#fff", "--abg": "#151515", fontSize: 10, padding: "2px 7px" }}
                  onClick={() => setSelectedSupplier(selectedSupplier === s.id ? null : s.id)}
                >{s.name} ({stats[s.name]})</button>
              ))}
            </div>
          )}

          {/* COUNT */}
          <div style={{ fontSize: 11, color: "#444", marginBottom: 10, fontFamily: "monospace" }}>
            {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
          </div>

          {/* TABLE */}
          <div style={{ border: "1px solid #1a1a1a", borderRadius: 10, overflow: "hidden" }}>
            <div className="grid-row" style={styles.tableHeader}>
              <span></span>
              <span>Marque / Modèle</span>
              <span className="hide-mobile">Référence</span>
              <span className="hide-mobile">Description</span>
              <span className="hide-mobile">Specs</span>
              <span className="hide-mobile">Prestataire</span>
            </div>
            <div style={{ maxHeight: "calc(100vh - 340px)", overflowY: "auto" }}>
              {filtered.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "#333" }}>Aucun produit trouvé</div>
              ) : (
                filtered.map((p, i) => {
                  const col = getCatColor(p.category_id);
                  const catName = categories.find((c) => c.id === p.category_id)?.name || "";
                  return (
                    <div key={p.id} className="row grid-row" style={{ ...styles.tableRow, background: i % 2 === 0 ? "#0c0c0c" : "#0a0a0a" }}>
                      <span>{p.is_new && <span className="badge">NEW</span>}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#fff" }}>{p.brand}</div>
                        <div style={{ fontSize: 12, color: "#bbb" }}>{p.model}</div>
                        <div style={{ fontSize: 9, color: col.text, marginTop: 1 }}>{catName}</div>
                      </div>
                      <div className="hide-mobile" style={{ fontFamily: "monospace", fontSize: 10, color: "#555" }}>{p.reference || "—"}</div>
                      <div className="hide-mobile" style={{ fontSize: 11, color: "#777" }}>{p.description || "—"}</div>
                      <div className="hide-mobile" style={{ fontSize: 11, color: "#777" }}>{p.specifications || "—"}</div>
                      <div className="hide-mobile" style={{ fontSize: 10, color: "#555" }}>{p.rental_suppliers?.name || "—"}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </main>
      ) : (
        <main style={{ padding: "16px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 10 }}>
            {suppliers.map((s) => (
              <div
                key={s.id}
                className="card"
                onClick={() => { setSelectedSupplier(s.id); setView("catalog"); }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: "#555", marginTop: 1 }}>
                      {s.city && `${s.city}, `}{s.country || ""}
                    </div>
                  </div>
                  {stats[s.name] ? (
                    <span style={{ background: "#1a1a1a", color: "#888", fontSize: 10, padding: "2px 7px", borderRadius: 4, fontFamily: "monospace" }}>
                      {stats[s.name]} prod.
                    </span>
                  ) : (
                    <span style={{ background: "#1a1a1a", color: "#444", fontSize: 10, padding: "2px 7px", borderRadius: 4 }}>—</span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                  {s.website && (
                    <a href={s.website} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
                      style={{ fontSize: 10, color: "#60a5fa", textDecoration: "none" }}>🌐 Site</a>
                  )}
                  {s.email && (
                    <a href={`mailto:${s.email}`} onClick={(e) => e.stopPropagation()}
                      style={{ fontSize: 10, color: "#60a5fa", textDecoration: "none" }}>✉️ Email</a>
                  )}
                  {s.phone && <span style={{ fontSize: 10, color: "#666" }}>📞 {s.phone}</span>}
                  {s.catalog_url && (
                    <a href={s.catalog_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
                      style={{ fontSize: 10, color: "#fb923c", textDecoration: "none" }}>📄 Catalogue</a>
                  )}
                </div>
                <div style={{ fontSize: 9, color: "#333", marginTop: 5 }}>
                  {s.type === "dry_hire" ? "Dry hire" : "Full service"}
                </div>
              </div>
            ))}
          </div>
        </main>
      )}
    </div>
  );
}

const styles = {
  root: { minHeight: "100vh", background: "#0a0a0a", color: "#e5e5e5" },
  loadingWrap: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a", color: "#fff" },
  header: {
    borderBottom: "1px solid #151515", padding: "12px 20px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    position: "sticky", top: 0, background: "#0a0a0aee", backdropFilter: "blur(10px)", zIndex: 100,
  },
  searchInput: {
    width: "100%", padding: "12px 18px 12px 40px", background: "#111",
    border: "1px solid #1a1a1a", borderRadius: 8, color: "#fff", fontSize: 14,
    fontFamily: "inherit",
  },
  tableHeader: {
    display: "grid", gridTemplateColumns: "50px 1fr 130px 1fr 1fr 110px",
    padding: "8px 14px", background: "#0f0f0f", borderBottom: "1px solid #1a1a1a",
    fontSize: 10, fontWeight: 600, color: "#444", textTransform: "uppercase", letterSpacing: 1,
  },
  tableRow: {
    display: "grid", gridTemplateColumns: "50px 1fr 130px 1fr 1fr 110px",
    padding: "8px 14px", borderBottom: "1px solid #0f0f0f", alignItems: "center",
  },
};
