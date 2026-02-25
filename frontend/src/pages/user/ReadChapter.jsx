import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Header from "../../components/Header";
import "./readChapter.css";
import { io } from "socket.io-client";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE = "http://localhost:5000";

function buildPageUrl(domain, chapterPath, file) {
  return `${domain}/${chapterPath}/${file}`;
}

export default function ReadChapter() {
  const [sp] = useSearchParams();
  const nav = useNavigate();

  const slug = sp.get("slug") || "";
  const chapterApi = sp.get("chap") || "";

  const token = localStorage.getItem("token");

  
  const me = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);
  const myId = me?.id;

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [chapterData, setChapterData] = useState(null);


  const [chapters, setChapters] = useState([]);

  
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");

  
  const [replyTo, setReplyTo] = useState(null); // { rootId, replyName }

  const listRef = useRef(null);
  const socketRef = useRef(null);

  // chapterId dùng để join room
  const chapterId = chapterData?.item?._id || "";
  const chapterName = chapterData?.item?.chapter_name || "";
  const comicName = chapterData?.item?.comic_name || "";

  // 1) load comic chapters (prev/next)
  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const r = await fetch(`https://otruyenapi.com/v1/api/truyen-tranh/${slug}`);
        const j = await r.json();
        const item = j?.data?.item;

        const list = (item?.chapters || [])
          .flatMap((sv) =>
            (sv?.server_data || []).map((ch) => ({
              name: ch.chapter_name,
              api: ch.chapter_api_data,
            }))
          )
          .sort((a, b) => Number(a.name) - Number(b.name));

        setChapters(list);
      } catch (e) {
        console.error(e);
        setChapters([]);
      }
    })();
  }, [slug]);

  // 2) load chapter images
  useEffect(() => {
    if (!chapterApi) return;

    (async () => {
      try {
        setErr("");
        setLoading(true);

        const res = await fetch(chapterApi);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || "Không tải được chapter");

        setChapterData(json?.data || null);
      } catch (e) {
        console.error(e);
        setErr(e.message || "Lỗi");
        setChapterData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [chapterApi]);

  // 3) pages
  const pages = useMemo(() => {
    const domain = chapterData?.domain_cdn;
    const item = chapterData?.item;
    if (!domain || !item?.chapter_path) return [];

    const images = Array.isArray(item.chapter_image) ? item.chapter_image : [];
    return [...images]
      .sort((a, b) => (a.image_page || 0) - (b.image_page || 0))
      .map((img) => buildPageUrl(domain, item.chapter_path, img.image_file));
  }, [chapterData]);

  // prev/next chap
  const currentIndex = useMemo(() => {
    if (!chapters.length || !chapterApi) return -1;
    return chapters.findIndex((c) => c.api === chapterApi);
  }, [chapters, chapterApi]);

  const prevChap = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChap = currentIndex >= 0 && currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  const goChap = (api) => {
    nav(`/doc?slug=${encodeURIComponent(slug)}&chap=${encodeURIComponent(api)}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

 
  useEffect(() => {
    if (!chapterId) return;

    // nếu chưa có socket -> tạo
    if (!socketRef.current) {
      socketRef.current = io(API_BASE, {
        transports: ["websocket", "polling"], // fallback
        withCredentials: true,
        auth: { token: token || "" }, // luôn gửi token
      });

      socketRef.current.on("connect", () => {
        console.log("socket connected:", socketRef.current.id);
      });

      socketRef.current.on("connect_error", (e) => {
        console.log("socket connect_error:", e.message);
      });
    } else {
      // token đổi -> cập nhật auth
      socketRef.current.auth = { token: token || "" };
      if (!socketRef.current.connected) socketRef.current.connect();
    }

    const s = socketRef.current;

    // join room
    s.emit("chapter:join", { chapterId });

    const onNewComment = (payload) => {
      if (payload?.chapterId !== chapterId) return;
      setComments((prev) => [payload.comment, ...prev]);
    };

    const onDeleted = (payload) => {
      if (payload?.chapterId !== chapterId) return;
      const delId = Number(payload?.commentId);
      if (!delId) return;
      setComments((prev) => prev.filter((c) => Number(c.id) !== delId));
    };

    const onReaction = (payload) => {
      if (payload?.chapterId !== chapterId) return;
      if (typeof payload.likeCount === "number") setLikeCount(payload.likeCount);
    };

    s.on("comment:new", onNewComment);
    s.on("comment:deleted", onDeleted);
    s.on("reaction:update", onReaction);

    return () => {
      s.off("comment:new", onNewComment);
      s.off("comment:deleted", onDeleted);
      s.off("reaction:update", onReaction);
      s.emit("chapter:leave", { chapterId });
    };
  }, [chapterId, token]);

  
  useEffect(() => {
    if (!chapterId) return;

    (async () => {
      try {
        // comments
        const rc = await fetch(`${API_BASE}/api/comments?chapterId=${encodeURIComponent(chapterId)}`);
        const jc = await rc.json();
        if (rc.ok) setComments(Array.isArray(jc?.data) ? jc.data : []);
        else setComments([]);

        // reactions
        const rr = await fetch(`${API_BASE}/api/reactions/chapter/${encodeURIComponent(chapterId)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const jr = await rr.json();
        if (rr.ok) {
          setLikeCount(Number(jr?.data?.likeCount || 0));
          setLiked(!!jr?.data?.liked);
        } else {
          setLikeCount(0);
          setLiked(false);
        }
      } catch (e) {
        console.error(e);
        setComments([]);
      }
    })();
  }, [chapterId, token]);

  
  const toggleLike = async () => {
    if (!token) {
      toast.info("Bạn cần đăng nhập để thả tim.");
      return;
    }

    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((c) => Math.max(0, c + (nextLiked ? 1 : -1)));

    try {
      const res = await fetch(`${API_BASE}/api/reactions/chapter/${encodeURIComponent(chapterId)}/toggle`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Không thả tim được");

      if (typeof data?.data?.likeCount === "number") setLikeCount(data.data.likeCount);
      if (typeof data?.data?.liked === "boolean") setLiked(data.data.liked);

      socketRef.current?.emit("reaction:toggle", { chapterId });
    } catch (e) {
      setLiked((x) => !x);
      setLikeCount((c) => Math.max(0, c + (liked ? 1 : -1)));
      toast.error(e.message || "Lỗi");
    }
  };

  
  const sendComment = () => {
    if (!token) {
      toast.info("Bạn cần đăng nhập để bình luận.");
      return;
    }

    const textRaw = commentText.trim();
    if (!textRaw) return;

    const finalText = replyTo?.replyName ? `@${replyTo.replyName} ${textRaw}` : textRaw;

    const payload = {
      chapterId,
      text: finalText,
      parentId: replyTo?.rootId || null,
    };

    socketRef.current?.emit("comment:create", payload);

    setCommentText("");
    setReplyTo(null);

    toast.success("Đã gửi bình luận!");
  };

  
  const deleteComment = (commentId) => {
    if (!token) {
      toast.info("Bạn cần đăng nhập.");
      return;
    }
    if (!chapterId) return;

    // toast confirm dạng custom
    toast(
      ({ closeToast }) => (
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <b>Xóa bình luận?</b>
            <div style={{ fontSize: 13, opacity: 0.9 }}>Bình luận sẽ bị xóa cho tất cả mọi người.</div>
          </div>
          <button
            className="btn btn-sm btn-outline-light"
            onClick={() => closeToast()}
            type="button"
          >
            Hủy
          </button>
          <button
            className="btn btn-sm btn-danger"
            onClick={() => {
              socketRef.current?.emit("comment:delete", { chapterId, commentId });
              closeToast();
              toast.success("Đã xóa bình luận!");
            }}
            type="button"
          >
            Xóa
          </button>
        </div>
      ),
      { autoClose: false, closeOnClick: false }
    );
  };

  const fmtTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("vi-VN");
  };

  // root + replies
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

  if (loading) {
    return (
      <div className="rc-page">
        <Header />
        <ToastContainer position="top-right" autoClose={2000} />
        <div className="rc-wrap">
          <div className="rc-loading">
            <div className="spinner-border spinner-border-sm me-2" />
            Đang tải chapter...
          </div>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="rc-page">
        <Header />
        <ToastContainer position="top-right" autoClose={2000} />
        <div className="rc-wrap">
          <div className="alert alert-danger">{err}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="rc-page">
      <Header />
      <ToastContainer position="top-right" autoClose={2000} />

      {/* topbar */}
      <div className="rc-topbar">
        <div className="rc-topbar-inner">
          <Link className="rc-back" to={`/truyen/${slug}`}>
            <i className="bi bi-arrow-left" /> Quay lại truyện
          </Link>

          <div className="rc-title">
            <div className="rc-comic">{comicName || "—"}</div>
            <div className="rc-chap">Chap {chapterName || ""}</div>
          </div>

          <div className="rc-nav">
            <button className="btn btn-outline-dark btn-sm" disabled={!prevChap} onClick={() => goChap(prevChap.api)}>
              <i className="bi bi-chevron-left" /> Chap trước
            </button>
            <button className="btn btn-outline-dark btn-sm" disabled={!nextChap} onClick={() => goChap(nextChap.api)}>
              Chap sau <i className="bi bi-chevron-right" />
            </button>
          </div>
        </div>
      </div>

      <div className="rc-wrap">
        {/* Reaction bar */}
        <div className="rc-actionsBar">
          <button
            className={`rc-likeBtn ${liked ? "active" : ""}`}
            type="button"
            onClick={toggleLike}
            title={liked ? "Bỏ tim" : "Thả tim"}
          >
            <i className={`bi ${liked ? "bi-heart-fill" : "bi-heart"}`} />
            <span>{likeCount}</span>
          </button>

          <div className="rc-actionsMeta">
            <span className="rc-pill">
              <i className="bi bi-chat-dots me-2" />
              {comments.length} bình luận
            </span>
            <span className="rc-pill">
              <i className="bi bi-images me-2" />
              {pages.length} trang
            </span>
          </div>
        </div>

        {/* images */}
        <div className="rc-reader">
          {pages.map((src, idx) => (
            <div className="rc-pageImg" key={src}>
              <img src={src} alt={`page-${idx + 1}`} loading="lazy" />
              <div className="rc-pageNo">
                {idx + 1}/{pages.length}
              </div>
            </div>
          ))}
        </div>

        {/* bottom nav */}
        <div className="rc-bottomNav">
          <button className="btn btn-dark" disabled={!prevChap} onClick={() => goChap(prevChap.api)}>
            <i className="bi bi-chevron-left me-2" />
            Chap trước
          </button>

          <button className="btn btn-outline-secondary" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <i className="bi bi-arrow-up" />
          </button>

          <button className="btn btn-dark" disabled={!nextChap} onClick={() => goChap(nextChap.api)}>
            Chap sau <i className="bi bi-chevron-right ms-2" />
          </button>
        </div>

        {/* Comments */}
        <div className="rc-comments">
          <div className="rc-commentsHead">
            <div className="rc-commentsTitle">
              <i className="bi bi-chat-left-text me-2" />
              Bình luận 
            </div>
            <div className="rc-commentsHint">Bình luận sẽ hiện ngay cho mọi người.</div>
          </div>

          {/* composer */}
          <div className="rc-composer">
            {replyTo ? (
              <div className="rc-replyTo">
                Đang trả lời <b>{replyTo.replyName || "user"}</b>
                <button className="rc-x" onClick={() => setReplyTo(null)} type="button">
                  <i className="bi bi-x" />
                </button>
              </div>
            ) : null}

            <textarea
              className="rc-input"
              rows={3}
              placeholder={token ? "Viết bình luận..." : "Đăng nhập để bình luận..."}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={!token}
            />

            <div className="rc-composerActions">
              <button className="btn btn-outline-light" type="button" onClick={() => setCommentText("")} disabled={!token}>
                Xóa
              </button>
              <button className="btn btn-primary" type="button" onClick={sendComment} disabled={!token || !commentText.trim()}>
                <i className="bi bi-send me-2" />
                Gửi
              </button>
            </div>
          </div>

          
          <div className="rc-commentList rc-scroll5" ref={listRef}>
            {rootComments.length === 0 ? (
              <div className="rc-empty">
                <i className="bi bi-chat-square-dots" />
                <div>Chưa có bình luận. Hãy là người đầu tiên!</div>
              </div>
            ) : (
              rootComments.map((c) => {
                const replies = repliesByParent.get(c.id) || [];
                const isMine = Number(c.user_id) === Number(myId);

                return (
                  <div className="rc-cmt" key={c.id}>
                    <div className="rc-cmtAvatar">
                      <img
                        src={c.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.user_name || "U")}&background=random`}
                        alt="avt"
                      />
                    </div>

                    <div className="rc-cmtBody">
                      <div className="rc-cmtTop">
                        <div className="rc-cmtName">{c.user_name || "User"}</div>
                        <div className="rc-cmtTime">{fmtTime(c.created_at)}</div>
                      </div>

                      <div className="rc-cmtText">{c.text}</div>

                      <div className="rc-cmtActions" style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <button
                          className="rc-linkBtn"
                          type="button"
                          onClick={() => setReplyTo({ rootId: c.id, replyName: c.user_name })}
                          disabled={!token}
                        >
                          <i className="bi bi-reply me-1" />
                          Trả lời
                        </button>

                      
                        {isMine ? (
                          <button
                            className="rc-iconBtn danger"
                            type="button"
                            onClick={() => deleteComment(c.id)}
                            title="Xóa bình luận"
                          >
                            <i className="bi bi-trash3" />
                          </button>
                        ) : null}
                      </div>

                      {replies.length ? (
                        <div className="rc-replies">
                          {replies.map((r) => {
                            const isMineReply = Number(r.user_id) === Number(myId);
                            return (
                              <div className="rc-reply" key={r.id}>
                                <div className="rc-replyTop" style={{ display: "flex", justifyContent: "space-between" }}>
                                  <div>
                                    <span className="rc-replyName">{r.user_name || "User"}</span>{" "}
                                    <span className="rc-replyTime">{fmtTime(r.created_at)}</span>
                                  </div>

                                  {isMineReply ? (
                                    <button
                                      className="rc-iconBtn danger"
                                      type="button"
                                      onClick={() => deleteComment(r.id)}
                                      title="Xóa bình luận"
                                    >
                                      <i className="bi bi-trash3" />
                                    </button>
                                  ) : null}
                                </div>

                                <div className="rc-replyText">{r.text}</div>

                                <div className="rc-replyActions">
                                  <button
                                    className="rc-linkBtn"
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