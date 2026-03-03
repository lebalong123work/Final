import { useEffect,  useState } from "react";
import AdminSidebar from "./AdminSidebar";
import "./adminComics.css";
import "./adminTransactions.css";
import { toast } from "react-toastify";

const API_BASE = "http://localhost:5000";
const LIMIT = 8;

function Badge({ children, tone = "secondary" }) {
  return <span className={`badge rounded-pill text-bg-${tone}`}>{children}</span>;
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("vi-VN");
}

function toneRole(role) {
  if (role === "admin") return "danger";
  if (role === "sub_admin") return "warning";
  return "secondary";
}
function toneStatus(status) {
  return Number(status) === 1 ? "success" : "secondary";
}

async function fetchJSON(url, options) {
  const res = await fetch(url, options);
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    //
  }
  if (!res.ok) throw new Error(json?.message || `HTTP ${res.status}`);
  return json;
}

export default function AdminUsers() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const token = localStorage.getItem("token") || "";

  // ===== Modal state =====
  const [modalOpen, setModalOpen] = useState(false);
  const [picked, setPicked] = useState(null); // user row
  const [draft, setDraft] = useState({ status: 1, role: "user" });
  const [saving, setSaving] = useState(false);

  const fetchPage = async (p = 1) => {
    if (!token) {
      setErr("Bạn cần đăng nhập admin (token không tồn tại).");
      return;
    }

    try {
      setErr("");
      setLoading(true);

      const url = new URL(`${API_BASE}/api/admin/users`);
      url.searchParams.set("page", String(p));
      url.searchParams.set("limit", String(LIMIT));
      if (q.trim()) url.searchParams.set("q", q.trim());

      const data = await fetchJSON(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

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
    fetchPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // search server-side theo q -> bấm enter/refresh
  const onSearch = (e) => {
    e.preventDefault();
    fetchPage(1);
  };

  const canPrev = page > 1 && !loading;
  const canNext = page < totalPages && !loading;

  const openModal = (u) => {
    setPicked(u);
    setDraft({
      status: Number(u?.status ?? 1),
      role: u?.role_code || "user",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setPicked(null);
  };

  const saveChanges = async () => {
    if (!picked?.id) return;
    if (!token) return;

    try {
      setSaving(true);

      // 1) update status
      await fetchJSON(`${API_BASE}/api/admin/users/${picked.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: Number(draft.status) }),
      });

      // 2) update role
      const roleRes = await fetchJSON(`${API_BASE}/api/admin/users/${picked.id}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: draft.role }),
      });

      // update UI list (optimistic)
      setRows((prev) =>
        prev.map((x) =>
          Number(x.id) === Number(picked.id)
            ? {
                ...x,
                status: Number(draft.status),
                role_code: roleRes?.data?.role_code || draft.role,
              }
            : x
        )
      );

      closeModal();
    } catch (e) {
      toast(e.message || "Lỗi lưu thay đổi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ad-layout">
      <AdminSidebar />

      <main className="ad-main">
        <div className="ad-page">
          <div className="container-fluid px-4 py-4">
            {/* Header */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
              <div>
                <h2 className="m-0 ad-title">Quản lý người dùng</h2>
                <div className="text-secondary small">
                  Tổng: <b>{total}</b> người dùng
                </div>
              </div>

              <div className="d-flex gap-2 align-items-center">
                <form className="input-group ad-search" style={{ minWidth: 340 }} onSubmit={onSearch}>
                  <span className="input-group-text bg-white">
                    <i className="bi bi-search" />
                  </span>
                  <input
                    className="form-control"
                    placeholder="Tìm username / email / phone..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </form>

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

            {/* Table */}
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr className="text-secondary small">
                        <th>ID</th>
                        <th>Người dùng</th>
                        <th>Email</th>
                        <th>Provider</th>
                        <th>Quyền</th>
                        <th>Trạng thái</th>
                        <th>Ngày tạo</th>
                        <th className="text-end">Hành động</th>
                      </tr>
                    </thead>

                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={8} className="py-4 text-center text-secondary">
                            <span className="spinner-border spinner-border-sm me-2" />
                            Đang tải...
                          </td>
                        </tr>
                      ) : rows.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-5 text-center text-secondary">
                            <i className="bi bi-inbox fs-3 d-block mb-2" />
                            Không có người dùng
                          </td>
                        </tr>
                      ) : (
                        rows.map((u) => (
                          <tr key={u.id}>
                            <td className="fw-semibold">{u.id}</td>

                            <td>
                              <div className="fw-semibold text-truncate" style={{ maxWidth: 220 }}>
                                {u.username || "—"}
                              </div>
                              <div className="small text-secondary">
                                {u.phone || "—"}
                              </div>
                            </td>

                            <td className="text-truncate" style={{ maxWidth: 260 }}>
                              {u.email || "—"}
                            </td>

                            <td>
                              <Badge tone={u.provider === "google" ? "info" : "secondary"}>
                                {u.provider || "—"}
                              </Badge>
                            </td>

                            <td>
                              <Badge tone={toneRole(u.role_code)}>{u.role_code || "user"}</Badge>
                            </td>

                            <td>
                              <Badge tone={toneStatus(u.status)}>
                                {Number(u.status) === 1 ? "Hoạt động" : "Bị khóa"}
                              </Badge>
                            </td>

                            <td className="small text-secondary">{fmtDate(u.created_at)}</td>

                            <td className="text-end">
                              <button
                                className="btn btn-outline-dark btn-sm"
                                type="button"
                                onClick={() => openModal(u)}
                              >
                                <i className="bi bi-pencil-square me-1" />
                                Cập nhật
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination footer */}
                <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mt-3">
                  <div className="small text-secondary">
                    Trang {page}/{totalPages}
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

            {/* ===== Modal ===== */}
            {modalOpen && picked ? (
              <div className="ad-modal-backdrop" onMouseDown={closeModal}>
                <div className="ad-modal" onMouseDown={(e) => e.stopPropagation()}>
                  <div className="d-flex align-items-start justify-content-between gap-3 mb-2">
                    <div className="min-w-0">
                      <div className="fw-bold">Cập nhật người dùng</div>
                      <div className="text-secondary small text-truncate" title={picked.email || ""}>
                        #{picked.id} • {picked.username || "—"} • {picked.email || "—"}
                      </div>
                    </div>

                    <button className="btn btn-light btn-sm" type="button" onClick={closeModal} disabled={saving}>
                      <i className="bi bi-x-lg" />
                    </button>
                  </div>

                  <div className="mt-3">
                    {/* Status */}
                    <label className="form-label fw-semibold">Trạng thái tài khoản</label>
                    <select
                      className="form-select"
                      value={draft.status}
                      onChange={(e) => setDraft((p) => ({ ...p, status: Number(e.target.value) }))}
                      disabled={saving}
                    >
                      <option value={1}>Hoạt động</option>
                      <option value={0}>Khóa</option>
                    </select>

                    {/* Role */}
                    <div className="mt-3">
                      <label className="form-label fw-semibold">Quyền</label>
                      <select
                        className="form-select"
                        value={draft.role}
                        onChange={(e) => setDraft((p) => ({ ...p, role: e.target.value }))}
                        disabled={saving}
                      >
                        <option value="user">User</option>
                        <option value="sub_admin">Admin phụ</option>
                        <option value="admin">Admin</option>
                      </select>

                      <div className="text-secondary small mt-2">
                        * Admin phụ chỉ nên có quyền hạn chế (tuỳ backend bạn chặn route).
                      </div>
                    </div>

                    <div className="ad-modal-actions mt-4">
                      <button className="btn btn-outline-secondary w-100" type="button" onClick={closeModal} disabled={saving}>
                        Huỷ
                      </button>
                      <button className="btn btn-primary w-100" type="button" onClick={saveChanges} disabled={saving}>
                        {saving ? "Đang lưu..." : "Lưu"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}