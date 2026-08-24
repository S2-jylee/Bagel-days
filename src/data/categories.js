import { asset } from "../lib/assetUrl";

// Fixed navigation taxonomy — categories/subcategories themselves aren't admin-editable,
// only the products inside them (see admin/MenuManager.jsx). Products carry their own
// category_id/subcategory_id (set in Supabase) rather than being listed here, so new
// items added via admin show up without touching this file.
export const CATEGORIES = [
  {
    id: "bagels", label: "Bagels", img: asset("/assets/images/bagel-plain.jpg"),
    subcategories: [
      { id: "classic-savoury", label: "Classic & Savoury" },
      { id: "sweet", label: "Sweet" },
      { id: "signature", label: "Signature" },
      { id: "sandwiches", label: "Sandwiches" },
    ],
  },
  {
    id: "cream-cheese", label: "Cream Cheese", img: asset("/assets/images/cream-plain.jpg"),
    subcategories: [
      { id: "savoury", label: "Savoury" },
      { id: "sweet", label: "Sweet" },
    ],
  },
  {
    id: "salt-bread", label: "Salt Bread", img: asset("/assets/images/salt-bread.jpg"),
    subcategories: [
      { id: "classic", label: "Classic" },
      { id: "flavoured", label: "Flavoured" },
    ],
  },
  {
    id: "dessert", label: "Dessert", img: asset("/assets/images/dessert-signature.jpg"),
    subcategories: [
      { id: "bagel-cakes", label: "Bagel Cakes" },
      { id: "slices", label: "Slices" },
    ],
  },
  {
    id: "coffee", label: "Coffee & Drink", img: asset("/assets/images/coffee-flatwhite.jpg"),
    subcategories: [
      { id: "hot", label: "Hot Coffee" },
      { id: "iced", label: "Iced Drinks" },
    ],
  },
];
