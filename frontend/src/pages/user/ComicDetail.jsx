import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "./comicDetail.css";
import Header from "../../components/Header";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE = "http://localhost:5000";
const IMG_BASE = "https://img.otruyenapi.com/uploads/comics/";
const CHAPTERS_PER_PAGE = 10;

function buildThumb(thumb) {
  if (!thumb) return "https://via.placeholder.com/500x700?text=No+Image";
  if (thumb.startsWith("http")) return thumb;
  return IMG_BASE + thumb;
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
  const myId = Number(me?.id || 0) || null;

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [detail, setDetail] = useState(null);
  const [pricing, setPricing] = useState({ is_paid: false, price: 0 });
  const [hasAccess, setHasAccess] = useState(false);

  const [comicDbId, setComicDbId] = useState(null);

  const [owner, setOwner] = useState({
    owner_user_id: null,
    username: null,
    comic_id: null,
    translator: null,
  });

  const [following, setFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  const [ratingAvg, setRatingAvg] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [myRating, setMyRating] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const run = async () => {
      try {
        setErr("");
        setLoading(true);

        // 1) OTruyen detail
        const r1 = await fetchJSON(`https://otruyenapi.com/v1/api/truyen-tranh/${slug}`);
        setDetail(r1?.data || null);

        // 2) pricing from DB
        const j2 = await fetchJSON(`${API_BASE}/api/external-comics/${slug}/pricing`);
        const pr = j2?.data || {
          id: null,
          comic_id: null,
          is_paid: false,
          price: 0,
        };

        setPricing({
          is_paid: !!pr.is_paid,
          price: Number(pr.price || 0),
        });

        // 3) owner
        const jo = await fetchJSON(`${API_BASE}/api/external-comics/${slug}/owner`);
        const ownerData = jo?.data || {
          owner_user_id: null,
          username: null,
          comic_id: null,
          translator: null,
        };
        setOwner(ownerData);

        // 4) get comic id from DB more reliably
        const finalComicId =
          Number(pr?.id || pr?.comic_id || ownerData?.comic_id || 0) || null;

        setComicDbId(finalComicId);

        console.log("pricing data:", pr);
        console.log("owner data:", ownerData);
        console.log("finalComicId:", finalComicId);

        // 5) rating summary
        if (finalComicId) {
          try {
            const js = await fetchJSON(`${API_BASE}/api/ratings/external/${finalComicId}`, {
              headers: token
                ? {
                    Authorization: `Bearer ${token}`,
                  }
                : {},
            });

            setRatingAvg(Number(js?.data?.summary?.avg || 0));
            setRatingCount(Number(js?.data?.summary?.count || 0));
            setMyRating(Number(js?.data?.mine || 0));
          } catch (ratingErr) {
            console.error("Load rating error:", ratingErr);
            setRatingAvg(0);
            setRatingCount(0);
            setMyRating(0);
          }
        } else {
          setRatingAvg(0);
          setRatingCount(0);
          setMyRating(0);
        }

        // 6) follow status
        if (token && ownerData?.owner_user_id) {
          try {
            const jf = await fetchJSON(
              `${API_BASE}/api/follows/${ownerData.owner_user_id}/status`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            setFollowing(!!jf?.data?.following);
            setFollowersCount(Number(jf?.data?.followers || 0));
          } catch (followErr) {
            console.error("Load follow error:", followErr);
            setFollowing(false);
            setFollowersCount(0);
          }
        } else {
          setFollowing(false);
          setFollowersCount(0);
        }

        // 7) access buy
        const paid = !!pr.is_paid;
        if (!paid) {
          setHasAccess(true);
        } else if (!token) {
          setHasAccess(false);
        } else {
          try {
            const j3 = await fetchJSON(`${API_BASE}/api/purchases/access/${slug}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            setHasAccess(!!j3?.hasAccess);
          } catch (accessErr) {
            console.error("Load access error:", accessErr);
            setHasAccess(false);
          }
        }
      } catch (e) {
        console.error(e);
        setErr(e.message || "Error");
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

  useEffect(() => {
    setCurrentPage(1);
  }, [slug, chapters.length]);

  const totalPages = Math.ceil(chapters.length / CHAPTERS_PER_PAGE) || 1;

  const paginatedChapters = useMemo(() => {
    const start = (currentPage - 1) * CHAPTERS_PER_PAGE;
    const end = start + CHAPTERS_PER_PAGE;
    return chapters.slice(start, end);
  }, [chapters, currentPage]);

  const pageNumbers = useMemo(() => {
    const pages = [];
    for (let i = 1; i <= totalPages; i += 1) {
      pages.push(i);
    }
    return pages;
  }, [totalPages]);

  const isPaid = !!pricing.is_paid;
  const locked = isPaid && !hasAccess;
  const isFree = !isPaid;
  const isBought = isPaid && hasAccess;

  const fmtVND = (n) =>
    new Intl.NumberFormat("vi-VN").format(Number(n || 0)) + " ₫";

  const firstChapterLink = `/doc?slug=${encodeURIComponent(
    slug
  )}&chap=${encodeURIComponent(chapters?.[0]?.api || "")}&comicId=${encodeURIComponent(
    comicDbId || ""
  )}`;

  const handleBuy = async () => {
    if (!token) {
      toast.info("You need to log in to purchase this comic");
      return;
    }

    try {
      const data = await fetchJSON(`${API_BASE}/api/purchases/buy/${slug}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      setHasAccess(true);
      toast.success(`Purchase successful! Remaining balance: ${data?.data?.balance || 0}`);
    } catch (e) {
      toast.error(e.message || "Purchase failed");
    }
  };

  const goRead = (chapterApi) => {
    if (locked) return;

    nav(
      `/doc?slug=${encodeURIComponent(slug)}&chap=${encodeURIComponent(
        chapterApi
      )}&comicId=${encodeURIComponent(comicDbId || "")}`
    );
  };

  const toggleFollow = async () => {
    if (!token) return toast.info("You need to log in to follow.");
    if (!owner?.owner_user_id) return toast.warning("This comic has no uploader yet.");
    if (Number(owner?.owner_user_id) === Number(myId)) {
      return toast.info("You cannot follow yourself.");
    }

    try {
      const data = await fetchJSON(`${API_BASE}/api/follows/${owner.owner_user_id}/toggle`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const next = !!data?.data?.following;
      setFollowing(next);
      setFollowersCount(Number(data?.data?.followers || 0));
      toast.success(next ? "Now following the uploader" : "Unfollowed");
    } catch (e) {
      toast.error(e.message || "Follow action failed");
    }
  };

  const setRating = async (star) => {
    if (!token) {
      toast.info("You need to log in to rate.");
      return;
    }

    if (!comicDbId) {
      console.log("comicDbId submit =", comicDbId);
      toast.warning("Comic ID not found in database for rating.");
      return;
    }

    try {
      const data = await fetchJSON(`${API_BASE}/api/ratings/external/${comicDbId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating: star }),
      });

      console.log("rating response:", data);

      setMyRating(star);
      setRatingAvg(Number(data?.data?.summary?.avg || 0));
      setRatingCount(Number(data?.data?.summary?.count || 0));
      toast.success(`You rated ${star} star(s)`);
    } catch (e) {
      console.error("set rating error:", e);
      toast.error(e.message || "Rating failed");
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
            title={clickable ? `Rate ${s} star(s)` : ""}
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
        <div className="cd-wrap cd-loading">Loading comic...</div>
      </div>
    );
  }

  if (err) {
    return (
      <div>
        <Header />
        <div className="cd-wrap">
          <div className="alert alert-danger">{err}</div>
        </div>
      </div>
    );
  }

  if (!item) return null;

  return (
    <div>
      <Header />
      <ToastContainer position="top-right" autoClose={2000} />

      <div className="cd-wrap">
        <div className="cd-hero">
          <div
            className="cd-hero-bg"
            style={{ backgroundImage: `url(${buildThumb(item.thumb_url)})` }}
          />

          <div className="cd-hero-content">
            <div className="cd-cover">
              <img src={buildThumb(item.thumb_url)} alt={item.name} />
              <div className="cd-badges">
                <span className={`cd-badge ${item.status === "ongoing" ? "ok" : "done"}`}>
                  {item.status === "ongoing" ? "Ongoing" : "Completed"}
                </span>
                {isPaid ? (
                  <span className="cd-badge pay">Paid • {fmtVND(pricing.price)}</span>
                ) : (
                  <span className="cd-badge free">Free</span>
                )}
              </div>
            </div>

            <div className="cd-info">
              <h1 className="cd-title">{item.name}</h1>
              <div className="cd-sub">{(item.origin_name || []).join(" • ")}</div>

              <div className="cd-meta">
                <div>
                  <i className="bi bi-person me-2" />
                  {(item.author || []).join(", ") || "—"}
                </div>

                <div>
                  <i className="bi bi-translate me-2" />
                  {owner?.translator || "—"}
                </div>

                <div>
                  <i className="bi bi-tags me-2" />
                  {(item.category || []).map((x) => x.name).join(", ") || "—"}
                </div>
              </div>

              <div className="cd-socialRow">
                <div className="cd-owner">
                  <div className="cd-ownerTop">
                    <i className="bi bi-person-circle me-2" />
                    <span className="fw-bold text-dark">Uploader:</span>
                    <span className="ms-2 text-dark">{owner?.username || "None"}</span>
                    <span className="ms-3 text-secondary">
                      <i className="bi bi-people me-1" />
                      {followersCount} followers
                    </span>
                  </div>

                  <button
                    className={`btn btn-sm ${following ? "btn-outline-success" : "btn-success"}`}
                    onClick={toggleFollow}
                    disabled={
                      !owner?.owner_user_id ||
                      Number(owner?.owner_user_id) === Number(myId)
                    }
                    title={!token ? "Log in to follow" : ""}
                  >
                    <i className={`bi ${following ? "bi-check2" : "bi-plus-lg"} me-2`} />
                    {following ? "Following" : "Follow"}
                  </button>
                </div>

                <div className="cd-rating">
                  <div className="cd-ratingTop">
                    <div className="cd-ratingText">
                      <i className="bi bi-star-fill me-2 text-warning" />
                      <b>{Number(ratingAvg).toFixed(1)}</b>
                      <span className="ms-2 text-secondary">({ratingCount} ratings)</span>
                    </div>

                    <div className="cd-myRating">
                      <span className="text-secondary me-2">Your rating:</span>
                      {renderStars(myRating, true)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="cd-actions">
                {isFree && (
                  <Link className="btn btn-success cd-btn" to={firstChapterLink}>
                    <i className="bi bi-unlock-fill me-2" />
                    Free to Read
                  </Link>
                )}

                {locked && (
                  <>
                    <button className="btn btn-danger cd-btn" onClick={handleBuy}>
                      <i className="bi bi-lock-fill me-2" />
                      Buy Comic {fmtVND(pricing.price)}
                    </button>
                    <div className="cd-hint">
                      This comic is locked. Purchase to read chapters.
                    </div>
                  </>
                )}

                {isBought && (
                  <Link className="btn btn-dark cd-btn" to={firstChapterLink}>
                    <i className="bi bi-book me-2" />
                    Purchased
                  </Link>
                )}
              </div>

              <div className="cd-desc">{stripHtml(item.content)}</div>
            </div>
          </div>
        </div>

        <div className="cd-section">
          <div className="cd-section-head">
            <h3>Chapter List</h3>
            <div className="cd-count">
              {chapters.length} chapters • Page {currentPage}/{totalPages}
            </div>
          </div>

          {locked ? (
            <div className="cd-lockbox">
              <div className="cd-lockicon">
                <i className="bi bi-lock" />
              </div>
              <div className="cd-locktext">
                <div className="fw-bold">Content Locked</div>
                <div className="text-secondary">
                  Purchase this comic to unlock the chapter list and read images.
                </div>
              </div>
              <button className="btn btn-danger" onClick={handleBuy}>
                Buy Comic • {fmtVND(pricing.price)}
              </button>
            </div>
          ) : null}

          <div className={`cd-chapters ${locked ? "locked" : ""}`}>
            {paginatedChapters.map((ch) => (
              <button
                key={ch.api}
                type="button"
                className="cd-chap"
                onClick={() => goRead(ch.api)}
                disabled={locked}
                title={locked ? "Paid comic — purchase to read" : `Read chapter ${ch.name}`}
              >
                <div className="cd-chap-left">
                  <div className="cd-chap-no">Chapter {ch.name}</div>
                  {ch.title ? <div className="cd-chap-title">{ch.title}</div> : null}
                </div>
                <div className="cd-chap-right">
                  <i className="bi bi-chevron-right" />
                </div>
              </button>
            ))}
          </div>

          {!locked && chapters.length > CHAPTERS_PER_PAGE && (
            <div className="cd-pagination">
              <button
                type="button"
                className="cd-page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              >
                ‹ Previous
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
                Next ›
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}