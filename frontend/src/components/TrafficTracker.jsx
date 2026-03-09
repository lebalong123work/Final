import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const API_BASE = "http://localhost:5000";

function getOrCreateSessionId() {
  let sid = localStorage.getItem("session_id");
  if (!sid) {
    sid = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem("session_id", sid);
  }
  return sid;
}

async function trackTraffic(pathname) {
  try {
    const sessionId = getOrCreateSessionId();

    await fetch(`${API_BASE}/api/traffic/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: pathname,
        sessionId,
        referer: document.referrer || "",
      }),
    });
  } catch (e) {
    console.error("track traffic error:", e);
  }
}

export default function TrafficTracker() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname + location.search;

    // bỏ qua admin/auth nếu muốn
    if (
      location.pathname.startsWith("/admin") ||
      location.pathname === "/login" ||
      location.pathname === "/register" ||
      location.pathname === "/forgot-password"
    ) {
      return;
    }

    trackTraffic(path);
  }, [location]);

  return null;
}