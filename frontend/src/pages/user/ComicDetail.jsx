import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "./comicDetail.css";
import Header from "../../components/Header";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE = "http://localhost:5000";
const IMG_BASE = "https://img.otruyenapi.com/uploads/comics/";

function buildThumb(thumb) {
  if (!thumb) return "https://via.placeholder.com/500x700?text=No+Image";
  if (thumb.startsWith("http")) return thumb;
  return IMG_BASE + thumb;
}

function stripHtml(html) {
  return (html || "").replace(/<[^>]+>/g, "").trim();
}

// ✅ helper fetch an toàn: không bị crash khi server trả HTML/404
async function fetchJSON(url, options) {
  const res = await fetch(url, options);
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // server trả html
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

export default function ComicDetail() {
  const { slug } = useParams();
  const nav = useNavigate();

  const token = localStorage.getItem("token") || "";
  const me = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);
  const myId = me?.id || null;

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [detail, setDetail] = useState(null);
  const [pricing, setPricing] = useState({ is_paid: false, price: 0 });
  const [hasAccess, setHasAccess] = useState(false);

  // ✅ owner + follow
  const [owner, setOwner] = useState({ owner_user_id: null, username: null });
  const [following, setFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  // ✅ rating
  const [ratingAvg, setRatingAvg] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [myRating, setMyRating] = useState(0);

  useEffect(() => {
    const run = async () => {
      try {
        setErr("");
        setLoading(true);

        // 1) otru detail
        const r1 = await fetchJSON(`https://otruyenapi.com/v1/api/truyen-tranh/${slug}`);
        setDetail(r1?.data || null);

        // 2) pricing
        const j2 = await fetchJSON(`${API_BASE}/api/external-comics/${slug}/pricing`);
        const pr = j2?.data || { is_paid: false, price: 0 };
        setPricing({ is_paid: !!pr.is_paid, price: Number(pr.price || 0) });

        // 3) owner (từ DB)
        const jo = await fetchJSON(`${API_BASE}/api/external-comics/${slug}/owner`);
        const ownerData = jo?.data || { owner_user_id: null, username: null };
        setOwner(ownerData);

        // 4) rating summary
        const js = await fetchJSON(`${API_BASE}/api/ratings/comic/${slug}`);
        setRatingAvg(Number(js?.data?.summary?.avg || 0));
        setRatingCount(Number(js?.data?.summary?.count || 0));

        // 5) follow status + my rating (nếu login)
        if (token && ownerData?.owner_user_id) {
          // ✅ FIX: đúng URL theo backend router.get("/:userId/status")
          const jf = await fetchJSON(`${API_BASE}/api/follows/${ownerData.owner_user_id}/status`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          setFollowing(!!jf?.data?.following);
          setFollowersCount(Number(jf?.data?.followers || 0));

          const jm = await fetchJSON(`${API_BASE}/api/ratings/comic/${slug}/mine`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setMyRating(Number(jm?.data?.rating || 0));
        } else {
          setFollowing(false);
          setFollowersCount(0);
          setMyRating(0);
        }

        // 6) access (buy)
        const paid = !!pr.is_paid;
        if (!paid) {
          setHasAccess(true);
        } else {
          if (!token) {
            setHasAccess(false);
          } else {
            const j3 = await fetchJSON(`${API_BASE}/api/purchases/access/${slug}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            setHasAccess(!!j3?.hasAccess);
          }
        }
      } catch (e) {
        console.error(e);
        setErr(e.message || "Lỗi");
        setDetail(null);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [slug, token]);

  const item = detail?.item;

  const chapters = useMemo(() => {
    const list = (item?.chapters || []).flatMap((sv) =>
      (sv?.server_data || []).map((ch) => ({
        server: sv.server_name,
        name: ch.chapter_name,
        title: ch.chapter_title,
        api: ch.chapter_api_data,
      }))
    );
    return list.sort((a, b) => Number(a.name) - Number(b.name));
  }, [item]);

  const isPaid = !!pricing.is_paid;
  const locked = isPaid && !hasAccess;
  const isFree = !isPaid;
  const isBought = isPaid && hasAccess;

  const fmtVND = (n) => new Intl.NumberFormat("vi-VN").format(Number(n || 0)) + " ₫";

  const handleBuy = async () => {
    if (!token) {
      toast.info("Bạn cần đăng nhập để mua truyện");
      return;
    }

    try {
      const data = await fetchJSON(`${API_BASE}/api/purchases/buy/${slug}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      setHasAccess(true);
      toast.success(`Mua thành công! Số dư còn lại: ${data?.data?.balance || 0}`);
    } catch (e) {
      toast.error(e.message || "Lỗi mua");
    }
  };

  const goRead = (chapterApi) => {
    if (locked) return;
    nav(`/doc?slug=${encodeURIComponent(slug)}&chap=${encodeURIComponent(chapterApi)}`);
  };

  // ✅ Follow/Unfollow
  const toggleFollow = async () => {
    if (!token) return toast.info("Bạn cần đăng nhập để theo dõi.");
    if (!owner?.owner_user_id) return toast.warning("Truyện chưa có người đăng.");
    if (owner?.owner_user_id === myId) return toast.info("Bạn không thể theo dõi chính mình.");

    try {
      const data = await fetchJSON(`${API_BASE}/api/follows/${owner.owner_user_id}/toggle`, {
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

  // ✅ Rating
  const setRating = async (star) => {
    if (!token) return toast.info("Bạn cần đăng nhập để đánh giá.");

    try {
      const data = await fetchJSON(`${API_BASE}/api/ratings/comic/${slug}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating: star }),
      });

      setMyRating(star);
      setRatingAvg(Number(data?.data?.summary?.avg || ratingAvg));
      setRatingCount(Number(data?.data?.summary?.count || ratingCount));
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

  if (loading) return <div className="cd-wrap cd-loading">Đang tải truyện...</div>;
  if (err) return <div className="cd-wrap"><div className="alert alert-danger">{err}</div></div>;
  if (!item) return null;

  return (
    <div>
      <Header />
      <ToastContainer position="top-right" autoClose={2000} />

      <div className="cd-wrap">
        <div className="cd-hero">
          <div className="cd-hero-bg" style={{ backgroundImage: `url(${buildThumb(item.thumb_url)})` }} />

          <div className="cd-hero-content">
            <div className="cd-cover">
              <img src={buildThumb(item.thumb_url)} alt={item.name} />
              <div className="cd-badges">
                <span className={`cd-badge ${item.status === "ongoing" ? "ok" : "done"}`}>
                  {item.status === "ongoing" ? "Đang ra" : "Hoàn thành"}
                </span>
                {isPaid ? (
                  <span className="cd-badge pay">Trả phí • {fmtVND(pricing.price)}</span>
                ) : (
                  <span className="cd-badge free">Miễn phí</span>
                )}
              </div>
            </div>

            <div className="cd-info">
              <h1 className="cd-title">{item.name}</h1>
              <div className="cd-sub">{(item.origin_name || []).join(" • ")}</div>

              <div className="cd-meta">
                <div><i className="bi bi-person me-2" />{(item.author || []).join(", ") || "—"}</div>
                <div><i className="bi bi-tags me-2" />{(item.category || []).map(x => x.name).join(", ") || "—"}</div>
              </div>

           
              <div className="cd-socialRow">
                <div className="cd-owner">
                  <div className="cd-ownerTop">
                    <i className="bi bi-person-circle me-2" />
                    <span className="fw-bold text-dark">Người đăng:</span>
                    <span className="ms-2 text-dark">{owner?.username || "Chưa có"}</span>
                    <span className="ms-3 text-secondary">
                      <i className="bi bi-people me-1" />
                      {followersCount} theo dõi
                    </span>
                  </div>

                  <button
                    className={`btn btn-sm ${following ? "btn-outline-success" : "btn-success"}`}
                    onClick={toggleFollow}
                    disabled={!owner?.owner_user_id || owner?.owner_user_id === myId}
                    title={!token ? "Đăng nhập để theo dõi" : ""}
                  >
                    <i className={`bi ${following ? "bi-check2" : "bi-plus-lg"} me-2`} />
                    {following ? "Đang theo dõi" : "Follow"}
                  </button>
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

              {/* Actions cũ */}
              <div className="cd-actions">
                {isFree && (
                  <Link
                    className="btn btn-success cd-btn"
                    to={`/doc?slug=${encodeURIComponent(slug)}&chap=${encodeURIComponent(chapters?.[0]?.api || "")}`}
                  >
                    <i className="bi bi-unlock-fill me-2" />
                    Miễn phí
                  </Link>
                )}

                {locked && (
                  <>
                    <button className="btn btn-danger cd-btn" onClick={handleBuy}>
                      <i className="bi bi-lock-fill me-2" />
                      Mua truyện {fmtVND(pricing.price)}
                    </button>
                    <div className="cd-hint">Truyện này đang khóa. Bạn cần mua để xem chapter.</div>
                  </>
                )}

                {isBought && (
                  <Link
                    className="btn btn-dark cd-btn"
                    to={`/doc?slug=${encodeURIComponent(slug)}&chap=${encodeURIComponent(chapters?.[0]?.api || "")}`}
                  >
                    <i className="bi bi-book me-2" />
                    Đã mua
                  </Link>
                )}
              </div>

              <div className="cd-desc">{stripHtml(item.content)}</div>
            </div>
          </div>
        </div>

        {/* Chapters */}
        <div className="cd-section">
          <div className="cd-section-head">
            <h3>Danh sách chapter</h3>
            <div className="cd-count">{chapters.length} chap</div>
          </div>

          {locked ? (
            <div className="cd-lockbox">
              <div className="cd-lockicon"><i className="bi bi-lock" /></div>
              <div className="cd-locktext">
                <div className="fw-bold">Nội dung bị khóa</div>
                <div className="text-secondary">Mua truyện để mở khóa danh sách chapter và đọc ảnh.</div>
              </div>
              <button className="btn btn-danger" onClick={handleBuy}>
                Mua truyện • {fmtVND(pricing.price)}
              </button>
            </div>
          ) : null}

          <div className={`cd-chapters ${locked ? "locked" : ""}`}>
            {chapters.map((ch) => (
              <button
                key={ch.api}
                type="button"
                className="cd-chap"
                onClick={() => goRead(ch.api)}
                disabled={locked}
                title={locked ? "Truyện trả phí — cần mua để đọc" : `Đọc chap ${ch.name}`}
              >
                <div className="cd-chap-left">
                  <div className="cd-chap-no">Chap {ch.name}</div>
                  {ch.title ? <div className="cd-chap-title">{ch.title}</div> : null}
                </div>
                <div className="cd-chap-right">
                  <i className="bi bi-chevron-right" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}