import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { useProducts } from "../../context/ProductsContext";
import { useCategories } from "../../context/CategoriesContext";
import { productImageUrl } from "../../lib/assetUrl";
import { resizeImage } from "../../lib/imageResize";
import {
  IcDonut, IcTub, IcBread, IcCakeSlice, IcCup, IcBowl, IcSet, IcTag, IcPlus, IcCheck, IcStar, IcGrip,
  IcPencil, IcTrash,
} from "../../components/Icons";
import { useAdminLang } from "../../lib/adminI18n";
import { logActivity } from "../../lib/activityLog";

const CATEGORY_ICONS = {
  bagels: IcDonut,
  "cream-cheese": IcTub,
  "salt-bread": IcBread,
  dessert: IcCakeSlice,
  coffee: IcCup,
  side: IcBowl,
  set: IcSet,
};

const BUCKET = "product-images";
const BEST_SELLER_LIMIT = 6;
const CATEGORY_BEST_LIMIT = 6;

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

// Only reports the fields that actually changed between a product's prior
// state and the just-submitted form, instead of always repeating the same
// fixed field (price) regardless of what staff actually edited.
function diffProductDetails(prev, row, categories, t) {
  const changes = [];
  if (prev.name !== row.name) changes.push(`${t("name")}: ${prev.name} → ${row.name}`);
  if (prev.price !== row.price) changes.push(`${t("price")}: $${prev.price.toFixed(2)} → $${row.price.toFixed(2)}`);
  if (prev.categoryId !== row.category_id) {
    const prevCat = categories.find((c) => c.id === prev.categoryId);
    const nextCat = categories.find((c) => c.id === row.category_id);
    changes.push(`${t("category")}: ${prevCat?.label ?? prev.categoryId} → ${nextCat?.label ?? row.category_id}`);
  } else if (prev.subcategoryId !== row.subcategory_id) {
    const cat = categories.find((c) => c.id === row.category_id);
    const prevSub = cat?.subcategories.find((s) => s.id === prev.subcategoryId);
    const nextSub = cat?.subcategories.find((s) => s.id === row.subcategory_id);
    changes.push(`${t("subcategory")}: ${prevSub?.label ?? "—"} → ${nextSub?.label ?? "—"}`);
  }
  if ((prev.desc || "") !== (row.description || "")) changes.push(t("description"));
  if ((prev.isActive !== false) !== row.is_active) changes.push(t("showOnMenuSite"));
  if (JSON.stringify([...(prev.badges || [])].sort()) !== JSON.stringify([...row.badges].sort())) changes.push(t("badgeLabel"));
  if (
    JSON.stringify(prev.variants || []) !== JSON.stringify(row.variants) ||
    (prev.baseVariantLabel || "") !== (row.base_variant_label || "")
  ) changes.push(t("addVariantRow"));
  return changes.length > 0 ? changes.join("; ") : undefined;
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

async function uploadCategoryIcon(file) {
  // Keep transparency (PNG) instead of flattening onto one fixed color — the
  // icon's button background isn't constant (transparent normally, tan when
  // active), so any single baked-in fill would only match one of those states.
  const resized = await resizeImage(file, 128, { format: "image/png" });
  const path = `category-icons/${crypto.randomUUID()}.png`;
  const { error } = await supabase.storage.from("site-images").upload(path, resized, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  return supabase.storage.from("site-images").getPublicUrl(path).data.publicUrl;
}

// Shared category/subcategory list editor — used both for the top-level
// category nav (variant="nav") and a category's subcategory pills
// (variant="pills"). Outside of manage mode it renders as a plain selectable
// list identical to the old hardcoded CATEGORIES nav/pills, so toggling
// "Manage" is the only visible change for staff who don't need it. Reordering
// in manage mode is drag-and-drop (mirrors the product/best-seller lists
// elsewhere in this file) rather than a Save step — each drop persists
// immediately since there's no larger form around it to batch into.
function TaxonomyEditor({
  items, selectedId, onSelect, onAdd, onRename, onDelete, onReorder, onIconChange, canDelete, deleteBlockedTitle,
  manageLabel, doneLabel, addPlaceholder, manageHint, icons, variant = "nav",
}) {
  const [managing, setManaging] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [order, setOrder] = useState(items.map((it) => it.id));
  const [draggingId, setDraggingId] = useState(null);
  const [uploadingIconId, setUploadingIconId] = useState(null);

  // Re-derive display order whenever the underlying list changes (add,
  // delete, or a reorder landing from elsewhere) — drag only touches this
  // local copy until drop, when the final order is persisted.
  useEffect(() => {
    setOrder(items.map((it) => it.id));
  }, [items]);

  const byId = Object.fromEntries(items.map((it) => [it.id, it]));
  const orderedItems = order.map((id) => byId[id]).filter(Boolean);

  function startEdit(item) {
    setEditingId(item.id);
    setDraft(item.label);
  }

  function commitEdit() {
    const label = draft.trim();
    if (label) onRename(editingId, label);
    setEditingId(null);
  }

  function handleAdd() {
    const label = newLabel.trim();
    if (!label) return;
    onAdd(label);
    setNewLabel("");
  }

  async function handleIconChange(item, e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingIconId(item.id);
    try {
      const url = await uploadCategoryIcon(file);
      await onIconChange(item.id, url);
    } catch (err) {
      window.alert(err.message || "Icon upload failed.");
    } finally {
      setUploadingIconId(null);
    }
  }

  function handleDragOver(e, overId) {
    e.preventDefault();
    if (!draggingId || draggingId === overId) return;
    setOrder((prev) => moveInList(prev, draggingId, overId));
  }

  function handleDragEnd() {
    setDraggingId(null);
    onReorder(orderedItems);
  }

  return (
    <div className={`taxonomy-editor taxonomy-editor-${variant}`}>
      <button
        type="button"
        className="taxonomy-manage-toggle"
        onClick={() => {
          setManaging((m) => !m);
          setEditingId(null);
        }}
      >
        {managing ? doneLabel : manageLabel}
      </button>

      {managing && manageHint && <p className="menu-manager-photo-hint taxonomy-manage-hint">{manageHint}</p>}

      {orderedItems.map((item) => {
        if (!managing) {
          const Ic = icons && (icons[item.id] || icons.__fallback);
          const cls = [variant === "pills" ? "taxonomy-pill-btn" : null, selectedId === item.id ? "active" : ""].filter(Boolean).join(" ");
          return (
            <button key={item.id} className={cls} onClick={() => onSelect(item)}>
              {item.iconUrl ? <img src={item.iconUrl} alt="" className="menu-maincats-icon" /> : Ic && <Ic />}
              <span>{item.label}</span>
            </button>
          );
        }
        const deletable = canDelete(item.id);
        const Ic = icons && (icons[item.id] || icons.__fallback);
        return (
          <div
            className={`taxonomy-edit-row${draggingId === item.id ? " dragging" : ""}`}
            key={item.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", item.id);
              setDraggingId(item.id);
            }}
            onDragOver={(e) => handleDragOver(e, item.id)}
            onDrop={(e) => e.preventDefault()}
            onDragEnd={handleDragEnd}
          >
            <span className="taxonomy-drag-handle" aria-hidden="true"><IcGrip /></span>
            {onIconChange && (
              <label className="taxonomy-icon-upload" title="Change icon">
                {item.iconUrl ? <img src={item.iconUrl} alt="" /> : Ic ? <Ic /> : <IcTag />}
                <input type="file" accept="image/*" hidden disabled={uploadingIconId === item.id} onChange={(e) => handleIconChange(item, e)} />
              </label>
            )}
            {editingId === item.id ? (
              <>
                <input
                  type="text"
                  className="taxonomy-edit-input"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEdit();
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  autoFocus
                />
                <button type="button" onClick={commitEdit} aria-label="Save"><IcCheck /></button>
              </>
            ) : (
              <>
                <span className="taxonomy-edit-label">{item.label}</span>
                <button type="button" onClick={() => startEdit(item)} aria-label="Rename"><IcPencil /></button>
              </>
            )}
            <button
              type="button"
              className="taxonomy-delete-btn"
              onClick={() => onDelete(item)}
              disabled={!deletable}
              title={deletable ? undefined : deleteBlockedTitle}
              aria-label="Delete"
            >
              <IcTrash />
            </button>
          </div>
        );
      })}

      {managing && (
        <div className="taxonomy-add-row">
          <input
            type="text"
            placeholder={addPlaceholder}
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
            }}
          />
          <button type="button" onClick={handleAdd} disabled={!newLabel.trim()} aria-label={addPlaceholder}><IcPlus /></button>
        </div>
      )}
    </div>
  );
}

// A Set product isn't a fixed combo of specific items — it's a listing of
// build-your-own combinations (customers actually order by combining items
// themselves, off-site). So it's described as labeled "sections" (e.g.
// "Bagel", "Cream Cheese"), each offering a menu of choices: either
// specific products, or a whole category/subcategory ("choose any X").
function emptySetSectionPicker() {
  return { categoryId: "", subcategoryId: "", productId: "" };
}

function emptySetSection() {
  return { label: "", choices: [], picker: emptySetSectionPicker() };
}

function emptyForm(category, subcategory) {
  return {
    id: null,
    name: "",
    price: "",
    // Coffee & Drink items are priced per size rather than having one plain
    // price — this pairs with `price` to make the first size row, and seeding
    // one extra (empty) variant row here gets the required 2-row minimum on
    // screen from the start instead of staff having to click "Add Size" first.
    baseVariantLabel: "",
    description: "",
    categoryId: category,
    subcategoryId: subcategory,
    imageUrl: "",
    isActive: true,
    badges: [],
    variants: category === "coffee" ? [{ label: "", price: "" }] : [],
    setSections: category === "set" ? [emptySetSection()] : [],
    addonIds: new Set(),
  };
}

export default function MenuManager() {
  const { t } = useAdminLang();
  const { products, addons } = useProducts();
  const { categories } = useCategories();
  const [activeCat, setActiveCat] = useState(categories[0].id);
  const [activeSubcat, setActiveSubcat] = useState(categories[0].subcategories?.[0]?.id ?? null);
  const [form, setForm] = useState(null); // null = closed, object = open (create or edit)
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState("");
  const [addonPoolOpen, setAddonPoolOpen] = useState(false);
  const [poolTab, setPoolTab] = useState(categories[0].id); // which category's add-ons the pool editor shows; "general" = no category
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
  const [categoryBestLimitId, setCategoryBestLimitId] = useState(null); // product id currently showing the "max 6" notice

  // ---- category best ordering (drag to reorder the panel below the
  // toolbar, then Save) — same pattern as best seller ordering above. ----
  const [categoryBestReordering, setCategoryBestReordering] = useState(false);
  const [categoryBestOrderedIds, setCategoryBestOrderedIds] = useState([]);
  const [savingCategoryBestOrder, setSavingCategoryBestOrder] = useState(false);
  const [draggingCategoryBestId, setDraggingCategoryBestId] = useState(null);

  // Leaving the category/subcategory you were reordering discards the
  // unsaved drag state rather than trying to carry it somewhere it no
  // longer applies.
  useEffect(() => {
    setReordering(false);
    setOrderedIds([]);
  }, [activeCat, activeSubcat]);

  const activeCategory = categories.find((c) => c.id === activeCat) ?? categories[0];
  const activeSubcategory = activeCategory.subcategories?.find((s) => s.id === activeSubcat) ?? null;
  // A product with no subcategory set always shows, regardless of which
  // subcategory tab is active — matches Menu.jsx, and keeps staff from
  // losing track of an item that'd otherwise be invisible on every tab.
  const visibleItems = Object.values(products)
    .filter((p) => p.categoryId === activeCat && (!activeSubcategory || !p.subcategoryId || p.subcategoryId === activeSubcat))
    .sort((a, b) => a.sortOrder - b.sortOrder);
  // Best Menu is shared across the whole category, not scoped to whichever
  // subcategory tab happens to be open — pulled from every product in
  // activeCat (not visibleItems) so it shows and stays editable the same way
  // regardless of which subcategory tab staff are looking at.
  const categoryBestItems = Object.values(products)
    .filter((p) => p.categoryId === activeCat && p.isCategoryBest)
    .sort((a, b) => (a.categoryBestOrder ?? 0) - (b.categoryBestOrder ?? 0));
  const addonList = Object.values(addons);
  const poolAddons = addonList.filter((a) => (poolTab === "general" ? !a.categoryId : a.categoryId === poolTab));
  const allProductIds = Object.keys(products);
  const displayItems = reordering ? orderedIds.map((id) => products[id]).filter(Boolean) : visibleItems;
  const displayCategoryBestItems = categoryBestReordering
    ? categoryBestOrderedIds.map((id) => products[id]).filter(Boolean)
    : categoryBestItems;
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

  // ---- category / subcategory management ----

  const categoryHasProducts = (id) => Object.values(products).some((p) => p.categoryId === id);
  const subcategoryHasProducts = (id) =>
    Object.values(products).some((p) => p.categoryId === activeCat && p.subcategoryId === id);

  async function handleAddCategory(label) {
    const id = uniqueId(label, new Set(categories.map((c) => c.id)));
    await supabase.from("menu_categories").insert({ id, label, sort_order: categories.length });
    logActivity({ action: "create", entity: "category", label, path: t("menu") });
  }

  async function handleRenameCategory(id, label) {
    const prev = categories.find((c) => c.id === id);
    await supabase.from("menu_categories").update({ label }).eq("id", id);
    logActivity({ action: "update", entity: "category", label, path: t("menu"), details: prev && prev.label !== label ? `${prev.label} → ${label}` : undefined });
  }

  async function handleDeleteCategory(item) {
    if (!window.confirm(t("deleteCategoryConfirm", item.label))) return;
    await supabase.from("menu_categories").delete().eq("id", item.id);
    logActivity({ action: "delete", entity: "category", label: item.label, path: t("menu") });
    if (activeCat === item.id) {
      const next = categories.find((c) => c.id !== item.id);
      setActiveCat(next?.id ?? null);
      setActiveSubcat(next?.subcategories?.[0]?.id ?? null);
    }
  }

  async function handleReorderCategories(orderedItems) {
    await Promise.all(orderedItems.map((c, i) => supabase.from("menu_categories").update({ sort_order: i }).eq("id", c.id)));
    logActivity({
      action: "reorder",
      entity: "category",
      label: t("menu"),
      path: t("menu"),
      details: orderedItems.map((c) => c.label).join(" → "),
    });
  }

  async function handleCategoryIconChange(id, iconUrl) {
    const cat = categories.find((c) => c.id === id);
    await supabase.from("menu_categories").update({ icon_url: iconUrl }).eq("id", id);
    logActivity({ action: "update", entity: "category", label: cat?.label ?? id, path: t("menu"), details: t("iconChanged") });
  }

  async function handleAddSubcategory(label) {
    const existing = new Set(activeCategory.subcategories.map((s) => s.id));
    const id = uniqueId(label, existing);
    await supabase.from("menu_subcategories").insert({ category_id: activeCat, id, label, sort_order: activeCategory.subcategories.length });
    logActivity({ action: "create", entity: "subcategory", label, path: `${t("menu")} > ${activeCategory.label}` });
  }

  async function handleRenameSubcategory(id, label) {
    const prev = activeCategory.subcategories.find((s) => s.id === id);
    await supabase.from("menu_subcategories").update({ label }).eq("category_id", activeCat).eq("id", id);
    logActivity({ action: "update", entity: "subcategory", label, path: `${t("menu")} > ${activeCategory.label}`, details: prev && prev.label !== label ? `${prev.label} → ${label}` : undefined });
  }

  async function handleDeleteSubcategory(item) {
    if (!window.confirm(t("deleteSubcategoryConfirm", item.label))) return;
    await supabase.from("menu_subcategories").delete().eq("category_id", activeCat).eq("id", item.id);
    logActivity({ action: "delete", entity: "subcategory", label: item.label, path: `${t("menu")} > ${activeCategory.label}` });
    if (activeSubcat === item.id) setActiveSubcat(null);
  }

  async function handleReorderSubcategories(orderedItems) {
    await Promise.all(orderedItems.map((s, i) => supabase.from("menu_subcategories").update({ sort_order: i }).eq("category_id", activeCat).eq("id", s.id)));
    logActivity({
      action: "reorder",
      entity: "subcategory",
      label: activeCategory.label,
      path: `${t("menu")} > ${activeCategory.label}`,
      details: orderedItems.map((s) => s.label).join(" → "),
    });
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
    logActivity({
      action: "reorder",
      entity: "product",
      label: activeSubcategory ? activeSubcategory.label : activeCategory.label,
      path: `${t("menu")} > ${activeCategory.label}${activeSubcategory ? ` > ${activeSubcategory.label}` : ""}`,
      details: orderedIds.map((id) => products[id]?.name).filter(Boolean).join(" → "),
    });
    setSavingOrder(false);
    setReordering(false);
    setOrderedIds([]);
  }

  // ---- best sellers (shown on Home, in the order they were marked) ----

  async function toggleBestSeller(p) {
    if (p.isBestSeller) {
      await supabase.from("products").update({ is_best_seller: false, best_seller_order: null }).eq("id", p.id);
      logActivity({ action: "delete", entity: "best_seller", label: p.name, path: `${t("menu")} > ${t("bestSellersHeading")}` });
      return;
    }
    if (bestSellerItems.length >= BEST_SELLER_LIMIT) {
      setBestSellerLimitId(p.id);
      setTimeout(() => setBestSellerLimitId((cur) => (cur === p.id ? null : cur)), 2200);
      return;
    }
    const nextOrder = Object.values(products).reduce((max, x) => (x.isBestSeller ? Math.max(max, x.bestSellerOrder ?? 0) + 1 : max), 0);
    await supabase.from("products").update({ is_best_seller: true, best_seller_order: nextOrder }).eq("id", p.id);
    logActivity({ action: "create", entity: "best_seller", label: p.name, path: `${t("menu")} > ${t("bestSellersHeading")}` });
  }

  // ---- category best (top row of the product grid, shared across every
  // subcategory of this category — scoped separately from the Home best
  // sellers) ----

  const categoryBestPath = `${t("menu")} > ${activeCategory.label}`;

  async function toggleCategoryBest(p) {
    if (p.isCategoryBest) {
      await supabase.from("products").update({ is_category_best: false, category_best_order: null }).eq("id", p.id);
      logActivity({ action: "delete", entity: "category_best", label: p.name, path: categoryBestPath });
      return;
    }
    if (categoryBestItems.length >= CATEGORY_BEST_LIMIT) {
      setCategoryBestLimitId(p.id);
      setTimeout(() => setCategoryBestLimitId((cur) => (cur === p.id ? null : cur)), 2200);
      return;
    }
    const nextOrder = categoryBestItems.reduce((max, x) => Math.max(max, x.categoryBestOrder ?? 0) + 1, 0);
    // Marking an item as this list's Best Menu also puts the "Best" badge
    // on it, so the highlighted row and the visible badge stay in sync
    // without a separate trip to the edit form — un-marking it later
    // leaves the badge alone, since staff may still want it shown.
    const nextBadges = p.badges.includes("best") ? p.badges : [...p.badges, "best"];
    await supabase.from("products").update({ is_category_best: true, category_best_order: nextOrder, badges: nextBadges }).eq("id", p.id);
    logActivity({ action: "create", entity: "category_best", label: p.name, path: categoryBestPath });
  }

  function startCategoryBestReorder() {
    setCategoryBestOrderedIds(categoryBestItems.map((p) => p.id));
    setCategoryBestReordering(true);
  }

  function cancelCategoryBestReorder() {
    setCategoryBestReordering(false);
    setCategoryBestOrderedIds([]);
  }

  function handleCategoryBestDragOver(e, overId) {
    e.preventDefault();
    if (!draggingCategoryBestId || draggingCategoryBestId === overId) return;
    setCategoryBestOrderedIds((prev) => moveInList(prev, draggingCategoryBestId, overId));
  }

  async function saveCategoryBestOrder() {
    setSavingCategoryBestOrder(true);
    await Promise.all(categoryBestOrderedIds.map((id, i) => supabase.from("products").update({ category_best_order: i }).eq("id", id)));
    logActivity({
      action: "reorder",
      entity: "category_best",
      label: activeCategory.label,
      path: categoryBestPath,
      details: categoryBestOrderedIds.map((id) => products[id]?.name).filter(Boolean).join(" → "),
    });
    setSavingCategoryBestOrder(false);
    setCategoryBestReordering(false);
    setCategoryBestOrderedIds([]);
  }

  async function removeCategoryBest(id) {
    const name = products[id]?.name;
    setCategoryBestOrderedIds((prev) => prev.filter((x) => x !== id));
    await supabase.from("products").update({ is_category_best: false, category_best_order: null }).eq("id", id);
    logActivity({ action: "delete", entity: "category_best", label: name, path: categoryBestPath });
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
    logActivity({
      action: "reorder",
      entity: "best_seller",
      label: t("bestSellersHeading"),
      path: `${t("menu")} > ${t("bestSellersHeading")}`,
      details: bestSellerOrderedIds.map((id) => products[id]?.name).filter(Boolean).join(" → "),
    });
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
    const variants = (p.variants || []).map((v) => ({ label: v.label, price: String(v.price) }));
    setForm({
      id: p.id,
      name: p.name,
      price: String(p.price),
      baseVariantLabel: p.baseVariantLabel || "",
      description: p.desc,
      categoryId: p.categoryId,
      subcategoryId: p.subcategoryId,
      imageUrl: p.imageUrl || "",
      isActive: p.isActive !== false,
      badges: p.badges || [],
      // A coffee item saved before this feature (or with every size later
      // removed) would otherwise show just one row here — pad it back up to
      // the required 2-row minimum.
      variants: p.categoryId === "coffee" && variants.length === 0 ? [{ label: "", price: "" }] : variants,
      setSections:
        p.categoryId === "set"
          ? (p.setSections || []).length > 0
            ? (p.setSections || []).map((s) => ({ label: s.label, choices: s.choices, picker: emptySetSectionPicker() }))
            : [emptySetSection()]
          : [],
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

  // ---- size/variant rows (e.g. "L" at a different price) — shown under
  // the base name+price on the product's page, same styling as the name. ----

  function addVariantRow() {
    setForm((f) => ({ ...f, variants: [...f.variants, { label: "", price: "" }] }));
  }

  function updateVariantRow(index, patch) {
    setForm((f) => ({ ...f, variants: f.variants.map((v, i) => (i === index ? { ...v, ...patch } : v)) }));
  }

  function removeVariantRow(index) {
    setForm((f) => ({ ...f, variants: f.variants.filter((_, i) => i !== index) }));
  }

  // ---- Set category sections (each a labeled group of choices, built via
  // its own category -> subcategory -> product picker) ----

  function addSetSection() {
    setForm((f) => ({ ...f, setSections: [...f.setSections, emptySetSection()] }));
  }

  function removeSetSection(index) {
    setForm((f) => ({ ...f, setSections: f.setSections.filter((_, i) => i !== index) }));
  }

  function updateSetSectionLabel(index, label) {
    setForm((f) => ({ ...f, setSections: f.setSections.map((s, i) => (i === index ? { ...s, label } : s)) }));
  }

  function updateSetSectionPicker(index, patch) {
    setForm((f) => ({
      ...f,
      setSections: f.setSections.map((s, i) => (i === index ? { ...s, picker: { ...s.picker, ...patch } } : s)),
    }));
  }

  function addSetSectionChoice(index, choice) {
    setForm((f) => ({
      ...f,
      setSections: f.setSections.map((s, i) =>
        i === index ? { ...s, choices: [...s.choices, choice], picker: emptySetSectionPicker() } : s
      ),
    }));
  }

  function removeSetSectionChoice(sectionIndex, choiceIndex) {
    setForm((f) => ({
      ...f,
      setSections: f.setSections.map((s, i) =>
        i === sectionIndex ? { ...s, choices: s.choices.filter((_, ci) => ci !== choiceIndex) } : s
      ),
    }));
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
        badges: form.badges,
        variants: form.variants
          .filter((v) => v.label.trim() && v.price !== "")
          .map((v) => ({ label: v.label.trim(), price: Number(v.price) })),
        base_variant_label: form.categoryId === "coffee" ? form.baseVariantLabel.trim() || null : null,
        set_items: [],
        set_sections:
          form.categoryId === "set"
            ? form.setSections
                .filter((s) => s.label.trim() && s.choices.length > 0)
                .map((s) => ({ label: s.label.trim(), choices: s.choices }))
            : [],
      };

      if (form.id) {
        const { error } = await supabase.from("products").update(row).eq("id", form.id);
        if (error) throw error;
      } else {
        // Without an explicit sort_order, a new row defaults to the DB's 0 —
        // tying it with whichever existing item never had its order set
        // either, landing it in the middle of the list. Put it at the very
        // top of its category/subcategory bucket instead (one below the
        // current lowest sort_order there).
        const siblingOrders = Object.values(products)
          .filter((p) => p.categoryId === row.category_id && p.subcategoryId === row.subcategory_id)
          .map((p) => p.sortOrder ?? 0);
        const topOrder = siblingOrders.length > 0 ? Math.min(...siblingOrders) - 1 : 0;
        const { error } = await supabase.from("products").insert({ ...row, sort_order: topOrder });
        if (error) throw error;
      }

      await supabase.from("product_addons").delete().eq("product_id", id);
      if (form.addonIds.size > 0) {
        const links = [...form.addonIds].map((addon_id) => ({ product_id: id, addon_id }));
        const { error } = await supabase.from("product_addons").insert(links);
        if (error) throw error;
      }

      const cat = categories.find((c) => c.id === row.category_id);
      const sub = cat?.subcategories.find((s) => s.id === row.subcategory_id);
      const prevProduct = form.id ? products[form.id] : null;
      logActivity({
        action: form.id ? "update" : "create",
        entity: "product",
        label: row.name,
        path: `${t("menu")} > ${cat?.label ?? row.category_id}${sub ? ` > ${sub.label}` : ""}`,
        details: prevProduct ? diffProductDetails(prevProduct, row, categories, t) : `${t("price")}: $${row.price.toFixed(2)}`,
      });

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
    const cat = categories.find((c) => c.id === p.categoryId);
    const sub = cat?.subcategories.find((s) => s.id === p.subcategoryId);
    logActivity({ action: "delete", entity: "product", label: p.name, path: `${t("menu")} > ${cat?.label ?? p.categoryId}${sub ? ` > ${sub.label}` : ""}` });
  }

  async function addPoolAddon() {
    if (!newAddonName.trim() || newAddonPrice === "") return;
    const category_id = poolTab === "general" ? null : poolTab;
    const name = newAddonName.trim();
    const price = Number(newAddonPrice);
    await supabase.from("addons").insert({ name, price, category_id });
    logActivity({
      action: "create",
      entity: "addon",
      label: name,
      path: `${t("menu")} > ${poolTab === "general" ? t("general") : categories.find((c) => c.id === poolTab)?.label}`,
      details: `$${price.toFixed(2)}`,
    });
    setNewAddonName("");
    setNewAddonPrice("");
  }

  async function deletePoolAddon(a) {
    if (!window.confirm(t("removeAddonConfirm", a.name))) return;
    await supabase.from("addons").delete().eq("id", a.id);
    logActivity({ action: "delete", entity: "addon", label: a.name, path: t("menu") });
  }

  return (
    <div>
      <div className="admin-section-header">
        <h2>{t("menuItems")}</h2>
      </div>

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
          <TaxonomyEditor
            items={categories}
            selectedId={activeCat}
            onSelect={selectCategory}
            onAdd={handleAddCategory}
            onRename={handleRenameCategory}
            onDelete={handleDeleteCategory}
            onReorder={handleReorderCategories}
            onIconChange={handleCategoryIconChange}
            canDelete={(id) => !categoryHasProducts(id)}
            deleteBlockedTitle={t("categoryHasProducts")}
            manageLabel={t("manageCategories")}
            doneLabel={t("done")}
            addPlaceholder={t("newCategoryPlaceholder")}
            manageHint={
              <>
                {t("categoryIconHint")}{" "}
                <a href="https://lucide.dev/icons/categories" target="_blank" rel="noopener noreferrer">Download icons</a>
                {" — Color #5a1f1e · Stroke width 2px"}
              </>
            }
            icons={{ ...CATEGORY_ICONS, __fallback: IcTag }}
            variant="nav"
          />
        </nav>

        <div className="inventory-products">
          <h2>{activeCategory.label}</h2>

          {activeCat !== "set" && (
            <div className="menu-manager-toolbar">
              <TaxonomyEditor
                items={activeCategory.subcategories}
                selectedId={activeSubcat}
                onSelect={(sub) => setActiveSubcat(sub.id)}
                onAdd={handleAddSubcategory}
                onRename={handleRenameSubcategory}
                onDelete={handleDeleteSubcategory}
                onReorder={handleReorderSubcategories}
                canDelete={(id) => !subcategoryHasProducts(id)}
                deleteBlockedTitle={t("subcategoryHasProducts")}
                manageLabel={t("manageSubcategories")}
                doneLabel={t("done")}
                addPlaceholder={t("newSubcategoryPlaceholder")}
                variant="pills"
              />
            </div>
          )}

          {activeCat !== "set" && (
            <>
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
                    {categories.map((c) => (
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
                      {t("addToLabel", poolTab === "general" ? t("general") : categories.find((c) => c.id === poolTab)?.label)}
                    </button>
                  </div>
                </div>
              )}

              <div className="bestseller-panel category-best-panel">
                <div className="bestseller-panel-head">
                  <div className="inventory-fillall-text">
                    <strong>{t("categoryBestHeading")}</strong>
                  </div>
                  <div className="menu-manager-toolbar-actions">
                    {categoryBestReordering ? (
                      <>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={cancelCategoryBestReorder} disabled={savingCategoryBestOrder}>{t("cancel")}</button>
                        <button type="button" className="btn btn-primary btn-sm" onClick={saveCategoryBestOrder} disabled={savingCategoryBestOrder}>
                          {savingCategoryBestOrder ? t("saving") : t("saveOrder")}
                        </button>
                      </>
                    ) : (
                      <button type="button" className="btn btn-ghost btn-sm" onClick={startCategoryBestReorder} disabled={categoryBestItems.length < 2}>{t("reorder")}</button>
                    )}
                  </div>
                </div>

                <div className="bestseller-grid">
                  {displayCategoryBestItems.map((p) => (
                    <div
                      className={`bestseller-card${categoryBestReordering ? " reordering" : ""}${draggingCategoryBestId === p.id ? " dragging" : ""}`}
                      key={p.id}
                      draggable={categoryBestReordering}
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", p.id);
                        setDraggingCategoryBestId(p.id);
                      }}
                      onDragOver={(e) => handleCategoryBestDragOver(e, p.id)}
                      onDrop={(e) => e.preventDefault()}
                      onDragEnd={() => setDraggingCategoryBestId(null)}
                    >
                      {categoryBestReordering && <span className="menu-manager-drag-handle" aria-hidden="true"><IcGrip /></span>}
                      {categoryBestReordering && (
                        <button
                          type="button"
                          className="bestseller-card-remove"
                          onClick={() => removeCategoryBest(p.id)}
                          aria-label={`Remove ${p.name} from Best Menu`}
                        >
                          &times;
                        </button>
                      )}
                      {p.img ? <img src={p.img} alt={p.name} /> : <div className="menu-manager-noimg" />}
                      <span className="bestseller-card-name">{p.name}</span>
                    </div>
                  ))}
                  {categoryBestItems.length === 0 && <p className="inventory-hint">{t("noCategoryBestYet")}</p>}
                </div>
              </div>
            </>
          )}

          <div className="menu-manager-toolbar-actions menu-manager-toolbar-actions-left">
            {reordering ? (
              <>
                <button type="button" className="btn btn-ghost btn-sm" onClick={cancelReorder} disabled={savingOrder}>{t("cancel")}</button>
                <button type="button" className="btn btn-primary btn-sm" onClick={saveOrder} disabled={savingOrder}>
                  {savingOrder ? t("saving") : t("saveOrder")}
                </button>
                <p className="inventory-hint inventory-hint-inline">{t("dragHint")}</p>
              </>
            ) : (
              <>
                <button type="button" className="btn btn-ghost btn-sm" onClick={startReorder} disabled={visibleItems.length < 2}>{t("rearrange")}</button>
                <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>{t("addNewItem")}</button>
              </>
            )}
          </div>

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
                    <div className="menu-manager-star-wrap" hidden={activeCat === "set"}>
                      <button
                        type="button"
                        className={`menu-manager-star menu-manager-category-best${p.isCategoryBest ? " active" : ""}`}
                        onClick={() => toggleCategoryBest(p)}
                        aria-label={p.isCategoryBest ? t("removeFromCategoryBest") : t("markAsCategoryBest")}
                        title={p.isCategoryBest ? t("categoryBestShownOnMenu") : t("markAsCategoryBest")}
                      >
                        <IcTag />
                      </button>
                      {categoryBestLimitId === p.id && (
                        <span className="menu-manager-star-notice">{t("categoryBestFull")}</span>
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
                  <div className="menu-manager-photo-actions">
                    <label className="btn btn-ghost btn-sm menu-manager-upload-btn">
                      {uploading ? t("uploading") : t("uploadPhoto")}
                      <input type="file" accept="image/*" onChange={handlePhotoChange} disabled={uploading} hidden />
                    </label>
                    {form.categoryId !== "set" && form.categoryId !== "coffee" && (
                      <button type="button" className="btn btn-ghost btn-sm" onClick={addVariantRow}>{t("addVariantRow")}</button>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-grid">
                {form.categoryId === "set" ? (
                  <>
                    <div className="name-price-row field full set-name-price-row">
                      <div className="field">
                        <label>{t("name")}</label>
                        <input type="text" value={form.name} onChange={(e) => updateForm({ name: e.target.value })} required />
                      </div>
                      <div className="field">
                        <label>{t("price")}</label>
                        <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => updateForm({ price: e.target.value })} required />
                      </div>
                    </div>
                    <div className="field full">
                      <label>{t("description")}</label>
                      <input type="text" className="set-description-input" value={form.description} onChange={(e) => updateForm({ description: e.target.value })} />
                    </div>
                  </>
                ) : form.categoryId === "coffee" ? (
                  <>
                    <div className="field full">
                      <label>{t("name")}</label>
                      <input type="text" value={form.name} onChange={(e) => updateForm({ name: e.target.value })} required />
                    </div>
                    <div className="field">
                      <label>{t("category")}</label>
                      <select
                        value={form.categoryId}
                        onChange={(e) => {
                          const nextCategoryId = e.target.value;
                          const cat = categories.find((c) => c.id === nextCategoryId);
                          updateForm({
                            categoryId: nextCategoryId,
                            subcategoryId: cat.subcategories?.[0]?.id ?? null,
                            variants: nextCategoryId === "coffee" && form.variants.length === 0 ? [{ label: "", price: "" }] : form.variants,
                          });
                        }}
                      >
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                    </div>
                    {categories.find((c) => c.id === form.categoryId)?.subcategories.length > 0 && (
                      <div className="field">
                        <label>{t("subcategory")}</label>
                        <select value={form.subcategoryId ?? ""} onChange={(e) => updateForm({ subcategoryId: e.target.value })}>
                          {categories.find((c) => c.id === form.categoryId).subcategories.map((s) => (
                            <option key={s.id} value={s.id}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="field full option-rows">
                      <div className="option-row">
                        <div className="field">
                          <label>{t("variantLabel")}</label>
                          <input type="text" value={form.baseVariantLabel} onChange={(e) => updateForm({ baseVariantLabel: e.target.value })} required />
                        </div>
                        <div className="field">
                          <label>{t("price")}</label>
                          <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => updateForm({ price: e.target.value })} required />
                        </div>
                      </div>
                      {form.variants.map((v, i) => (
                        <div className="option-row" key={i}>
                          <div className="field">
                            <label>{t("variantLabel")}</label>
                            <input type="text" value={v.label} onChange={(e) => updateVariantRow(i, { label: e.target.value })} required />
                          </div>
                          <div className="field">
                            <label>{t("price")}</label>
                            <div className="variant-price-input-row">
                              <input type="number" min="0" step="0.01" value={v.price} onChange={(e) => updateVariantRow(i, { price: e.target.value })} required />
                              <button type="button" className="variant-remove-btn" onClick={() => removeVariantRow(i)} aria-label={t("removeVariantRow")} title={t("removeVariantRow")}>×</button>
                            </div>
                          </div>
                        </div>
                      ))}
                      <button type="button" className="btn btn-ghost btn-sm" onClick={addVariantRow}>{t("addVariantRow")}</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="name-price-row field full">
                      <div className="field">
                        <label>{t("name")}</label>
                        <input type="text" value={form.name} onChange={(e) => updateForm({ name: e.target.value })} required />
                      </div>
                      <div className="field">
                        <label>{t("price")}</label>
                        <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => updateForm({ price: e.target.value })} required />
                      </div>
                    </div>
                    <div className="field">
                      <label>{t("category")}</label>
                      <select
                        value={form.categoryId}
                        onChange={(e) => {
                          const nextCategoryId = e.target.value;
                          const cat = categories.find((c) => c.id === nextCategoryId);
                          updateForm({
                            categoryId: nextCategoryId,
                            subcategoryId: cat.subcategories?.[0]?.id ?? null,
                            variants: nextCategoryId === "coffee" && form.variants.length === 0 ? [{ label: "", price: "" }] : form.variants,
                          });
                        }}
                      >
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                    </div>
                    {categories.find((c) => c.id === form.categoryId)?.subcategories.length > 0 && (
                      <div className="field">
                        <label>{t("subcategory")}</label>
                        <select value={form.subcategoryId ?? ""} onChange={(e) => updateForm({ subcategoryId: e.target.value })}>
                          {categories.find((c) => c.id === form.categoryId).subcategories.map((s) => (
                            <option key={s.id} value={s.id}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {form.variants.length > 0 && (
                      <div className="field full option-rows">
                        {form.variants.map((v, i) => (
                          <div className="option-row" key={i}>
                            <div className="field">
                              <label>{t("variantLabel")}</label>
                              <input type="text" value={v.label} onChange={(e) => updateVariantRow(i, { label: e.target.value })} />
                            </div>
                            <div className="field">
                              <label>{t("price")}</label>
                              <div className="variant-price-input-row">
                                <input type="number" min="0" step="0.01" value={v.price} onChange={(e) => updateVariantRow(i, { price: e.target.value })} />
                                <button type="button" className="variant-remove-btn" onClick={() => removeVariantRow(i)} aria-label={t("removeVariantRow")} title={t("removeVariantRow")}>×</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {form.categoryId === "set" && (
                  <div className="field full set-builder">
                    <label>{t("setSectionsLabel")}</label>
                    {form.setSections.map((section, si) => {
                      const picker = section.picker;
                      const pickerCat = categories.find((c) => c.id === picker.categoryId);
                      const hasSubcats = (pickerCat?.subcategories.length ?? 0) > 0;
                      const pickerProducts = Object.values(products).filter(
                        (p) => p.categoryId === picker.categoryId && (!hasSubcats || p.subcategoryId === picker.subcategoryId) && p.id !== form.id
                      );
                      const scopeLabel = hasSubcats
                        ? pickerCat?.subcategories.find((s) => s.id === picker.subcategoryId)?.label
                        : pickerCat?.label;
                      return (
                        <div className="set-section" key={si}>
                          <div className="set-section-head">
                            <input
                              type="text"
                              className="set-section-label-input"
                              placeholder={t("setSectionLabelPlaceholder")}
                              value={section.label}
                              onChange={(e) => updateSetSectionLabel(si, e.target.value)}
                            />
                            <button
                              type="button"
                              className="set-section-remove-btn"
                              onClick={() => removeSetSection(si)}
                              aria-label={t("removeSetSection")}
                              title={t("removeSetSection")}
                              disabled={form.setSections.length < 2}
                            >
                              ×
                            </button>
                          </div>
                          <div className="set-builder-row">
                            <select
                              value={picker.categoryId}
                              onChange={(e) => updateSetSectionPicker(si, { categoryId: e.target.value, subcategoryId: "", productId: "" })}
                            >
                              <option value="">{t("setSelectCategory")}</option>
                              {categories.filter((c) => c.id !== "set").map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                            </select>
                            <select
                              value={picker.subcategoryId}
                              onChange={(e) => updateSetSectionPicker(si, { subcategoryId: e.target.value, productId: "" })}
                              disabled={!hasSubcats}
                            >
                              <option value="">{t("setSelectSubcategory")}</option>
                              {pickerCat?.subcategories.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                            </select>
                            <select
                              value={picker.productId}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (!val) return;
                                if (val === "__any__") {
                                  addSetSectionChoice(si, {
                                    type: "category",
                                    categoryId: picker.categoryId,
                                    subcategoryId: hasSubcats ? picker.subcategoryId : null,
                                  });
                                } else {
                                  addSetSectionChoice(si, { type: "product", productId: val });
                                }
                              }}
                              disabled={!picker.categoryId || (hasSubcats && !picker.subcategoryId)}
                            >
                              <option value="">{t("setSelectProduct")}</option>
                              {scopeLabel && <option value="__any__">{t("setAnyItemIn", scopeLabel)}</option>}
                              {pickerProducts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                          </div>
                          {section.choices.length > 0 && (
                            <ul className="set-builder-items">
                              {section.choices.map((choice, ci) => {
                                const text =
                                  choice.type === "product"
                                    ? products[choice.productId]?.name ?? "—"
                                    : t(
                                        "setAnyItemIn",
                                        choice.subcategoryId
                                          ? categories
                                              .find((c) => c.id === choice.categoryId)
                                              ?.subcategories.find((s) => s.id === choice.subcategoryId)?.label
                                          : categories.find((c) => c.id === choice.categoryId)?.label
                                      );
                                return (
                                  <li key={ci}>
                                    <span>{text}</span>
                                    <button
                                      type="button"
                                      className="set-item-remove-btn"
                                      onClick={() => removeSetSectionChoice(si, ci)}
                                      aria-label={t("removeSetItem")}
                                      title={t("removeSetItem")}
                                    >
                                      −
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                    <button type="button" className="btn btn-ghost btn-sm" onClick={addSetSection}>{t("addSetSection")}</button>
                  </div>
                )}

                {form.categoryId !== "set" && (
                  <div className="field full">
                    <label>{t("description")}</label>
                    <textarea value={form.description} onChange={(e) => updateForm({ description: e.target.value })} />
                  </div>
                )}
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

              <div className="field full badge-select-field">
                <label>{t("badgeLabel")}</label>
                <div className="badge-select">
                  {[
                    { value: "signature", label: t("badgeSignature") },
                    { value: "best", label: t("badgeBest") },
                    { value: "new", label: t("badgeNew") },
                  ].map((opt) => {
                    const active = form.badges.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        className={`badge-select-btn${active ? " active" : ""}`}
                        onClick={() => updateForm({
                          badges: active ? form.badges.filter((b) => b !== opt.value) : [...form.badges, opt.value],
                        })}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

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
