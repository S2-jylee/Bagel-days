import { useState } from "react";
import { useStaffAuth } from "../lib/useStaffAuth";
import StaffLogin from "../components/StaffLogin";
import OrderHistory from "./admin/OrderHistory";
import MenuManager from "./admin/MenuManager";

export default function Admin() {
  const { session, loading, signIn, signOut } = useStaffAuth();
  const [tab, setTab] = useState("menu");

  if (loading) return null;
  if (!session) return <StaffLogin title="Admin Login" onSignIn={signIn} />;

  return (
    <div className="admin-page">
      <div className="admin-shell-bar">
        <div className="admin-tabs">
          <button className={tab === "menu" ? "active" : ""} onClick={() => setTab("menu")}>Menu</button>
          <button className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}>Order History</button>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={signOut}>Sign Out</button>
      </div>

      {tab === "menu" && <MenuManager />}
      {tab === "orders" && <OrderHistory />}
    </div>
  );
}
