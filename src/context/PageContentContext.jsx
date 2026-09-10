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
      aboutPhotos: r.about_photos && typeof r.about_photos === "object" ? r.about_photos : {},
      aboutContent: r.about_content && typeof r.about_content === "object" ? r.about_content : {},
      contactCardImage: r.contact_card_image || null,
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
      fetchAll()
        .then((pages) => {
          if (!cancelled) setState({ pages, loading: false });
        })
        // Pages that gate rendering on `loading` (avoiding a flash of
        // bundled default content before the real row arrives — see
        // Home.jsx) would otherwise stay blank forever if this request
        // never resolves (e.g. offline) instead of falling back to those
        // defaults like they used to.
        .catch(() => {
          if (!cancelled) setState({ pages: {}, loading: false });
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

// { pages: {[page_id]: {title, tagline, description, images, aboutPhotos, aboutContent, contactCardImage}}, loading }
// aboutPhotos/aboutContent are only meaningful for page_id "about" — named
// photo slots and text/icon overrides (see src/lib/aboutPhotos.js and
// aboutContent.js), not a hero carousel, used by About.jsx.
// contactCardImage is only meaningful for page_id "contact" — the single
// photo in the Catering & Bulk Orders card, separate from that page's own
// hero carousel (images).
export function usePageContent() {
  const ctx = useContext(PageContentContext);
  if (!ctx) throw new Error("usePageContent must be used within PageContentProvider");
  return ctx;
}
