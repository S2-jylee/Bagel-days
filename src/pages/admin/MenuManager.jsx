import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { useProducts } from "../../context/ProductsContext";
import { CATEGORIES } from "../../data/categories";
import { productImageUrl } from "../../lib/assetUrl";
import { IcDonut, IcTub, IcBread, IcCakeSlice, IcCup, IcPlus, IcCheck, IcStar, IcGrip } from "../../components/Icons";
import { useAdminLang } from "../../lib/adminI18n";

const CATEGORY_ICONS = {
  bagels: IcDonut,
  "cream-cheese": IcTub,
  "salt-bread": IcBread,
  dessert: IcCakeSlice,
  coffee: IcCup,
};

const BUCKET = "product-images";
const BEST_SELLER_LIMIT = 6;

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

// Shared drag-reorder math: pulls `draggingId` out of `list` and reinserts it
// at wherever `overId` currently sits — used by both the per-category product
// list and the Best Sellers preview below.
function moveInList(list, draggingId, overId) {
  const from = list.indexOf(draggingId);
  const to = list.indexOf(overId);
  if (from === -1 || to === -1) return list;
  const next = [...list];
  next.splice(from, 1);
  next.splice(to, 0, draggingId);
  return next;
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
  const { t } = useAdminLang();
  const { products, addons } = useProducts();
  const [activeCat, setActiveCat] = useState(CATEGORIES[0].id);
  const [activeSubcat, setActiveSubcat] = useState(CATEGORIES[0].subcategories?.[0]?.id ?? null);
  const [form, setForm] = useState(null); // null = closed, object = open (create or edit)
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState("");
  const [addonPoolOpen, setAddonPoolOpen] = useState(false);
  const [poolTab, setPoolTab] = useState(CATEGORIES[0].id); // which category's add-ons the pool editor shows; "general" = no category
  const [newAddonName, setNewAddonName] = useState("");
  const [newAddonPrice, setNewAddonPrice] = useState("");

  // ---- manual product ordering (drag to reorder, then Save) ----
  const [reordering, setReordering] = useState(false);
  const [orderedIds, setOrderedIds] = useState([]);
  const [savingOrder, setSavingOrder] = useState(false);
  const [draggingId, setDraggingId] = useState(null);

  // ---- best seller ordering (drag to reorder the Home preview, then Save) ----
  const [bestSellerReordering, setBestSellerReordering] = useState(false);
  const [bestSellerOrderedIds, setBestSellerOrderedIds] = useState([]);
  const [savingBestSellerOrder, setSavingBestSellerOrder] = useState(false);
  const [draggingBestSellerId, setDraggingBestSellerId] = useState(null);
  const [bestSellerLimitId, setBestSellerLimitId] = useState(null); // product id currently showing the "max 6" notice

  // Leaving the category/subcategory you were reordering discards the
  // unsaved drag state rather than trying to carry it somewhere it no
  // longer applies.
  useEffect(() => {
    setReordering(false);
    setOrderedIds([]);
  }, [activeCat, activeSubcat]);

  const activeCategory = CATEGORIES.find((c) => c.id === activeCat);
  const activeSubcategory = activeCategory.subcategories?.find((s) => s.id === activeSubcat) ?? null;
  const visibleItems = Object.values(products)
    .filter((p) => p.categoryId === activeCat && (!activeSubcategory || p.subcategoryId === activeSubcat))
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const addonList = Object.values(addons);
  const poolAddons = addonList.filter((a) => (poolTab === "general" ? !a.categoryId : a.categoryId === poolTab));
  const allProductIds = Object.keys(products);
  const displayItems = reordering ? orderedIds.map((id) => products[id]).filter(Boolean) : visibleItems;
  const bestSellerItems = useMemo(
    () => Object.values(products).filter((p) => p.isBestSeller).sort((a, b) => (a.bestSellerOrder ?? 0) - (b.bestSellerOrder ?? 0)),
    [products]
  );
  const displayBestSellerItems = bestSellerReordering
    ? bestSellerOrderedIds.map((id) => products[id]).filter(Boolean)
    : bestSellerItems;

  function selectCategory(cat) {
    setActiveCat(cat.id);
    setActiveSubcat(cat.subcategories?.[0]?.id ?? null);
  }

  // ---- manual ordering ----

  function startReorder() {
    setOrderedIds(visibleItems.map((p) => p.id));
    setReordering(true);
  }

  function cancelReorder() {
    setReordering(false);
    setOrderedIds([]);
  }

  function handleDragOver(e, overId) {
    e.preventDefault();
    if (!draggingId || draggingId === overId) return;
    setOrderedIds((prev) => moveInList(prev, draggingId, overId));
  }

  async function saveOrder() {
    setSavingOrder(true);
    await Promise.all(orderedIds.map((id, i) => supabase.from("products").update({ sort_order: i }).eq("id", id)));
    setSavingOrder(false);
    setReordering(false);
    setOrderedIds([]);
  }

  // ---- best sellers (shown on Home, in the order they were marked) ----

  async function toggleBestSeller(p) {
    if (p.isBestSeller) {
      await supabase.from("products").update({ is_best_seller: false, best_seller_order: null }).eq("id", p.id);
      return;
    }
    if (bestSellerItems.length >= BEST_SELLER_LIMIT) {
      setBestSellerLimitId(p.id);
      setTimeout(() => setBestSellerLimitId((cur) => (cur === p.id ? null : cur)), 2200);
      return;
    }
    const nextOrder = Object.values(products).reduce((max, x) => (x.isBestSeller ? Math.max(max, x.bestSellerOrder ?? 0) + 1 : max), 0);
    await supabase.from("products").update({ is_best_seller: true, best_seller_order: nextOrder }).eq("id", p.id);
  }

  function startBestSellerReorder() {
    setBestSellerOrderedIds(bestSellerItems.map((p) => p.id));
    setBestSellerReordering(true);
  }

  function cancelBestSellerReorder() {
    setBestSellerReordering(false);
    setBestSellerOrderedIds([]);
  }

  function handleBestSellerDragOver(e, overId) {
    e.preventDefault();
    if (!draggingBestSellerId || draggingBestSellerId === overId) return;
    setBestSellerOrderedIds((prev) => moveInList(prev, draggingBestSellerId, overId));
  }

  async function saveBestSellerOrder() {
    setSavingBestSellerOrder(true);
    await Promise.all(bestSellerOrderedIds.map((id, i) => supabase.from("products").update({ best_seller_order: i }).eq("id", id)));
    setSavingBestSellerOrder(false);
    setBestSellerReordering(false);
    setBestSellerOrderedIds([]);
  }

  async function removeBestSeller(id) {
    setBestSellerOrderedIds((prev) => prev.filter((x) => x !== id));
    await supabase.from("products").update({ is_best_seller: false, best_seller_order: null }).eq("id", id);
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
      setFormError(err.message || t("photoUploadFailed"));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || form.price === "" || !form.categoryId) {
      setFormError(t("nameRequired"));
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
      }

      await supabase.from("product_addons").delete().eq("product_id", id);
      if (form.addonIds.size > 0) {
        const links = [...form.addonIds].map((addon_id) => ({ product_id: id, addon_id }));
        const { error } = await supabase.from("product_addons").insert(links);
        if (error) throw error;
      }

      setForm(null);
    } catch (err) {
      setFormError(err.message || t("saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p) {
    if (!window.confirm(t("deleteConfirm", p.name))) return;
    await supabase.from("products").delete().eq("id", p.id);
  }

  async function addPoolAddon() {
    if (!newAddonName.trim() || newAddonPrice === "") return;
    const category_id = poolTab === "general" ? null : poolTab;
    await supabase.from("addons").insert({ name: newAddonName.trim(), price: Number(newAddonPrice), category_id });
    setNewAddonName("");
    setNewAddonPrice("");
  }

  async function deletePoolAddon(a) {
    if (!window.confirm(t("removeAddonConfirm", a.name))) return;
    await supabase.from("addons").delete().eq("id", a.id);
  }

  return (
    <div>
      <div className="admin-section-header">
        <h2>{t("menuItems")}</h2>
      </div>

      <div className="inventory-fillall-bar">
        <div className="inventory-fillall-text">
          <strong>{t("addonPool")}</strong>
          <span>{t("addonPoolDesc")}</span>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAddonPoolOpen((v) => !v)}>
          {addonPoolOpen ? t("hide") : t("manage", addonList.length)}
        </button>
      </div>

      {addonPoolOpen && (
        <div className="addon-pool-editor">
          <div className="addon-pool-tabs">
            {CATEGORIES.map((c) => (
              <button key={c.id} type="button" className={poolTab === c.id ? "active" : ""} onClick={() => setPoolTab(c.id)}>{c.label}</button>
            ))}
            <button type="button" className={poolTab === "general" ? "active" : ""} onClick={() => setPoolTab("general")}>{t("general")}</button>
          </div>
          <ul className="addon-pool-list">
            {poolAddons.map((a) => (
              <li key={a.id}>
                <span>{a.name}</span>
                <span className="mono">${a.price.toFixed(2)}</span>
                <button type="button" className="addon-pool-remove" onClick={() => deletePoolAddon(a)} aria-label={`Remove ${a.name}`}>&times;</button>
              </li>
            ))}
            {poolAddons.length === 0 && <li className="addon-pool-empty">{t("noAddonsYet")}</li>}
          </ul>
          <div className="addon-pool-add">
            <input type="text" placeholder={t("addonName")} value={newAddonName} onChange={(e) => setNewAddonName(e.target.value)} />
            <input type="number" min="0" step="0.01" placeholder={t("price")} value={newAddonPrice} onChange={(e) => setNewAddonPrice(e.target.value)} />
            <button type="button" className="btn btn-primary btn-sm" onClick={addPoolAddon} disabled={!newAddonName.trim() || newAddonPrice === ""}>
              {t("addToLabel", poolTab === "general" ? t("general") : CATEGORIES.find((c) => c.id === poolTab)?.label)}
            </button>
          </div>
        </div>
      )}

      <div className="bestseller-panel">
        <div className="bestseller-panel-head">
          <div className="inventory-fillall-text">
            <strong>{t("bestSellersHeading")}</strong>
            <span>{t("bestSellersDesc")}</span>
          </div>
          <div className="menu-manager-toolbar-actions">
            {bestSellerReordering ? (
              <>
                <button type="button" className="btn btn-ghost btn-sm" onClick={cancelBestSellerReorder} disabled={savingBestSellerOrder}>{t("cancel")}</button>
                <button type="button" className="btn btn-primary btn-sm" onClick={saveBestSellerOrder} disabled={savingBestSellerOrder}>
                  {savingBestSellerOrder ? t("saving") : t("saveOrder")}
                </button>
              </>
            ) : (
              <button type="button" className="btn btn-ghost btn-sm" onClick={startBestSellerReorder} disabled={bestSellerItems.length < 2}>{t("reorder")}</button>
            )}
          </div>
        </div>

        <div className="bestseller-grid">
          {displayBestSellerItems.map((p) => (
            <div
              className={`bestseller-card${bestSellerReordering ? " reordering" : ""}${draggingBestSellerId === p.id ? " dragging" : ""}`}
              key={p.id}
              draggable={bestSellerReordering}
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", p.id);
                setDraggingBestSellerId(p.id);
              }}
              onDragOver={(e) => handleBestSellerDragOver(e, p.id)}
              onDrop={(e) => e.preventDefault()}
              onDragEnd={() => setDraggingBestSellerId(null)}
            >
              {bestSellerReordering && <span className="menu-manager-drag-handle" aria-hidden="true"><IcGrip /></span>}
              {bestSellerReordering && (
                <button
                  type="button"
                  className="bestseller-card-remove"
                  onClick={() => removeBestSeller(p.id)}
                  aria-label={`Remove ${p.name} from Best Sellers`}
                >
                  &times;
                </button>
              )}
              {p.img ? <img src={p.img} alt={p.name} /> : <div className="menu-manager-noimg" />}
              <span className="bestseller-card-name">{p.name}</span>
            </div>
          ))}
          {bestSellerItems.length === 0 && <p className="inventory-hint">{t("noBestSellersYet")}</p>}
        </div>
      </div>

      <p className="inventory-hint">{t("editHint")}</p>

      <div className="inventory-layout">
        <nav className="menu-maincats" aria-label="Menu categories">
          <h3 className="menu-maincats-label">{t("menu")}</h3>
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
            <div className="menu-manager-toolbar-actions">
              {reordering ? (
                <>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={cancelReorder} disabled={savingOrder}>{t("cancel")}</button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={saveOrder} disabled={savingOrder}>
                    {savingOrder ? t("saving") : t("saveOrder")}
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={startReorder} disabled={visibleItems.length < 2}>{t("reorder")}</button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>{t("addNewItem")}</button>
                </>
              )}
            </div>
          </div>

          {reordering && <p className="inventory-hint">{t("dragHint")}</p>}

          <div className="inventory-list">
            {displayItems.map((p) => (
              <div
                className={`inventory-row menu-manager-row${p.isActive === false ? " inactive" : ""}${reordering ? " reordering" : ""}${draggingId === p.id ? " dragging" : ""}`}
                key={p.id}
                draggable={reordering}
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", p.id);
                  setDraggingId(p.id);
                }}
                onDragOver={(e) => handleDragOver(e, p.id)}
                onDrop={(e) => e.preventDefault()}
                onDragEnd={() => setDraggingId(null)}
              >
                {reordering && <span className="menu-manager-drag-handle" aria-hidden="true"><IcGrip /></span>}
                {p.img ? <img src={p.img} alt={p.name} /> : <div className="menu-manager-noimg" />}
                <div className="inventory-row-info">
                  <div className="inventory-row-name">
                    {p.name}
                    {p.isActive === false && <span className="menu-manager-hidden-badge">{t("hidden")}</span>}
                  </div>
                  <div className="inventory-row-price">${p.price.toFixed(2)}</div>
                </div>
                {!reordering && (
                  <>
                    <div className="menu-manager-star-wrap">
                      <button
                        type="button"
                        className={`menu-manager-star${p.isBestSeller ? " active" : ""}`}
                        onClick={() => toggleBestSeller(p)}
                        aria-label={p.isBestSeller ? t("removeFromBestSellers") : t("markAsBestSeller")}
                        title={p.isBestSeller ? t("bestSellerShownOnHome") : t("markAsBestSeller")}
                      >
                        <IcStar filled={p.isBestSeller} />
                      </button>
                      {bestSellerLimitId === p.id && (
                        <span className="menu-manager-star-notice">{t("bestSellersFull")}</span>
                      )}
                    </div>
                    <div className="menu-manager-row-actions">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>{t("edit")}</button>
                      <button type="button" className="btn btn-ghost btn-sm menu-manager-delete" onClick={() => handleDelete(p)}>{t("delete")}</button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {displayItems.length === 0 && <p className="inventory-hint">{t("noItemsYet")}</p>}
          </div>
        </div>
      </div>

      {form && (
        <div className="admin-form-overlay" onClick={closeForm}>
          <div className="admin-form-panel" onClick={(e) => e.stopPropagation()}>
            <h3>{form.id ? t("editItemTitle") : t("addNewItemTitle")}</h3>
            <form onSubmit={handleSubmit}>
              <div className="menu-manager-photo-row">
                {form.imageUrl ? <img src={productImageUrl(form.imageUrl)} alt="" className="menu-manager-photo-preview" /> : <div className="menu-manager-noimg large" />}
                <div>
                  <p className="menu-manager-photo-hint">{t("recommendedSize")}</p>
                  <label className="btn btn-ghost btn-sm menu-manager-upload-btn">
                    {uploading ? t("uploading") : t("uploadPhoto")}
                    <input type="file" accept="image/*" onChange={handlePhotoChange} disabled={uploading} hidden />
                  </label>
                </div>
              </div>

              <div className="form-grid">
                <div className="field full">
                  <label>{t("name")}</label>
                  <input type="text" value={form.name} onChange={(e) => updateForm({ name: e.target.value })} required />
                </div>
                <div className="field">
                  <label>{t("category")}</label>
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
                    <label>{t("subcategory")}</label>
                    <select value={form.subcategoryId ?? ""} onChange={(e) => updateForm({ subcategoryId: e.target.value })}>
                      {CATEGORIES.find((c) => c.id === form.categoryId).subcategories.map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="field">
                  <label>{t("price")}</label>
                  <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => updateForm({ price: e.target.value })} required />
                </div>
                <div className="field full">
                  <label>{t("description")}</label>
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
                  <h4>{t("addonsAvailable")}</h4>
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
                {t("showOnMenuSite")}
              </label>

              {formError && <p className="form-status err">{formError}</p>}

              <div className="menu-manager-form-actions">
                <button type="button" className="btn btn-ghost" onClick={closeForm} disabled={saving}>{t("cancel")}</button>
                <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
                  {saving ? t("saving") : form.id ? t("saveChanges") : t("register")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
