import { useState } from "react";
import { useStaffAuth } from "../lib/useStaffAuth";
import StaffLogin from "../components/StaffLogin";
import InviteStaffModal from "../components/InviteStaffModal";
import OrderHistory from "./admin/OrderHistory";
import MenuManager from "./admin/MenuManager";
import HomepageManager from "./admin/HomepageManager";
import HistoryTab from "./admin/HistoryTab";
import { useSeo } from "../lib/seo";
import { AdminLangProvider, useAdminLang } from "../lib/adminI18n";

function AdminShell({ signOut }) {
  const { lang, setLang, t } = useAdminLang();
  const [tab, setTab] = useState("menu");
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div className="admin-page" data-lang={lang}>
      <div className="admin-shell-bar">
        <div className="admin-tabs">
          <button className={tab === "menu" ? "active" : ""} onClick={() => setTab("menu")}>{t("menuTab")}</button>
          <button className={tab === "homepage" ? "active" : ""} onClick={() => setTab("homepage")}>{t("homepageTab")}</button>
          <button className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}>{t("orderHistoryTab")}</button>
          <button className={tab === "history" ? "active" : ""} onClick={() => setTab("history")}>{t("historyTab")}</button>
        </div>
        <div className="admin-shell-actions">
          <div className="admin-lang-toggle">
            <button type="button" className={lang === "ko" ? "active" : ""} onClick={() => setLang("ko")}>한국어</button>
            <button type="button" className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>English</button>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setInviteOpen(true)}>{t("inviteStaffButton")}</button>
          <button className="btn btn-ghost btn-sm" onClick={signOut}>{t("signOut")}</button>
        </div>
      </div>

      {tab === "menu" && <MenuManager />}
      {tab === "homepage" && <HomepageManager />}
      {tab === "orders" && <OrderHistory />}
      {tab === "history" && <HistoryTab />}

      {inviteOpen && <InviteStaffModal onClose={() => setInviteOpen(false)} />}
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

  const { session, loading, signIn, signOut } = useStaffAuth();

  if (loading) return null;
  if (!session) return <StaffLogin title="Admin Login" onSignIn={signIn} />;

  return (
    <AdminLangProvider>
      <AdminShell signOut={signOut} />
    </AdminLangProvider>
  );
}
