import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import "./adminComics.css";
import "./adminTransactions.css";

const API_BASE = "http://localhost:5000";

function Badge({ children, tone = "secondary" }) {
  return (
    <span className={`badge rounded-pill text-bg-${tone}`}>{children}</span>
  );
}

function fmtVND(n) {
  return new Intl.NumberFormat("vi-VN").format(Number(n || 0)) + " ₫";
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("vi-VN");
}

function toneByStatus(status) {
  if (status === "success") return "success";
  if (status === "pending") return "warning";
  if (status === "failed") return "danger";
  return "secondary";
}

export default function AdminFinance() {
  const token = localStorage.getItem("token");

  // tabs: overview | topups | transactions
  const [tab, setTab] = useState("overview");

  // =======================
  // 1) OVERVIEW
  // =======================
  const [overview, setOverview] = useState({
    totalTopup: 0,
    totalSpend: 0,
    todayTransactions: 0,
    monthTransactions: 0,
  });
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewErr, setOverviewErr] = useState("");

  const fetchOverview = async () => {
    if (!token) {
      setOverviewErr("You need to log in as admin (token does not exist).");
      return;
    }
    try {
      setOverviewErr("");
      setOverviewLoading(true);

      const res = await fetch(`${API_BASE}/api/admin/finance/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to load overview");

      setOverview(data?.data || {});
    } catch (e) {
      console.error(e);
      setOverviewErr(e.message || "Cannot connect to server");
    } finally {
      setOverviewLoading(false);
    }
  };

  // =======================
  // 2) TOPUPS
  // =======================
  const TOPUP_LIMIT = 10;
  const [topupPage, setTopupPage] = useState(1);
  const [topupTotalPages, setTopupTotalPages] = useState(1);
  const [topupTotal, setTopupTotal] = useState(0);
  const [topupRows, setTopupRows] = useState([]);
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupErr, setTopupErr] = useState("");

  const [qTopup, setQTopup] = useState("");
  const [statusTopup, setStatusTopup] = useState("");
  const [fromTopup, setFromTopup] = useState("");
  const [toTopup, setToTopup] = useState(""); // YYYY-MM-DD

  const fetchTopups = async (p = 1) => {
    if (!token) {
      setTopupErr("You need to log in as admin (token does not exist).");
      return;
    }
    try {
      setTopupErr("");
      setTopupLoading(true);

      const url = new URL(`${API_BASE}/api/admin/finance/topups`);
      url.searchParams.set("page", String(p));
      url.searchParams.set("limit", String(TOPUP_LIMIT));

      if (qTopup.trim()) url.searchParams.set("q", qTopup.trim());
      if (statusTopup) url.searchParams.set("status", statusTopup);
      if (fromTopup) url.searchParams.set("from", fromTopup);
      if (toTopup) url.searchParams.set("to", toTopup);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data?.message || "Failed to load top-up history");

      setTopupRows(Array.isArray(data?.data) ? data.data : []);
      setTopupPage(data.page || p);
      setTopupTotalPages(data.totalPages || 1);
      setTopupTotal(data.total || 0);
    } catch (e) {
      console.error(e);
      setTopupRows([]);
      setTopupPage(1);
      setTopupTotalPages(1);
      setTopupTotal(0);
      setTopupErr(e.message || "Cannot connect to server");
    } finally {
      setTopupLoading(false);
    }
  };

  // =======================
  // 3) TRANSACTIONS
  // =======================
  const TX_LIMIT = 5;
  const [txQ, setTxQ] = useState("");
  const [txPage, setTxPage] = useState(1);

  const [txRows, setTxRows] = useState([]);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [txTotal, setTxTotal] = useState(0);

  const [txLoading, setTxLoading] = useState(false);
  const [txErr, setTxErr] = useState("");

  const fetchTransactions = async (p = 1) => {
    if (!token) {
      setTxErr("You need to log in as admin (token does not exist).");
      return;
    }

    try {
      setTxErr("");
      setTxLoading(true);

      const res = await fetch(
        `${API_BASE}/api/admin/wallet/transactions?page=${p}&limit=${TX_LIMIT}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data?.message || "Failed to load transactions");

      setTxRows(Array.isArray(data?.data) ? data.data : []);
      setTxPage(data.page || p);
      setTxTotalPages(data.totalPages || 1);
      setTxTotal(data.total || 0);
    } catch (e) {
      console.error(e);
      setTxRows([]);
      setTxTotalPages(1);
      setTxTotal(0);
      setTxErr(e.message || "Cannot connect to server");
    } finally {
      setTxLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "topups") {
      setTopupPage(1);
      fetchTopups(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusTopup, qTopup, fromTopup, toTopup]);
  const txFiltered = useMemo(() => {
    const key = txQ.trim().toLowerCase();

    return txRows.filter((t) => {
      if (!key) return true;

      const s = [
        t?.order_id,
        t?.note,
        t?.type,
        t?.status,
        t?.username,
        t?.email,
        String(t?.amount ?? ""),
        String(t?.trans_id ?? ""),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return s.includes(key);
    });
  }, [txRows, txQ]);

  // =======================
  // Effects
  // =======================
  useEffect(() => {
    if (tab === "overview") fetchOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    if (tab === "topups") fetchTopups(topupPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, topupPage]);

  useEffect(() => {
    if (tab === "transactions") fetchTransactions(txPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, txPage]);

  const canPrevTopup = topupPage > 1 && !topupLoading;
  const canNextTopup = topupPage < topupTotalPages && !topupLoading;

  const canPrevTx = txPage > 1 && !txLoading;
  const canNextTx = txPage < txTotalPages && !txLoading;

  return (
    <div className="ad-layout">
      <AdminSidebar />

      <main className="ad-main">
        <div className="ad-page">
          <div className="container-fluid px-4 py-4">
            {/* Header */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
              <div>
                <h2 className="m-0 ad-title">Manage Finance</h2>
                <div className="text-secondary small">
                  Track top-up &amp; wallet transactions of users
                </div>
              </div>

              <div className="d-flex gap-2 align-items-center">
                <button
                  className={`btn ${tab === "overview" ? "btn-dark" : "btn-outline-dark"}`}
                  type="button"
                  onClick={() => setTab("overview")}
                >
                  <i className="bi bi-bar-chart me-2" />
                  Overview
                </button>

                <button
                  className={`btn ${tab === "topups" ? "btn-dark" : "btn-outline-dark"}`}
                  type="button"
                  onClick={() => setTab("topups")}
                >
                  <i className="bi bi-wallet2 me-2" />
                  Top-up History
                </button>

                <button
                  className={`btn ${tab === "transactions" ? "btn-dark" : "btn-outline-dark"}`}
                  type="button"
                  onClick={() => setTab("transactions")}
                >
                  <i className="bi bi-receipt me-2" />
                  Wallet Transactions
                </button>
              </div>
            </div>

            {/* =======================
                TAB: OVERVIEW
            ======================= */}
            {tab === "overview" ? (
              <>
                {overviewErr ? (
                  <div className="alert alert-warning rounded-4">
                    <i className="bi bi-exclamation-triangle me-2" />
                    {overviewErr}
                  </div>
                ) : null}

                <div className="row g-3">
                  <div className="col-12 col-md-6 col-lg-3">
                    <div className="card border-0 shadow-sm rounded-4">
                      <div className="card-body">
                        <div className="text-secondary small">
                          Total top-up (success)
                        </div>
                        <div className="fw-bold fs-4 mt-1">
                          {overviewLoading
                            ? "…"
                            : fmtVND(overview.totalTopup || 0)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6 col-lg-3">
                    <div className="card border-0 shadow-sm rounded-4">
                      <div className="card-body">
                        <div className="text-secondary small">
                          Total comic purchases
                        </div>
                        <div className="fw-bold fs-4 mt-1">
                          {overviewLoading
                            ? "…"
                            : fmtVND(overview.totalSpend || 0)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6 col-lg-3">
                    <div className="card border-0 shadow-sm rounded-4">
                      <div className="card-body">
                        <div className="text-secondary small">
                          Transactions today
                        </div>
                        <div className="fw-bold fs-4 mt-1">
                          {overviewLoading
                            ? "…"
                            : overview.todayTransactions || 0}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6 col-lg-3">
                    <div className="card border-0 shadow-sm rounded-4">
                      <div className="card-body">
                        <div className="text-secondary small">
                          Transactions this month
                        </div>
                        <div className="fw-bold fs-4 mt-1">
                          {overviewLoading
                            ? "…"
                            : overview.monthTransactions || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-end mt-3">
                  <button
                    className="btn btn-outline-dark"
                    type="button"
                    onClick={fetchOverview}
                    disabled={overviewLoading}
                  >
                    <i
                      className={`bi ${overviewLoading ? "bi-arrow-repeat" : "bi-arrow-clockwise"}`}
                    />
                    <span className="ms-2">Refresh</span>
                  </button>
                </div>
              </>
            ) : null}

            {/* =======================
                TAB: TOPUPS
            ======================= */}
            {tab === "topups" ? (
              <>
                {/* Filters */}
                <div className="card border-0 shadow-sm rounded-4 mb-3">
                  <div className="card-body">
                    <div className="row g-2 align-items-end">
                      <div className="col-12 col-lg-4">
                        <label className="form-label small text-secondary mb-1">
                          Search
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-white">
                            <i className="bi bi-search" />
                          </span>
                          <input
                            className="form-control"
                            placeholder="username, email, order_id, trans_id..."
                            value={qTopup}
                            onChange={(e) => setQTopup(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="col-12 col-md-4 col-lg-2">
                        <label className="form-label small text-secondary mb-1">
                          Status
                        </label>
                        <select
                          className="form-select"
                          style={{ width: 160 }}
                          value={statusTopup}
                          onChange={(e) => setStatusTopup(e.target.value)}
                        >
                          <option value="">All</option>
                          <option value="success">success</option>
                          <option value="pending">pending</option>
                          <option value="failed">failed</option>
                        </select>
                      </div>

                      <div className="col-12 col-md-4 col-lg-2">
                        <label className="form-label small text-secondary mb-1">
                          From date
                        </label>
                        <input
                          type="date"
                          className="form-control"
                          value={fromTopup}
                          onChange={(e) => setFromTopup(e.target.value)}
                        />
                      </div>

                      <div className="col-12 col-md-4 col-lg-2">
                        <label className="form-label small text-secondary mb-1">
                          To date
                        </label>
                        <input
                          type="date"
                          className="form-control"
                          value={toTopup}
                          onChange={(e) => setToTopup(e.target.value)}
                        />
                      </div>

                      <div className="col-12 col-lg-2 d-flex gap-2">
                        <button
                          className="btn btn-dark w-100"
                          type="button"
                          onClick={() => {
                            setTopupPage(1);
                            fetchTopups(1);
                          }}
                          disabled={topupLoading}
                        >
                          Filter
                        </button>

                        <button
                          className="btn btn-outline-dark"
                          type="button"
                          onClick={() => fetchTopups(topupPage)}
                          disabled={topupLoading}
                          title="Refresh"
                        >
                          <i
                            className={`bi ${topupLoading ? "bi-arrow-repeat" : "bi-arrow-clockwise"}`}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="small text-secondary mt-2">
                      Total: <b>{topupTotal}</b> top-up transactions
                    </div>
                  </div>
                </div>

                {/* Error */}
                {topupErr ? (
                  <div className="alert alert-warning rounded-4">
                    <i className="bi bi-exclamation-triangle me-2" />
                    {topupErr}
                  </div>
                ) : null}

                {/* Table */}
                <div className="card border-0 shadow-sm rounded-4">
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table align-middle">
                        <thead>
                          <tr className="text-secondary small">
                            <th>User</th>
                            <th>Order ID</th>
                            <th>Note</th>
                            <th>Time</th>
                            <th className="text-end">Amount</th>
                            <th className="text-end">Status</th>
                          </tr>
                        </thead>

                        <tbody>
                          {topupLoading ? (
                            <tr>
                              <td
                                colSpan={6}
                                className="py-4 text-center text-secondary"
                              >
                                <span className="spinner-border spinner-border-sm me-2" />
                                Loading...
                              </td>
                            </tr>
                          ) : topupRows.length === 0 ? (
                            <tr>
                              <td
                                colSpan={6}
                                className="py-5 text-center text-secondary"
                              >
                                <i className="bi bi-inbox fs-3 d-block mb-2" />
                                No top-up history
                              </td>
                            </tr>
                          ) : (
                            topupRows.map((t) => {
                              const amount = Number(t.amount || 0);
                              return (
                                <tr key={t.id}>
                                  <td>
                                    <div className="fw-semibold">
                                      {t.username || "—"}
                                    </div>
                                    <div className="small text-secondary">
                                      {t.email || "—"}
                                    </div>
                                  </td>

                                  <td className="fw-semibold">
                                    <div
                                      className="text-truncate"
                                      style={{ maxWidth: 220 }}
                                    >
                                      {t.order_id || `TOPUP${t.id}`}
                                    </div>
                                    <div className="small text-secondary">
                                      {t.trans_id
                                        ? `Trans: ${t.trans_id}`
                                        : "—"}
                                    </div>
                                  </td>

                                  <td
                                    className="text-truncate"
                                    style={{ maxWidth: 420 }}
                                  >
                                    {t.note || "—"}
                                  </td>

                                  <td className="small text-secondary">
                                    {fmtDate(t.created_at)}
                                  </td>

                                  <td className="text-end fw-bold pw-pos">
                                    +{fmtVND(Math.abs(amount))}
                                  </td>

                                  <td className="text-end">
                                    <Badge tone={toneByStatus(t.status)}>
                                      {t.status || "—"}
                                    </Badge>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mt-3">
                      <div className="small text-secondary">
                        Page {topupPage}/{topupTotalPages}
                      </div>

                      <div className="d-flex gap-2 align-items-center">
                        <button
                          className="btn btn-outline-dark btn-sm"
                          type="button"
                          disabled={!canPrevTopup}
                          onClick={() => setTopupPage(1)}
                          title="First page"
                        >
                          <i className="bi bi-chevron-double-left" />
                        </button>

                        <button
                          className="btn btn-outline-dark btn-sm"
                          type="button"
                          disabled={!canPrevTopup}
                          onClick={() =>
                            setTopupPage((p) => Math.max(1, p - 1))
                          }
                        >
                          <i className="bi bi-chevron-left me-1" />
                          Previous
                        </button>

                        <button
                          className="btn btn-outline-dark btn-sm"
                          type="button"
                          disabled={!canNextTopup}
                          onClick={() =>
                            setTopupPage((p) =>
                              Math.min(topupTotalPages, p + 1),
                            )
                          }
                        >
                          Next
                          <i className="bi bi-chevron-right ms-1" />
                        </button>

                        <button
                          className="btn btn-outline-dark btn-sm"
                          type="button"
                          disabled={!canNextTopup}
                          onClick={() => setTopupPage(topupTotalPages)}
                          title="Last page"
                        >
                          <i className="bi bi-chevron-double-right" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : null}

            {/* =======================
                TAB: TRANSACTIONS
            ======================= */}
            {tab === "transactions" ? (
              <>
                {/* Header tools */}
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 mt-1">
                  <div className="d-flex gap-2 align-items-center">
                    <div
                      className="input-group ad-search"
                      style={{ minWidth: 320 }}
                    >
                      <span className="input-group-text bg-white">
                        <i className="bi bi-search" />
                      </span>
                      <input
                        className="form-control"
                        placeholder="Search by order ID, note, status..."
                        value={txQ}
                        onChange={(e) => setTxQ(e.target.value)}
                      />
                    </div>

                    <button
                      className="btn btn-outline-dark d-flex align-items-center gap-2 px-4 text-nowrap"
                      type="button"
                      onClick={() => fetchTransactions(txPage)}
                      disabled={txLoading}
                    >
                      <i
                        className={`bi ${txLoading ? "bi-arrow-repeat" : "bi-arrow-clockwise"}`}
                      />
                      Refresh
                    </button>
                  </div>

                  <div className="small text-secondary">
                    Total transactions: <b>{txTotal}</b>
                  </div>
                </div>

                {/* Error */}
                {txErr ? (
                  <div className="alert alert-warning rounded-4">
                    <i className="bi bi-exclamation-triangle me-2" />
                    {txErr}
                  </div>
                ) : null}

                {/* Table */}
                <div className="card border-0 shadow-sm rounded-4">
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table align-middle">
                        <thead>
                          <tr className="text-secondary small">
                            <th>Order ID</th>
                            <th>Note</th>
                            <th>Time</th>
                            <th className="text-end">Amount</th>
                            <th className="text-end">Status</th>
                          </tr>
                        </thead>

                        <tbody>
                          {txLoading ? (
                            <tr>
                              <td
                                colSpan={5}
                                className="py-4 text-center text-secondary"
                              >
                                <span className="spinner-border spinner-border-sm me-2" />
                                Loading...
                              </td>
                            </tr>
                          ) : txFiltered.length === 0 ? (
                            <tr>
                              <td
                                colSpan={5}
                                className="py-5 text-center text-secondary"
                              >
                                <i className="bi bi-inbox fs-3 d-block mb-2" />
                                No transactions
                              </td>
                            </tr>
                          ) : (
                            txFiltered.map((t) => {
                              const amount = Number(t.amount || 0);
                              const isNeg = amount < 0;

                              return (
                                <tr key={t.id}>
                                  <td className="fw-semibold">
                                    <div
                                      className="text-truncate"
                                      style={{ maxWidth: 220 }}
                                    >
                                      {t.order_id || `TX${t.id}`}
                                    </div>
                                  </td>

                                  <td
                                    className="text-truncate"
                                    style={{ maxWidth: 420 }}
                                  >
                                    {t.note || "—"}
                                  </td>

                                  <td className="small text-secondary">
                                    {fmtDate(t.created_at)}
                                  </td>

                                  <td
                                    className={`text-end fw-bold ${isNeg ? "pw-neg" : "pw-pos"}`}
                                  >
                                    {isNeg ? "-" : "+"}
                                    {fmtVND(Math.abs(amount))}
                                  </td>

                                  <td className="text-end">
                                    <Badge tone={toneByStatus(t.status)}>
                                      {t.status || "—"}
                                    </Badge>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mt-3">
                      <div className="small text-secondary">
                        Showing {txFiltered.length}/{txRows.length} rows on this
                        page
                      </div>

                      <div className="d-flex gap-2 align-items-center">
                        <button
                          className="btn btn-outline-dark btn-sm"
                          type="button"
                          disabled={!canPrevTx}
                          onClick={() => setTxPage(1)}
                          title="First page"
                        >
                          <i className="bi bi-chevron-double-left" />
                        </button>

                        <button
                          className="btn btn-outline-dark btn-sm"
                          type="button"
                          disabled={!canPrevTx}
                          onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                        >
                          <i className="bi bi-chevron-left me-1" />
                          Previous
                        </button>

                        <span className="small text-secondary px-2">
                          {txPage}/{txTotalPages}
                        </span>

                        <button
                          className="btn btn-outline-dark btn-sm"
                          type="button"
                          disabled={!canNextTx}
                          onClick={() =>
                            setTxPage((p) => Math.min(txTotalPages, p + 1))
                          }
                        >
                          Next
                          <i className="bi bi-chevron-right ms-1" />
                        </button>

                        <button
                          className="btn btn-outline-dark btn-sm"
                          type="button"
                          disabled={!canNextTx}
                          onClick={() => setTxPage(txTotalPages)}
                          title="Last page"
                        >
                          <i className="bi bi-chevron-double-right" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
