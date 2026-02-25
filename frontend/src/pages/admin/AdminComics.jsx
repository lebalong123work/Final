import { useEffect,  useState } from "react";
import AdminSidebar from "./AdminSidebar";
import "./adminComics.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const IMG_BASE = "https://img.otruyenapi.com/uploads/comics/";
function buildThumb(thumb) {
  if (!thumb) return "";
  if (thumb.startsWith("http")) return thumb;
  return IMG_BASE + thumb;
}

function Badge({ children, tone = "dark" }) {
  return <span className={`badge rounded-pill text-bg-${tone}`}>{children}</span>;
}

const API_BASE = "http://localhost:5000";
const LIMIT = 12;

export default function AdminComics() {
  const [tab, setTab] = useState("external"); 

  
  const [extItems, setExtItems] = useState([]);
  const [extLoading, setExtLoading] = useState(false);
  const [extError, setExtError] = useState("");

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Self demo
  const [myItems] = useState([
    {
      id: "my_1",
      name: "Truyện tự đăng A",
      status: "ongoing",
      updatedAt: new Date().toISOString(),
      thumb: "https://picsum.photos/seed/comicA/500/700",
    },
    {
      id: "my_2",
      name: "Truyện tự đăng B",
      status: "completed",
      updatedAt: new Date().toISOString(),
      thumb: "https://picsum.photos/seed/comicB/500/700",
    },
  ]);

  // Modal state
  const [settingComic, setSettingComic] = useState(null);
  const [settingDraft, setSettingDraft] = useState({ type: "free", price: 0 });
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");

  const fetchExternalFromDB = async (p = 1) => {
    try {
      setExtError("");
      setExtLoading(true);

      const url = new URL(`${API_BASE}/api/external-comics`);
      url.searchParams.set("page", String(p));
      url.searchParams.set("limit", String(LIMIT));
      if (q.trim()) url.searchParams.set("q", q.trim());

      const res = await fetch(url.toString());
      const data = await res.json();

      if (!res.ok) throw new Error(data?.message || "Lỗi tải truyện từ DB");

      setExtItems(Array.isArray(data?.data) ? data.data : []);
      setPage(data.page || p);
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      console.error(e);
      setExtItems([]);
      setPage(1);
      setTotalPages(1);
      setExtError(e.message || "Không tải được");
    } finally {
      setExtLoading(false);
    }
  };

const handleSyncToDB = async () => {
  if (!token) {
    toast.warning("Bạn cần đăng nhập admin để đồng bộ.");
    return;
  }

  const toastId = toast.loading("Đang đồng bộ dữ liệu...");

  try {
    setExtLoading(true);

    const res = await fetch(`${API_BASE}/api/admin/external-comics/sync`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "Đồng bộ thất bại");

    await fetchExternalFromDB(1);

    toast.update(toastId, {
      render: `Đồng bộ thành công! ${data?.stats?.upsertedComics || 0} truyện`,
      type: "success",
      isLoading: false,
      autoClose: 3000,
    });
  } catch (e) {
    toast.update(toastId, {
      render: e.message || "Không đồng bộ được",
      type: "error",
      isLoading: false,
      autoClose: 3000,
    });
  } finally {
    setExtLoading(false);
  }
};

 
  useEffect(() => {
    if (tab !== "external") return;
    fetchExternalFromDB(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, q]);

  const current = tab === "external" ? extItems : myItems;

  const openSetting = (comic) => {
  
    const isPaid = !!comic?.is_paid;
    setSettingComic(comic);
    setSettingDraft({
      type: isPaid ? "paid" : "free",
      price: Number(comic?.price || 0),
    });
  };

  const closeSetting = () => {
    if (saving) return;
    setSettingComic(null);
    setSettingDraft({ type: "free", price: 0 });
  };

  const saveSetting = async () => {
    if (!settingComic?.api_id) return;

    const isPaid = settingDraft.type === "paid";
    const price = Math.max(0, Number(settingDraft.price || 0));

    if (isPaid && price <= 0) {
      alert("Giá phải > 0 khi bật trả phí");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch(`${API_BASE}/api/admin/external-comics/${settingComic.api_id}/pricing`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_paid: isPaid, price }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Lưu cài đặt thất bại");

      // cập nhật ngay trên UI
      setExtItems((prev) =>
        prev.map((x) =>
          x.api_id === settingComic.api_id
            ? { ...x, is_paid: data.data.is_paid, price: data.data.price }
            : x
        )
      );

      closeSetting();
    } catch (e) {
      console.error(e);
      alert(e.message || "Lỗi lưu");
    } finally {
      setSaving(false);
    }
  };

  const pricingLabel = (comic) => {
    if (!comic) return null;
    if (comic.is_paid) return { text: `Trả phí${comic.price ? ` • ${fmtVND(comic.price)}` : ""}`, tone: "danger" };
    return { text: "Miễn phí", tone: "success" };
  };

  return (
    <div className="ad-layout">
      <AdminSidebar />

      <main className="ad-main">
         <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="colored"
      />
        <div className="ad-page">
          <div className="container-fluid px-4 py-4">
            {/* Header */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
              <div>
                <h2 className="m-0 ad-title">Quản lý truyện</h2>
                <div className="text-secondary small">
                  Truyện ngoài (DB) & Truyện tự đăng — có cài đặt miễn phí / trả phí
                </div>
              </div>

              <div className="d-flex gap-2 align-items-center">
                <div className="input-group ad-search">
                  <span className="input-group-text bg-white">
                    <i className="bi bi-search" />
                  </span>
                  <input
                    className="form-control"
                    placeholder="Tìm truyện..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>

                {tab === "self" ? (
                  <button className="btn btn-primary d-flex align-items-center gap-2 px-4 rounded-3 text-nowrap" type="button">
                    <i className="bi bi-plus-lg" />
                    Thêm truyện
                  </button>
                ) : (
                  <button
                    className="btn btn-outline-dark d-flex align-items-center gap-2 px-4 text-nowrap"
                    type="button"
                    onClick={handleSyncToDB}
                    disabled={extLoading}
                  >
                    <i className={`bi ${extLoading ? "bi-arrow-repeat" : "bi-cloud-download"}`} />
                    Đồng bộ
                  </button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="ad-tabs mb-3">
              <button className={`ad-tab ${tab === "external" ? "active" : ""}`} onClick={() => setTab("external")} type="button">
                <i className="bi bi-globe2 me-2" />
                Truyện ngoài (DB)
                <span className="ms-2 badge rounded-pill text-bg-light">{extItems.length}</span>
              </button>

              <button className={`ad-tab ${tab === "self" ? "active" : ""}`} onClick={() => setTab("self")} type="button">
                <i className="bi bi-person-lines-fill me-2" />
                Truyện tự đăng
                <span className="ms-2 badge rounded-pill text-bg-light">{myItems.length}</span>
              </button>
            </div>

            {/* Status */}
            {tab === "external" && extError ? (
              <div className="alert alert-warning rounded-4">
                <i className="bi bi-exclamation-triangle me-2" />
                {extError}
              </div>
            ) : null}

            {tab === "external" && extLoading ? (
              <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body d-flex align-items-center gap-2">
                  <div className="spinner-border spinner-border-sm" />
                  <span className="text-secondary">Đang tải dữ liệu...</span>
                </div>
              </div>
            ) : null}

            {/* Grid */}
            <div className="row g-3 mt-1">
              {current.map((c) => {
                const id = c?.api_id || c?.id;
                const name = c?.name || "Không tên";
                const status = c?.status || "unknown";
                const updatedAt = c?.updated_at || c?.updatedAt;
                const thumb = tab === "external" ? buildThumb(c?.thumb_url) : c?.thumb;

                const cats = tab === "external" ? (c?.categories || []) : [];
                const latest = tab === "external" ? c?.latest_chapter : null;

                const priceBadge = tab === "external" ? pricingLabel(c) : null;

                return (
                  <div key={id} className="col-12 col-sm-6 col-lg-4 d-flex">
                    <div className="card ad-comic-card border-0 shadow-sm w-100">
                      <div className="ad-comic-thumb">
                        {thumb ? <img src={thumb} alt={name} /> : null}

                        <div className="ad-comic-topbadges">
                          <Badge tone={status === "ongoing" ? "success" : status === "completed" ? "secondary" : "dark"}>
                            {status === "ongoing" ? "Đang ra" : status === "completed" ? "Hoàn thành" : status}
                          </Badge>

                          {latest ? <Badge tone="dark">Chap {latest}</Badge> : null}
                          {priceBadge ? <Badge tone={priceBadge.tone}>{priceBadge.text}</Badge> : null}
                        </div>

                        <div className="ad-comic-actions">
                          

                          {tab === "external" ? (
                            <button className="btn btn-warning btn-sm" type="button" onClick={() => openSetting(c)}>
                              <i className="bi bi-gear me-1" />
                              Cài đặt
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <div className="card-body">
                        <div className="fw-bold ad-comic-title" title={name}>
                          {name}
                        </div>

                        {cats?.length ? (
                          <div className="ad-comic-tags mt-2">
                            {cats.slice(0, 3).map((t) => (
                              <span className="ad-tag" key={t.api_id || t.slug}>
                                {t.name}
                              </span>
                            ))}
                            {cats.length > 3 ? <span className="ad-tag more">+{cats.length - 3}</span> : null}
                          </div>
                        ) : (
                          <div className="text-secondary small mt-2">
                            {tab === "self" ? "Truyện do bạn đăng" : "Không có thể loại"}
                          </div>
                        )}

                        <div className="ad-comic-meta mt-3">
                          <div className="text-secondary small">
                            <i className="bi bi-clock me-1" />
                            {updatedAt ? new Date(updatedAt).toLocaleString("vi-VN") : "—"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {!extLoading && current.length === 0 ? (
                <div className="col-12">
                  <div className="card border-0 shadow-sm rounded-4">
                    <div className="card-body text-center text-secondary">
                      <i className="bi bi-inbox fs-3 d-block mb-2" />
                      Không có truyện nào.
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Pagination cho tab external */}
            {tab === "external" ? (
              <div className="d-flex justify-content-center mt-4">
                <nav>
                  <ul className="pagination mb-0">
                    <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
                      <button className="page-link" onClick={() => fetchExternalFromDB(page - 1)} type="button">
                        «
                      </button>
                    </li>

                    <li className="page-item active">
                      <span className="page-link">
                        {page}/{totalPages}
                      </span>
                    </li>

                    <li className={`page-item ${page >= totalPages ? "disabled" : ""}`}>
                      <button className="page-link" onClick={() => fetchExternalFromDB(page + 1)} type="button">
                        »
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            ) : null}
          </div>
        </div>

        {/* Modal cài đặt */}
        {settingComic ? (
          <div className="ad-modal-backdrop" onMouseDown={closeSetting}>
            <div className="ad-modal" onMouseDown={(e) => e.stopPropagation()}>
              <div className="d-flex align-items-start justify-content-between gap-3 mb-2">
                <div className="min-w-0">
                  <div className="fw-bold">Cài đặt truyện</div>
                  <div className="text-secondary small text-truncate" title={settingComic?.name}>
                    {settingComic?.name}
                  </div>
                </div>

                <button className="btn btn-light btn-sm" type="button" onClick={closeSetting} disabled={saving}>
                  <i className="bi bi-x-lg" />
                </button>
              </div>

              <div className="mt-3">
                <label className="form-label fw-semibold">Hình thức xem</label>
                <select
                  className="form-select"
                  value={settingDraft.type}
                  onChange={(e) => setSettingDraft((p) => ({ ...p, type: e.target.value }))}
                  disabled={saving}
                >
                  <option value="free">Miễn phí</option>
                  <option value="paid">Yêu cầu thanh toán</option>
                </select>

                {settingDraft.type === "paid" ? (
                  <div className="mt-3">
                    <label className="form-label fw-semibold">Giá (VNĐ)</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      value={settingDraft.price}
                      onChange={(e) => setSettingDraft((p) => ({ ...p, price: e.target.value }))}
                      placeholder="Ví dụ: 5000"
                      disabled={saving}
                    />
                  </div>
                ) : (
                  <div className="text-secondary small mt-2">User sẽ được xem miễn phí.</div>
                )}

                <div className="ad-modal-actions mt-4">
                  <button className="btn btn-outline-secondary w-100" type="button" onClick={closeSetting} disabled={saving}>
                    Huỷ
                  </button>
                  <button className="btn btn-primary w-100" type="button" onClick={saveSetting} disabled={saving}>
                    {saving ? "Đang lưu..." : "Lưu cài đặt"}
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