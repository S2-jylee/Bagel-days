import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { CATEGORIES } from "../../data/categories";
import { useProducts } from "../../context/ProductsContext";
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
  const [fillAllQty, setFillAllQty] = useState("");
  const [fillingAll, setFillingAll] = useState(false);
  const { products } = useProducts();
  const allProductIds = useMemo(() => Object.keys(products), [products]);

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
  const visibleItems = Object.values(products)
    .filter((p) => p.categoryId === activeCat && (!activeSubcategory || p.subcategoryId === activeSubcat))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((p) => p.id);
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

  async function fillAllStock() {
    if (fillAllQty === "") return;
    const qty = Math.max(0, parseInt(fillAllQty, 10) || 0);
    const ids = allProductIds;
    setFillingAll(true);
    setStockMap((prev) => {
      const next = { ...prev };
      ids.forEach((id) => (next[id] = qty));
      return next;
    });
    await supabase.from("product_stock").update({ stock_qty: qty }).in("product_id", ids);
    setFillingAll(false);
    setFillAllQty("");
  }

  return (
    <div>
      <div className="admin-section-header">
        <h2>Inventory</h2>
      </div>

      <p className="inventory-hint">Enter today's available quantity for each item &mdash; anything left blank shows as Sold Out on the menu.</p>

      <div className="inventory-fillall-bar">
        <div className="inventory-fillall-text">
          <strong>Fill every product</strong>
          <span>Sets stock for all {allProductIds.length} products at once, across every category &mdash; no need to select items first.</span>
        </div>
        <div className="inventory-bulk-apply">
          <input
            type="number"
            min="0"
            placeholder="Qty"
            value={fillAllQty}
            onChange={(e) => setFillAllQty(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={fillAllStock}
            disabled={fillAllQty === "" || fillingAll}
          >
            {fillingAll ? "Filling…" : "Fill All Products"}
          </button>
        </div>
      </div>

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
              const p = products[id];
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
