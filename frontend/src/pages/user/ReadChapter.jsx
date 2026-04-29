import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "../../components/Header";
import ChapterNavBar from "../../components/chapter/ChapterNavBar";
import CommentSection from "../../components/chapter/CommentSection";
import "./readChapter.css";
import { io } from "socket.io-client";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE = "http://localhost:5000";
const CHAPTER_TYPE = "external";

function buildPageUrl(domain, chapterPath, file) {
  return `${domain}/${chapterPath}/${file}`;
}

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* ignore */ }
  if (!res.ok) throw new Error(json?.message || `HTTP ${res.status}`);
  return json;
}

export default function ReadChapter() {
  const [sp] = useSearchParams();
  const nav = useNavigate();

  const slug = sp.get("slug") || "";
  const chapterApi = sp.get("chap") || "";
  const comicDbId = Number(sp.get("comicId") || 0) || null;
  const token = localStorage.getItem("token") || "";

  const me = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  }, []);
  const myId = me?.id || null;

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [chapterData, setChapterData] = useState(null);
  const [chapters, setChapters] = useState([]);

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [reactionReady, setReactionReady] = useState(false);
  const [reactionLoading, setReactionLoading] = useState(false);

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState(null);

  const socketRef = useRef(null);

  const chapterId = chapterData?.item?._id || "";
  const chapterName = chapterData?.item?.chapter_name || "";
  const comicName = chapterData?.item?.comic_name || "";

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const r = await fetch(`https://otruyenapi.com/v1/api/truyen-tranh/${slug}`);
        const j = await r.json();
        const item = j?.data?.item;
        const list = (item?.chapters || [])
          .flatMap((sv) => (sv?.server_data || []).map((ch) => ({ name: ch.chapter_name, api: ch.chapter_api_data })))
          .sort((a, b) => Number(a.name) - Number(b.name));
        setChapters(list);
      } catch (e) { console.error(e); setChapters([]); }
    })();
  }, [slug]);

  useEffect(() => {
    if (!chapterApi) return;
    (async () => {
      try {
        setErr(""); setLoading(true);
        const res = await fetch(chapterApi);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || "Failed to load chapter");
        setChapterData(json?.data || null);
      } catch (e) { console.error(e); setErr(e.message || "Error"); setChapterData(null); }
      finally { setLoading(false); }
    })();
  }, [chapterApi]);

  useEffect(() => {
    if (!token || !comicDbId || !chapterId || !chapterApi) return;
    const timer = setTimeout(async () => {
      try {
        await fetchJSON(`${API_BASE}/api/reading-history/mark`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ comicType: "external", comicId: comicDbId, chapterId, chapterApi, chapterTitle: chapterName }),
        });
      } catch (e) { console.error("mark read external error:", e); }
    }, 1200);
    return () => clearTimeout(timer);
  }, [token, comicDbId, chapterId, chapterApi, chapterName]);

  const pages = useMemo(() => {
    const domain = chapterData?.domain_cdn;
    const item = chapterData?.item;
    if (!domain || !item?.chapter_path) return [];
    const images = Array.isArray(item.chapter_image) ? item.chapter_image : [];
    return [...images]
      .sort((a, b) => (a.image_page || 0) - (b.image_page || 0))
      .map((img) => buildPageUrl(domain, item.chapter_path, img.image_file));
  }, [chapterData]);

  const currentIndex = useMemo(() => {
    if (!chapters.length || !chapterApi) return -1;
    return chapters.findIndex((c) => c.api === chapterApi);
  }, [chapters, chapterApi]);

  const prevChap = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChap = currentIndex >= 0 && currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  const goChap = (api) => {
    nav(`/doc?slug=${encodeURIComponent(slug)}&chap=${encodeURIComponent(api)}&comicId=${encodeURIComponent(comicDbId || "")}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (!chapterId) return;
    if (!socketRef.current) {
      socketRef.current = io(API_BASE, { transports: ["websocket", "polling"], withCredentials: true, auth: { token: token || "" } });
      socketRef.current.on("connect", () => console.log("socket connected:", socketRef.current.id));
      socketRef.current.on("connect_error", (e) => console.log("socket connect_error:", e.message));
    } else {
      socketRef.current.auth = { token: token || "" };
      if (!socketRef.current.connected) socketRef.current.connect();
    }

    const s = socketRef.current;
    const roomKey = `chapter:${CHAPTER_TYPE}:${chapterId}`;
    s.emit("chapter:join", { chapterType: CHAPTER_TYPE, chapterId, room: roomKey });

    const onNewComment = (payload) => {
      if (payload?.chapterType !== CHAPTER_TYPE) return;
      if (String(payload?.chapterId) !== String(chapterId)) return;
      setComments((prev) => {
        const exists = prev.some((x) => Number(x.id) === Number(payload?.comment?.id));
        return exists ? prev : [payload.comment, ...prev];
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
      if (typeof payload.likeCount === "number") setLikeCount(payload.likeCount);
      if (typeof payload.liked === "boolean") setLiked(payload.liked);
    };
    s.on("comment:new", onNewComment);
    s.on("comment:deleted", onDeleted);
    s.on("reaction:update", onReaction);
    return () => {
      s.off("comment:new", onNewComment);
      s.off("comment:deleted", onDeleted);
      s.off("reaction:update", onReaction);
      s.emit("chapter:leave", { chapterType: CHAPTER_TYPE, chapterId, room: roomKey });
    };
  }, [chapterId, token]);

  useEffect(() => {
    if (!chapterId || !comicDbId) return;
    let cancelled = false;
    setReactionReady(false);
    (async () => {
      try {
        const rc = await fetchJSON(`${API_BASE}/api/comments?chapterType=${encodeURIComponent(CHAPTER_TYPE)}&chapterId=${encodeURIComponent(chapterId)}`);
        if (!cancelled) setComments(Array.isArray(rc?.data) ? rc.data : []);
        const rr = await fetchJSON(
          `${API_BASE}/api/reactions/chapter/${encodeURIComponent(chapterId)}?comicId=${encodeURIComponent(comicDbId)}&comicType=external`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        if (!cancelled) { setLikeCount(Number(rr?.data?.likeCount || 0)); setLiked(!!rr?.data?.liked); setReactionReady(true); }
      } catch (e) {
        console.error(e);
        if (!cancelled) { setComments([]); setLikeCount(0); setLiked(false); setReactionReady(true); }
      }
    })();
    return () => { cancelled = true; };
  }, [chapterId, comicDbId, token]);

  const toggleLike = async () => {
    if (!token) { toast.info("You need to log in to like."); return; }
    if (!chapterId) { toast.warning("Chapter not found."); return; }
    if (!comicDbId) { toast.warning("Comic not found in database."); return; }
    if (!reactionReady || reactionLoading) return;
    try {
      setReactionLoading(true);
      const data = await fetchJSON(`${API_BASE}/api/reactions/chapter/${encodeURIComponent(chapterId)}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ comicId: comicDbId, comicType: "external", slug: slug || null, chapApi: chapterApi || null, chapterTitle: chapterName || null }),
      });
      setLikeCount(Number(data?.data?.likeCount || 0));
      setLiked(!!data?.data?.liked);
      socketRef.current?.emit("reaction:toggle", { chapterType: CHAPTER_TYPE, chapterId: String(chapterId), likeCount: Number(data?.data?.likeCount || 0), liked: !!data?.data?.liked });
    } catch (e) { toast.error(e.message || "Error"); }
    finally { setReactionLoading(false); }
  };

  const sendComment = async () => {
    if (!token) { toast.info("You need to log in to comment."); return; }
    const textRaw = commentText.trim();
    if (!textRaw) return;
    const finalText = replyTo?.replyName ? `@${replyTo.replyName} ${textRaw}` : textRaw;
    try {
      const data = await fetchJSON(`${API_BASE}/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ chapterType: CHAPTER_TYPE, chapterId, text: finalText, parentId: replyTo?.rootId || null }),
      });
      const newComment = data?.data;
      if (newComment) {
        setComments((prev) => {
          const exists = prev.some((x) => Number(x.id) === Number(newComment.id));
          return exists ? prev : [newComment, ...prev];
        });
        socketRef.current?.emit("comment:create", { chapterType: CHAPTER_TYPE, chapterId, comment: newComment });
      }
      setCommentText(""); setReplyTo(null);
      toast.success("Comment sent!");
    } catch (e) { toast.error(e.message || "Failed to send comment"); }
  };

  const deleteComment = async (commentId) => {
    if (!token) { toast.info("You need to log in."); return; }
    try {
      await fetchJSON(`${API_BASE}/api/comments/${commentId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setComments((prev) => prev.filter((c) => Number(c.id) !== Number(commentId)));
      socketRef.current?.emit("comment:delete", { chapterType: CHAPTER_TYPE, chapterId, commentId });
      toast.success("Comment deleted!");
    } catch (e) { toast.error(e.message || "Failed to delete comment"); }
  };

  if (loading) {
    return (
      <div className="rc-page">
        <Header />
        <ToastContainer position="top-right" autoClose={2000} />
        <div className="rc-wrap">
          <div className="rc-loading">
            <div className="spinner-border spinner-border-sm me-2" />
            Loading chapter...
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

      <ChapterNavBar
        slug={slug}
        comicName={comicName}
        chapterName={chapterName}
        prevChap={prevChap}
        nextChap={nextChap}
        onGoChap={goChap}
      />

      <div className="rc-wrap">
        <div className="rc-actionsBar">
          <button
            className={`rc-likeBtn ${liked ? "active" : ""}`}
            type="button"
            onClick={toggleLike}
            disabled={!reactionReady || reactionLoading}
            title={liked ? "Unlike" : "Like"}
          >
            <i className={`bi ${liked ? "bi-heart-fill" : "bi-heart"}`} />
            <span>{likeCount}</span>
          </button>

          <div className="rc-actionsMeta">
            <span className="rc-pill">
              <i className="bi bi-chat-dots me-2" />
              {comments.length} comments
            </span>
            <span className="rc-pill">
              <i className="bi bi-images me-2" />
              {pages.length} pages
            </span>
          </div>
        </div>

        <div className="rc-reader">
          {pages.map((src, idx) => (
            <div className="rc-pageImg" key={src}>
              <div className="page-wrapper">
                <img src={src} alt={`page-${idx + 1}`} loading="lazy" />
              </div>
              <div className="rc-pageNo">{idx + 1}/{pages.length}</div>
            </div>
          ))}
        </div>

        <div className="rc-bottomNav">
          <button className="btn btn-dark" disabled={!prevChap} onClick={() => prevChap && goChap(prevChap.api)}>
            <i className="bi bi-chevron-left me-2" />
            Previous
          </button>
          <button className="btn btn-outline-secondary" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <i className="bi bi-arrow-up" />
          </button>
          <button className="btn btn-dark" disabled={!nextChap} onClick={() => nextChap && goChap(nextChap.api)}>
            Next <i className="bi bi-chevron-right ms-2" />
          </button>
        </div>

        <CommentSection
          token={token}
          myId={myId}
          comments={comments}
          commentText={commentText}
          setCommentText={setCommentText}
          replyTo={replyTo}
          setReplyTo={setReplyTo}
          onSendComment={sendComment}
          onDeleteComment={deleteComment}
        />
      </div>
    </div>
  );
}
