import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./comicDetail.css";
import Header from "../../components/Header";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE = "http://localhost:5000";
const CHAPTERS_PER_PAGE = 10;

function buildSelfCover(cover) {
  if (!cover) return "https://via.placeholder.com/500x700?text=No+Cover";
  if (cover.startsWith("http")) return cover;
  if (cover.startsWith("data:image")) return cover;
  if (cover.startsWith("/")) return `${API_BASE}${cover}`;
  return cover;
}

function stripHtml(html) {
  return (html || "").replace(/<[^>]+>/g, "").trim();
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

  if (!res.ok) {
    const msg = json?.message || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.raw = text;
    throw err;
  }

  return json;
}

function fmtVND(n) {
  return new Intl.NumberFormat("vi-VN").format(Number(n || 0)) + " ₫";
}

function fmtDateTime(v) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString("vi-VN");
  } catch {
    return "—";
  }
}

export default function ComicSelfDetail() {
  const { id } = useParams();
  const nav = useNavigate();

  const token = localStorage.getItem("token") || "";
  const me = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);
  const myId = Number(me?.id || 0) || null;

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [detail, setDetail] = useState(null);
  const [chapters, setChapters] = useState([]);

  const [ratingAvg, setRatingAvg] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [myRating, setMyRating] = useState(0);

  const [following, setFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  const [hasAccess, setHasAccess] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setErr("");

        const comicId = Number(id || 0);
        if (!comicId) {
          throw new Error("ID truyện không hợp lệ.");
        }

        // 1) detail self comic
        const d1 = await fetchJSON(`${API_BASE}/api/self-comics/${comicId}`, {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        });

        const comic = d1?.data || null;
        setDetail(comic);

        // 2) chapters
        const d2 = await fetchJSON(`${API_BASE}/api/self-chapters/comic/${comicId}`);
        const rows = Array.isArray(d2?.data) ? d2.data : [];
        setChapters(rows);

        // 3) rating
        try {
          const d3 = await fetchJSON(`${API_BASE}/api/ratings/self/${comicId}`, {
            headers: token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {},
          });

          setRatingAvg(Number(d3?.data?.summary?.avg || 0));
          setRatingCount(Number(d3?.data?.summary?.count || 0));
          setMyRating(Number(d3?.data?.mine || 0));
        } catch (ratingErr) {
          console.error("Load rating error:", ratingErr);
          setRatingAvg(0);
          setRatingCount(0);
          setMyRating(0);
        }

        // 4) follow status
        try {
          const ownerUserId = Number(comic?.user_id || 0);

          if (token && ownerUserId) {
            const jf = await fetchJSON(`${API_BASE}/api/follows/${ownerUserId}/status`, {
              headers: { Authorization: `Bearer ${token}` },
            });

            setFollowing(!!jf?.data?.following);
            setFollowersCount(Number(jf?.data?.followers || 0));
          } else {
            setFollowing(false);
            setFollowersCount(0);
          }
        } catch (followErr) {
          console.error("Load follow error:", followErr);
          setFollowing(false);
          setFollowersCount(0);
        }

        // 5) access buy
        const paid = !!comic?.is_paid;
        const ownerId = Number(comic?.user_id || 0);

        if (!paid) {
          setHasAccess(true);
        } else if (ownerId && myId && Number(ownerId) === Number(myId)) {
          setHasAccess(true);
        } else if (!token) {
          setHasAccess(false);
        } else {
          try {
            const j3 = await fetchJSON(`${API_BASE}/api/purchases/access-self/${comicId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            setHasAccess(!!j3?.hasAccess);
          } catch (accessErr) {
            console.error("Load self access error:", accessErr);
            setHasAccess(false);
          }
        }
      } catch (e) {
        console.error(e);
        setErr(e.message || "Lỗi tải truyện");
        setDetail(null);
        setChapters([]);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [id, token, myId]);

  const sortedChapters = useMemo(() => {
    return [...chapters].sort(
      (a, b) => Number(a.chapter_no || 0) - Number(b.chapter_no || 0)
    );
  }, [chapters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [id, sortedChapters.length]);

  const totalPages = Math.ceil(sortedChapters.length / CHAPTERS_PER_PAGE) || 1;

  const paginatedChapters = useMemo(() => {
    const start = (currentPage - 1) * CHAPTERS_PER_PAGE;
    const end = start + CHAPTERS_PER_PAGE;
    return sortedChapters.slice(start, end);
  }, [sortedChapters, currentPage]);

  const pageNumbers = useMemo(() => {
    const arr = [];
    for (let i = 1; i <= totalPages; i += 1) {
      arr.push(i);
    }
    return arr;
  }, [totalPages]);

  const isPaid = !!detail?.is_paid;
  const statusLabel = Number(detail?.status) === 1 ? "Hiển thị" : "Ẩn";
  const statusTone = Number(detail?.status) === 1 ? "ok" : "done";
  const ownerUserId = Number(detail?.user_id || 0) || null;
  const isOwner = !!(ownerUserId && myId && ownerUserId === myId);

  const locked = isPaid && !hasAccess;
  const isBought = isPaid && hasAccess && !isOwner;

  const goRead = (chapterId) => {
    if (locked) return;
    nav(`/doc-self?comicId=${encodeURIComponent(id)}&chapterId=${encodeURIComponent(chapterId)}`);
  };

  const handleBuy = async () => {
    if (!token) {
      toast.info("Bạn cần đăng nhập để mua truyện");
      return;
    }

    if (!id) {
      toast.warning("ID truyện không hợp lệ");
      return;
    }

    try {
      const data = await fetchJSON(`${API_BASE}/api/purchases/buy-self/${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setHasAccess(true);
      toast.success(`Mua thành công! Số dư còn lại: ${data?.data?.balance || 0}`);
    } catch (e) {
      toast.error(e.message || "Lỗi mua truyện");
    }
  };

  const toggleFollow = async () => {
    if (!token) return toast.info("Bạn cần đăng nhập để theo dõi.");
    if (!ownerUserId) return toast.warning("Truyện chưa có người đăng.");
    if (ownerUserId === myId) return toast.info("Bạn không thể theo dõi chính mình.");

    try {
      const data = await fetchJSON(`${API_BASE}/api/follows/${ownerUserId}/toggle`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const next = !!data?.data?.following;
      setFollowing(next);
      setFollowersCount(Number(data?.data?.followers || 0));
      toast.success(next ? "Đã theo dõi người đăng" : "Đã bỏ theo dõi");
    } catch (e) {
      toast.error(e.message || "Lỗi follow");
    }
  };

  const setRating = async (star) => {
    if (!token) {
      toast.info("Bạn cần đăng nhập để đánh giá.");
      return;
    }

    try {
      const data = await fetchJSON(`${API_BASE}/api/ratings/self/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating: star }),
      });

      setMyRating(star);
      setRatingAvg(Number(data?.data?.summary?.avg || 0));
      setRatingCount(Number(data?.data?.summary?.count || 0));
      toast.success(`Bạn đã chấm ${star} sao`);
    } catch (e) {
      toast.error(e.message || "Lỗi đánh giá");
    }
  };

  const renderStars = (value, clickable = false) => {
    const v = Number(value || 0);

    return (
      <div className="cd-stars">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            className={`cd-starBtn ${v >= s ? "on" : ""} ${clickable ? "clickable" : ""}`}
            onClick={clickable ? () => setRating(s) : undefined}
            title={clickable ? `Chấm ${s} sao` : ""}
          >
            <i className={`bi ${v >= s ? "bi-star-fill" : "bi-star"}`} />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div className="cd-wrap cd-loading">Đang tải truyện...</div>
      </div>
    );
  }

  if (err) {
    return (
      <div>
        <Header />
        <ToastContainer position="top-right" autoClose={2000} />
        <div className="cd-wrap">
          <div className="alert alert-danger">{err}</div>
        </div>
      </div>
    );
  }

  if (!detail) return null;

  return (
    <div>
      <Header />
      <ToastContainer position="top-right" autoClose={2000} />

      <div className="cd-wrap">
        <div className="cd-hero">
          <div
            className="cd-hero-bg"
            style={{ backgroundImage: `url(${buildSelfCover(detail.cover_image)})` }}
          />

          <div className="cd-hero-content">
            <div className="cd-cover">
              <img src={buildSelfCover(detail.cover_image)} alt={detail.title} />
              <div className="cd-badges">
                <span className={`cd-badge ${statusTone}`}>{statusLabel}</span>

                {isPaid ? (
                  <span className="cd-badge pay">Trả phí • {fmtVND(detail.price)}</span>
                ) : (
                  <span className="cd-badge free">Miễn phí</span>
                )}
              </div>
            </div>

            <div className="cd-info">
              <h1 className="cd-title">{detail.title || "Không tên"}</h1>

              <div className="cd-sub">
                Truyện tự đăng
                {detail?.id ? ` • ID #${detail.id}` : ""}
              </div>

              <div className="cd-meta">
                <div>
                  <i className="bi bi-person me-2" />
                  {detail.author || "Chưa có tác giả"}
                </div>
                 <div>
                  <i className="bi bi-translate me-2" />
                  {detail?.translated_by || "—"}
                </div>
                <div>
                  <i className="bi bi-tags me-2" />
                  {detail.category_name || "Chưa có danh mục"}
                </div>

                <div>
                  <i className="bi bi-journal-bookmark me-2" />
                  {detail.total_chapters || 0} chương
                </div>
              </div>

              <div className="cd-socialRow">
                <div className="cd-owner">
                  <div className="cd-ownerTop">
                    <i className="bi bi-person-circle me-2" />
                    <span className="fw-bold text-dark">Người đăng:</span>
                    <span className="ms-2 text-dark">{detail.username || "Chưa có"}</span>

                    <span className="ms-3 text-secondary">
                      <i className="bi bi-people me-1" />
                      {followersCount} theo dõi
                    </span>
                  </div>

                  <div className="d-flex align-items-center gap-2 mt-1">
                    <button
                      className={`btn btn-sm ${following ? "btn-outline-success" : "btn-success"}`}
                      onClick={toggleFollow}
                      disabled={!ownerUserId || isOwner}
                      title={!token ? "Đăng nhập để theo dõi" : ""}
                    >
                      <i className={`bi ${following ? "bi-check2" : "bi-plus-lg"} me-2`} />
                      {following ? "Đang theo dõi" : "Follow"}
                    </button>

                    <div className="text-secondary small">
                      <i className="bi bi-clock-history me-1" />
                      Cập nhật: {fmtDateTime(detail.updated_at || detail.created_at)}
                    </div>
                  </div>
                </div>

                <div className="cd-rating">
                  <div className="cd-ratingTop">
                    <div className="cd-ratingText">
                      <i className="bi bi-star-fill me-2 text-warning" />
                      <b>{Number(ratingAvg).toFixed(1)}</b>
                      <span className="ms-2 text-secondary">({ratingCount} đánh giá)</span>
                    </div>

                    <div className="cd-myRating">
                      <span className="text-secondary me-2">Bạn:</span>
                      {renderStars(myRating, true)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="cd-actions">
                {!locked && sortedChapters.length > 0 ? (
                  <button
                    className="btn btn-dark cd-btn"
                    type="button"
                    onClick={() => goRead(sortedChapters[0].id)}
                  >
                    <i className="bi bi-book me-2" />
                    {isOwner ? "Đọc truyện của bạn" : isBought ? "Đã mua" : "Đọc từ đầu"}
                  </button>
                ) : locked ? (
                  <button className="btn btn-danger cd-btn" type="button" onClick={handleBuy}>
                    <i className="bi bi-lock-fill me-2" />
                    Mua truyện {fmtVND(detail.price)}
                  </button>
                ) : (
                  <button className="btn btn-secondary cd-btn" type="button" disabled>
                    <i className="bi bi-slash-circle me-2" />
                    Chưa có chương
                  </button>
                )}

                {locked ? (
                  <div className="cd-hint">
                    Truyện này đang khóa. Bạn cần mua để đọc chapter.
                  </div>
                ) : isPaid ? (
                  <div className="cd-hint">
                    Truyện này đang đánh dấu trả phí: {fmtVND(detail.price)}.
                  </div>
                ) : (
                  <div className="cd-hint">Truyện này đang miễn phí.</div>
                )}
              </div>

              <div className="cd-desc">{stripHtml(detail.description)}</div>
            </div>
          </div>
        </div>

        <div className="cd-section">
          <div className="cd-section-head">
            <h3>Danh sách chapter</h3>
            <div className="cd-count">
              {sortedChapters.length} chap • Trang {currentPage}/{totalPages}
            </div>
          </div>

          {locked ? (
            <div className="cd-lockbox">
              <div className="cd-lockicon">
                <i className="bi bi-lock" />
              </div>
              <div className="cd-locktext">
                <div className="fw-bold">Nội dung bị khóa</div>
                <div className="text-secondary">
                  Mua truyện để mở khóa danh sách chapter và nội dung đọc.
                </div>
              </div>
              <button className="btn btn-danger" onClick={handleBuy}>
                Mua truyện • {fmtVND(detail.price)}
              </button>
            </div>
          ) : null}

          <div className={`cd-chapters ${locked ? "locked" : ""}`}>
            {sortedChapters.length === 0 ? (
              <div className="alert alert-light border">Chưa có chapter nào.</div>
            ) : (
              paginatedChapters.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  className="cd-chap"
                  onClick={() => goRead(ch.id)}
                  disabled={locked}
                  title={
                    locked
                      ? "Truyện trả phí — cần mua để đọc"
                      : `Đọc ${ch.chapter_title || `Chương ${ch.chapter_no}`}`
                  }
                >
                  <div className="cd-chap-left">
                    <div className="cd-chap-no">Chap {ch.chapter_no}</div>
                    {ch.chapter_title ? (
                      <div className="cd-chap-title">{ch.chapter_title}</div>
                    ) : null}
                  </div>

                  <div className="cd-chap-right">
                    <i className="bi bi-chevron-right" />
                  </div>
                </button>
              ))
            )}
          </div>

          {!locked && sortedChapters.length > CHAPTERS_PER_PAGE && (
            <div className="cd-pagination">
              <button
                type="button"
                className="cd-page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              >
                ‹ Trước
              </button>

              <div className="cd-page-numbers">
                {pageNumbers.map((page) => (
                  <button
                    key={page}
                    type="button"
                    className={`cd-page-btn ${currentPage === page ? "active" : ""}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="cd-page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              >
                Sau ›
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}