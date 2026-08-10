export const PRODUCTS = {
  "bagel-plain":        { name:"Plain Bagel",              price:3.5,  img:"/assets/images/bagel-plain.jpg", desc:"Classic and simple. The perfect everyday bagel." },
  "bagel-everything":   { name:"Everything Bagel",         price:4.5,  img:"/assets/images/bagel-everything.jpg", desc:"Topped with a blend of sesame, poppy, garlic, onion & sea salt." },
  "bagel-blueberry":    { name:"Blueberry Bagel",          price:4.5,  img:"/assets/images/bagel-blueberry.jpg", desc:"Naturally sweet bagel packed with juicy blueberries." },
  "bagel-sesame":       { name:"Sesame Bagel",             price:4.0,  img:"/assets/images/bagel-sesame.jpg", desc:"Covered in toasted sesame seeds for a rich, nutty flavour." },
  "bagel-poppy":        { name:"Poppy Seed Bagel",         price:4.0,  img:"/assets/images/bagel-poppy.jpg", desc:"A delicate crunch of poppy seed in every bite." },
  "bagel-cinnamon":     { name:"Cinnamon Raisin Bagel",    price:4.5,  img:"/assets/images/bagel-cinnamon.jpg", desc:"Warm cinnamon swirl studded with sweet raisins." },
  "sandwich-salmon":    { name:"Smoked Salmon Bagel",      price:13.5, img:"/assets/images/sandwich-salmon.jpg", desc:"Smoked salmon, cream cheese, red onion, capers, dill, lettuce." },
  "sandwich-avocado":   { name:"Avocado & Feta Bagel",     price:12.5, img:"/assets/images/sandwich-avocado.jpg", desc:"Smashed avocado, feta cheese, tomato, red onion, mixed greens." },
  "sandwich-bacon-egg": { name:"Bacon & Egg Bagel",        price:11.5, img:"/assets/images/sandwich-bacon-egg.jpg", desc:"Crispy bacon, fried egg, cheddar cheese, tomato relish." },
  "sandwich-jalapeno":  { name:"Jalapeño Cheese Bagel",    price:11.5, img:"/assets/images/sandwich-jalapeno.jpg", desc:"Jalapeño cheese bagel with cream cheese and chive." },
  "sandwich-reuben":    { name:"Valley Reuben",            price:17.0, img:"/assets/images/sandwich-reuben.jpg", desc:"Pastrami, swiss, sauerkraut, Russian dressing." },
  "cream-plain":        { name:"Plain Cream Cheese",       price:2.5,  img:"/assets/images/cream-plain.jpg", desc:"Whipped daily, smooth and simple." },
  "cream-chive":        { name:"Chive Cream Cheese",       price:2.5,  img:"/assets/images/cream-chive.jpg", desc:"Fresh chive folded through house-whipped cream cheese." },
  "cream-strawberry":   { name:"Strawberry Cream Cheese",  price:3.0,  img:"/assets/images/cream-strawberry.jpg", desc:"Fresh strawberry, lightly sweetened." },
  "cream-honey":        { name:"Honey Walnut Cream Cheese",price:3.2,  img:"/assets/images/cream-honey.jpg", desc:"Toasted walnut and a touch of honey." },
  "salt-bread":         { name:"Original Salt Bread",      price:5.5,  img:"/assets/images/salt-bread.jpg", desc:"Soft milk bread with a pocket of butter and sea salt." },
  "salt-bread-2":       { name:"Garlic Butter Salt Bread", price:6.0,  img:"/assets/images/salt-bread-2.jpg", desc:"Our salt bread finished with garlic herb butter." },
  "dessert-signature":  { name:"Signature Bagel Cake",     price:7.5,  img:"/assets/images/dessert-signature.jpg", desc:"Layered bagel cake with whipped cream and cookie crumble." },
  "dessert-tiramisu":   { name:"Tiramisu Slice",           price:7.0,  img:"/assets/images/dessert-tiramisu.jpg", desc:"Campos espresso-soaked layers with mascarpone cream." },
  "coffee-flatwhite":   { name:"Flat White",               price:4.8,  img:"/assets/images/coffee-flatwhite.jpg", desc:"Campos Specialty Coffee, silky micro-foam." },
  "coffee-longblack":   { name:"Long Black",                price:4.5,  img:"/assets/images/coffee-longblack.jpg", desc:"Double shot, hot water, full-bodied." },
  "coffee-latte":       { name:"Iced Latte",                price:5.8,  img:"/assets/images/coffee-latte.jpg", desc:"Campos espresso over ice with fresh milk." },
  "coffee-matcha":      { name:"Matcha Latte",              price:6.0,  img:"/assets/images/coffee-matcha.jpg", desc:"Ceremonial-grade matcha, steamed milk." },
  "set-classic":        { name:"Bagel + Cream Cheese + Coffee Set", price:12.5, img:"/assets/images/sandwich-set.jpg", desc:"Any Bagel + Cream Cheese + Coffee" }
};

export const CATEGORIES = [
  { id: "bagels", label: "Bagels", items: ["bagel-plain","bagel-everything","bagel-blueberry","bagel-sesame","bagel-poppy","bagel-cinnamon","sandwich-salmon","sandwich-avocado","sandwich-bacon-egg","sandwich-jalapeno","sandwich-reuben"] },
  { id: "cream-cheese", label: "Cream Cheese", items: ["cream-plain","cream-chive","cream-strawberry","cream-honey"] },
  { id: "salt-bread", label: "Salt Bread", items: ["salt-bread","salt-bread-2"] },
  { id: "dessert", label: "Dessert", items: ["dessert-signature","dessert-tiramisu"] },
  { id: "coffee", label: "Coffee & Drink", items: ["coffee-flatwhite","coffee-longblack","coffee-latte","coffee-matcha"] },
];
