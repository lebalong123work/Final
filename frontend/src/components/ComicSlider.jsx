import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./comicSlider.css";

const API_BASE = "http://localhost:5000";
const IMG_BASE = "https://img.otruyenapi.com/uploads/comics/";

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function buildCover(thumbUrl) {
  if (!thumbUrl) return "https://via.placeholder.com/500x700?text=No+Image";
  if (thumbUrl.startsWith("http")) return thumbUrl;
  return IMG_BASE + thumbUrl;
}

function fmtUpdated(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("vi-VN");
  } catch {
    return "—";
  }
}

function normalizeExternalComic(c) {
  return {
    id: c.api_id || c.id,
    name: c.name || "Không tên",
    cover: buildCover(c.thumb_url),
    tags: (c.categories || []).map((x) => x.name).filter(Boolean),
    updated: fmtUpdated(c.updated_at || c.created_at),
    latest: c.latest_chapter || null,
    is_paid: !!c.is_paid,
    price: Number(c.price || 0),
    slug: c.slug,
  };
}

function fmtVND(n) {
  return new Intl.NumberFormat("vi-VN").format(Number(n || 0)) + " ₫";
}

export default function ComicSlider({
  title = "Truyện mới cập nhật",
  perPage = 4,
  limit = 24,
  q = "",
  category = "",
  // đổi route detail ở đây nếu bạn khác
  buildDetailUrl = (comic) => `/truyen/${comic.slug || comic.id}`,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const pages = useMemo(() => chunk(items, perPage), [items, perPage]);
  const [page, setPage] = useState(0);

  const prev = () => setPage((p) => (p - 1 + (pages.length || 1)) % (pages.length || 1));
  const next = () => setPage((p) => (p + 1) % (pages.length || 1));

  const current = pages[page] || [];

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);

        const url = new URL(`${API_BASE}/api/external-comics`);
        url.searchParams.set("page", "1");
        url.searchParams.set("limit", String(limit));
        if (q?.trim()) url.searchParams.set("q", q.trim());
        if (category?.trim()) url.searchParams.set("category", category.trim());

        const res = await fetch(url.toString());
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Lỗi tải external comics");

        const rows = Array.isArray(data?.data) ? data.data : [];
        setItems(rows.map(normalizeExternalComic));
        setPage(0);
      } catch (e) {
        console.error(e);
        setItems([]);
        setPage(0);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [limit, q, category]);

  return (
    <section className="cs-wrap">
      <div className="cs-head">
        <div className="cs-title">
          <span className="cs-dotTitle" />
          <span>{title}</span>
          <span className="cs-count">{items.length}</span>
        </div>

        <div className="cs-controls d-none d-md-flex gap-2">
          <button className="btn cs-btn" onClick={prev} aria-label="Prev" disabled={!pages.length}>
            <i className="bi bi-chevron-left" />
          </button>
          <button className="btn cs-btn" onClick={next} aria-label="Next" disabled={!pages.length}>
            <i className="bi bi-chevron-right" />
          </button>
        </div>
      </div>

      <div className="position-relative py-2">
        <button className="cs-fab cs-fab-left" onClick={prev} aria-label="Prev" disabled={!pages.length}>
          <i className="bi bi-chevron-left" />
        </button>
        <button className="cs-fab cs-fab-right" onClick={next} aria-label="Next" disabled={!pages.length}>
          <i className="bi bi-chevron-right" />
        </button>

        {loading ? (
          <div className="cs-loading">
            <div className="spinner-border spinner-border-sm me-2" />
            Đang tải...
          </div>
        ) : (
          <div className="row g-3">
            {current.map((c) => {
              const detailUrl = buildDetailUrl(c);

              return (
                <div key={c.id} className="col-12 col-sm-6 col-lg-3">
                  <div className="cs-card">
                    {/* Click cả ảnh cũng vào chi tiết */}
                    <Link to={detailUrl} className="cs-thumbLink" aria-label={`Xem ${c.name}`}>
                      <div className="cs-thumb">
                        <img src={c.cover} alt={c.name} loading="lazy" />

                        {/* badges top-left */}
                        <div className="cs-badges cs-badges-left">
                          {(c.tags || []).slice(0, 2).map((t) => (
                            <span key={t} className="cs-badge cs-badge-soft">{t}</span>
                          ))}
                        </div>

                        {/* badges top-right */}
                        <div className="cs-badges cs-badges-right">
                          {c.latest ? <span className="cs-badge cs-badge-dark">Chap {c.latest}</span> : null}
                          {c.is_paid ? (
                            <span className="cs-badge cs-badge-pay">
                              Trả phí{c.price ? ` • ${fmtVND(c.price)}` : ""}
                            </span>
                          ) : (
                            <span className="cs-badge cs-badge-free">Miễn phí</span>
                          )}
                        </div>

                        {/* overlay bottom */}
                        <div className="cs-overlay">
                          <div className="cs-overlayTitle" title={c.name}>{c.name}</div>
                          <div className="cs-overlayMeta">
                            <i className="bi bi-clock me-1" />
                            Cập nhật: <span>{c.updated}</span>
                          </div>

                          <div className="cs-overlayActions">
                            <span className="cs-btnGhost">
                              <i className="bi bi-eye me-1" />
                              Xem chi tiết
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>

                    {/* body */}
                    <div className="cs-body">
                      <div className="cs-name" title={c.name}>{c.name}</div>
                      <div className="cs-update">
                        <i className="bi bi-clock me-1" />
                        Cập nhật <span>{c.updated}</span>
                      </div>

                     
                    </div>
                  </div>
                </div>
              );
            })}

            {!loading && current.length === 0 ? (
              <div className="col-12 text-secondary py-4">Không có dữ liệu.</div>
            ) : null}
          </div>
        )}

        <div className="cs-dots mt-3">
          {pages.map((_, idx) => (
            <button
              key={idx}
              className={`cs-dot ${idx === page ? "active" : ""}`}
              onClick={() => setPage(idx)}
              aria-label={`Page ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}