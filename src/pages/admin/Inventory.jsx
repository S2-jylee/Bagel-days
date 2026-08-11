import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { CATEGORIES, PRODUCTS } from "../../data/products";
import { IcDonut, IcTub, IcBread, IcCakeSlice, IcCup, IcCheck } from "../../components/Icons";

const CATEGORY_ICONS = {
  bagels: IcDonut,
  "cream-cheese": IcTub,
  "salt-bread": IcBread,
  dessert: IcCakeSlice,
  coffee: IcCup,
};

export default function Inventory() {
  const [activeCat, setActiveCat] = useState(CATEGORIES[0].id);
  const [activeSubcat, setActiveSubcat] = useState(CATEGORIES[0].subcategories?.[0]?.id ?? null);
  const [stockMap, setStockMap] = useState({});
  const [saved, setSaved] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkQty, setBulkQty] = useState("");
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("product_stock").select("product_id, stock_qty");
      if (data) {
        const map = {};
        for (const row of data) map[row.product_id] = row.stock_qty;
        setStockMap(map);
      }
    }
    load();
  }, []);

  const activeCategory = CATEGORIES.find((c) => c.id === activeCat);
  const activeSubcategory = activeCategory.subcategories?.find((s) => s.id === activeSubcat) ?? null;
  const visibleItems = (activeSubcategory ? activeSubcategory.items : activeCategory.items).filter((id) => PRODUCTS[id]);
  const allVisibleSelected = visibleItems.length > 0 && visibleItems.every((id) => selectedIds.has(id));

  function selectCategory(cat) {
    setActiveCat(cat.id);
    setActiveSubcat(cat.subcategories?.[0]?.id ?? null);
  }

  function toggleOne(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) visibleItems.forEach((id) => next.delete(id));
      else visibleItems.forEach((id) => next.add(id));
      return next;
    });
  }

  async function saveStock(id, value) {
    const qty = value === "" ? null : Math.max(0, parseInt(value, 10) || 0);
    setStockMap((prev) => ({ ...prev, [id]: qty }));
    const { error } = await supabase.from("product_stock").update({ stock_qty: qty }).eq("product_id", id);
    if (!error) {
      setSaved(id);
      setTimeout(() => setSaved((s) => (s === id ? null : s)), 1200);
    }
  }

  async function applyBulk() {
    const qty = bulkQty === "" ? null : Math.max(0, parseInt(bulkQty, 10) || 0);
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setApplying(true);
    setStockMap((prev) => {
      const next = { ...prev };
      ids.forEach((id) => (next[id] = qty));
      return next;
    });
    await supabase.from("product_stock").update({ stock_qty: qty }).in("product_id", ids);
    setApplying(false);
    setSelectedIds(new Set());
    setBulkQty("");
  }

  return (
    <div>
      <div className="admin-section-header">
        <h2>Inventory</h2>
      </div>

      <p className="inventory-hint">Enter today's available quantity for each item &mdash; anything left blank shows as Sold Out on the menu.</p>

      <div className="inventory-layout">
        <nav className="menu-maincats" aria-label="Inventory categories">
          <h3 className="menu-maincats-label">Menu</h3>
          {CATEGORIES.map((cat) => {
            const Ic = CATEGORY_ICONS[cat.id];
            return (
              <button key={cat.id} className={activeCat === cat.id ? "active" : ""} onClick={() => selectCategory(cat)}>
                {Ic && <Ic />}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="inventory-products">
          <h2>{activeCategory.label}</h2>
          {activeCategory.subcategories && (
            <div className="menu-subcat-pills">
              {activeCategory.subcategories.map((sub) => (
                <button key={sub.id} className={activeSubcat === sub.id ? "active" : ""} onClick={() => setActiveSubcat(sub.id)}>
                  {sub.label}
                </button>
              ))}
            </div>
          )}

          <div className="inventory-bulk-bar">
            <label className="inventory-select-all">
              <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} />
              Select all shown ({visibleItems.length})
            </label>
            <div className="inventory-bulk-apply">
              <input
                type="number"
                min="0"
                placeholder="Qty"
                value={bulkQty}
                onChange={(e) => setBulkQty(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={applyBulk}
                disabled={selectedIds.size === 0 || applying}
              >
                {applying ? "Applying…" : `Apply to ${selectedIds.size} selected`}
              </button>
            </div>
          </div>

          <div className="inventory-list">
            {visibleItems.map((id) => {
              const p = PRODUCTS[id];
              const qty = stockMap[id];
              return (
                <div className={`inventory-row${selectedIds.has(id) ? " selected" : ""}`} key={id}>
                  <input
                    type="checkbox"
                    className="inventory-row-check"
                    checked={selectedIds.has(id)}
                    onChange={() => toggleOne(id)}
                  />
                  <img src={p.img} alt={p.name} />
                  <div className="inventory-row-info">
                    <div className="inventory-row-name">{p.name}</div>
                    <div className="inventory-row-price">${p.price.toFixed(2)}</div>
                  </div>
                  <div className="inventory-row-stock">
                    <input
                      type="number"
                      min="0"
                      placeholder="Sold out"
                      defaultValue={qty ?? ""}
                      key={qty}
                      onBlur={(e) => saveStock(id, e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                    />
                    {saved === id && <IcCheck />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
