import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { PRODUCTS } from "../data/products";

const CART_KEY = "bageldays_cart";
const CartContext = createContext(null);

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || {};
  } catch {
    return {};
  }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(loadCart);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  const addToCart = useCallback((id, qty = 1) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + qty }));
  }, []);

  const setQty = useCallback((id, qty) => {
    setCart((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });
  }, []);

  const removeFromCart = useCallback((id) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const clearCart = useCallback(() => setCart({}), []);

  const ids = Object.keys(cart).filter((id) => PRODUCTS[id]);
  const count = ids.reduce((sum, id) => sum + cart[id], 0);
  const subtotal = ids.reduce((sum, id) => sum + PRODUCTS[id].price * cart[id], 0);

  const value = { cart, ids, count, subtotal, addToCart, setQty, removeFromCart, clearCart };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function fmt(n) {
  return "$" + n.toFixed(2);
}
