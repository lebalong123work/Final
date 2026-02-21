import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import "./adminComics.css"; // bạn có thể đổi tên css riêng nếu muốn

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";

const API_BASE = "http://localhost:5000"; // đổi theo backend bạn
const API_LEVELS = `${API_BASE}/levels`;

function Badge({ children, tone = "dark" }) {
  return <span className={`badge rounded-pill text-bg-${tone}`}>{children}</span>;
}

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
    ...options,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // ignore
  }

  if (!res.ok) {
    const msg = data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export default function AdminLevels() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // search
  const [q, setQ] = useState("");

  // modal
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null); // level object hoặc null
  const [draft, setDraft] = useState({ level_no: 1, min_total_topup: 0, name: "" });

  const loadLevels = async () => {
    try {
      setErr("");
      setLoading(true);
      const json = await fetchJSON(API_LEVELS, { method: "GET" });
      // backend mình gửi trước trả {data:[], paging:{...}}
      setItems(json?.data ?? []);
    } catch (e) {
      console.error(e);
      setErr(e.message || "Không tải được levels.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLevels();
  }, []);

  const filtered = useMemo(() => {
    const key = q.trim().toLowerCase();
    if (!key) return items;
    return items.filter((x) => {
      const a = String(x?.name || "").toLowerCase().includes(key);
      const b = String(x?.level_no ?? "").includes(key);
      return a || b;
    });
  }, [items, q]);

  const openAdd = () => {
    setEditing(null);
    setDraft({ level_no: 1, min_total_topup: 0, name: "" });
    setOpen(true);
  };

  const openEdit = (level) => {
    setEditing(level);
    setDraft({
      level_no: Number(level?.level_no ?? 1),
      min_total_topup: Number(level?.min_total_topup ?? 0),
      name: String(level?.name ?? ""),
    });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
  };

  const validateDraft = () => {
    if (!draft.name || String(draft.name).trim() === "") return "Tên level không được rỗng";
    if (!Number.isInteger(Number(draft.level_no)) || Number(draft.level_no) <= 0)
      return "level_no phải là số nguyên dương";
    if (Number(draft.min_total_topup) < 0) return "min_total_topup phải >= 0";
    return "";
  };

  const handleSave = async () => {
    const msg = validateDraft();
    if (msg) return toast.error(msg);

    try {
      const payload = {
        level_no: Number(draft.level_no),
        min_total_topup: Number(draft.min_total_topup),
        name: String(draft.name).trim(),
      };

      if (editing?.id) {
        await fetchJSON(`${API_LEVELS}/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("Cập nhật level thành công!");
      } else {
        await fetchJSON(API_LEVELS, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Thêm level thành công!");
      }

      closeModal();
      await loadLevels();
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Lỗi khi lưu level");
    }
  };

  const handleDelete = async (level) => {
    const rs = await Swal.fire({
      title: "Xoá level?",
      html: `<div style="text-align:left">
              <b>${escapeHtml(level?.name || "")}</b><br/>
              Level No: ${level?.level_no ?? "—"}<br/>
              Min topup: ${fmtVND(level?.min_total_topup ?? 0)}
            </div>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xoá",
      cancelButtonText: "Huỷ",
      confirmButtonColor: "#d33",
    });

    if (!rs.isConfirmed) return;

    try {
      await fetchJSON(`${API_LEVELS}/${level.id}`, { method: "DELETE" });
      await Swal.fire({
        title: "Đã xoá!",
        text: "Xoá level thành công.",
        icon: "success",
        timer: 1200,
        showConfirmButton: false,
      });
      await loadLevels();
    } catch (e) {
      console.error(e);
      await Swal.fire({
        title: "Không xoá được",
        text: e.message || "Lỗi server",
        icon: "error",
      });
    }
  };

  return (
    <div className="ad-layout">
      <AdminSidebar />

      <main className="ad-main">
        <ToastContainer position="top-right" autoClose={1800} />

        <div className="ad-page">
          <div className="container-fluid px-4 py-4">
            {/* Header */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
              <div>
                <h2 className="m-0 ad-title">Quản lý Level</h2>
               
              </div>

              <div className="d-flex gap-2 align-items-center">
                <div className="input-group ad-search">
                  <span className="input-group-text bg-white">
                    <i className="bi bi-search" />
                  </span>
                  <input
                    className="form-control"
                    placeholder="Tìm theo tên hoặc level_no..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>

                <button
                  className="btn btn-primary d-flex align-items-center justify-content-center gap-2 px-4 rounded-3 text-nowrap"
                  type="button"
                  onClick={openAdd}
                >
                  <i className="bi bi-plus-lg" />
                  Thêm level
                </button>

                <button
                  className="btn btn-outline-dark d-flex align-items-center justify-content-center gap-2 px-4 text-nowrap"
                  type="button"
                  onClick={loadLevels}
                  disabled={loading}
                >
                  <i className={`bi ${loading ? "bi-arrow-repeat" : "bi-arrow-clockwise"}`} />
                  Tải lại
                </button>
              </div>
            </div>

            {/* Status */}
            {err ? (
              <div className="alert alert-warning rounded-4">
                <i className="bi bi-exclamation-triangle me-2" />
                {err}
              </div>
            ) : null}

            {loading ? (
              <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body d-flex align-items-center gap-2">
                  <div className="spinner-border spinner-border-sm" />
                  <span className="text-secondary">Đang tải danh sách level...</span>
                </div>
              </div>
            ) : null}

            {/* Grid */}
            <div className="row g-3 mt-1">
              {filtered.map((lv) => {
                const tone = Number(lv?.level_no) >= 5 ? "warning" : "dark";
                return (
                  <div key={lv.id} className="col-12 col-sm-6 col-lg-4 d-flex">
                    <div className="card ad-comic-card border-0 shadow-sm w-100">
                      <div className="card-body">
                        <div className="d-flex align-items-start justify-content-between gap-2">
                          <div className="min-w-0">
                            <div className="fw-bold ad-comic-title text-truncate" title={lv?.name}>
                              {lv?.name}
                            </div>
                            <div className="text-secondary small mt-1">
                              <Badge tone={tone}>Level #{lv?.level_no}</Badge>
                              <span className="ms-2">
                                Min topup: <b>{fmtVND(lv?.min_total_topup ?? 0)}</b>
                              </span>
                            </div>
                            <div className="text-secondary small mt-2">
                              <i className="bi bi-clock me-1" />
                              {lv?.created_at ? new Date(lv.created_at).toLocaleString("vi-VN") : "—"}
                            </div>
                          </div>

                          <div className="d-flex gap-2">
                            <button className="btn btn-warning btn-sm" type="button" onClick={() => openEdit(lv)}>
                              <i className="bi bi-pencil-square me-1" />
                              Sửa
                            </button>

                            <button className="btn btn-outline-danger btn-sm" type="button" onClick={() => handleDelete(lv)}>
                              <i className="bi bi-trash me-1" />
                              Xoá
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {!loading && filtered.length === 0 ? (
                <div className="col-12">
                  <div className="card border-0 shadow-sm rounded-4">
                    <div className="card-body text-center text-secondary">
                      <i className="bi bi-inbox fs-3 d-block mb-2" />
                      Không có level nào.
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Modal add/edit */}
        {open ? (
          <div className="ad-modal-backdrop" onMouseDown={closeModal}>
            <div className="ad-modal" onMouseDown={(e) => e.stopPropagation()}>
              <div className="d-flex align-items-start justify-content-between gap-3 mb-2">
                <div className="min-w-0">
                  <div className="fw-bold">{editing ? "Sửa level" : "Thêm level"}</div>
                  <div className="text-secondary small">
                    {editing ? `ID: ${editing.id}` : "Tạo mới một level"}
                  </div>
                </div>

                <button className="btn btn-light btn-sm" type="button" onClick={closeModal}>
                  <i className="bi bi-x-lg" />
                </button>
              </div>

              <div className="mt-3">
                <label className="form-label fw-semibold">Level No</label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  value={draft.level_no}
                  onChange={(e) => setDraft((p) => ({ ...p, level_no: e.target.value }))}
                  placeholder="Ví dụ: 1"
                />

                <div className="mt-3">
                  <label className="form-label fw-semibold">Tên level</label>
                  <input
                    className="form-control"
                    value={draft.name}
                    onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Ví dụ: Đồng / Bạc / Vàng..."
                  />
                </div>

                <div className="mt-3">
                  <label className="form-label fw-semibold">Min total topup (VNĐ)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    value={draft.min_total_topup}
                    onChange={(e) => setDraft((p) => ({ ...p, min_total_topup: e.target.value }))}
                    placeholder="Ví dụ: 500000"
                  />
                  <div className="text-secondary small mt-1">
                    Tổng nạp tối thiểu để đạt level này.
                  </div>
                </div>

                <div className="ad-modal-actions mt-4">
                  <button className="btn btn-outline-secondary w-100" type="button" onClick={closeModal}>
                    Huỷ
                  </button>
                  <button className="btn btn-primary w-100" type="button" onClick={handleSave}>
                    Lưu
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

function fmtVND(n) {
  return new Intl.NumberFormat("vi-VN").format(Number(n || 0)) + " ₫";
}

// để nhét HTML vào Swal an toàn hơn
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}