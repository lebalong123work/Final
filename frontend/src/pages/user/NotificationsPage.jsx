import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import "./notifications.css";
import Header from "../../components/Header";

const API_BASE = "http://localhost:5000";

async function fetchJSON(url, options) {
  const res = await fetch(url, options);

  let json = null;
  try {
    json = await res.json();
  } catch {
    // nếu không phải JSON thì bỏ qua
  }

  if (!res.ok) {
    throw new Error(json?.message || `HTTP ${res.status}`);
  }

  return json;
}

export default function NotificationsPage() {
  const nav = useNavigate();

  const token = useMemo(() => localStorage.getItem("token") || "", []);
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);

  const fmtTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("vi-VN");
  };

  const loadAll = async () => {
    if (!token) return;
    try {
      setErr("");
      setLoading(true);

      const [listRes, unreadRes] = await Promise.all([
        fetchJSON(`${API_BASE}/api/notifications?limit=20`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetchJSON(`${API_BASE}/api/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setItems(Array.isArray(listRes?.data) ? listRes.data : []);
      setUnread(Number(unreadRes?.data?.unread || 0));
    } catch (e) {
      setErr(e.message || "Lỗi tải thông báo");
      setItems([]);
      setUnread(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    
  }, []);

  const markReadAndGo = async (n) => {
    if (!n?.id) return;

    // optimistic UI
    setItems((prev) =>
      prev.map((x) => (Number(x.id) === Number(n.id) ? { ...x, read_at: x.read_at || new Date().toISOString() } : x))
    );
    setUnread((u) => Math.max(0, u - (n.read_at ? 0 : 1)));

    try {
      const r = await fetchJSON(`${API_BASE}/api/notifications/${n.id}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setUnread(Number(r?.data?.unread || 0));
    } catch {
      // 
    }

    if (n?.url) nav(n.url);
  };

  if (!token || !user?.id) {
    return (
      <div>
        <Header/>
        <div className="nt-wrap container py-4">
          <div className="nt-card">
            <div className="nt-head">
              <div className="nt-title">
                <i className="bi bi-bell-fill me-2" />
                Thông báo
              </div>
            </div>
            <div className="nt-empty">
              <i className="bi bi-shield-lock" />
              <div className="fw-bold mt-2">Bạn cần đăng nhập</div>
              <div className="text-secondary">Đăng nhập để xem thông báo của bạn.</div>
              <div className="mt-3">
                <Link className="btn btn-dark" to="/login">
                  <i className="bi bi-box-arrow-in-right me-2" />
                  Đăng nhập
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />

      <div className="nt-wrap container py-4">
        <div className="nt-card">
          <div className="nt-head">
            <div className="nt-title">
              <i className="bi bi-bell-fill me-2" />
              Thông báo
            </div>

            <div className="nt-actions">
              <span className={`nt-badge ${unread > 0 ? "on" : ""}`}>
                {unread > 0 ? `${unread} chưa đọc` : "Đã đọc hết"}
              </span>

              <button className="btn btn-outline-dark btn-sm" onClick={loadAll} disabled={loading} type="button">
                <i className={`bi ${loading ? "bi-arrow-repeat" : "bi-arrow-clockwise"} me-2`} />
                Tải lại
              </button>
            </div>
          </div>

          {err ? (
            <div className="alert alert-danger m-3">
              <i className="bi bi-exclamation-triangle me-2" />
              {err}
            </div>
          ) : null}

          {loading ? (
            <div className="nt-loading">
              <div className="spinner-border spinner-border-sm" />
              <span>Đang tải thông báo...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="nt-empty">
              <i className="bi bi-inbox" />
              <div className="fw-bold mt-2">Chưa có thông báo</div>
              <div className="text-secondary">Khi có thông báo mới, nó sẽ xuất hiện ở đây.</div>
            </div>
          ) : (
            <div className="nt-list">
              {items.map((n) => {
                const isUnread = !n.read_at;
                return (
                  <button
                    key={n.id}
                    type="button"
                    className={`nt-item ${isUnread ? "unread" : ""}`}
                    onClick={() => markReadAndGo(n)}
                  >
                    <div className="nt-itemTop">
                      <div className="nt-itemTitle">
                        {isUnread ? <span className="nt-dot" /> : null}
                        {n.title || "Thông báo"}
                      </div>
                      <div className="nt-time">{fmtTime(n.created_at)}</div>
                    </div>

                    {n.body ? <div className="nt-body">{n.body}</div> : null}

                    <div className="nt-meta">
                      {n.actor_username ? (
                        <span className="nt-metaChip">
                          <i className="bi bi-person me-1" />
                          {n.actor_username}
                        </span>
                      ) : null}

                      {n.type ? (
                        <span className="nt-metaChip">
                          <i className="bi bi-tag me-1" />
                          {n.type}
                        </span>
                      ) : null}

                      {n.url ? (
                        <span className="nt-metaLink">
                          Mở <i className="bi bi-chevron-right ms-1" />
                        </span>
                      ) : (
                        <span className="text-secondary small">—</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}