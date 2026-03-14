import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "./comicListPage.css";
import Header from "../../components/Header";

const API_BASE = "http://localhost:5000";

function buildCover(src) {
  if (!src) return "https://via.placeholder.com/500x700?text=No+Image";
  if (src.startsWith("http")) return src;
  if (src.startsWith("data:image")) return src;
  if (src.startsWith("/")) return `${API_BASE}${src}`;
  return src;
}

function fmtUpdated(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("vi-VN");
  } catch {
    return "—";
  }
}

function fmtVND(n) {
  return new Intl.NumberFormat("vi-VN").format(Number(n || 0)) + " ₫";
}

function normalizeSelfComic(c) {
  return {
    id: c.id,
    name: c.title || "Không tên",
    cover: buildCover(c.cover_image),
    tags: c.category_name ? [c.category_name] : [],
    updated: fmtUpdated(c.updated_at || c.created_at),
    latest: c.total_chapters || null,
    is_paid: !!c.is_paid,
    price: Number(c.price || 0),
    category_id: c.category_id || null,
    category_name: c.category_name || "",
    author: c.author || "",
    status: Number(c.status || 0),
    description: c.description || "",
  };
}

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();

  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    //
  }

  if (!res.ok) {
    const msg = json?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return json;
}

function Pagination({ page, totalPages, onPage }) {
  const pages = useMemo(() => {
    const out = [];
    const delta = 2;
    const left = Math.max(1, page - delta);
    const right = Math.min(totalPages, page + delta);

    out.push(1);

    if (left > 2) out.push("...");

    for (let p = left; p <= right; p++) out.push(p);

    if (right < totalPages - 1) out.push("...");

    if (totalPages > 1) out.push(totalPages);

    return out.filter((v, i, a) => i === 0 || v !== a[i - 1]);
  }, [page, totalPages]);

  return (
    <div className="clp-pagi">
      <button className="clp-pagiBtn" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        <i className="bi bi-chevron-left" /> Trước
      </button>

      <div className="clp-pagiNums">
        {pages.map((p, idx) =>
          p === "..." ? (
            <span key={`d${idx}`} className="clp-dots">
              …
            </span>
          ) : (
            <button
              key={p}
              className={`clp-num ${p === page ? "active" : ""}`}
              onClick={() => onPage(p)}
              aria-label={`Page ${p}`}
            >
              {p}
            </button>
          )
        )}
      </div>

      <button className="clp-pagiBtn" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
        Sau <i className="bi bi-chevron-right" />
      </button>
    </div>
  );
}

export default function SelfComicListPage() {
  const [sp, setSp] = useSearchParams();

  const page = Math.max(1, Number(sp.get("page") || 1));
  const q = (sp.get("q") || "").trim();
  const categoryId = (sp.get("categoryId") || sp.get("other_category_id") || "").trim();

  const limit = 24;
  const token = localStorage.getItem("token") || "";

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(false);
  const [catErr, setCatErr] = useState("");

  const buildDetailUrl = (comic) => `/self-comics/${comic.id}`;

  const setParam = (key, val) => {
    const next = new URLSearchParams(sp);

    if (!val) next.delete(key);
    else next.set(key, val);

    if (key !== "page") next.set("page", "1");

    setSp(next);
  };

  const gotoPage = (p) => {
    const next = new URLSearchParams(sp);
    next.set("page", String(p));
    setSp(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const run = async () => {
      try {
        setCatLoading(true);
        setCatErr("");

        const data = await fetchJSON(`${API_BASE}/api/categories`);
        const rows = Array.isArray(data?.data) ? data.data : [];
        setCategories(rows);
      } catch (e) {
        setCatErr(e?.message || "Lỗi tải danh mục");
        setCategories([]);
      } finally {
        setCatLoading(false);
      }
    };

    run();
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setErr("");

        const url = new URL(`${API_BASE}/api/self-comics`);
        url.searchParams.set("page", String(page));
        url.searchParams.set("limit", String(limit));

        if (q) url.searchParams.set("q", q);
        if (categoryId) url.searchParams.set("categoryId", categoryId);

        const data = await fetchJSON(url.toString(), {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        });

        const rows = Array.isArray(data?.data) ? data.data : [];
        setItems(rows.map(normalizeSelfComic));

        setMeta({
          page: Number(data?.page || page),
          limit: Number(data?.limit || limit),
          total: Number(data?.total || rows.length),
          totalPages: Number(data?.totalPages || 1),
        });
      } catch (e) {
        setErr(e?.message || "Lỗi tải dữ liệu");
        setItems([]);
        setMeta({ page: 1, limit, total: 0, totalPages: 1 });
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [page, q, categoryId, token]);

  return (
    <div>
      <Header />

      <div className="clp-wrap">
        <div className="clp-hero mb-3">
          <div className="clp-heroLeft">
            <h1 className="clp-title">Truyện tự đăng</h1>
            <div className="clp-sub">
              <i className="bi bi-collection me-2" />
              Tổng: <b className="ms-1">{meta.total}</b>
              <span className="ms-2 text-secondary">
                • Trang {meta.page}/{meta.totalPages}
              </span>
            </div>
          </div>

          <div className="clp-filters">
            <div className="clp-search">
              <i className="bi bi-search" />
              <input
                value={q}
                onChange={(e) => setParam("q", e.target.value)}
                placeholder="Tìm truyện tự đăng..."
              />
              {q ? (
                <button className="clp-x" onClick={() => setParam("q", "")} aria-label="Clear">
                  <i className="bi bi-x-lg" />
                </button>
              ) : null}
            </div>

            <select
              value={categoryId}
              onChange={(e) => setParam("categoryId", e.target.value)}
              className="clp-select"
              disabled={catLoading}
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {catErr ? (
          <div className="clp-alert">
            <i className="bi bi-exclamation-triangle me-2" />
            Lỗi danh mục: {catErr}
          </div>
        ) : null}

        {err ? (
          <div className="clp-alert">
            <i className="bi bi-exclamation-triangle me-2" />
            {err}
          </div>
        ) : null}

        {!token ? (
          <div className="clp-alert">
            <i className="bi bi-exclamation-triangle me-2" />
            Bạn cần đăng nhập để xem truyện tự đăng.
          </div>
        ) : loading ? (
          <div className="clp-loading">
            <div className="spinner-border spinner-border-sm me-2" />
            Đang tải trang {page}...
          </div>
        ) : items.length === 0 ? (
          <div className="clp-empty">
            <i className="bi bi-inbox fs-1" />
            <div className="mt-2">Không có dữ liệu.</div>
          </div>
        ) : (
          <>
            <div className="row g-3">
              {items.map((c) => {
                const detailUrl = buildDetailUrl(c);

                return (
                  <div key={c.id} className="col-12 col-sm-6 col-lg-4">
                    <div className="clp-card">
                      <Link to={detailUrl} className="clp-thumbLink" aria-label={`Xem ${c.name}`}>
                        <div className="clp-thumb">
                          <img src={c.cover} alt={c.name} loading="lazy" />

                          <div className="clp-badgesLeft">
                            {(c.tags || []).slice(0, 2).map((t) => (
                              <span key={t} className="clp-badge soft">
                                {t}
                              </span>
                            ))}
                          </div>

                          <div className="clp-badgesRight">
                            {c.latest ? <span className="clp-badge dark">{c.latest} chap</span> : null}

                            {c.is_paid ? (
                              <span className="clp-badge pay">
                                Trả phí{c.price ? ` • ${fmtVND(c.price)}` : ""}
                              </span>
                            ) : (
                              <span className="clp-badge free">Miễn phí</span>
                            )}
                          </div>

                          <div className="clp-overlay">
                            <div className="clp-overlayTitle" title={c.name}>
                              {c.name}
                            </div>
                            <div className="clp-overlayMeta">
                              <i className="bi bi-clock me-1" /> Cập nhật: <span>{c.updated}</span>
                            </div>
                          </div>
                        </div>
                      </Link>

                      <div className="clp-body">
                        <Link to={detailUrl} className="text-decoration-none text-dark">
                          <div className="clp-name" title={c.name}>
                            {c.name}
                          </div>
                        </Link>

                        <div className="clp-meta">
                          <i className="bi bi-person me-1" />
                          {c.author || "Chưa có tác giả"}
                        </div>

                        <div className="clp-meta">
                          <i className="bi bi-bookmark me-1" />
                          {c.category_name || "Chưa có danh mục"}
                        </div>

                        <div className="clp-meta">
                          <i className="bi bi-clock me-1" /> {c.updated}
                        </div>

                        <div className="clp-meta">
                          <i className="bi bi-card-text me-1" />
                          {c.status === 1 ? "Đang phát hành" : "Ẩn / nháp"}
                        </div>

                        <div className="mt-3">
                          <Link to={detailUrl} className="btn btn-dark btn-sm w-100">
                            <i className="bi bi-eye me-2" />
                            Xem chi tiết
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <Pagination page={meta.page} totalPages={meta.totalPages} onPage={gotoPage} />
          </>
        )}
      </div>
    </div>
  );
}