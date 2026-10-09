// Named photo slots for the About page (src/pages/About.jsx) — fixed
// positions in that page's layout, not a reorderable hero carousel, so
// each one is edited individually in admin (Homepage > About) rather than
// through the shared add/reorder/remove PhotoField used for hero images.
// Shared between About.jsx (render) and admin/HomepageManager.jsx (edit)
// so the two can't drift out of sync on slot keys or defaults.
// `size` is the recommended upload size in px (about 2x what the slot
// renders at on desktop, in the slot's own aspect ratio) — shown as a small
// badge on each photo in admin so staff know what to prepare.
export const ABOUT_PHOTO_SLOTS = [
  { key: "storyMain", labelKey: "aboutPhotoStoryMain", default: "/assets/images/dough-rolling.jpg", size: "780 × 1040" },
  { key: "storyTop", labelKey: "aboutPhotoStoryTop", default: "/assets/images/dough-baking.jpg", size: "800 × 500" },
  { key: "storyBottom", labelKey: "aboutPhotoStoryBottom", default: "/assets/images/bagel-everything.jpg", size: "800 × 500" },
  { key: "candy", labelKey: "aboutPhotoCandy", default: "/assets/images/candy-mascot.png", size: "800 × 600" },
  // The mascot illustration on the right of the Meet Candy panel — a
  // transparent PNG sitting straight on the panel's cream background.
  { key: "candyDeco", labelKey: "aboutPhotoCandyDeco", default: "/assets/images/mascot-dog.png", size: "300 × 450" },
  { key: "special1", labelKey: "aboutPhotoSpecial1", default: "/assets/images/dough-rolling.jpg", size: "560 × 420" },
  { key: "special2", labelKey: "aboutPhotoSpecial2", default: "/assets/images/dough-baking.jpg", size: "560 × 420" },
  { key: "special3", labelKey: "aboutPhotoSpecial3", default: "/assets/images/bagel-everything.jpg", size: "560 × 420" },
  { key: "special4", labelKey: "aboutPhotoSpecial4", default: "/assets/images/cream-plain.jpg", size: "560 × 420" },
  { key: "special5", labelKey: "aboutPhotoSpecial5", default: "/assets/images/coffee-flatwhite.jpg", size: "560 × 420" },
];

export const DEFAULT_ABOUT_PHOTOS = Object.fromEntries(ABOUT_PHOTO_SLOTS.map((s) => [s.key, s.default]));
export const ABOUT_PHOTO_SIZES = Object.fromEntries(ABOUT_PHOTO_SLOTS.map((s) => [s.key, s.size]));

// "candy" (Meet Candy) is the one slot that can hold several photos to
// browse through (infinite-looping, like HeroCarousel) instead of just
// one — this normalizes whatever's stored there (nothing yet, a single
// legacy string from before this feature, or the intended array) into a
// non-empty array of photo URLs/paths to render.
export function candyPhotoList(photos) {
  const raw = photos?.candy;
  if (Array.isArray(raw) && raw.length > 0) return raw;
  if (typeof raw === "string" && raw) return [raw];
  return [DEFAULT_ABOUT_PHOTOS.candy];
}
