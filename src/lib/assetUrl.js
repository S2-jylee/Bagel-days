// Prefixes a root-relative path (e.g. "/assets/images/x.jpg") with Vite's
// configured base path. Needed because GitHub Pages serves this site from
// a /bagel-days/ subpath, not the domain root — a plain "/assets/..." string
// resolves from the domain root and 404s, since Vite only rewrites asset
// URLs it processes through the build pipeline (imports, index.html tags),
// not raw strings embedded in JSX/JS.
export function asset(path) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
}

// Product photos are either a legacy site-relative path ("/assets/images/x.jpg",
// for the original catalog migrated into the DB — needs the same base-path
// treatment as any other asset() call) or a full Supabase Storage URL (for
// anything uploaded via the admin Menu manager, already absolute).
export function productImageUrl(url) {
  if (!url) return "";
  return /^https?:\/\//.test(url) ? url : asset(url);
}
