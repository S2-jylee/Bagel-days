import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { productImageUrl } from "../lib/assetUrl";

const ProductsContext = createContext(null);

function buildState(products, addons, links, addonGroups) {
  const addonGroupById = {};
  for (const g of addonGroups) {
    addonGroupById[g.id] = { id: g.id, categoryId: g.category_id, title: g.title, sortOrder: g.sort_order };
  }

  const addonById = {};
  for (const a of addons) {
    const group = addonGroupById[a.group_id];
    addonById[a.id] = {
      id: a.id,
      name: a.name,
      price: Number(a.price),
      groupId: a.group_id,
      // Denormalized from the option's group so existing per-category
      // filtering (product-addon picker, Menu.jsx's per-category list)
      // keeps working unchanged — an option's category is its group's.
      categoryId: group?.categoryId ?? null,
      groupTitle: group?.title ?? "",
      groupSortOrder: group?.sortOrder ?? 0,
      sortOrder: a.sort_order,
    };
  }

  const addonsByProduct = {};
  for (const l of links) {
    (addonsByProduct[l.product_id] ??= []).push(addonById[l.addon_id]);
  }

  const productMap = {};
  for (const p of products) {
    productMap[p.id] = {
      id: p.id,
      name: p.name,
      price: Number(p.price),
      img: productImageUrl(p.image_url),
      imageUrl: p.image_url,
      desc: p.description || "",
      categoryId: p.category_id,
      subcategoryId: p.subcategory_id,
      isActive: p.is_active,
      sortOrder: p.sort_order,
      isBestSeller: p.is_best_seller,
      bestSellerOrder: p.best_seller_order,
      isCategoryBest: p.is_category_best,
      categoryBestOrder: p.category_best_order,
      badges: Array.isArray(p.badges) ? p.badges : [],
      variants: Array.isArray(p.variants) ? p.variants : [],
      baseVariantLabel: p.base_variant_label || "",
      setItems: Array.isArray(p.set_items) ? p.set_items : [],
      // A set's actual composition — a list of labeled sections, each
      // offering either specific products or "any item in this category/
      // subcategory" as choices. Replaces the flat set_items list above,
      // which described one fixed combo rather than a menu of combinable
      // options (this is a build-your-own-combo listing, not a
      // separately-orderable product — see MenuManager's set-builder).
      setSections: Array.isArray(p.set_sections) ? p.set_sections : [],
      addons: (addonsByProduct[p.id] || []).filter(Boolean),
    };
  }
  return { products: productMap, addons: addonById, addonGroups: addonGroupById };
}

async function fetchAll() {
  const [{ data: products }, { data: addons }, { data: links }, { data: addonGroups }] = await Promise.all([
    supabase.from("products").select("*"),
    supabase.from("addons").select("*").order("sort_order"),
    supabase.from("product_addons").select("product_id, addon_id"),
    supabase.from("addon_groups").select("*").order("sort_order"),
  ]);
  return buildState(products || [], addons || [], links || [], addonGroups || []);
}

export function ProductsProvider({ children }) {
  const [state, setState] = useState({ products: {}, addons: {}, addonGroups: {}, loading: true });

  useEffect(() => {
    let cancelled = false;

    function reload() {
      fetchAll().then((next) => {
        if (!cancelled) setState({ ...next, loading: false });
      });
    }
    reload();

    // Admin edits (add/edit/delete a product, adjust its add-ons, grow the add-on
    // pool) are low-frequency — a full refetch on any change is simpler and safer
    // than patching three joined tables' worth of local state by hand.
    const channel = supabase
      .channel("products-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "addons" }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "addon_groups" }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "product_addons" }, reload)
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return <ProductsContext.Provider value={state}>{children}</ProductsContext.Provider>;
}

// Buckets a flat list of addons (as found on `addons` / `product.addons`)
// back into their groups — every consumer that displays add-ons (Menu's
// per-category panel, a product's modal) shows "group title, then its
// options" rather than one flat list, so this lives here once instead of
// being reimplemented per screen.
export function groupAddons(list) {
  const groups = new Map();
  for (const a of list) {
    if (!groups.has(a.groupId)) groups.set(a.groupId, { groupId: a.groupId, title: a.groupTitle, groupSortOrder: a.groupSortOrder, options: [] });
    groups.get(a.groupId).options.push(a);
  }
  return [...groups.values()]
    .sort((x, y) => x.groupSortOrder - y.groupSortOrder)
    .map((g) => ({ ...g, options: [...g.options].sort((a, b) => a.sortOrder - b.sortOrder) }));
}

// { products: {[id]: {...}}, addons: {[id]: {...}}, addonGroups: {[id]: {...}}, loading }
export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error("useProducts must be used within ProductsProvider");
  return ctx;
}
