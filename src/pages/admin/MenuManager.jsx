import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useProducts } from "../../context/ProductsContext";
import { CATEGORIES } from "../../data/categories";
import { IcDonut, IcTub, IcBread, IcCakeSlice, IcCup, IcPlus, IcCheck } from "../../components/Icons";

const CATEGORY_ICONS = {
  bagels: IcDonut,
  "cream-cheese": IcTub,
  "salt-bread": IcBread,
  dessert: IcCakeSlice,
  coffee: IcCup,
};

const BUCKET = "product-images";

// Unicode-aware: keeps letters from any script (Korean names included) instead
// of stripping everything down to "item" the way an ASCII-only [a-z0-9] filter
// would — non-Latin names still get a meaningful, readable id this way.
function slugify(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueId(name, existingIds) {
  const base = slugify(name) || "item";
  let id = base;
  let n = 2;
  while (existingIds.has(id)) {
    id = `${base}-${n}`;
    n++;
  }
  return id;
}

// Matches the original catalog photos' native 800x600 (4:3) ratio, so legacy
// and freshly-uploaded photos both display at the same proportions.
const CANVAS_W = 1200;
const CANVAS_H = 900;

// Different photos come in at wildly different aspect ratios, which made the
// menu grid look jagged (each thumb sized itself to its own image). Instead
// of cropping (loses part of the photo) or stretching (distorts it), draw the
// photo onto a fixed white 4:3 canvas, scaled to fit — the file itself is
// normalized once here, so every display context (grid, modal, admin list)
// gets a consistent shape without needing to special-case legacy photos.
function normalizeToWhiteCanvas(file, w = CANVAS_W, h = CANVAS_H) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      const scale = Math.min(w / img.width, h / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) => (blob ? resolve(new File([blob], "product.jpg", { type: "image/jpeg" })) : reject(new Error("Could not process image"))),
        "image/jpeg",
        0.92
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image file"));
    };
    img.src = url;
  });
}

async function uploadProductImage(file) {
  const normalized = await normalizeToWhiteCanvas(file);
  const path = `${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, normalized, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

function emptyForm(category, subcategory) {
  return {
    id: null,
    name: "",
    price: "",
    description: "",
    categoryId: category,
    subcategoryId: subcategory,
    imageUrl: "",
    isActive: true,
    addonIds: new Set(),
  };
}

export default function MenuManager() {
  const { products, addons } = useProducts();
  const [activeCat, setActiveCat] = useState(CATEGORIES[0].id);
  const [activeSubcat, setActiveSubcat] = useState(CATEGORIES[0].subcategories?.[0]?.id ?? null);
  const [form, setForm] = useState(null); // null = closed, object = open (create or edit)
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState("");
  const [addonPoolOpen, setAddonPoolOpen] = useState(false);
  const [newAddonName, setNewAddonName] = useState("");
  const [newAddonPrice, setNewAddonPrice] = useState("");
  const [newAddonCategory, setNewAddonCategory] = useState("");

  // ---- stock (merged in from the old Inventory tab) ----
  const [stockMap, setStockMap] = useState({});
  const [saved, setSaved] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkQty, setBulkQty] = useState("");
  const [applying, setApplying] = useState(false);
  const [fillAllQty, setFillAllQty] = useState("");
  const [fillingAll, setFillingAll] = useState(false);

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
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const addonList = Object.values(addons);
  const allProductIds = Object.keys(products);
  const allVisibleSelected = visibleItems.length > 0 && visibleItems.every((p) => selectedIds.has(p.id));

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
      if (allVisibleSelected) visibleItems.forEach((p) => next.delete(p.id));
      else visibleItems.forEach((p) => next.add(p.id));
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
    setFillingAll(true);
    setStockMap((prev) => {
      const next = { ...prev };
      allProductIds.forEach((id) => (next[id] = qty));
      return next;
    });
    await supabase.from("product_stock").update({ stock_qty: qty }).in("product_id", allProductIds);
    setFillingAll(false);
    setFillAllQty("");
  }

  // ---- product CRUD ----

  function openCreate() {
    setFormError("");
    setForm(emptyForm(activeCat, activeSubcat));
  }

  function openEdit(p) {
    setFormError("");
    setForm({
      id: p.id,
      name: p.name,
      price: String(p.price),
      description: p.desc,
      categoryId: p.categoryId,
      subcategoryId: p.subcategoryId,
      imageUrl: p.imageUrl || "",
      isActive: p.isActive !== false,
      addonIds: new Set(p.addons.map((a) => a.id)),
    });
  }

  function closeForm() {
    if (saving) return;
    setForm(null);
  }

  function updateForm(patch) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function toggleAddon(id) {
    setForm((f) => {
      const next = new Set(f.addonIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...f, addonIds: next };
    });
  }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setFormError("");
    try {
      const url = await uploadProductImage(file);
      updateForm({ imageUrl: url });
    } catch (err) {
      setFormError(err.message || "Photo upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || form.price === "" || !form.categoryId) {
      setFormError("Name, category, and price are required.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const id = form.id || uniqueId(form.name, new Set(allProductIds));
      const row = {
        id,
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: Number(form.price),
        image_url: form.imageUrl || null,
        category_id: form.categoryId,
        subcategory_id: form.subcategoryId,
        is_active: form.isActive,
      };

      if (form.id) {
        const { error } = await supabase.from("products").update(row).eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(row);
        if (error) throw error;
        // New items start with no stock set (shows as Sold Out until staff fills it in below).
        await supabase.from("product_stock").insert({ product_id: id, stock_qty: null });
        setStockMap((prev) => ({ ...prev, [id]: null }));
      }

      await supabase.from("product_addons").delete().eq("product_id", id);
      if (form.addonIds.size > 0) {
        const links = [...form.addonIds].map((addon_id) => ({ product_id: id, addon_id }));
        const { error } = await supabase.from("product_addons").insert(links);
        if (error) throw error;
      }

      setForm(null);
    } catch (err) {
      setFormError(err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p) {
    if (!window.confirm(`Delete "${p.name}"? This can't be undone.`)) return;
    await supabase.from("products").delete().eq("id", p.id);
  }

  async function addPoolAddon() {
    if (!newAddonName.trim() || newAddonPrice === "") return;
    await supabase.from("addons").insert({ name: newAddonName.trim(), price: Number(newAddonPrice), category_id: newAddonCategory || null });
    setNewAddonName("");
    setNewAddonPrice("");
    setNewAddonCategory("");
  }

  async function deletePoolAddon(a) {
    if (!window.confirm(`Remove "${a.name}" from the add-on pool? It'll be removed from every item that uses it.`)) return;
    await supabase.from("addons").delete().eq("id", a.id);
  }

  return (
    <div>
      <div className="admin-section-header">
        <h2>Menu Items</h2>
      </div>

      <div className="inventory-fillall-bar">
        <div className="inventory-fillall-text">
          <strong>Add-on pool</strong>
          <span>Shared add-ons any item can offer (e.g. Extra Cream Cheese) &mdash; manage the list here, then pick which apply per item.</span>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAddonPoolOpen((v) => !v)}>
          {addonPoolOpen ? "Hide" : `Manage (${addonList.length})`}
        </button>
      </div>

      {addonPoolOpen && (
        <div className="addon-pool-editor">
          <ul className="addon-pool-list">
            {addonList.map((a) => (
              <li key={a.id}>
                <span className="addon-pool-cat">{CATEGORIES.find((c) => c.id === a.categoryId)?.label || "General"}</span>
                <span>{a.name}</span>
                <span className="mono">${a.price.toFixed(2)}</span>
                <button type="button" className="addon-pool-remove" onClick={() => deletePoolAddon(a)} aria-label={`Remove ${a.name}`}>&times;</button>
              </li>
            ))}
            {addonList.length === 0 && <li className="addon-pool-empty">No add-ons yet.</li>}
          </ul>
          <div className="addon-pool-add">
            <select value={newAddonCategory} onChange={(e) => setNewAddonCategory(e.target.value)}>
              <option value="">General (all categories)</option>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <input type="text" placeholder="Add-on name" value={newAddonName} onChange={(e) => setNewAddonName(e.target.value)} />
            <input type="number" min="0" step="0.01" placeholder="Price" value={newAddonPrice} onChange={(e) => setNewAddonPrice(e.target.value)} />
            <button type="button" className="btn btn-primary btn-sm" onClick={addPoolAddon} disabled={!newAddonName.trim() || newAddonPrice === ""}>Add</button>
          </div>
        </div>
      )}

      <div className="inventory-fillall-bar">
        <div className="inventory-fillall-text">
          <strong>Fill every product</strong>
          <span>Sets stock for all {allProductIds.length} products at once, across every category &mdash; no need to select items first.</span>
        </div>
        <div className="inventory-bulk-apply">
          <input type="number" min="0" placeholder="Qty" value={fillAllQty} onChange={(e) => setFillAllQty(e.target.value)} />
          <button type="button" className="btn btn-primary btn-sm" onClick={fillAllStock} disabled={fillAllQty === "" || fillingAll}>
            {fillingAll ? "Filling…" : "Fill All Products"}
          </button>
        </div>
      </div>

      <p className="inventory-hint">Edit an item's details or photo, or enter today's available quantity &mdash; anything left blank shows as Sold Out on the menu.</p>

      <div className="inventory-layout">
        <nav className="menu-maincats" aria-label="Menu categories">
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

          <div className="menu-manager-toolbar">
            {activeCategory.subcategories && (
              <div className="menu-subcat-pills">
                {activeCategory.subcategories.map((sub) => (
                  <button key={sub.id} className={activeSubcat === sub.id ? "active" : ""} onClick={() => setActiveSubcat(sub.id)}>
                    {sub.label}
                  </button>
                ))}
              </div>
            )}
            <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>+ Add New Item</button>
          </div>

          <div className="inventory-bulk-bar">
            <label className="inventory-select-all">
              <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} />
              Select all shown ({visibleItems.length})
            </label>
            <div className="inventory-bulk-apply">
              <input type="number" min="0" placeholder="Qty" value={bulkQty} onChange={(e) => setBulkQty(e.target.value)} />
              <button type="button" className="btn btn-primary btn-sm" onClick={applyBulk} disabled={selectedIds.size === 0 || applying}>
                {applying ? "Applying…" : `Apply to ${selectedIds.size} selected`}
              </button>
            </div>
          </div>

          <div className="inventory-list">
            {visibleItems.map((p) => (
              <div className={`inventory-row menu-manager-row${p.isActive === false ? " inactive" : ""}${selectedIds.has(p.id) ? " selected" : ""}`} key={p.id}>
                <input type="checkbox" className="inventory-row-check" checked={selectedIds.has(p.id)} onChange={() => toggleOne(p.id)} />
                {p.img ? <img src={p.img} alt={p.name} /> : <div className="menu-manager-noimg" />}
                <div className="inventory-row-info">
                  <div className="inventory-row-name">
                    {p.name}
                    {p.isActive === false && <span className="menu-manager-hidden-badge">Hidden</span>}
                  </div>
                  <div className="inventory-row-price">${p.price.toFixed(2)}</div>
                </div>
                <div className="inventory-row-stock">
                  <input
                    type="number"
                    min="0"
                    placeholder="Sold out"
                    defaultValue={stockMap[p.id] ?? ""}
                    key={stockMap[p.id]}
                    onBlur={(e) => saveStock(p.id, e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                  />
                  {saved === p.id && <IcCheck />}
                </div>
                <div className="menu-manager-row-actions">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>Edit</button>
                  <button type="button" className="btn btn-ghost btn-sm menu-manager-delete" onClick={() => handleDelete(p)}>Delete</button>
                </div>
              </div>
            ))}
            {visibleItems.length === 0 && <p className="inventory-hint">No items in this category yet.</p>}
          </div>
        </div>
      </div>

      {form && (
        <div className="admin-form-overlay" onClick={closeForm}>
          <div className="admin-form-panel" onClick={(e) => e.stopPropagation()}>
            <h3>{form.id ? "Edit Item" : "Add New Item"}</h3>
            <form onSubmit={handleSubmit}>
              <div className="menu-manager-photo-row">
                {form.imageUrl ? <img src={form.imageUrl} alt="" className="menu-manager-photo-preview" /> : <div className="menu-manager-noimg large" />}
                <div>
                  <label className="btn btn-ghost btn-sm menu-manager-upload-btn">
                    {uploading ? "Uploading…" : "Upload Photo"}
                    <input type="file" accept="image/*" onChange={handlePhotoChange} disabled={uploading} hidden />
                  </label>
                </div>
              </div>

              <div className="form-grid">
                <div className="field full">
                  <label>Name</label>
                  <input type="text" value={form.name} onChange={(e) => updateForm({ name: e.target.value })} required />
                </div>
                <div className="field">
                  <label>Category</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => {
                      const cat = CATEGORIES.find((c) => c.id === e.target.value);
                      updateForm({ categoryId: e.target.value, subcategoryId: cat.subcategories?.[0]?.id ?? null });
                    }}
                  >
                    {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                {CATEGORIES.find((c) => c.id === form.categoryId)?.subcategories && (
                  <div className="field">
                    <label>Subcategory</label>
                    <select value={form.subcategoryId ?? ""} onChange={(e) => updateForm({ subcategoryId: e.target.value })}>
                      {CATEGORIES.find((c) => c.id === form.categoryId).subcategories.map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="field">
                  <label>Price</label>
                  <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => updateForm({ price: e.target.value })} required />
                </div>
                <div className="field full">
                  <label>Description</label>
                  <textarea value={form.description} onChange={(e) => updateForm({ description: e.target.value })} />
                </div>
              </div>

              {(() => {
                // Only offer add-ons that make sense for this item's category (e.g. don't
                // show "Extra Cream Cheese" on a coffee item) — plus anything with no
                // category set, which counts as a general/universal add-on.
                const relevantAddons = addonList.filter((a) => !a.categoryId || a.categoryId === form.categoryId);
                return relevantAddons.length > 0 && (
                <div className="modal-addons">
                  <h4>Add-ons available for this item</h4>
                  <div className="modal-addon-list">
                    {relevantAddons.map((a) => {
                      const active = form.addonIds.has(a.id);
                      return (
                        <button key={a.id} type="button" className={`modal-addon-btn${active ? " active" : ""}`} onClick={() => toggleAddon(a.id)}>
                          <span>{active ? <IcCheck /> : <IcPlus />} {a.name}</span>
                          <span className="p">${a.price.toFixed(2)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                );
              })()}

              <label className="menu-manager-active-toggle">
                <input type="checkbox" checked={form.isActive} onChange={(e) => updateForm({ isActive: e.target.checked })} />
                Show on menu site
              </label>

              {formError && <p className="form-status err">{formError}</p>}

              <div className="menu-manager-form-actions">
                <button type="button" className="btn btn-ghost" onClick={closeForm} disabled={saving}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
                  {saving ? "Saving…" : form.id ? "Save Changes" : "Register"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
