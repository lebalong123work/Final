import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import "./header.css";
import { io } from "socket.io-client";

const API_BASE = "http://localhost:5000";

export default function Header() {
  const navigate = useNavigate();

  const [tick, setTick] = useState(0);

  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error("Parse user error:", e);
      return null;
    }
  }, [tick]);

  const token = useMemo(() => localStorage.getItem("token") || "", [tick]);

  
  const [notifOpen, setNotifOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [notifs, setNotifs] = useState([]); // [{id,title,body,url,created_at,read_at,...}]

  const socketRef = useRef(null);
  const notifHoverTimerRef = useRef(null);

  // storage sync giữa nhiều tab
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "user" || e.key === "token") setTick((t) => t + 1);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // đóng socket
    if (socketRef.current) {
      try {
        socketRef.current.disconnect();
      } catch {
        //
      }
      socketRef.current = null;
    }

    setUnread(0);
    setNotifs([]);
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
      if (r.ok && Array.isArray(j?.data)) {
        setNotifs(j.data);
      }
    } catch  {
      // ignore
    }
  };

 
  useEffect(() => {
   
    if (!token || !user?.id) {
   
      if (socketRef.current) {
        try {
          socketRef.current.disconnect();
        } catch {
          //
        }
        socketRef.current = null;
      }
      setUnread(0);
      setNotifs([]);
      return;
    }

    // tạo socket 1 lần
    if (!socketRef.current) {
      socketRef.current = io(API_BASE, {
        transports: ["websocket", "polling"],
        withCredentials: true,
        auth: { token },
      });

      socketRef.current.on("connect", () => {
        // hỏi unread ngay khi connect
        socketRef.current?.emit("notif:unread:get");
      });

      socketRef.current.on("connect_error", (e) => {
        console.log("socket connect_error:", e.message);
      });
    } else {
      // cập nhật token nếu đổi
      socketRef.current.auth = { token };
      if (!socketRef.current.connected) socketRef.current.connect();
    }

    const s = socketRef.current;

    // unread badge realtime
    const onUnread = (payload) => {
      if (typeof payload?.unread === "number") setUnread(payload.unread);
    };

    // notif realtime: new / updated
    const onNotifNew = (payload) => {
      const n = payload?.notification;
      if (!n?.id) return;
      setNotifs((prev) => {
        // upsert theo id + đưa lên đầu
        const existedIdx = prev.findIndex((x) => Number(x.id) === Number(n.id));
        const copy = [...prev];
        if (existedIdx >= 0) copy.splice(existedIdx, 1);
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
        // đưa lên đầu cho “mới nhất”
        copy.splice(idx, 1);
        copy.unshift(copy[idx] || n);
        return copy;
      });
    };

    s.on("notif:unread", onUnread);
    s.on("notif:new", onNotifNew);
    s.on("notif:updated", onNotifUpdated);

    // load list lần đầu (REST)
    fetchNotifications();

    return () => {
      s.off("notif:unread", onUnread);
      s.off("notif:new", onNotifNew);
      s.off("notif:updated", onNotifUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.id]);

  // =========================
  // ✅ UI: hover open/close dropdown notification
  // =========================
  const openNotif = () => {
    if (notifHoverTimerRef.current) clearTimeout(notifHoverTimerRef.current);
    setNotifOpen(true);
  };
  const closeNotif = () => {
    if (notifHoverTimerRef.current) clearTimeout(notifHoverTimerRef.current);
    // delay nhẹ để user rê chuột xuống list không bị đóng
    notifHoverTimerRef.current = setTimeout(() => setNotifOpen(false), 180);
  };

  
  const markReadAndGo = (notif) => {
    if (!notif?.id) return;

   
    setNotifs((prev) =>
      prev.map((x) =>
        Number(x.id) === Number(notif.id)
          ? { ...x, read_at: x.read_at || new Date().toISOString() }
          : x
      )
    );


    socketRef.current?.emit("notif:read", { notifId: notif.id });


    if (notif?.url) {
      setNotifOpen(false);
      navigate(notif.url);
    }
  };

  const fmtTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("vi-VN");
  };

  return (
    <header className="zt-header border-bottom bg-white">
      <nav className="navbar navbar-expand-lg navbar-light">
        <div className="container-fluid px-4">
          {/* Brand */}
          <Link to="/" className="navbar-brand d-flex align-items-center gap-2">
            <div className="d-flex align-items-center gap-2 mb-0">
              <img
                src="https://www.zettruyen.space/images/logo.webp"
                alt="Ztruyen Logo"
                className="hero-logo"
              />
              <span className="brand-text">
                <span className="brand-z">Z</span>truyện
              </span>
            </div>
          </Link>

          {/* Toggle */}
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#ztNav"
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div className="collapse navbar-collapse" id="ztNav">
            {/* Menu */}
            <ul className="navbar-nav mx-auto mb-2 mb-lg-0 zt-nav">
              <li className="nav-item">
                <NavLink className="nav-link" to="#">
                  Thể loại
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="#">
                  Đang phát hành
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="#">
                  Hoàn thành
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="#">
                  Sắp ra mắt
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="#">
                  Truyện mới
                </NavLink>
              </li>
            </ul>

            {/* Search + Notifications + User */}
            <div className="d-flex align-items-center gap-3">
              {/* Search */}
              <form
                className="d-flex align-items-center zt-search"
                onSubmit={(e) => e.preventDefault()}
              >
                <div className="input-group zt-search-group">
                  <input
                    type="search"
                    className="form-control zt-search-input"
                    placeholder="Tìm truyện..."
                  />
                  <button className="btn zt-search-btn" type="button">
                    <i className="bi bi-search" />
                  </button>
                </div>
              </form>

              {/* 🔔 Notifications */}
              <div
                className="zt-notifWrap"
                onMouseEnter={openNotif}
                onMouseLeave={closeNotif}
              >
                <button
                  className="btn zt-notifBtn"
                  type="button"
                  onClick={() => setNotifOpen((v) => !v)}
                  title={user ? "Thông báo" : "Đăng nhập để nhận thông báo"}
                  disabled={!user}
                >
                  <i className="bi bi-bell fs-5" />
                  {user && unread > 0 ? (
                    <span className="zt-notifBadge">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  ) : null}
                </button>

                {/* dropdown */}
                {notifOpen && user ? (
                  <div className="zt-notifDropdown">
                    <div className="zt-notifHead">
                      <div className="zt-notifTitle">
                        <i className="bi bi-bell-fill me-2" />
                        Thông báo
                      </div>
                      <button
                        className="zt-notifRefresh"
                        type="button"
                        onClick={fetchNotifications}
                        title="Tải lại"
                      >
                        <i className="bi bi-arrow-clockwise" />
                      </button>
                    </div>

                    <div className="zt-notifList">
                      {notifs.length === 0 ? (
                        <div className="zt-notifEmpty">
                          <i className="bi bi-inbox" />
                          <div>Chưa có thông báo.</div>
                        </div>
                      ) : (
                        notifs.map((n) => {
                          const isUnread = !n.read_at;
                          return (
                            <button
                              key={n.id}
                              type="button"
                              className={`zt-notifItem ${isUnread ? "unread" : ""}`}
                              onClick={() => markReadAndGo(n)}
                            >
                              <div className="zt-notifItemTop">
                                <div className="zt-notifItemTitle">
                                  {isUnread ? <span className="dot" /> : null}
                                  {n.title || "Thông báo"}
                                </div>
                                <div className="zt-notifItemTime">
                                  {fmtTime(n.created_at)}
                                </div>
                              </div>
                              {n.body ? (
                                <div className="zt-notifItemBody">{n.body}</div>
                              ) : null}
                            </button>
                          );
                        })
                      )}
                    </div>

                    <div className="zt-notifFoot">
                      <Link className="zt-notifAll" to="/notifications" onClick={() => setNotifOpen(false)}>
                        Xem tất cả <i className="bi bi-chevron-right ms-1" />
                      </Link>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* User Dropdown */}
              <div className="dropdown">
                <button
                  className="btn user-btn dropdown-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                >
                  <i className="bi bi-person-circle fs-4 me-1"></i>
                  {user ? user.username : ""}
                </button>

                <ul className="dropdown-menu dropdown-menu-end">
                  {!user && (
                    <>
                      <li>
                        <Link className="dropdown-item" to="/login">
                          <i className="bi bi-box-arrow-in-right me-2"></i>
                          Đăng nhập
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/register">
                          <i className="bi bi-person-plus me-2"></i>
                          Đăng ký
                        </Link>
                      </li>
                    </>
                  )}

                  {user && (
                    <>
                      <li>
                        <Link className="dropdown-item" to="/profile">
                          <i className="bi bi-person me-2"></i>
                          Trang cá nhân
                        </Link>
                      </li>

                      {user.role === "admin" && (
                        <li>
                          <Link className="dropdown-item text-danger" to="/admin">
                            <i className="bi bi-speedometer2 me-2"></i>
                            Quản trị
                          </Link>
                        </li>
                      )}

                      <li>
                        <hr className="dropdown-divider" />
                      </li>

                      <li>
                        <button className="dropdown-item" onClick={handleLogout}>
                          <i className="bi bi-box-arrow-right me-2"></i>
                          Đăng xuất
                        </button>
                      </li>
                    </>
                  )}
                </ul>
              </div>
              {/* end user dropdown */}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}