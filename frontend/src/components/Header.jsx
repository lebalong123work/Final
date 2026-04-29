import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import "./header.css";
import { io } from "socket.io-client";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import NotificationDropdown from "./header/NotificationDropdown";
import UserMenuDropdown from "./header/UserMenuDropdown";
import CategoryNav from "./header/CategoryNav";

const API_BASE = "http://localhost:5000";

async function fetchJSON(url, options) {
  const res = await fetch(url, options);
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* ignore */ }
  if (!res.ok) throw new Error(json?.message || `HTTP ${res.status}`);
  return json;
}

export default function Header() {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);

  const user = useMemo(() => {
    try { const raw = localStorage.getItem("user"); return raw ? JSON.parse(raw) : null; }
    catch { return null; }
  }, [tick]);

  const token = useMemo(() => localStorage.getItem("token") || "", [tick]);

  const [navOpen, setNavOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [notifs, setNotifs] = useState([]);

  const [categories, setCategories] = useState([]);
  const [catErr, setCatErr] = useState("");
  const [catLoading, setCatLoading] = useState(false);

  const [moreOpen, setMoreOpen] = useState(false);
  const [textOpen, setTextOpen] = useState(false);

  const [otherCategories, setOtherCategories] = useState([]);
  const [otherCatLoading, setOtherCatLoading] = useState(false);
  const [otherCatErr, setOtherCatErr] = useState("");

  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const socketRef = useRef(null);
  const notifHoverTimerRef = useRef(null);
  const userMenuRef = useRef(null);
  const notifWrapRef = useRef(null);
  const navRef = useRef(null);

  const visibleCategories = categories.slice(0, 5);
  const moreCategories = categories.slice(5);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "user" || e.key === "token") setTick((t) => t + 1);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
      if (notifWrapRef.current && !notifWrapRef.current.contains(e.target)) setNotifOpen(false);
      if (navRef.current && !navRef.current.contains(e.target)) { setMoreOpen(false); setTextOpen(false); }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => { if (notifHoverTimerRef.current) clearTimeout(notifHoverTimerRef.current); };
  }, []);

  const closeAllMenus = () => { setMoreOpen(false); setTextOpen(false); setUserMenuOpen(false); };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    if (socketRef.current) { try { socketRef.current.disconnect(); } catch { /* ignore */ } socketRef.current = null; }
    setUnread(0);
    setNotifs([]);
    closeAllMenus();
    setNotifOpen(false);
    setNavOpen(false);
    setTick((t) => t + 1);
    navigate("/");
  };

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const r = await fetch(`${API_BASE}/api/notifications?limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await r.json();
      if (r.ok && Array.isArray(j?.data)) setNotifs(j.data);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    const run = async () => {
      try {
        setCatLoading(true); setCatErr("");
        const data = await fetchJSON(`${API_BASE}/api/external-categories`);
        setCategories(Array.isArray(data?.data) ? data.data : []);
      } catch (e) { setCatErr(e?.message || "Error loading categories"); setCategories([]); }
      finally { setCatLoading(false); }
    };
    run();
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        setOtherCatLoading(true); setOtherCatErr("");
        const data = await fetchJSON(`${API_BASE}/api/categories`);
        setOtherCategories(Array.isArray(data?.data) ? data.data : []);
      } catch (e) { setOtherCatErr(e?.message || "Error loading other categories"); setOtherCategories([]); }
      finally { setOtherCatLoading(false); }
    };
    run();
  }, []);

  useEffect(() => {
    if (!token || !user?.id) {
      if (socketRef.current) { try { socketRef.current.disconnect(); } catch { /* ignore */ } socketRef.current = null; }
      setUnread(0); setNotifs([]);
      return;
    }

    if (!socketRef.current) {
      socketRef.current = io(API_BASE, { transports: ["websocket", "polling"], withCredentials: true, auth: { token } });
      socketRef.current.on("connect", () => socketRef.current?.emit("notif:unread:get"));
      socketRef.current.on("connect_error", (e) => console.log("socket connect_error:", e.message));
    } else {
      socketRef.current.auth = { token };
      if (!socketRef.current.connected) socketRef.current.connect();
    }

    const s = socketRef.current;
    const onUnread = (payload) => { if (typeof payload?.unread === "number") setUnread(payload.unread); };
    const onNotifNew = (payload) => {
      const n = payload?.notification;
      if (!n?.id) return;
      setNotifs((prev) => {
        const copy = [...prev];
        const idx = copy.findIndex((x) => Number(x.id) === Number(n.id));
        if (idx >= 0) copy.splice(idx, 1);
        copy.unshift(n);
        return copy;
      });
    };
    const onNotifUpdated = (payload) => {
      const n = payload?.notification;
      if (!n?.id) return;
      setNotifs((prev) => {
        const idx = prev.findIndex((x) => Number(x.id) === Number(n.id));
        if (idx < 0) return [n, ...prev];
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...n };
        const moved = copy.splice(idx, 1)[0];
        copy.unshift(moved);
        return copy;
      });
    };
    s.on("notif:unread", onUnread);
    s.on("notif:new", onNotifNew);
    s.on("notif:updated", onNotifUpdated);
    fetchNotifications();
    return () => { s.off("notif:unread", onUnread); s.off("notif:new", onNotifNew); s.off("notif:updated", onNotifUpdated); };
  }, [token, user?.id]);

  const openNotif = () => { if (notifHoverTimerRef.current) clearTimeout(notifHoverTimerRef.current); setNotifOpen(true); };
  const closeNotif = () => {
    if (notifHoverTimerRef.current) clearTimeout(notifHoverTimerRef.current);
    notifHoverTimerRef.current = setTimeout(() => setNotifOpen(false), 180);
  };

  const markReadAndGo = (notif) => {
    if (!notif?.id) return;
    setNotifs((prev) =>
      prev.map((x) => Number(x.id) === Number(notif.id) ? { ...x, read_at: x.read_at || new Date().toISOString() } : x)
    );
    socketRef.current?.emit("notif:read", { notifId: notif.id });
    if (notif?.url) { setNotifOpen(false); setNavOpen(false); closeAllMenus(); navigate(notif.url); }
  };

  const goSelfCategory = (catId) => {
    closeAllMenus(); setNotifOpen(false); setNavOpen(false);
    navigate(`/self-comics?page=1&categoryId=${catId}`);
  };

  return (
    <header className="rk-header">

      {/* ════════════════════════════════════════
          MAIN NAV BAR
      ════════════════════════════════════════ */}
      <div className="rk-nav" ref={navRef}>

        {/* Brand */}
        <Link
          to="/"
          className="rk-brand"
          onClick={() => { closeAllMenus(); setNavOpen(false); }}
        >
          <img
            className="rk-logo"
            src="https://i.ibb.co/MxWp9rJW/logo-fotor-bg-remover-202603048410-2.png"
            alt="Readink logo"
          />
          <span className="rk-wordmark">
            <span className="rk-wordmark-r">R</span>eadink
          </span>
        </Link>

        {/* Desktop center — CategoryNav chips */}
        <div className="rk-desktop-nav">
          <CategoryNav
            visibleCategories={visibleCategories}
            moreCategories={moreCategories}
            otherCategories={otherCategories}
            otherCatLoading={otherCatLoading}
            otherCatErr={otherCatErr}
            moreOpen={moreOpen}
            textOpen={textOpen}
            setMoreOpen={setMoreOpen}
            setTextOpen={setTextOpen}
            onCategoryClick={() => { setNavOpen(false); closeAllMenus(); }}
            onSelfCategoryClick={goSelfCategory}
          />
        </div>

        {/* Right actions */}
        <div className="rk-nav-end">

          <NotificationDropdown
            user={user}
            unread={unread}
            notifs={notifs}
            notifOpen={notifOpen}
            notifWrapRef={notifWrapRef}
            onMouseEnter={openNotif}
            onMouseLeave={closeNotif}
            onToggle={() => setNotifOpen((v) => !v)}
            onRefresh={fetchNotifications}
            onMarkReadAndGo={markReadAndGo}
            setNotifOpen={setNotifOpen}
          />

          <UserMenuDropdown
            user={user}
            userMenuOpen={userMenuOpen}
            userMenuRef={userMenuRef}
            onToggle={() => setUserMenuOpen((v) => !v)}
            onLogout={handleLogout}
            setUserMenuOpen={setUserMenuOpen}
          />

          {/* Mobile hamburger */}
          <button
            className={`rk-hamburger ${navOpen ? "open" : ""}`}
            type="button"
            onClick={() => { setNavOpen((v) => { const next = !v; if (!next) closeAllMenus(); return next; }); }}
            aria-label="Toggle navigation"
            aria-expanded={navOpen}
          >
            <span className="rk-hamburger-line" />
            <span className="rk-hamburger-line" />
            <span className="rk-hamburger-line" />
          </button>

        </div>
      </div>

      {/* ════════════════════════════════════════
          MOBILE DRAWER — all categories as chips
      ════════════════════════════════════════ */}
      <div className={`rk-drawer ${navOpen ? "open" : ""}`} aria-hidden={!navOpen}>

        {/* Comic categories */}
        {categories.length > 0 && (
          <>
            <span className="rk-drawer-label">Comic Genres</span>
            <div className="rk-drawer-chips">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  className="rk-drawer-chip"
                  to={`/truyen?category=${cat.slug}`}
                  onClick={() => { setNavOpen(false); closeAllMenus(); }}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </>
        )}

        {catLoading && (
          <div className="rk-drawer-chips">
            <span className="rk-drawer-chip" style={{ opacity: .45, pointerEvents: "none" }}>Loading...</span>
          </div>
        )}

        {(categories.length > 0 || otherCategories.length > 0) && (
          <div className="rk-drawer-divider" />
        )}

        {/* Text novel categories */}
        <span className="rk-drawer-label">Novels</span>
        <div className="rk-drawer-chips">
          <Link
            className="rk-drawer-chip rk-drawer-chip--text"
            to="/self-comics?page=1"
            onClick={() => { setNavOpen(false); closeAllMenus(); }}
          >
            <i className="bi bi-journals" />
            All Novels
          </Link>

          {otherCatLoading ? (
            <span className="rk-drawer-chip" style={{ opacity: .45, pointerEvents: "none" }}>Loading...</span>
          ) : (
            otherCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className="rk-drawer-chip"
                onClick={() => goSelfCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))
          )}
        </div>

      </div>

      {/* ── Status feedback ── */}
      {catErr ? <div className="rk-cat-error">Category error: {catErr}</div> : null}

    </header>
  );
}
