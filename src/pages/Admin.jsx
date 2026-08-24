import { useState } from "react";
import { useStaffAuth } from "../lib/useStaffAuth";
import StaffLogin from "../components/StaffLogin";
import OrderHistory from "./admin/OrderHistory";
import Inventory from "./admin/Inventory";
import MenuManager from "./admin/MenuManager";

export default function Admin() {
  const { session, loading, signIn, signOut } = useStaffAuth();
  const [tab, setTab] = useState("orders");

  if (loading) return null;
  if (!session) return <StaffLogin title="Admin Login" onSignIn={signIn} />;

  return (
    <div className="admin-page">
      <div className="admin-shell-bar">
        <div className="admin-tabs">
          <button className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}>Order History</button>
          <button className={tab === "inventory" ? "active" : ""} onClick={() => setTab("inventory")}>Inventory</button>
          <button className={tab === "menu" ? "active" : ""} onClick={() => setTab("menu")}>Menu</button>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={signOut}>Sign Out</button>
      </div>

      {tab === "orders" && <OrderHistory />}
      {tab === "inventory" && <Inventory />}
      {tab === "menu" && <MenuManager />}
    </div>
  );
}
