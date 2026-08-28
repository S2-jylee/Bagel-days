import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Pagination from "../../components/Pagination";
import { fmt } from "../../lib/format";
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

function formatItem(it) {
  const addonsPart = it.addons?.length ? ` (+${it.addons.map((a) => a.name).join(", +")})` : "";
  return `${it.name} x ${it.qty}${addonsPart}`;
}

function itemsSummary(items) {
  return (items || []).map(formatItem).join("; ");
}

function toCsvRow(fields) {
  return fields.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(",");
}

const QUICK_RANGES = [
  { key: "today", from: () => todayStr(), to: () => todayStr() },
  { key: "days7", from: () => daysAgoStr(6), to: () => todayStr() },
  { key: "days30", from: () => daysAgoStr(29), to: () => todayStr() },
  { key: "thisMonth", from: () => firstOfMonthStr(), to: () => todayStr() },
];

const STATUS_KEY = { pending: "statusPending", accepted: "statusAccepted", rejected: "statusRejected" };

export default function OrderHistory() {
  const { t } = useAdminLang();
  const [from, setFrom] = useState(todayStr());
  const [to, setTo] = useState(todayStr());
  const [orders, setOrders] = useState([]);
  const [searched, setSearched] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runSearch(explicitFrom, explicitTo) {
    const f = explicitFrom || from;
    const t = explicitTo || to;
    setFetching(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .gte("created_at", `${f}T00:00:00`)
      .lte("created_at", `${t}T23:59:59`)
      .order("created_at", { ascending: false });
    setOrders(error ? [] : data);
    setSearched(true);
    setPage(1);
    setFetching(false);
  }

  function applyQuickRange(range) {
    const f = range.from();
    const t = range.to();
    setFrom(f);
    setTo(t);
    runSearch(f, t);
  }

  function exportCsv() {
    const header = toCsvRow(["Date", "Name", "Phone", "Items", "Total", "Status"]);
    const rows = orders.map((o) =>
      toCsvRow([new Date(o.created_at).toLocaleString("en-AU"), o.customer_name, o.customer_phone, itemsSummary(o.items), o.total, o.status])
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders_${from}_to_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Rejected orders were refunded in full — don't count them as revenue.
  const total = orders.filter((o) => o.status !== "rejected").reduce((sum, o) => sum + Number(o.total), 0);
  const pageCount = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageOrders = orders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div>
      <div className="admin-section-header">
        <h2>{t("orderHistoryTab")}</h2>
        {orders.length > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={exportCsv}>{t("exportCsv")}</button>
        )}
      </div>

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
          <div className="admin-summary">
            {t("ordersCount", orders.length, fmt(total))}
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t("date")}</th>
                  <th>{t("nameCol")}</th>
                  <th>{t("phone")}</th>
                  <th>{t("items")}</th>
                  <th>{t("total")}</th>
                  <th>{t("status")}</th>
                </tr>
              </thead>
              <tbody>
                {pageOrders.map((o) => (
                  <tr key={o.id}>
                    <td>{new Date(o.created_at).toLocaleString("en-AU")}</td>
                    <td>{o.customer_name}</td>
                    <td>{o.customer_phone}</td>
                    <td>
                      {(o.items || []).map((it, i) => (
                        <div key={i}>{formatItem(it)}</div>
                      ))}
                    </td>
                    <td>{fmt(Number(o.total))}</td>
                    <td><span className={`order-status-pill status-${o.status}`}>{t(STATUS_KEY[o.status] ?? o.status)}</span></td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={6} className="admin-empty">{t("noOrdersInRange")}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} className="admin-pagination" />
        </>
      )}
    </div>
  );
}
