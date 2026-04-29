const express = require("express");
const router = express.Router();
const TrafficController = require("../controllers/admin/traffic.controller");

router.post("/track",     TrafficController.trackVisit);
router.get("/stats",      TrafficController.getStats);
router.get("/dashboard",  TrafficController.getDashboard);
router.get("/page",       TrafficController.getPageViews);

module.exports = router;
