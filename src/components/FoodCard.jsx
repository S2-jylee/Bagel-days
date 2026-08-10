import { useState } from "react";
import { useCart } from "../context/CartContext";
import { PRODUCTS } from "../data/products";

export default function FoodCard({ id, small }) {
  const p = PRODUCTS[id];
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  if (!p) return null;

  const handleAdd = () => {
    addToCart(id, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1100);
  };

  return (
    <div className={`food-card${small ? " food-card-small" : ""}`}>
      <div className="thumb"><img src={p.img} alt={p.name} /></div>
      <div className="body">
        <h4>{p.name}</h4>
        {small ? null : (
          <>
            <p className="desc">{p.desc}</p>
            <div className="row">
              <span className="price">${p.price.toFixed(2)}</span>
              <button className={`add-btn${added ? " added" : ""}`} onClick={handleAdd}>
                {added ? "Added ✓" : "Add to Cart"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
