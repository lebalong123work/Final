import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Header from "../../components/Header";
import "./readSelfChapter.css";
import { io } from "socket.io-client";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE = "http://localhost:5000";
const CHAPTER_TYPE = "self";

const DEFAULT_READER_SETTINGS = {
  fontFamily: "system",
  fontSize: 19,
  lineHeight: 1.9,
  contentWidth: 820,
  theme: "light",
};

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
    throw new Error(json?.message || `HTTP ${res.status}`);
  }

  return json;
}

function fmtTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("vi-VN");
}

function fmtVND(n) {
  return new Intl.NumberFormat("vi-VN").format(Number(n || 0)) + " ₫";
}

function getSavedReaderSettings() {
  try {
    const raw = localStorage.getItem("self_reader_settings");
    if (!raw) return DEFAULT_READER_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_READER_SETTINGS,
      ...parsed,
    };
  } catch {
    return DEFAULT_READER_SETTINGS;
  }
}

export default function ReadSelfChapter() {
  const [sp] = useSearchParams();
  const nav = useNavigate();

  const comicId = Number(sp.get("comicId") || 0);
  const chapterId = Number(sp.get("chapterId") || 0);

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

  const [comic, setComic] = useState(null);
  const [chapterData, setChapterData] = useState(null);
  const [chapters, setChapters] = useState([]);

  const [hasAccess, setHasAccess] = useState(false);

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [reactionReady, setReactionReady] = useState(false);
  const [reactionLoading, setReactionLoading] = useState(false);

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState(null);

  const [readerSettings, setReaderSettings] = useState(getSavedReaderSettings);

  const listRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("self_reader_settings", JSON.stringify(readerSettings));
  }, [readerSettings]);

  // load dữ liệu comic + access + chapter list + current chapter
  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setErr("");

        if (!comicId || !chapterId) {
          throw new Error("Thiếu comicId hoặc chapterId.");
        }

        const d1 = await fetchJSON(`${API_BASE}/api/self-comics/${comicId}`, {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        });

        const comicData = d1?.data || null;
        setComic(comicData);

        const paid = !!comicData?.is_paid;
        const ownerId = Number(comicData?.user_id || 0);
        const isOwnerNow = !!(ownerId && myId && ownerId === myId);

        if (!paid || isOwnerNow) {
          setHasAccess(true);
        } else if (!token) {
          setHasAccess(false);
        } else {
          try {
            const acc = await fetchJSON(`${API_BASE}/api/purchases/access-self/${comicId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            setHasAccess(!!acc?.hasAccess);
          } catch (e) {
            console.error("access self error:", e);
            setHasAccess(false);
          }
        }

        const d2 = await fetchJSON(`${API_BASE}/api/self-chapters/comic/${comicId}`);
        const chapterRows = Array.isArray(d2?.data) ? d2.data : [];
        setChapters(chapterRows);

        const d3 = await fetchJSON(`${API_BASE}/api/self-chapters/${chapterId}`);
        setChapterData(d3?.data || null);
      } catch (e) {
        console.error(e);
        setErr(e.message || "Lỗi tải chapter");
        setComic(null);
        setChapterData(null);
        setChapters([]);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [comicId, chapterId, token, myId]);

  const sortedChapters = useMemo(() => {
    return [...chapters].sort(
      (a, b) => Number(a.chapter_no || 0) - Number(b.chapter_no || 0)
    );
  }, [chapters]);

  const currentIndex = useMemo(() => {
    if (!sortedChapters.length || !chapterId) return -1;
    return sortedChapters.findIndex((c) => Number(c.id) === Number(chapterId));
  }, [sortedChapters, chapterId]);

  const prevChap = currentIndex > 0 ? sortedChapters[currentIndex - 1] : null;
  const nextChap =
    currentIndex >= 0 && currentIndex < sortedChapters.length - 1
      ? sortedChapters[currentIndex + 1]
      : null;

  const goChap = (nextChapterId) => {
    nav(
      `/doc-self?comicId=${encodeURIComponent(comicId)}&chapterId=${encodeURIComponent(
        nextChapterId
      )}`
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isPaid = !!comic?.is_paid;
  const ownerUserId = Number(comic?.user_id || 0) || null;
  const isOwner = !!(ownerUserId && myId && ownerUserId === myId);
  const locked = isPaid && !hasAccess;

  // lưu lịch sử đọc
  useEffect(() => {
    if (!token) return;
    if (!comicId) return;
    if (!chapterId) return;
    if (locked) return;

    const timer = setTimeout(async () => {
      try {
        await fetchJSON(`${API_BASE}/api/reading-history/mark`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            comicType: "self",
            comicId,
            chapterId,
          }),
        });

        console.log("Đã lưu lịch sử đọc self:", {
          comicType: "self",
          comicId,
          chapterId,
        });
      } catch (e) {
        console.error("mark read self error:", e);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [token, comicId, chapterId, locked]);

  // socket
  useEffect(() => {
    if (!chapterId) return;

    if (!socketRef.current) {
      socketRef.current = io(API_BASE, {
        transports: ["websocket", "polling"],
        withCredentials: true,
        auth: { token: token || "" },
      });

      socketRef.current.on("connect", () => {
        console.log("socket connected:", socketRef.current.id);
      });

      socketRef.current.on("connect_error", (e) => {
        console.log("socket connect_error:", e.message);
      });
    } else {
      socketRef.current.auth = { token: token || "" };
      if (!socketRef.current.connected) {
        socketRef.current.connect();
      }
    }

    const s = socketRef.current;
    const roomKey = `chapter:${CHAPTER_TYPE}:${chapterId}`;

    s.emit("chapter:join", {
      chapterType: CHAPTER_TYPE,
      chapterId: String(chapterId),
      room: roomKey,
    });

    const onNewComment = (payload) => {
      if (payload?.chapterType !== CHAPTER_TYPE) return;
      if (String(payload?.chapterId) !== String(chapterId)) return;

      setComments((prev) => {
        const exists = prev.some((x) => Number(x.id) === Number(payload?.comment?.id));
        if (exists) return prev;
        return [payload.comment, ...prev];
      });
    };

    const onDeleted = (payload) => {
      if (payload?.chapterType !== CHAPTER_TYPE) return;
      if (String(payload?.chapterId) !== String(chapterId)) return;

      const delId = Number(payload?.commentId);
      if (!delId) return;

      setComments((prev) => prev.filter((c) => Number(c.id) !== delId));
    };

    const onReaction = (payload) => {
      if (payload?.chapterType && payload.chapterType !== CHAPTER_TYPE) return;
      if (String(payload?.chapterId) !== String(chapterId)) return;

      if (typeof payload.likeCount === "number") {
        setLikeCount(payload.likeCount);
      }
      if (typeof payload.liked === "boolean") {
        setLiked(payload.liked);
      }
    };

    s.on("comment:new", onNewComment);
    s.on("comment:deleted", onDeleted);
    s.on("reaction:update", onReaction);

    return () => {
      s.off("comment:new", onNewComment);
      s.off("comment:deleted", onDeleted);
      s.off("reaction:update", onReaction);

      s.emit("chapter:leave", {
        chapterType: CHAPTER_TYPE,
        chapterId: String(chapterId),
        room: roomKey,
      });
    };
  }, [chapterId, token]);

  // load comments + reactions
  useEffect(() => {
    if (!chapterId || !comicId) return;

    let cancelled = false;
    setReactionReady(false);

    (async () => {
      try {
        const rc = await fetchJSON(
          `${API_BASE}/api/comments?chapterType=${encodeURIComponent(
            CHAPTER_TYPE
          )}&chapterId=${encodeURIComponent(chapterId)}`
        );

        if (!cancelled) {
          setComments(Array.isArray(rc?.data) ? rc.data : []);
        }

        const rr = await fetchJSON(
          `${API_BASE}/api/reactions/chapter/${encodeURIComponent(
            chapterId
          )}?comicId=${encodeURIComponent(comicId)}&comicType=self`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );

        if (!cancelled) {
          setLikeCount(Number(rr?.data?.likeCount || 0));
          setLiked(!!rr?.data?.liked);
          setReactionReady(true);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setComments([]);
          setLikeCount(0);
          setLiked(false);
          setReactionReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chapterId, comicId, token]);

  const toggleLike = async () => {
    if (!token) {
      toast.info("Bạn cần đăng nhập để thả tim.");
      return;
    }

    if (!chapterId || !comicId) {
      toast.warning("Thiếu thông tin chapter.");
      return;
    }

    if (!reactionReady || reactionLoading) {
      return;
    }

    try {
      setReactionLoading(true);

      const data = await fetchJSON(
        `${API_BASE}/api/reactions/chapter/${encodeURIComponent(chapterId)}/toggle`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            comicId: Number(comicId),
            comicType: "self",
            chapterTitle:
              chapterData?.chapter_title || `Chap ${chapterData?.chapter_no || ""}`,
          }),
        }
      );

      setLikeCount(Number(data?.data?.likeCount || 0));
      setLiked(!!data?.data?.liked);

      socketRef.current?.emit("reaction:toggle", {
        chapterType: CHAPTER_TYPE,
        chapterId: String(chapterId),
        likeCount: Number(data?.data?.likeCount || 0),
        liked: !!data?.data?.liked,
      });
    } catch (e) {
      toast.error(e.message || "Lỗi");
    } finally {
      setReactionLoading(false);
    }
  };

  const sendComment = async () => {
    if (!token) {
      toast.info("Bạn cần đăng nhập để bình luận.");
      return;
    }

    const textRaw = commentText.trim();
    if (!textRaw) return;

    const finalText = replyTo?.replyName ? `@${replyTo.replyName} ${textRaw}` : textRaw;

    try {
      const data = await fetchJSON(`${API_BASE}/api/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          chapterType: CHAPTER_TYPE,
          chapterId: String(chapterId),
          text: finalText,
          parentId: replyTo?.rootId || null,
        }),
      });

      const newComment = data?.data;
      if (newComment) {
        setComments((prev) => {
          const exists = prev.some((x) => Number(x.id) === Number(newComment.id));
          if (exists) return prev;
          return [newComment, ...prev];
        });

        socketRef.current?.emit("comment:create", {
          chapterType: CHAPTER_TYPE,
          chapterId: String(chapterId),
          comment: newComment,
        });
      }

      setCommentText("");
      setReplyTo(null);
      toast.success("Đã gửi bình luận!");
    } catch (e) {
      toast.error(e.message || "Không gửi được bình luận");
    }
  };

  const deleteComment = async (commentId) => {
    if (!token) {
      toast.info("Bạn cần đăng nhập.");
      return;
    }

    try {
      await fetchJSON(`${API_BASE}/api/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setComments((prev) => prev.filter((c) => Number(c.id) !== Number(commentId)));

      socketRef.current?.emit("comment:delete", {
        chapterType: CHAPTER_TYPE,
        chapterId: String(chapterId),
        commentId,
      });

      toast.success("Đã xóa bình luận!");
    } catch (e) {
      toast.error(e.message || "Không xóa được bình luận");
    }
  };

  const handleBuy = async () => {
    if (!token) {
      toast.info("Bạn cần đăng nhập để mua truyện");
      return;
    }

    try {
      const data = await fetchJSON(`${API_BASE}/api/purchases/buy-self/${comicId}`, {
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

  const updateReaderSetting = (key, value) => {
    setReaderSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetReaderSettings = () => {
    setReaderSettings(DEFAULT_READER_SETTINGS);
  };

  const rootComments = useMemo(() => comments.filter((c) => !c.parent_id), [comments]);

  const repliesByParent = useMemo(() => {
    const map = new Map();
    for (const c of comments) {
      if (!c.parent_id) continue;
      const arr = map.get(c.parent_id) || [];
      arr.push(c);
      map.set(c.parent_id, arr);
    }
    return map;
  }, [comments]);

  const readerClassName = `rsc-page theme-${readerSettings.theme} font-${readerSettings.fontFamily}`;

  if (loading) {
    return (
      <div className={readerClassName}>
        <Header />
        <ToastContainer position="top-right" autoClose={2000} />
        <div className="rsc-wrap">
          <div className="rsc-loading">
            <div className="spinner-border spinner-border-sm me-2" />
            Đang tải chapter...
          </div>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className={readerClassName}>
        <Header />
        <ToastContainer position="top-right" autoClose={2000} />
        <div className="rsc-wrap">
          <div className="alert alert-danger">{err}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={readerClassName}>
      <Header />
      <ToastContainer position="top-right" autoClose={2000} />

      <div className="rsc-topbar">
        <div className="rsc-topbar-inner">
          <Link className="rsc-back" to={`/self-comics/${comicId}`}>
            <i className="bi bi-arrow-left" /> Quay lại truyện
          </Link>

          <div className="rsc-title">
            <div className="rsc-comic">{comic?.title || "—"}</div>
            <div className="rsc-chap">
              {chapterData?.chapter_title || `Chap ${chapterData?.chapter_no || ""}`}
            </div>
          </div>

          <div className="rsc-nav">
            <button
              className="btn btn-outline-dark btn-sm"
              disabled={!prevChap}
              onClick={() => prevChap && goChap(prevChap.id)}
            >
              <i className="bi bi-chevron-left" /> Chap trước
            </button>
            <button
              className="btn btn-outline-dark btn-sm"
              disabled={!nextChap}
              onClick={() => nextChap && goChap(nextChap.id)}
            >
              Chap sau <i className="bi bi-chevron-right" />
            </button>
          </div>
        </div>
      </div>

      <div className="rsc-wrap">
        <div className="rsc-actionsBar">
          <button
            className={`rsc-likeBtn ${liked ? "active" : ""}`}
            type="button"
            onClick={toggleLike}
            disabled={!reactionReady || reactionLoading}
            title={liked ? "Bỏ tim" : "Thả tim"}
          >
            <i className={`bi ${liked ? "bi-heart-fill" : "bi-heart"}`} />
            <span>{likeCount}</span>
          </button>

          <div className="rsc-actionsMeta">
            <span className="rsc-pill">
              <i className="bi bi-chat-dots me-2" />
              {comments.length} bình luận
            </span>
            <span className="rsc-pill">
              <i className="bi bi-journal-text me-2" />
              Chap {chapterData?.chapter_no || "—"}
            </span>
          </div>
        </div>

        {!locked ? (
          <div className="rsc-readerTools">
            <div className="rsc-toolsHead">
              <div className="rsc-toolsTitle">
                <i className="bi bi-sliders me-2" />
                Tùy chỉnh đọc truyện
              </div>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={resetReaderSettings}
                type="button"
              >
                Mặc định
              </button>
            </div>

            <div className="rsc-toolsGrid">
              <div className="rsc-toolItem">
                <label>Font chữ</label>
                <select
                  value={readerSettings.fontFamily}
                  onChange={(e) => updateReaderSetting("fontFamily", e.target.value)}
                  className="form-select"
                >
                  <option value="system">Mặc định</option>
                  <option value="serif">Serif</option>
                  <option value="sans">Sans</option>
                  <option value="mono">Mono</option>
                </select>
              </div>

              <div className="rsc-toolItem">
                <label>Nền đọc</label>
                <select
                  value={readerSettings.theme}
                  onChange={(e) => updateReaderSetting("theme", e.target.value)}
                  className="form-select"
                >
                  <option value="light">Sáng</option>
                  <option value="sepia">Sepia</option>
                  <option value="dark">Tối</option>
                </select>
              </div>

              <div className="rsc-toolItem">
                <label>Cỡ chữ: {readerSettings.fontSize}px</label>
                <input
                  type="range"
                  min="15"
                  max="28"
                  step="1"
                  value={readerSettings.fontSize}
                  onChange={(e) => updateReaderSetting("fontSize", Number(e.target.value))}
                  className="form-range"
                />
              </div>

              <div className="rsc-toolItem">
                <label>Giãn dòng: {readerSettings.lineHeight}</label>
                <input
                  type="range"
                  min="1.4"
                  max="2.4"
                  step="0.1"
                  value={readerSettings.lineHeight}
                  onChange={(e) => updateReaderSetting("lineHeight", Number(e.target.value))}
                  className="form-range"
                />
              </div>

              <div className="rsc-toolItem">
                <label>Chiều rộng: {readerSettings.contentWidth}px</label>
                <input
                  type="range"
                  min="640"
                  max="1100"
                  step="10"
                  value={readerSettings.contentWidth}
                  onChange={(e) => updateReaderSetting("contentWidth", Number(e.target.value))}
                  className="form-range"
                />
              </div>
            </div>
          </div>
        ) : null}

        {locked ? (
          <div className="rsc-lockbox">
            <div className="rsc-lockicon">
              <i className="bi bi-lock" />
            </div>
            <div className="rsc-locktext">
              <div className="fw-bold">Nội dung bị khóa</div>
              <div className="text-secondary">
                {isOwner
                  ? "Bạn là chủ truyện nên luôn có quyền đọc."
                  : "Mua truyện để mở khóa nội dung chapter này."}
              </div>
            </div>

            {!isOwner ? (
              <button className="btn btn-danger" onClick={handleBuy}>
                Mua truyện • {fmtVND(comic?.price)}
              </button>
            ) : null}
          </div>
        ) : (
          <div className="rsc-reader">
            <div
              className="rsc-content card shadow-sm"
              style={{ maxWidth: `${readerSettings.contentWidth}px`, margin: "0 auto" }}
            >
              <div className="card-body">
                <div className="rsc-chapterHeader">
                  <h2>{chapterData?.chapter_title || `Chap ${chapterData?.chapter_no || ""}`}</h2>
                  <div className="rsc-subInfo">
                    <span>{comic?.title || "Truyện tự đăng"}</span>
                    <span>•</span>
                    <span>{fmtTime(chapterData?.created_at)}</span>
                  </div>
                </div>

                <div
                  className="rsc-htmlContent"
                  style={{
                    fontSize: `${readerSettings.fontSize}px`,
                    lineHeight: readerSettings.lineHeight,
                  }}
                  dangerouslySetInnerHTML={{
                    __html:
                      chapterData?.content || "<p>Chưa có nội dung cho chapter này.</p>",
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="rsc-bottomNav">
          <button className="btn btn-dark" disabled={!prevChap} onClick={() => prevChap && goChap(prevChap.id)}>
            <i className="bi bi-chevron-left me-2" />
            Chap trước
          </button>

          <button
            className="btn btn-outline-secondary"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <i className="bi bi-arrow-up" />
          </button>

          <button className="btn btn-dark" disabled={!nextChap} onClick={() => nextChap && goChap(nextChap.id)}>
            Chap sau <i className="bi bi-chevron-right ms-2" />
          </button>
        </div>

        <div className="rsc-comments">
          <div className="rsc-commentsHead">
            <div className="rsc-commentsTitle">
              <i className="bi bi-chat-left-text me-2" />
              Bình luận
            </div>
            <div className="rsc-commentsHint">Bình luận sẽ hiện ngay cho mọi người.</div>
          </div>

          <div className="rsc-composer">
            {replyTo ? (
              <div className="rsc-replyTo">
                Đang trả lời <b>{replyTo.replyName || "user"}</b>
                <button className="rsc-x" onClick={() => setReplyTo(null)} type="button">
                  <i className="bi bi-x" />
                </button>
              </div>
            ) : null}

            <textarea
              className="rsc-input"
              rows={3}
              placeholder={token ? "Viết bình luận..." : "Đăng nhập để bình luận..."}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={!token}
            />

            <div className="rsc-composerActions">
              <button
                className="btn btn-outline-light"
                type="button"
                onClick={() => setCommentText("")}
                disabled={!token}
              >
                Xóa
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={sendComment}
                disabled={!token || !commentText.trim()}
              >
                <i className="bi bi-send me-2" />
                Gửi
              </button>
            </div>
          </div>

          <div className="rsc-commentList rsc-scroll5" ref={listRef}>
            {rootComments.length === 0 ? (
              <div className="rsc-empty">
                <i className="bi bi-chat-square-dots" />
                <div>Chưa có bình luận. Hãy là người đầu tiên!</div>
              </div>
            ) : (
              rootComments.map((c) => {
                const replies = repliesByParent.get(c.id) || [];
                const isMine = Number(c.user_id) === Number(myId);

                return (
                  <div className="rsc-cmt" key={c.id}>
                    <div className="rsc-cmtAvatar">
                      <img
                        src={
                          c.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            c.user_name || "U"
                          )}&background=random`
                        }
                        alt="avt"
                      />
                    </div>

                    <div className="rsc-cmtBody">
                      <div className="rsc-cmtTop">
                        <div className="rsc-cmtName">{c.user_name || "User"}</div>
                        <div className="rsc-cmtTime">{fmtTime(c.created_at)}</div>
                      </div>

                      <div className="rsc-cmtText">{c.text}</div>

                      <div className="rsc-cmtActions">
                        <button
                          className="rsc-linkBtn"
                          type="button"
                          onClick={() => setReplyTo({ rootId: c.id, replyName: c.user_name })}
                          disabled={!token}
                        >
                          <i className="bi bi-reply me-1" />
                          Trả lời
                        </button>

                        {isMine ? (
                          <button
                            className="rsc-iconBtn danger"
                            type="button"
                            onClick={() => deleteComment(c.id)}
                            title="Xóa bình luận"
                          >
                            <i className="bi bi-trash3" />
                          </button>
                        ) : null}
                      </div>

                      {replies.length ? (
                        <div className="rsc-replies">
                          {replies.map((r) => {
                            const isMineReply = Number(r.user_id) === Number(myId);
                            return (
                              <div className="rsc-reply" key={r.id}>
                                <div className="rsc-replyTop">
                                  <div>
                                    <span className="rsc-replyName">{r.user_name || "User"}</span>{" "}
                                    <span className="rsc-replyTime">{fmtTime(r.created_at)}</span>
                                  </div>

                                  {isMineReply ? (
                                    <button
                                      className="rsc-iconBtn danger"
                                      type="button"
                                      onClick={() => deleteComment(r.id)}
                                      title="Xóa bình luận"
                                    >
                                      <i className="bi bi-trash3" />
                                    </button>
                                  ) : null}
                                </div>

                                <div className="rsc-replyText">{r.text}</div>

                                <div className="rsc-replyActions">
                                  <button
                                    className="rsc-linkBtn"
                                    type="button"
                                    onClick={() => setReplyTo({ rootId: c.id, replyName: r.user_name })}
                                    disabled={!token}
                                  >
                                    <i className="bi bi-reply me-1" />
                                    Trả lời
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}