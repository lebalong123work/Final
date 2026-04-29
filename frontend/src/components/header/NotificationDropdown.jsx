import { Link } from "react-router-dom";

function getNotifMeta(n) {
  const type = String(n?.type || "").toUpperCase();
  if (type === "NEW_SELF_COMIC")
    return {
      label: "New Novel",
      icon: "bi bi-journal-text",
      badgeClass: "self",
    };
  if (type === "NEW_COMIC")
    return { label: "New Comic", icon: "bi bi-book", badgeClass: "comic" };
  return { label: "Notification", icon: "bi bi-bell", badgeClass: "default" };
}

export default function NotificationDropdown({
  user,
  unread,
  notifs,
  notifOpen,
  notifWrapRef,
  onMouseEnter,
  onMouseLeave,
  onToggle,
  onRefresh,
  onMarkReadAndGo,
  setNotifOpen,
}) {
  const fmtTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("vi-VN");
  };

  return (
    <div
      className="rk-notif-wrap"
      ref={notifWrapRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* ── Bell trigger ── */}
      <button
        className="rk-notif-btn"
        type="button"
        onClick={onToggle}
        title={user ? "Notifications" : "Log in to receive notifications"}
        disabled={!user}
        aria-label="Notifications"
      >
        <i className="bi bi-bell" />
        {user && unread > 0 ? (
          <span className="rk-notif-badge">{unread > 99 ? "99+" : unread}</span>
        ) : null}
      </button>

      {/* ── Panel ── */}
      {notifOpen && user ? (
        <div className="rk-notif-panel">
          <div className="rk-notif-head">
            <div className="rk-notif-title">
              <i className="bi bi-bell-fill" />
              Notifications
            </div>
            <button
              className="rk-notif-refresh"
              type="button"
              onClick={onRefresh}
              title="Refresh"
              aria-label="Refresh notifications"
            >
              <i className="bi bi-arrow-clockwise" />
            </button>
          </div>

          <div className="rk-notif-list">
            {notifs.length === 0 ? (
              <div className="rk-notif-empty">
                <i className="bi bi-inbox" />
                <p>No notifications yet.</p>
              </div>
            ) : (
              notifs.map((n) => {
                const isUnread = !n.read_at;
                const meta = getNotifMeta(n);
                return (
                  <button
                    key={n.id}
                    type="button"
                    className={`rk-notif-item ${isUnread ? "unread" : ""}`}
                    onClick={() => onMarkReadAndGo(n)}
                  >
                    <div className="rk-notif-item-top">
                      <div className="rk-notif-item-title">
                        {isUnread ? <span className="rk-notif-dot" /> : null}
                        <i className={meta.icon} />
                        {n.title || "Notification"}
                      </div>
                      <div className="rk-notif-time">
                        {fmtTime(n.created_at)}
                      </div>
                    </div>

                    <div className="rk-notif-meta">
                      <span
                        className={`rk-notif-type-badge ${meta.badgeClass}`}
                      >
                        {meta.label}
                      </span>
                    </div>

                    {n.body ? (
                      <div className="rk-notif-body">{n.body}</div>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>

          <div className="rk-notif-foot">
            <Link
              className="rk-notif-all"
              to="/notifications"
              onClick={() => setNotifOpen(false)}
            >
              View all
              <i className="bi bi-arrow-right" />
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
