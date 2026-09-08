import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { DEFAULT_CATEGORIES } from "../data/categories";

const CategoriesContext = createContext(null);

function buildState(categoryRows, subcategoryRows) {
  const subsByCat = {};
  for (const s of subcategoryRows) {
    (subsByCat[s.category_id] ??= []).push(s);
  }
  return categoryRows.map((c) => ({
    id: c.id,
    label: c.label,
    subcategories: (subsByCat[c.id] || [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((s) => ({ id: s.id, label: s.label })),
  }));
}

async function fetchAll() {
  const [{ data: categoryRows }, { data: subcategoryRows }] = await Promise.all([
    supabase.from("menu_categories").select("*").order("sort_order"),
    supabase.from("menu_subcategories").select("*"),
  ]);
  const categories = buildState(categoryRows || [], subcategoryRows || []);
  return categories.length > 0 ? categories : DEFAULT_CATEGORIES;
}

export function CategoriesProvider({ children }) {
  const [state, setState] = useState({ categories: DEFAULT_CATEGORIES, loading: true });

  useEffect(() => {
    let cancelled = false;

    function reload() {
      fetchAll().then((categories) => {
        if (!cancelled) setState({ categories, loading: false });
      });
    }
    reload();

    // Admin edits (add/rename/reorder/delete a category or subcategory) are
    // low-frequency — a full refetch of both tables on any change is simpler
    // and safer than patching nested local state by hand.
    const channel = supabase
      .channel("categories-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_categories" }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_subcategories" }, reload)
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return <CategoriesContext.Provider value={state}>{children}</CategoriesContext.Provider>;
}

// { categories: [{id, label, subcategories: [{id, label}]}], loading }
export function useCategories() {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error("useCategories must be used within CategoriesProvider");
  return ctx;
}
