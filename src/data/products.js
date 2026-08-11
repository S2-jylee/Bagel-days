// NOTE: many items below are newly added and don't have real product photography yet
// (flagged "TODO photo" in the comment beside them) — they currently reuse the closest
// existing bagel/sandwich photo as a stand-in. Swap in real photos when available.
export const PRODUCTS = {
  // ---------- Bagels: Classic & Savoury ----------
  "bagel-plain":              { name:"Plain Bagel",                  price:3.5,  img:"/assets/images/bagel-plain.jpg", desc:"Wonderfully soft, moist and chewy. Perfect on its own or with your favourite cream cheese." },
  "bagel-sesame":              { name:"Sesame Bagel",                 price:4.0,  img:"/assets/images/bagel-sesame.jpg", desc:"Covered in toasted sesame seeds for a rich, nutty flavour." },
  "bagel-poppy":                { name:"Poppy Seed Bagel",              price:4.0,  img:"/assets/images/bagel-poppy.jpg", desc:"A delicate crunch of poppy seed in every bite." },
  "bagel-everything":          { name:"Everything Bagel",             price:4.5,  img:"/assets/images/bagel-sesame.jpg", desc:"Loaded with white & black sesame seeds, poppy seeds, garlic, onion and sea salt for a savoury, crunchy bite." }, // TODO photo
  "bagel-onion":                { name:"Onion Bagel",                   price:4.0,  img:"/assets/images/bagel-plain.jpg", desc:"Packed with roasted onion flakes for a rich, savoury flavour." }, // TODO photo
  "bagel-wholemeal":           { name:"Wholemeal Bagel",              price:4.0,  img:"/assets/images/bagel-plain.jpg", desc:"Hearty, soft and moist with a subtle, earthy flavour." }, // TODO photo
  "bagel-multigrain":          { name:"Multigrain Bagel",             price:4.5,  img:"/assets/images/bagel-plain.jpg", desc:"Soft, moist & chewy — loaded with toasted grains and seeds for a rich, crunchy bite." }, // TODO photo
  "bagel-black-olive":         { name:"Black Olive Bagel",            price:4.5,  img:"/assets/images/bagel-plain.jpg", desc:"Soft, moist & chewy — studded with savoury black olives for a rich, aromatic flavour." }, // TODO photo
  "bagel-tomato-basil":        { name:"Sun-Dried Tomato & Basil Bagel", price:4.5, img:"/assets/images/bagel-plain.jpg", desc:"Infused with sweet sun-dried tomatoes and fragrant basil." }, // TODO photo
  "bagel-pepperoni-jalapeno":  { name:"Pepperoni Jalapeño Bagel",     price:5.5,  img:"/assets/images/sandwich-jalapeno.jpg", desc:"Spicy pepperoni and chopped jalapeños wrapped in our signature bagel dough for a bold, savoury kick." }, // TODO photo
  "bagel-garlic-butter":       { name:"Garlic Butter Bagel",          price:4.5,  img:"/assets/images/salt-bread-2.jpg", desc:"Golden bagel dough brushed with rich garlic herb butter." }, // TODO photo
  "bagel-cheesy-potato":       { name:"Cheesy Potato Bagel",          price:5.5,  img:"/assets/images/bagel-plain.jpg", desc:"Filled with creamy mashed potato and topped with a slice of cheese." }, // TODO photo
  "bagel-salt-butter":         { name:"Salt & Butter Bagel",          price:4.5,  img:"/assets/images/salt-bread.jpg", desc:"Rich, buttery dough finished with flaky sea salt." }, // TODO photo
  "bagel-baychel":             { name:"Baychel (Pretzel Bagel)",      price:5.0,  img:"/assets/images/salt-bread.jpg", desc:"Chewy pretzel-style bagel with a deep golden crust." }, // TODO photo

  // ---------- Bagels: Sweet ----------
  "bagel-blueberry":           { name:"Blueberry Bagel",              price:4.5,  img:"/assets/images/bagel-blueberry.jpg", desc:"Naturally sweet bagel packed with juicy blueberries." },
  "bagel-cinnamon":            { name:"Cinnamon Raisin Bagel",        price:4.5,  img:"/assets/images/bagel-cinnamon.jpg", desc:"Made with plump raisins and fragrant cinnamon." },
  "bagel-fig-walnut":          { name:"Fig & Walnut Bagel",           price:5.0,  img:"/assets/images/bagel-cinnamon.jpg", desc:"Made with naturally sweet figs and crunchy walnuts for a rich, nutty flavour." }, // TODO photo
  "bagel-dark-chocolate":      { name:"Dark Chocolate Bagel",         price:4.5,  img:"/assets/images/bagel-Dark-Chocolate.jpg", desc:"A soft, chewy bagel filled with rich dark chocolate and studded with dark chocolate chips." },
  "bagel-coffee-bun":          { name:"Coffee Bun Bagel",             price:5.0,  img:"/assets/images/bagel-cinnamon.jpg", desc:"Soft bun-style bagel topped with a crackly coffee crust." }, // TODO photo

  // ---------- Bagels: Signature ----------
  "bagel-triple-cheese":       { name:"Triple Cheese Bagel",          price:6.0,  img:"/assets/images/bagel-plain.jpg", desc:"A blend of three cheeses, finished with a snowy blanket of finely grated aged cheese." }, // TODO photo
  "bagel-byron":               { name:"Byron",                        price:6.5,  img:"/assets/images/bagel-sesame.jpg", desc:"A sesame bagel filled with rich housemade cream cheese and finished with a drizzle of Australian honey." }, // TODO photo
  "bagel-milky-bum":           { name:"Milky Bum",                    price:6.0,  img:"/assets/images/dessert-signature.jpg", desc:"Vanilla milk cream & fine castella crumb." }, // TODO photo

  // ---------- Bagels: Sandwiches ----------
  "sandwich-jambon-beurre":    { name:"Jambon Beurre",                price:14.5, img:"/assets/images/sandwich-bacon-egg.jpg", desc:"French-style sesame bagel with double smoked ham, cultured butter, Dijon mustard & cornichons." }, // TODO photo
  "sandwich-ham-cheese":       { name:"Ham & Cheese",                 price:12.5, img:"/assets/images/sandwich-bacon-egg.jpg", desc:"Double smoked ham and melted cheese on a toasted bagel." }, // TODO photo
  "sandwich-salmon":           { name:"Smoked Salmon Bagel",          price:13.5, img:"/assets/images/sandwich-salmon.jpg", desc:"Smoked salmon, cream cheese, red onion, capers, dill, lettuce." },
  "sandwich-chicken-avocado":  { name:"Chicken Avocado",              price:13.5, img:"/assets/images/sandwich-avocado.jpg", desc:"Grilled chicken, smashed avocado and fresh greens on a toasted bagel." }, // TODO photo
  "sandwich-carrot-rapees":    { name:"Carrot Râpées Everything",     price:12.0, img:"/assets/images/sandwich-reuben.jpg", desc:"Crisp carrot râpées, cream cheese and fresh greens on an everything bagel, served with a lemon wedge." }, // TODO photo
  "sandwich-butter-baychel":   { name:"Butter Baychel",               price:8.5,  img:"/assets/images/salt-bread.jpg", desc:"Chewy, salty pretzel-style bagel filled with fresh butter." }, // TODO photo
  "sandwich-avocado":          { name:"Avocado & Feta Bagel",         price:12.5, img:"/assets/images/sandwich-avocado.jpg", desc:"Smashed avocado, feta cheese, tomato, red onion, mixed greens." },
  "sandwich-bacon-egg":        { name:"Bacon & Egg Bagel",            price:11.5, img:"/assets/images/sandwich-bacon-egg.jpg", desc:"Crispy bacon, fried egg, cheddar cheese, tomato relish." },
  "sandwich-jalapeno":         { name:"Jalapeño Cheese Bagel",        price:11.5, img:"/assets/images/sandwich-jalapeno.jpg", desc:"Jalapeño cheese bagel with cream cheese and chive." },
  "sandwich-reuben":           { name:"Valley Reuben",                price:17.0, img:"/assets/images/sandwich-reuben.jpg", desc:"Pastrami, swiss, sauerkraut, Russian dressing." },

  // ---------- Cream Cheese ----------
  "cream-plain":        { name:"Plain Cream Cheese",       price:2.5,  img:"/assets/images/cream-plain.jpg", desc:"Whipped daily, smooth and simple." },
  "cream-chive":        { name:"Chive Cream Cheese",       price:2.5,  img:"/assets/images/cream-chive.jpg", desc:"Fresh chive folded through house-whipped cream cheese." },
  "cream-strawberry":   { name:"Strawberry Cream Cheese",  price:3.0,  img:"/assets/images/cream-strawberry.jpg", desc:"Fresh strawberry, lightly sweetened." },
  "cream-honey":        { name:"Honey Walnut Cream Cheese",price:3.2,  img:"/assets/images/cream-honey.jpg", desc:"Toasted walnut and a touch of honey." },

  // ---------- Salt Bread ----------
  "salt-bread":         { name:"Original Salt Bread",      price:5.5,  img:"/assets/images/salt-bread.jpg", desc:"Soft milk bread with a pocket of butter and sea salt." },
  "salt-bread-2":       { name:"Garlic Butter Salt Bread", price:6.0,  img:"/assets/images/salt-bread-2.jpg", desc:"Our salt bread finished with garlic herb butter." },

  // ---------- Dessert ----------
  "dessert-signature":  { name:"Signature Bagel Cake",     price:7.5,  img:"/assets/images/dessert-signature.jpg", desc:"Layered bagel cake with whipped cream and cookie crumble." },
  "dessert-tiramisu":   { name:"Tiramisu Slice",           price:7.0,  img:"/assets/images/dessert-tiramisu.jpg", desc:"Campos espresso-soaked layers with mascarpone cream." },

  // ---------- Coffee & Drink ----------
  "coffee-flatwhite":   { name:"Flat White",               price:4.8,  img:"/assets/images/coffee-flatwhite.jpg", desc:"Campos Specialty Coffee, silky micro-foam." },
  "coffee-longblack":   { name:"Long Black",                price:4.5,  img:"/assets/images/coffee-longblack.jpg", desc:"Double shot, hot water, full-bodied." },
  "coffee-latte":       { name:"Iced Latte",                price:5.8,  img:"/assets/images/coffee-latte.jpg", desc:"Campos espresso over ice with fresh milk." },
  "coffee-matcha":      { name:"Matcha Latte",              price:6.0,  img:"/assets/images/coffee-matcha.jpg", desc:"Ceremonial-grade matcha, steamed milk." },

  "set-classic":        { name:"Bagel + Cream Cheese + Coffee Set", price:12.5, img:"/assets/images/sandwich-set.jpg", desc:"Any Bagel + Cream Cheese + Coffee" }
};

export const CATEGORIES = [
  {
    id: "bagels", label: "Bagels", img: "/assets/images/bagel-plain.jpg",
    subcategories: [
      { id: "classic-savoury", label: "Classic & Savoury", items: ["bagel-plain","bagel-sesame","bagel-poppy","bagel-everything","bagel-onion","bagel-wholemeal","bagel-multigrain","bagel-black-olive","bagel-tomato-basil","bagel-pepperoni-jalapeno","bagel-garlic-butter","bagel-cheesy-potato","bagel-salt-butter","bagel-baychel"] },
      { id: "sweet", label: "Sweet", items: ["bagel-blueberry","bagel-cinnamon","bagel-fig-walnut","bagel-dark-chocolate","bagel-coffee-bun"] },
      { id: "signature", label: "Signature", items: ["bagel-triple-cheese","bagel-byron","bagel-milky-bum"] },
      { id: "sandwiches", label: "Sandwiches", items: ["sandwich-jambon-beurre","sandwich-ham-cheese","sandwich-salmon","sandwich-chicken-avocado","sandwich-carrot-rapees","sandwich-butter-baychel","sandwich-avocado","sandwich-bacon-egg","sandwich-jalapeno","sandwich-reuben"] },
    ],
  },
  {
    id: "cream-cheese", label: "Cream Cheese", img: "/assets/images/cream-plain.jpg",
    subcategories: [
      { id: "savoury", label: "Savoury", items: ["cream-plain","cream-chive"] },
      { id: "sweet", label: "Sweet", items: ["cream-strawberry","cream-honey"] },
    ],
  },
  {
    id: "salt-bread", label: "Salt Bread", img: "/assets/images/salt-bread.jpg",
    subcategories: [
      { id: "classic", label: "Classic", items: ["salt-bread"] },
      { id: "flavoured", label: "Flavoured", items: ["salt-bread-2"] },
    ],
  },
  {
    id: "dessert", label: "Dessert", img: "/assets/images/dessert-signature.jpg",
    subcategories: [
      { id: "bagel-cakes", label: "Bagel Cakes", items: ["dessert-signature"] },
      { id: "slices", label: "Slices", items: ["dessert-tiramisu"] },
    ],
  },
  {
    id: "coffee", label: "Coffee & Drink", img: "/assets/images/coffee-flatwhite.jpg",
    subcategories: [
      { id: "hot", label: "Hot Coffee", items: ["coffee-flatwhite","coffee-longblack"] },
      { id: "iced", label: "Iced Drinks", items: ["coffee-latte","coffee-matcha"] },
    ],
  },
];
