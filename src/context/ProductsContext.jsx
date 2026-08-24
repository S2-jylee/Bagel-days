import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { asset } from "../lib/assetUrl";

const ProductsContext = createContext(null);

// Product photos are either a legacy site-relative path ("/assets/images/x.jpg",
// for the original catalog migrated into the DB) or a full Supabase Storage URL
// (for anything uploaded via the admin Menu manager) — tell them apart by scheme.
function resolveImg(url) {
  if (!url) return "";
  return /^https?:\/\//.test(url) ? url : asset(url);
}

function buildState(products, addons, links) {
  const addonById = {};
  for (const a of addons) addonById[a.id] = { id: a.id, name: a.name, price: Number(a.price), categoryId: a.category_id };

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
      img: resolveImg(p.image_url),
      imageUrl: p.image_url,
      desc: p.description || "",
      categoryId: p.category_id,
      subcategoryId: p.subcategory_id,
      isActive: p.is_active,
      sortOrder: p.sort_order,
      addons: (addonsByProduct[p.id] || []).filter(Boolean),
    };
  }
  return { products: productMap, addons: addonById };
}

async function fetchAll() {
  const [{ data: products }, { data: addons }, { data: links }] = await Promise.all([
    supabase.from("products").select("*"),
    supabase.from("addons").select("*"),
    supabase.from("product_addons").select("product_id, addon_id"),
  ]);
  return buildState(products || [], addons || [], links || []);
}

export function ProductsProvider({ children }) {
  const [state, setState] = useState({ products: {}, addons: {}, loading: true });

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
      .on("postgres_changes", { event: "*", schema: "public", table: "product_addons" }, reload)
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return <ProductsContext.Provider value={state}>{children}</ProductsContext.Provider>;
}

// { products: {[id]: {...}}, addons: {[id]: {...}}, loading }
export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error("useProducts must be used within ProductsProvider");
  return ctx;
}
