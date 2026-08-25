import { useEffect } from "react";

// GitHub Pages serves this site from https://s2-jylee.github.io/Bagel-days/ —
// keep in sync with the `base` in vite.config.js if the repo/host ever changes.
export const SITE_ORIGIN = "https://s2-jylee.github.io";
export const SITE_URL = `${SITE_ORIGIN}${import.meta.env.BASE_URL}`;

function upsertMeta(attr, key, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function upsertJsonLd(id, data) {
  let el = document.head.querySelector(`script[data-seo-id="${id}"]`);
  if (!data) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.setAttribute("data-seo-id", id);
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

// Sets per-page title, description, canonical, Open Graph/Twitter tags, and
// an optional JSON-LD block. Each route mounts a fresh page component, so
// this just runs on mount and overwrites whatever the previous page set.
export function useSeo({ title, description, path = "/", image, noindex = false, jsonLd } = {}) {
  useEffect(() => {
    const url = `${SITE_URL}${path.replace(/^\//, "")}`;
    const ogImage = image ? `${SITE_ORIGIN}${image}` : `${SITE_URL}assets/images/storefront.jpg`;

    if (title) document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", noindex ? "noindex,nofollow" : "index,follow");
    upsertLink("canonical", url);

    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:image", ogImage);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:site_name", "Bagel Days");

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", ogImage);

    upsertJsonLd("page", jsonLd);
  }, [title, description, path, image, noindex, jsonLd]);
}
