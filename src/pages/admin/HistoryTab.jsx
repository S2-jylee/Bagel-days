import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Pagination from "../../components/Pagination";
import { useAdminLang } from "../../lib/adminI18n";

const PAGE_SIZE = 15;

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoStr(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function firstOfMonthStr() {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

const QUICK_RANGES = [
  { key: "today", from: () => todayStr(), to: () => todayStr() },
  { key: "days7", from: () => daysAgoStr(6), to: () => todayStr() },
  { key: "days30", from: () => daysAgoStr(29), to: () => todayStr() },
  { key: "thisMonth", from: () => firstOfMonthStr(), to: () => todayStr() },
];

const ACTION_KEY = { create: "actionCreate", update: "actionUpdate", delete: "actionDelete", reorder: "actionReorder" };
const ENTITY_KEY = {
  category: "entityCategory",
  subcategory: "entitySubcategory",
  product: "entityProduct",
  addon: "entityAddon",
  best_seller: "entityBestSeller",
  category_best: "entityCategoryBest",
  staff: "entityStaff",
  homepage_section: "entityHomepageSection",
  business_info: "entityBusinessInfo",
};

export default function HistoryTab() {
  const { t } = useAdminLang();
  const [from, setFrom] = useState(todayStr());
  const [to, setTo] = useState(todayStr());
  const [entries, setEntries] = useState([]);
  const [searched, setSearched] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [page, setPage] = useState(1);
  const [modalEntry, setModalEntry] = useState(null);

  useEffect(() => {
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runSearch(explicitFrom, explicitTo) {
    const f = explicitFrom || from;
    const tt = explicitTo || to;
    setFetching(true);
    const { data, error } = await supabase
      .from("admin_activity_log")
      .select("*")
      .gte("created_at", `${f}T00:00:00`)
      .lte("created_at", `${tt}T23:59:59`)
      .order("created_at", { ascending: false });
    setEntries(error ? [] : data);
    setSearched(true);
    setPage(1);
    setFetching(false);
  }

  function applyQuickRange(range) {
    const f = range.from();
    const tt = range.to();
    setFrom(f);
    setTo(tt);
    runSearch(f, tt);
  }

  const pageCount = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageEntries = entries.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div>
      <div className="admin-section-header">
        <h2>{t("historyTab")}</h2>
      </div>
      <p className="homepage-hint">{t("historyIntro")}</p>

      <div className="admin-filters">
        <div className="field">
          <label>{t("from")}</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="field">
          <label>{t("to")}</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={() => runSearch()} disabled={fetching}>
          {fetching ? t("loading") : t("search")}
        </button>
        <div className="admin-quick-ranges">
          {QUICK_RANGES.map((r) => (
            <button key={r.key} type="button" className="btn-quick" onClick={() => applyQuickRange(r)}>
              {t(r.key)}
            </button>
          ))}
        </div>
      </div>

      {searched && (
        <>
          <div className="admin-summary">{t("historyCount", entries.length)}</div>
          <div className="admin-table-wrap">
            <table className="admin-table history-table">
              <thead>
                <tr>
                  <th>{t("date")}</th>
                  <th>{t("user")}</th>
                  <th>{t("action")}</th>
                  <th>{t("path")}</th>
                  <th>{t("content")}</th>
                  <th>{t("details")}</th>
                </tr>
              </thead>
              <tbody>
                {pageEntries.map((e) => (
                  <tr key={e.id}>
                    <td>{new Date(e.created_at).toLocaleString("en-AU")}</td>
                    <td>{e.actor_email}</td>
                    <td><span className={`history-action-pill action-${e.action}`}>{t(ACTION_KEY[e.action] ?? e.action)}</span></td>
                    <td>{e.path || "—"}</td>
                    <td>{t(ENTITY_KEY[e.entity] ?? e.entity)} · {e.label}</td>
                    <td>
                      {e.details ? (
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setModalEntry(e)}>{t("viewDetails")}</button>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
                {entries.length === 0 && (
                  <tr><td colSpan={6} className="admin-empty">{t("noHistoryInRange")}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} className="admin-pagination" />
        </>
      )}

      {modalEntry && (
        <div className="admin-form-overlay" onClick={() => setModalEntry(null)}>
          <div className="admin-form-panel" onClick={(e) => e.stopPropagation()}>
            <h3>{t("details")}</h3>
            <dl className="history-detail-list">
              <dt>{t("date")}</dt>
              <dd>{new Date(modalEntry.created_at).toLocaleString("en-AU")}</dd>
              <dt>{t("user")}</dt>
              <dd>{modalEntry.actor_email}</dd>
              <dt>{t("action")}</dt>
              <dd><span className={`history-action-pill action-${modalEntry.action}`}>{t(ACTION_KEY[modalEntry.action] ?? modalEntry.action)}</span></dd>
              <dt>{t("path")}</dt>
              <dd>{modalEntry.path || "—"}</dd>
              <dt>{t("content")}</dt>
              <dd>{t(ENTITY_KEY[modalEntry.entity] ?? modalEntry.entity)} · {modalEntry.label}</dd>
              <dt>{t("details")}</dt>
              <dd className="history-detail-text">{modalEntry.details}</dd>
            </dl>
            <div className="menu-manager-form-actions">
              <button type="button" className="btn btn-primary" onClick={() => setModalEntry(null)}>{t("close")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
