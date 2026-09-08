// Fallback taxonomy, used by CategoriesContext only while the menu_categories/
// menu_subcategories tables are still loading (or briefly empty) — the real,
// admin-editable source of truth lives in Supabase now (see admin/MenuManager.jsx's
// category management UI). Keeping this in sync with the DB isn't required; it
// only needs to look reasonable for the first paint.
export const DEFAULT_CATEGORIES = [
  {
    id: "bagels", label: "Bagels",
    subcategories: [
      { id: "classic-savoury", label: "Classic & Savoury" },
      { id: "sweet", label: "Sweet" },
      { id: "signature", label: "Signature" },
      { id: "sandwiches", label: "Sandwiches" },
    ],
  },
  {
    id: "cream-cheese", label: "Cream Cheese",
    subcategories: [
      { id: "savoury", label: "Savoury" },
      { id: "sweet", label: "Sweet" },
    ],
  },
  {
    id: "salt-bread", label: "Salt Bread",
    subcategories: [
      { id: "classic", label: "Classic" },
      { id: "flavoured", label: "Flavoured" },
    ],
  },
  {
    id: "dessert", label: "Dessert",
    subcategories: [
      { id: "bagel-cakes", label: "Bagel Cakes" },
      { id: "slices", label: "Slices" },
    ],
  },
  {
    id: "coffee", label: "Coffee & Drink",
    subcategories: [
      { id: "hot", label: "Hot Coffee" },
      { id: "iced", label: "Iced Drinks" },
    ],
  },
];
