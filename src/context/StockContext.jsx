import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const StockContext = createContext(null);

export function StockProvider({ children }) {
  const [stockMap, setStockMap] = useState({});

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("product_stock").select("product_id, stock_qty");
      if (data) {
        const map = {};
        for (const row of data) map[row.product_id] = row.stock_qty;
        setStockMap(map);
      }
    }
    load();

    const channel = supabase
      .channel("product-stock-live")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "product_stock" }, (payload) => {
        setStockMap((prev) => ({ ...prev, [payload.new.product_id]: payload.new.stock_qty }));
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  return <StockContext.Provider value={stockMap}>{children}</StockContext.Provider>;
}

// undefined = not loaded yet, null = no quantity set (treated as Sold Out), number = remaining stock
export function useStock(id) {
  const stockMap = useContext(StockContext);
  if (!stockMap) throw new Error("useStock must be used within StockProvider");
  return stockMap[id];
}
