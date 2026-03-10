import { useEffect, useMemo, useState } from "react";
import "./dashboard.css";
import AdminSidebar from "./AdminSidebar";

const API_BASE = "http://localhost:5000";

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();

  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`API không trả JSON: ${url}`);
  }

  if (!res.ok) {
    throw new Error(json?.message || `HTTP ${res.status}`);
  }

  return json;
}

function fmtVND(n) {
  return new Intl.NumberFormat("vi-VN").format(Number(n || 0)) + " ₫";
}

function fmtNum(n) {
  return new Intl.NumberFormat("vi-VN").format(Number(n || 0));
}


function dayLabelFromDate(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;

  const day = d.getDay();
  const map = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  return map[day] || dateStr;
}

function timeAgo(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";

  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  return `${days} ngày trước`;
}

export default function Dashboard() {
  const [range, setRange] = useState("7d");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [dashboard, setDashboard] = useState({
    traffic: {
      total_views: 0,
      today_views: 0,
      week_views: 0,
      month_views: 0,
      daily_views: [],
    },
    revenue: {
      total_revenue: 0,
      today_revenue: 0,
      week_revenue: 0,
      month_revenue: 0,
      daily_revenue: [],
    },
    users: {
      today_new_users: 0,
      week_new_users: 0,
      month_new_users: 0,
      latest_users: [],
    },
    orders: {
      today_orders: 0,
      week_orders: 0,
      month_orders: 0,
    },
    top_comics: [],
  });

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setErr("");

        const token = localStorage.getItem("token") || "";
        const data = await fetchJSON(`${API_BASE}/api/admin/dashboard?range=${range}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        setDashboard(
          data?.data || {
            traffic: {
              total_views: 0,
              today_views: 0,
              week_views: 0,
              month_views: 0,
              daily_views: [],
            },
            revenue: {
              total_revenue: 0,
              today_revenue: 0,
              week_revenue: 0,
              month_revenue: 0,
              daily_revenue: [],
            },
            users: {
              today_new_users: 0,
              week_new_users: 0,
              month_new_users: 0,
              latest_users: [],
            },
            orders: {
              today_orders: 0,
              week_orders: 0,
              month_orders: 0,
            },
            top_comics: [],
          }
        );
      } catch (e) {
        console.error(e);
        setErr(e.message || "Lỗi tải dashboard");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [range]);

  const trafficValue = useMemo(() => {
    if (range === "today") return Number(dashboard.traffic?.today_views || 0);
    if (range === "30d") return Number(dashboard.traffic?.month_views || 0);
    return Number(dashboard.traffic?.week_views || 0);
  }, [range, dashboard]);

  const revenueValue = useMemo(() => {
    if (range === "today") return Number(dashboard.revenue?.today_revenue || 0);
    if (range === "30d") return Number(dashboard.revenue?.month_revenue || 0);
    return Number(dashboard.revenue?.week_revenue || 0);
  }, [range, dashboard]);

  const newUsersValue = useMemo(() => {
    if (range === "today") return Number(dashboard.users?.today_new_users || 0);
    if (range === "30d") return Number(dashboard.users?.month_new_users || 0);
    return Number(dashboard.users?.week_new_users || 0);
  }, [range, dashboard]);

  const ordersValue = useMemo(() => {
    if (range === "today") return Number(dashboard.orders?.today_orders || 0);
    if (range === "30d") return Number(dashboard.orders?.month_orders || 0);
    return Number(dashboard.orders?.week_orders || 0);
  }, [range, dashboard]);

  const trafficSeries = useMemo(() => {
    const rows = Array.isArray(dashboard.traffic?.daily_views)
      ? dashboard.traffic.daily_views
      : [];

    if (range === "today") {
      return [{ label: "Hôm nay", value: Number(dashboard.traffic?.today_views || 0) }];
    }

    return rows.map((x) => ({
      label: dayLabelFromDate(x.day),
      value: Number(x.views || 0),
    }));
  }, [range, dashboard]);

  const revenueSeries = useMemo(() => {
    const rows = Array.isArray(dashboard.revenue?.daily_revenue)
      ? dashboard.revenue.daily_revenue
      : [];

    if (range === "today") {
      return [{ label: "Hôm nay", value: Number(dashboard.revenue?.today_revenue || 0) }];
    }

    return rows.map((x) => ({
      label: dayLabelFromDate(x.day),
      value: Number(x.revenue || 0),
    }));
  }, [range, dashboard]);

  const maxTraffic = useMemo(() => {
    if (!trafficSeries.length) return 1;
    return Math.max(...trafficSeries.map((x) => Number(x.value || 0)), 1);
  }, [trafficSeries]);

  const maxRevenue = useMemo(() => {
    if (!revenueSeries.length) return 1;
    return Math.max(...revenueSeries.map((x) => Number(x.value || 0)), 1);
  }, [revenueSeries]);

  return (
    <div className="ad-layout">
      <AdminSidebar />

      <main className="ad-main">
        <div className="ad-page">
          <div className="container-fluid px-4 py-4">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
              <div>
                <h2 className="m-0 ad-title">Dashboard Tổng quan</h2>
                <div className="text-secondary small">
                  Thống kê traffic, doanh thu toàn sàn, user mới
                </div>
              </div>

              <div className="d-flex gap-2">
                <div className="btn-group" role="group" aria-label="range">
                  <button
                    type="button"
                    className={`btn ${range === "today" ? "btn-dark" : "btn-outline-dark"}`}
                    onClick={() => setRange("today")}
                  >
                    Hôm nay
                  </button>
                  <button
                    type="button"
                    className={`btn ${range === "7d" ? "btn-dark" : "btn-outline-dark"}`}
                    onClick={() => setRange("7d")}
                  >
                    7 ngày
                  </button>
                  <button
                    type="button"
                    className={`btn ${range === "30d" ? "btn-dark" : "btn-outline-dark"}`}
                    onClick={() => setRange("30d")}
                  >
                    30 ngày
                  </button>
                </div>
              </div>
            </div>

            {err ? <div className="alert alert-danger">{err}</div> : null}

            <div className="row g-3">
              <div className="col-12 col-sm-6 col-xl-3 d-flex">
                <div className="card ad-card shadow-sm border-0 h-100 w-100">
                  <div className="card-body d-flex flex-column">
                    <div className="ad-kpi-top">
                      <div className="ad-kpi-icon">
                        <i className="bi bi-graph-up-arrow" />
                      </div>
                    </div>

                    <div className="text-secondary small mt-3">Traffic</div>
                    <div className="ad-kpi-value mt-1">
                      {loading ? "..." : fmtNum(trafficValue)}
                    </div>
                    <div className="ad-kpi-sub mt-auto">lượt truy cập</div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-xl-3 d-flex">
                <div className="card ad-card shadow-sm border-0 h-100 w-100">
                  <div className="card-body d-flex flex-column">
                    <div className="ad-kpi-top">
                      <div className="ad-kpi-icon">
                        <i className="bi bi-cash-coin" />
                      </div>
                
                    </div>

                    <div className="text-secondary small mt-3">Doanh thu toàn sàn</div>
                    <div className="ad-kpi-value mt-1">
                      {loading ? "..." : fmtVND(revenueValue)}
                    </div>
                    <div className="ad-kpi-sub mt-auto">tổng doanh thu</div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-xl-3 d-flex">
                <div className="card ad-card shadow-sm border-0 h-100 w-100">
                  <div className="card-body d-flex flex-column">
                    <div className="ad-kpi-top">
                      <div className="ad-kpi-icon">
                        <i className="bi bi-person-plus" />
                      </div>
                      
                    </div>

                    <div className="text-secondary small mt-3">User mới</div>
                    <div className="ad-kpi-value mt-1">
                      {loading ? "..." : fmtNum(newUsersValue)}
                    </div>
                    <div className="ad-kpi-sub mt-auto">người dùng</div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-xl-3 d-flex">
                <div className="card ad-card shadow-sm border-0 h-100 w-100">
                  <div className="card-body d-flex flex-column">
                    <div className="ad-kpi-top">
                      <div className="ad-kpi-icon">
                        <i className="bi bi-receipt" />
                      </div>
                     
                    </div>

                    <div className="text-secondary small mt-3">Giao dịch</div>
                    <div className="ad-kpi-value mt-1">
                      {loading ? "..." : fmtNum(ordersValue)}
                    </div>
                    <div className="ad-kpi-sub mt-auto">đơn mua chap/gói</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="row g-3 mt-1">
              <div className="col-12 col-xl-7">
                <div className="card shadow-sm border-0 ad-card">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="fw-bold m-0">Traffic theo ngày</h5>
                      <span className="text-secondary small">({range})</span>
                    </div>

                    <div className="ad-bars mt-3">
                      {trafficSeries.map((x) => (
                        <div className="ad-bar-row" key={`${x.label}-${x.value}`}>
                          <div className="ad-bar-label">{x.label}</div>
                          <div className="ad-bar-track">
                            <div
                              className="ad-bar-fill"
                              style={{
                                width: `${Math.round((Number(x.value || 0) / maxTraffic) * 100)}%`,
                              }}
                            />
                          </div>
                          <div className="ad-bar-value">{fmtNum(x.value)}</div>
                        </div>
                      ))}

                      {!loading && trafficSeries.length === 0 ? (
                        <div className="text-secondary">Chưa có dữ liệu traffic</div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-xl-5">
                <div className="card shadow-sm border-0 ad-card">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="fw-bold m-0">Doanh thu theo ngày</h5>
                      <span className="text-secondary small">({range})</span>
                    </div>

                    <div className="ad-bars mt-3">
                      {revenueSeries.map((x) => (
                        <div className="ad-bar-row" key={`${x.label}-${x.value}`}>
                          <div className="ad-bar-label">{x.label}</div>
                          <div className="ad-bar-track">
                            <div
                              className="ad-bar-fill ad-bar-fill-money"
                              style={{
                                width: `${Math.round((Number(x.value || 0) / maxRevenue) * 100)}%`,
                              }}
                            />
                          </div>
                          <div className="ad-bar-value">{fmtVND(x.value)}</div>
                        </div>
                      ))}

                      {!loading && revenueSeries.length === 0 ? (
                        <div className="text-secondary">Chưa có dữ liệu doanh thu</div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="row g-3 mt-1">
            

              <div className="col-12 col-xl-12">
                <div className="card shadow-sm border-0 ad-card">
                  <div className="card-body">
                    <h5 className="fw-bold mb-3">User mới</h5>

                    <div className="ad-users">
                      {(dashboard.users?.latest_users || []).map((u, idx) => (
                        <div key={`${u.email}-${idx}`} className="ad-user">
                          <div className="ad-user-avatar">
                            <i className="bi bi-person" />
                          </div>
                          <div className="min-w-0">
                            <div className="fw-semibold text-truncate">{u.name}</div>
                            <div className="small text-secondary text-truncate">{u.email}</div>
                          </div>
                          <div className="small text-secondary">{timeAgo(u.created_at)}</div>
                        </div>
                      ))}

                      {!loading && (!dashboard.users?.latest_users || dashboard.users.latest_users.length === 0) ? (
                        <div className="text-secondary">Chưa có user mới</div>
                      ) : null}
                    </div>

                    <button className="btn btn-outline-dark w-100 mt-3" type="button">
                      Xem danh sách user
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}