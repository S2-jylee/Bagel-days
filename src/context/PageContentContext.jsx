import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const PageContentContext = createContext(null);

function buildState(rows) {
  const pages = {};
  for (const r of rows) {
    pages[r.page_id] = {
      title: r.title,
      tagline: r.tagline,
      description: r.description,
      images: Array.isArray(r.images) ? r.images : [],
    };
  }
  return pages;
}

async function fetchAll() {
  const { data } = await supabase.from("page_content").select("*");
  return buildState(data || []);
}

export function PageContentProvider({ children }) {
  const [state, setState] = useState({ pages: {}, loading: true });

  useEffect(() => {
    let cancelled = false;

    function reload() {
      fetchAll().then((pages) => {
        if (!cancelled) setState({ pages, loading: false });
      });
    }
    reload();

    const channel = supabase
      .channel("page-content-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "page_content" }, reload)
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return <PageContentContext.Provider value={state}>{children}</PageContentContext.Provider>;
}

// { pages: {[page_id]: {title, tagline, description, images}}, loading }
export function usePageContent() {
  const ctx = useContext(PageContentContext);
  if (!ctx) throw new Error("usePageContent must be used within PageContentProvider");
  return ctx;
}
