import { useState } from "react";
import { useStaffAuth } from "../lib/useStaffAuth";
import StaffLogin from "../components/StaffLogin";
import StaffManageModal from "../components/StaffManageModal";
import OrderHistory from "./admin/OrderHistory";
import MenuManager from "./admin/MenuManager";
import HomepageManager from "./admin/HomepageManager";
import HistoryTab from "./admin/HistoryTab";
import { useSeo } from "../lib/seo";
import { AdminLangProvider, useAdminLang } from "../lib/adminI18n";

// "staff" role only ever sees Menu — everything else here (tabs, the Add
// Staff button) is hidden client-side for a clean UI, but the real
// enforcement is server-side (RLS policies keyed off the JWT's own role
// claim, checked again inside the invite-staff function) — hiding a button
// was never going to be the actual security boundary.
function AdminShell({ role, userId, signOut }) {
  const { lang, setLang, t } = useAdminLang();
  const isOwner = role === "owner";
  const [tab, setTab] = useState("menu");
  const [staffModalOpen, setStaffModalOpen] = useState(false);

  return (
    <div className="admin-page" data-lang={lang}>
      <div className="admin-shell-bar">
        <div className="admin-tabs">
          <button className={tab === "menu" ? "active" : ""} onClick={() => setTab("menu")}>{t("menuTab")}</button>
          {isOwner && <button className={tab === "homepage" ? "active" : ""} onClick={() => setTab("homepage")}>{t("homepageTab")}</button>}
          {isOwner && <button className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}>{t("orderHistoryTab")}</button>}
          {isOwner && <button className={tab === "history" ? "active" : ""} onClick={() => setTab("history")}>{t("historyTab")}</button>}
        </div>
        <div className="admin-shell-actions">
          <div className="admin-lang-toggle">
            <button type="button" className={lang === "ko" ? "active" : ""} onClick={() => setLang("ko")}>한국어</button>
            <button type="button" className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>English</button>
          </div>
          {isOwner && <button className="btn btn-ghost btn-sm" onClick={() => setStaffModalOpen(true)}>{t("inviteStaffButton")}</button>}
          <button className="btn btn-ghost btn-sm" onClick={signOut}>{t("signOut")}</button>
        </div>
      </div>

      {tab === "menu" && <MenuManager />}
      {isOwner && tab === "homepage" && <HomepageManager />}
      {isOwner && tab === "orders" && <OrderHistory />}
      {isOwner && tab === "history" && <HistoryTab />}

      {isOwner && staffModalOpen && <StaffManageModal currentUserId={userId} onClose={() => setStaffModalOpen(false)} />}
    </div>
  );
}

export default function Admin() {
  useSeo({
    title: "Bagel Days | Staff Admin",
    description: "Staff admin panel for Bagel Days.",
    path: "/admin",
    noindex: true,
  });

  const { session, role, loading, signIn, signOut } = useStaffAuth();

  if (loading) return null;
  if (!session) return <StaffLogin title="Admin Login" onSignIn={signIn} />;

  return (
    <AdminLangProvider>
      <AdminShell role={role} userId={session.user.id} signOut={signOut} />
    </AdminLangProvider>
  );
}
