const TrafficModel = require("../../models/admin/traffic.model");

function normalizeText(v) { return String(v || "").trim(); }

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (Array.isArray(forwarded) && forwarded.length) return String(forwarded[0]).trim();
  if (typeof forwarded === "string" && forwarded.trim()) return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress || req.connection?.remoteAddress || "";
}

async function trackVisit(req, res) {
  try {
    const path = normalizeText(req.body.path);
    const sessionId = normalizeText(req.body.sessionId);
    const referer = normalizeText(req.body.referer);
    if (!path) return res.status(400).json({ message: "path is required" });
    if (!sessionId) return res.status(400).json({ message: "sessionId is required" });

    const visitKey = `${sessionId}::${path}`;
    const isDup = await TrafficModel.checkDuplicate(visitKey);
    if (isDup) return res.json({ success: true, dedup: true, message: "Recent traffic has been recorded." });

    await TrafficModel.insertVisit(path, sessionId, visitKey, null, normalizeText(getClientIp(req)), normalizeText(req.headers["user-agent"]), referer);
    return res.json({ success: true, message: "Recent traffic has been recorded." });
  } catch (err) {
    console.error("POST /api/traffic/track error:", err);
    return res.status(500).json({ message: "Server error when recording traffic" });
  }
}

async function getStats(req, res) {
  try {
    const data = await TrafficModel.getStats();
    return res.json({ success: true, data });
  } catch (err) {
    console.error("GET /api/traffic/stats error:", err);
    return res.status(500).json({ message: "Server error when fetching traffic statistics" });
  }
}

async function getDashboard(req, res) {
  try {
    const data = await TrafficModel.getDashboard();
    return res.json({ success: true, data });
  } catch (err) {
    console.error("GET /api/traffic/dashboard error:", err);
    return res.status(500).json({ message: "Server error when fetching traffic dashboard" });
  }
}

async function getPageViews(req, res) {
  try {
    const path = normalizeText(req.query.path);
    if (!path) return res.status(400).json({ message: "path is required" });
    const views = await TrafficModel.getPageViews(path);
    return res.json({ success: true, data: { path, views } });
  } catch (err) {
    console.error("GET /api/traffic/page error:", err);
    return res.status(500).json({ message: "Server error when fetching page views" });
  }
}

module.exports = { trackVisit, getStats, getDashboard, getPageViews };
