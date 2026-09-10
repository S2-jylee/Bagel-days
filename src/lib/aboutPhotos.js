// Named photo slots for the About page (src/pages/About.jsx) — fixed
// positions in that page's layout, not a reorderable hero carousel, so
// each one is edited individually in admin (Homepage > About) rather than
// through the shared add/reorder/remove PhotoField used for hero images.
// Shared between About.jsx (render) and admin/HomepageManager.jsx (edit)
// so the two can't drift out of sync on slot keys or defaults.
export const ABOUT_PHOTO_SLOTS = [
  { key: "storyMain", labelKey: "aboutPhotoStoryMain", default: "/assets/images/dough-rolling.jpg" },
  { key: "storyTop", labelKey: "aboutPhotoStoryTop", default: "/assets/images/dough-baking.jpg" },
  { key: "storyBottom", labelKey: "aboutPhotoStoryBottom", default: "/assets/images/bagel-everything.jpg" },
  { key: "candy", labelKey: "aboutPhotoCandy", default: "/assets/images/candy-mascot.png" },
  { key: "special1", labelKey: "aboutPhotoSpecial1", default: "/assets/images/dough-rolling.jpg" },
  { key: "special2", labelKey: "aboutPhotoSpecial2", default: "/assets/images/dough-baking.jpg" },
  { key: "special3", labelKey: "aboutPhotoSpecial3", default: "/assets/images/bagel-everything.jpg" },
  { key: "special4", labelKey: "aboutPhotoSpecial4", default: "/assets/images/cream-plain.jpg" },
  { key: "special5", labelKey: "aboutPhotoSpecial5", default: "/assets/images/coffee-flatwhite.jpg" },
];

export const DEFAULT_ABOUT_PHOTOS = Object.fromEntries(ABOUT_PHOTO_SLOTS.map((s) => [s.key, s.default]));
