import { useMemo, useState } from "react";
import "./dashboard.css";
import AdminSidebar from "./AdminSidebar";

const MOCK = {
  kpis: {
    traffic: { value: 128540, delta: 12.8 }, // %
    revenue: { value: 235000, delta: 8.4 }, // VND
    newUsers: { value: 1240, delta: 5.1 }, // %
    orders: { value: 3920, delta: -2.2 }, // %
  },
  trafficSeries: [
    { label: "T2", value: 12000 },
    { label: "T3", value: 14500 },
    { label: "T4", value: 13200 },
    { label: "T5", value: 16800 },
    { label: "T6", value: 15400 },
    { label: "T7", value: 17600 },
    { label: "CN", value: 18900 },
  ],
  revenueSeries: [
    { label: "T2", value: 2800000 },
    { label: "T3", value: 3100000 },
    { label: "T4", value: 2600000 },
    { label: "T5", value: 3500000 },
    { label: "T6", value: 3300000 },
    { label: "T7", value: 3700000 },
    { label: "CN", value: 4200000 },
  ],
  sources: [
    { name: "Organic Search", pct: 46 },
    { name: "Facebook", pct: 22 },
    { name: "Direct", pct: 18 },
    { name: "Referral", pct: 9 },
    { name: "Other", pct: 5 },
  ],
  topComics: [
    { name: "Kiếm Thần Trở Lại", sold: 1240, revenue: 4800000 },
    { name: "Hệ Thống Bá Đạo", sold: 980, revenue: 3650000 },
    { name: "Bí Mật Thanh Xuân", sold: 860, revenue: 3120000 },
    { name: "Ta Có Một Thành Phố", sold: 640, revenue: 2450000 },
    { name: "Trọng Sinh Đô Thị", sold: 520, revenue: 1980000 },
  ],
  newUsers: [
    { name: "minh.ng", email: "minhng@gmail.com", when: "2 phút trước" },
    { name: "thanh.le", email: "thanhle@gmail.com", when: "15 phút trước" },
    { name: "an.tran", email: "antran@gmail.com", when: "1 giờ trước" },
    { name: "hoa.pham", email: "hoapham@gmail.com", when: "3 giờ trước" },
  ],
};

function fmtVND(n) {
  return new Intl.NumberFormat("vi-VN").format(Number(n || 0)) + " ₫";
}
function fmtNum(n) {
  return new Intl.NumberFormat("vi-VN").format(Number(n || 0));
}
function Delta({ value }) {
  const up = value >= 0;
  return (
    <span className={`ad-delta ${up ? "up" : "down"}`}>
      <i className={`bi ${up ? "bi-arrow-up-right" : "bi-arrow-down-right"}`} />
      {Math.abs(value)}%
    </span>
  );
}

export default function Dashboard() {
  const [range, setRange] = useState("7d"); // today | 7d | 30d

  const maxTraffic = useMemo(
    () => Math.max(...MOCK.trafficSeries.map((x) => x.value)),
    []
  );
  const maxRevenue = useMemo(
    () => Math.max(...MOCK.revenueSeries.map((x) => x.value)),
    []
  );

  return (
     <div className="ad-layout">
      <AdminSidebar />

      <main className="ad-main">
    <div className="ad-page">
      <div className="container-fluid px-4 py-4">
        {/* Header */}
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

        {/* KPI cards */}
     <div className="row g-3">

  {/* Traffic */}
  <div className="col-12 col-sm-6 col-xl-3 d-flex">
    <div className="card ad-card shadow-sm border-0 h-100 w-100">
      <div className="card-body d-flex flex-column">
        <div className="ad-kpi-top">
          <div className="ad-kpi-icon">
            <i className="bi bi-graph-up-arrow" />
          </div>
          <Delta value={MOCK.kpis.traffic.delta} />
        </div>

        <div className="text-secondary small mt-3">Traffic</div>
        <div className="ad-kpi-value mt-1">
          {fmtNum(MOCK.kpis.traffic.value)}
        </div>
        <div className="ad-kpi-sub mt-auto">lượt truy cập</div>
      </div>
    </div>
  </div>

  {/* Revenue */}
  <div className="col-12 col-sm-6 col-xl-3 d-flex">
    <div className="card ad-card shadow-sm border-0 h-100 w-100">
      <div className="card-body d-flex flex-column">
        <div className="ad-kpi-top">
          <div className="ad-kpi-icon">
            <i className="bi bi-cash-coin" />
          </div>
          <Delta value={MOCK.kpis.revenue.delta} />
        </div>

        <div className="text-secondary small mt-3">Doanh thu toàn sàn</div>
        <div className="ad-kpi-value mt-1">
          {fmtVND(MOCK.kpis.revenue.value)}
        </div>
        <div className="ad-kpi-sub mt-auto">tổng doanh thu</div>
      </div>
    </div>
  </div>

  {/* New Users */}
  <div className="col-12 col-sm-6 col-xl-3 d-flex">
    <div className="card ad-card shadow-sm border-0 h-100 w-100">
      <div className="card-body d-flex flex-column">
        <div className="ad-kpi-top">
          <div className="ad-kpi-icon">
            <i className="bi bi-person-plus" />
          </div>
          <Delta value={MOCK.kpis.newUsers.delta} />
        </div>

        <div className="text-secondary small mt-3">User mới</div>
        <div className="ad-kpi-value mt-1">
          {fmtNum(MOCK.kpis.newUsers.value)}
        </div>
        <div className="ad-kpi-sub mt-auto">người dùng</div>
      </div>
    </div>
  </div>

  {/* Orders */}
  <div className="col-12 col-sm-6 col-xl-3 d-flex">
    <div className="card ad-card shadow-sm border-0 h-100 w-100">
      <div className="card-body d-flex flex-column">
        <div className="ad-kpi-top">
          <div className="ad-kpi-icon">
            <i className="bi bi-receipt" />
          </div>
          <Delta value={MOCK.kpis.orders.delta} />
        </div>

        <div className="text-secondary small mt-3">Giao dịch</div>
        <div className="ad-kpi-value mt-1">
          {fmtNum(MOCK.kpis.orders.value)}
        </div>
        <div className="ad-kpi-sub mt-auto">đơn mua chap/gói</div>
      </div>
    </div>
  </div>

</div>


        {/* Charts row */}
        <div className="row g-3 mt-1">
          <div className="col-12 col-xl-7">
            <div className="card shadow-sm border-0 ad-card">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="fw-bold m-0">Traffic theo ngày</h5>
                  <span className="text-secondary small">({range})</span>
                </div>

                <div className="ad-bars mt-3">
                  {MOCK.trafficSeries.map((x) => (
                    <div className="ad-bar-row" key={x.label}>
                      <div className="ad-bar-label">{x.label}</div>
                      <div className="ad-bar-track">
                        <div
                          className="ad-bar-fill"
                          style={{ width: `${Math.round((x.value / maxTraffic) * 100)}%` }}
                        />
                      </div>
                      <div className="ad-bar-value">{fmtNum(x.value)}</div>
                    </div>
                  ))}
                </div>

                <div className="ad-note text-secondary small mt-3">
                  * Biểu đồ dạng “mini bar” (nhẹ, không cần thư viện). Nếu bạn muốn chart
                  xịn (line/area), mình đổi sang Recharts.
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
                  {MOCK.revenueSeries.map((x) => (
                    <div className="ad-bar-row" key={x.label}>
                      <div className="ad-bar-label">{x.label}</div>
                      <div className="ad-bar-track">
                        <div
                          className="ad-bar-fill ad-bar-fill-money"
                          style={{ width: `${Math.round((x.value / maxRevenue) * 100)}%` }}
                        />
                      </div>
                      <div className="ad-bar-value">{fmtVND(x.value)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="row g-3 mt-1">
          <div className="col-12 col-xl-6">
            <div className="card shadow-sm border-0 ad-card">
              <div className="card-body">
                <h5 className="fw-bold mb-3">Top truyện doanh thu</h5>

                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr className="text-secondary small">
                        <th>Truyện</th>
                        <th className="text-end">Đã bán</th>
                        <th className="text-end">Doanh thu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK.topComics.map((c) => (
                        <tr key={c.name}>
                          <td className="fw-semibold">{c.name}</td>
                          <td className="text-end">{fmtNum(c.sold)}</td>
                          <td className="text-end fw-bold">{fmtVND(c.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          </div>

          <div className="col-12 col-xl-6">
            <div className="card shadow-sm border-0 ad-card">
              <div className="card-body">
                <h5 className="fw-bold mb-3">Nguồn traffic</h5>

                {MOCK.sources.map((s) => (
                  <div key={s.name} className="mb-3">
                    <div className="d-flex justify-content-between small">
                      <span className="fw-semibold">{s.name}</span>
                      <span className="text-secondary">{s.pct}%</span>
                    </div>
                    <div className="progress ad-progress">
                      <div
                        className="progress-bar"
                        role="progressbar"
                        style={{ width: `${s.pct}%` }}
                        aria-valuenow={s.pct}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-12 col-xl-12">
            <div className="card shadow-sm border-0 ad-card">
              <div className="card-body">
                <h5 className="fw-bold mb-3">User mới</h5>

                <div className="ad-users">
                  {MOCK.newUsers.map((u) => (
                    <div key={u.email} className="ad-user">
                      <div className="ad-user-avatar">
                        <i className="bi bi-person" />
                      </div>
                      <div className="min-w-0">
                        <div className="fw-semibold text-truncate">{u.name}</div>
                        <div className="small text-secondary text-truncate">{u.email}</div>
                      </div>
                      <div className="small text-secondary">{u.when}</div>
                    </div>
                  ))}
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
