import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { PRODUCTS } from "../data/products";

const CART_KEY = "bageldays_cart";
const CartContext = createContext(null);

function addonKey(addons) {
  return (addons || []).map((a) => a.name).sort().join("|");
}

function lineId(id, addons) {
  const key = addonKey(addons);
  return key ? `${id}::${key}` : id;
}

function loadCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY)) || {};
    const normalized = {};
    for (const key of Object.keys(raw)) {
      const val = raw[key];
      if (typeof val === "number") {
        normalized[key] = { id: key, qty: val, addons: [] };
      } else if (val && typeof val === "object") {
        normalized[key] = { id: val.id ?? key, qty: val.qty ?? 0, addons: val.addons ?? [] };
      }
    }
    return normalized;
  } catch {
    return {};
  }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(loadCart);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  const addToCart = useCallback((id, qty = 1, addons = []) => {
    setCart((prev) => {
      const lid = lineId(id, addons);
      const existingQty = prev[lid]?.qty || 0;
      return { ...prev, [lid]: { id, qty: existingQty + qty, addons } };
    });
  }, []);

  const setQty = useCallback((lid, qty) => {
    setCart((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[lid];
      else next[lid] = { ...next[lid], qty };
      return next;
    });
  }, []);

  const removeFromCart = useCallback((lid) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[lid];
      return next;
    });
  }, []);

  const clearCart = useCallback(() => setCart({}), []);

  const ids = Object.keys(cart).filter((lid) => PRODUCTS[cart[lid].id]);
  const count = ids.reduce((sum, lid) => sum + cart[lid].qty, 0);
  const lineUnitPrice = (lid) => {
    const entry = cart[lid];
    const addonsTotal = (entry.addons || []).reduce((s, a) => s + a.price, 0);
    return PRODUCTS[entry.id].price + addonsTotal;
  };
  const subtotal = ids.reduce((sum, lid) => sum + lineUnitPrice(lid) * cart[lid].qty, 0);

  const value = { cart, ids, count, subtotal, lineUnitPrice, addToCart, setQty, removeFromCart, clearCart };
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
