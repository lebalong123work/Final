import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import "./adminComics.css"; 
import "./adminTransactions.css"; 

const API_BASE = "http://localhost:5000";
const LIMIT = 5;

function Badge({ children, tone = "secondary" }) {
  return <span className={`badge rounded-pill text-bg-${tone}`}>{children}</span>;
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


export default function AdminWalletTransactions() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const token = localStorage.getItem("token");

  const fetchPage = async (p) => {
  if (!token) {
    setErr("Bạn cần đăng nhập (token không tồn tại).");
    return;
  }

  try {
    setErr("");
    setLoading(true);

    const res = await fetch(
      `${API_BASE}/api/admin/wallet/transactions?page=${p}&limit=${LIMIT}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.message || "Lỗi tải giao dịch");
    }

    setRows(Array.isArray(data?.data) ? data.data : []);
    setPage(data.page || p);
    setTotalPages(data.totalPages || 1);
    setTotal(data.total || 0);

  } catch (e) {
    console.error(e);
    setRows([]);
    setTotalPages(1);
    setTotal(0);
    setErr(e.message || "Không kết nối được server");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchPage(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // search tại client (vì API chưa có search)
  const filtered = useMemo(() => {
    const key = q.trim().toLowerCase();
    if (!key) return rows;

    return rows.filter((t) => {
      const s = [
        t?.order_id,
        t?.note,
        t?.type,
        t?.status,
        String(t?.amount ?? ""),
        String(t?.trans_id ?? ""),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return s.includes(key);
    });
  }, [rows, q]);

  const canPrev = page > 1 && !loading;
  const canNext = page < totalPages && !loading;

  return (
    <div className="ad-layout">
      <AdminSidebar />

      <main className="ad-main">
        <div className="ad-page">
          <div className="container-fluid px-4 py-4">
            {/* Header */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
              <div>
                <h2 className="m-0 ad-title">Giao dịch ví</h2>
               
              </div>

              <div className="d-flex gap-2 align-items-center">
                <div className="input-group ad-search" style={{ minWidth: 320 }}>
                  <span className="input-group-text bg-white">
                    <i className="bi bi-search" />
                  </span>
                  <input
                    className="form-control"
                    placeholder="Tìm theo mã, ghi chú, trạng thái..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>

                <button
                  className="btn btn-outline-dark d-flex align-items-center gap-2 px-4 text-nowrap"
                  type="button"
                  onClick={() => fetchPage(page)}
                  disabled={loading}
                >
                  <i className={`bi ${loading ? "bi-arrow-repeat" : "bi-arrow-clockwise"}`} />
                  Làm mới
                </button>
              </div>
            </div>

            {/* Error */}
            {err ? (
              <div className="alert alert-warning rounded-4">
                <i className="bi bi-exclamation-triangle me-2" />
                {err}
              </div>
            ) : null}

            {/* Summary */}
            <div className="card border-0 shadow-sm rounded-4 mb-3">
           
            </div>

            {/* Table */}
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr className="text-secondary small">
                        <th>Mã (Order)</th>
                       
                        <th>Ghi chú</th>
                        <th>Thời gian</th>
                        <th className="text-end">Số tiền</th>
                        <th className="text-end">Trạng thái</th>
                      </tr>
                    </thead>

                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="py-4 text-center text-secondary">
                            <span className="spinner-border spinner-border-sm me-2" />
                            Đang tải...
                          </td>
                        </tr>
                      ) : filtered.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-5 text-center text-secondary">
                            <i className="bi bi-inbox fs-3 d-block mb-2" />
                            Không có giao dịch
                          </td>
                        </tr>
                      ) : (
                        filtered.map((t) => {
                          const amount = Number(t.amount || 0);
                          const isNeg = amount < 0;

                          return (
                            <tr key={t.id}>
                              <td className="fw-semibold">
                                <div className="text-truncate" style={{ maxWidth: 220 }}>
                                  {t.order_id || `TX${t.id}`}
                                </div>
                               
                              </td>

                              

                              <td className="text-truncate" style={{ maxWidth: 420 }}>
                                {t.note || "—"}
                              </td>

                              <td className="small text-secondary">{fmtDate(t.created_at)}</td>

                              <td className={`text-end fw-bold ${isNeg ? "pw-neg" : "pw-pos"}`}>
                                {isNeg ? "-" : "+"}
                                {fmtVND(Math.abs(amount))}
                              </td>

                              <td className="text-end">
                                <Badge tone={toneByStatus(t.status)}>{t.status || "—"}</Badge>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination footer */}
                <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mt-3">
                  <div className="small text-secondary">
                    Hiển thị {filtered.length}/{rows.length} dòng trên trang này
                  </div>

                  <div className="d-flex gap-2 align-items-center">
                    <button
                      className="btn btn-outline-dark btn-sm"
                      type="button"
                      disabled={!canPrev}
                      onClick={() => setPage(1)}
                      title="Trang đầu"
                    >
                      <i className="bi bi-chevron-double-left" />
                    </button>

                    <button
                      className="btn btn-outline-dark btn-sm"
                      type="button"
                      disabled={!canPrev}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <i className="bi bi-chevron-left me-1" />
                      Trước
                    </button>

                    <span className="small text-secondary px-2">
                      {page}/{totalPages}
                    </span>

                    <button
                      className="btn btn-outline-dark btn-sm"
                      type="button"
                      disabled={!canNext}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Sau
                      <i className="bi bi-chevron-right ms-1" />
                    </button>

                    <button
                      className="btn btn-outline-dark btn-sm"
                      type="button"
                      disabled={!canNext}
                      onClick={() => setPage(totalPages)}
                      title="Trang cuối"
                    >
                      <i className="bi bi-chevron-double-right" />
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