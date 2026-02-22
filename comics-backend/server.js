require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const db = require("./db");
const levelsRoute = require("./routes/levels");
const meRoutes = require("./routes/me");
const walletRoutes = require("./routes/wallet");
const momoRoutes = require("./routes/momo");
const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", async (req, res) => {
  try {
    const r = await db.query("SELECT NOW() as now");
    res.json({ ok: true, now: r.rows[0].now });
  } catch (e) {
    res.status(500).json({ ok: false, message: "DB error" });
  }
});
app.use("/api/admin", require("./routes/adminExternalComics"));
app.use("/api/external-comics", require("./routes/externalComics"));
app.use("/api/purchases", require("./routes/purchaseComic"));
app.use("/api/purchases", require("./routes/purchases"));
app.use("/levels", levelsRoute);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/me", meRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/momo", momoRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port", PORT));
