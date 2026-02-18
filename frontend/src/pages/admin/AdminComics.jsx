import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import "./adminComics.css";

const API_HOME = "https://otruyenapi.com/v1/api/home";
const IMG_BASE = "https://img.otruyenapi.com/uploads/comics/";

/** Build thumb from external API */
function buildThumb(thumb) {
  if (!thumb) return "";
  if (thumb.startsWith("http")) return thumb;
  return IMG_BASE + thumb;
}

function Badge({ children, tone = "dark" }) {
  return <span className={`badge rounded-pill text-bg-${tone}`}>{children}</span>;
}

const STORAGE_KEY = "admin_comic_pricing_map_v1";
/**
 * pricingMap structure:
 * {
 *   [comicId]: { type: "free" | "paid", price: number }
 * }
 */
function loadPricingMap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function savePricingMap(map) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (err) {
    console.error("Save pricing map error:", err);
  }
}


export default function AdminComics() {
  const [tab, setTab] = useState("external"); // external | self

  // External (API)
  const [extItems, setExtItems] = useState([]);
  const [extLoading, setExtLoading] = useState(false);
  const [extError, setExtError] = useState("");

  // Search
  const [q, setQ] = useState("");

  // Self (demo)
  const [myItems, setMyItems] = useState([
    {
      id: "my_1",
      name: "Truyện tự đăng A",
      status: "ongoing",
      updatedAt: new Date().toISOString(),
      thumb: "https://picsum.photos/seed/comicA/500/700",
      views: 1234,
    },
    {
      id: "my_2",
      name: "Truyện tự đăng B",
      status: "completed",
      updatedAt: new Date().toISOString(),
      thumb: "https://picsum.photos/seed/comicB/500/700",
      views: 842,
    },
  ]);

  // Pricing config
  const [pricingMap, setPricingMap] = useState(() => loadPricingMap());

  // Modal state
  const [settingComic, setSettingComic] = useState(null);
  const [settingDraft, setSettingDraft] = useState({ type: "free", price: 0 });

  // Load external API when open tab external
useEffect(() => {
  if (tab !== "external") return;

  const controller = new AbortController();

  const loadExternal = async () => {
    try {
      setExtError("");
      setExtLoading(true);

      const res = await fetch(API_HOME, {
        signal: controller.signal,
      });

      const json = await res.json();
      setExtItems(json?.data?.items ?? []);

    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Load error:", err);
        setExtError("Không tải được truyện ngoài.");
      }
    } finally {
      setExtLoading(false);
    }
  };

  loadExternal();

  return () => {
    controller.abort();
  };

}, [tab]);

  // persist pricing map
  useEffect(() => {
    savePricingMap(pricingMap);
  }, [pricingMap]);

  const filteredExt = useMemo(() => {
    const key = q.trim().toLowerCase();
    if (!key) return extItems;
    return extItems.filter((x) => (x?.name || "").toLowerCase().includes(key));
  }, [extItems, q]);

  const filteredMy = useMemo(() => {
    const key = q.trim().toLowerCase();
    if (!key) return myItems;
    return myItems.filter((x) => (x?.name || "").toLowerCase().includes(key));
  }, [myItems, q]);

  const current = tab === "external" ? filteredExt : filteredMy;

  const openSetting = (comic) => {
    const id = comic?._id || comic?.id;
    const existing = pricingMap[id] || { type: "free", price: 0 };
    setSettingComic(comic);
    setSettingDraft({
      type: existing.type || "free",
      price: Number(existing.price || 0),
    });
  };

  const closeSetting = () => {
    setSettingComic(null);
    setSettingDraft({ type: "free", price: 0 });
  };

  const saveSetting = () => {
    const id = settingComic?._id || settingComic?.id;
    if (!id) return;

    setPricingMap((prev) => ({
      ...prev,
      [id]: {
        type: settingDraft.type,
        price: settingDraft.type === "paid" ? Number(settingDraft.price || 0) : 0,
      },
    }));
    closeSetting();
  };

  const pricingLabel = (id) => {
    const cfg = pricingMap[id];
    if (!cfg) return null; // chưa cấu hình
    if (cfg.type === "paid") return { text: `Trả phí${cfg.price ? ` • ${fmtVND(cfg.price)}` : ""}`, tone: "danger" };
    return { text: "Miễn phí", tone: "success" };
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
                <h2 className="m-0 ad-title">Quản lý truyện</h2>
                <div className="text-secondary small">
                  2 nguồn: Truyện ngoài (API) & Truyện tự đăng — có cài đặt miễn phí / trả phí
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
                <button
  className="btn btn-primary d-flex align-items-center justify-content-center gap-2 px-4 rounded-3 text-nowrap"
  type="button"
  onClick={() =>
    alert("Demo UI: Thêm truyện (bước tiếp theo nối API của bạn)")
  }
>
  <i className="bi bi-plus-lg" />
  Thêm truyện
</button>

                ) : (
                  <button
  className="btn btn-outline-dark d-flex align-items-center justify-content-center gap-2 px-4 text-nowrap"
  type="button"
  onClick={() => setTab("external")}
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
              <button
                className={`ad-tab ${tab === "external" ? "active" : ""}`}
                onClick={() => setTab("external")}
                type="button"
              >
                <i className="bi bi-globe2 me-2" />
                Truyện ngoài (API)
                <span className="ms-2 badge rounded-pill text-bg-light">{extItems.length}</span>
              </button>

              <button
                className={`ad-tab ${tab === "self" ? "active" : ""}`}
                onClick={() => setTab("self")}
                type="button"
              >
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
                  <span className="text-secondary">Đang tải truyện ngoài...</span>
                </div>
              </div>
            ) : null}

            {/* Grid 4 cột */}
            <div className="row g-3 mt-1">
              {current.map((c) => {
                const id = c?._id || c?.id;
                const name = c?.name || "Không tên";
                const status = c?.status || "unknown";
                const updatedAt = c?.updatedAt;
                const thumb = tab === "external" ? buildThumb(c?.thumb_url) : c?.thumb;

                const cats = tab === "external" ? (c?.category || []) : [];
                const latest = tab === "external" ? c?.chaptersLatest?.[0]?.chapter_name : null;

                const priceBadge = pricingLabel(id);

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

                        {/* Hover actions */}
                        <div className="ad-comic-actions">
                          <button className="btn btn-light btn-sm" type="button" onClick={() => alert("Demo: xem truyện")}>
                            <i className="bi bi-eye me-1" />
                            Xem
                          </button>

                          <button className="btn btn-warning btn-sm" type="button" onClick={() => openSetting(c)}>
                            <i className="bi bi-gear me-1" />
                            Cài đặt
                          </button>
                        </div>
                      </div>

                      <div className="card-body">
                        <div className="fw-bold ad-comic-title" title={name}>
                          {name}
                        </div>

                        {cats?.length ? (
                          <div className="ad-comic-tags mt-2">
                            {cats.slice(0, 3).map((t) => (
                              <span className="ad-tag" key={t.id || t.slug}>
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

                <button className="btn btn-light btn-sm" type="button" onClick={closeSetting}>
                  <i className="bi bi-x-lg" />
                </button>
              </div>

              <div className="mt-3">
                <label className="form-label fw-semibold">Hình thức xem</label>
                <select
                  className="form-select"
                  value={settingDraft.type}
                  onChange={(e) => setSettingDraft((p) => ({ ...p, type: e.target.value }))}
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
                    />
                    <div className="text-secondary small mt-1">
                      User sẽ phải mua để xem truyện/chap (tuỳ logic bạn triển khai phía user).
                    </div>
                  </div>
                ) : (
                  <div className="text-secondary small mt-2">
                    User sẽ được xem miễn phí.
                  </div>
                )}

                <div className="ad-modal-actions mt-4">
                  <button className="btn btn-outline-secondary w-100" type="button" onClick={closeSetting}>
                    Huỷ
                  </button>
                  <button className="btn btn-primary w-100" type="button" onClick={saveSetting}>
                    Lưu cài đặt
                  </button>
                </div>
              </div>

              <div className="text-secondary small mt-3">
                * Demo đang lưu vào <b>localStorage</b>. Khi bạn có API backend, mình đổi sang gọi API lưu DB.
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
