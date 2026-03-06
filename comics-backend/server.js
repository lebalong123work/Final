require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http"); 
const selfComicsRoutes = require("./routes/selfComics");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const db = require("./db");
const levelsRoute = require("./routes/levels");
const meRoutes = require("./routes/me");
const walletRoutes = require("./routes/wallet");
const momoRoutes = require("./routes/momo");
const commentsRoutes = require("./routes/comments");
const reactionsRoutes = require("./routes/reactions");
const followsRoutes = require("./routes/follows");
const ratingsRoutes = require("./routes/ratings")
const notificationsRoutes = require("./routes/notifications");
const adminFinanceRoutes = require("./routes/adminFinance");
const selfChaptersRoutes = require("./routes/selfChapters");

const { initSocket } = require("./socket");

const app = express();

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}));
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));


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
app.use("/api/comments", commentsRoutes);
app.use("/api/reactions", reactionsRoutes);
app.use("/api/follows", followsRoutes);
app.use("/api/ratings", ratingsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/admin", require("./routes/adminUsers"));
app.use("/api/admin", adminFinanceRoutes);
app.use("/api/categories", require("./routes/categories"));
app.use("/api/self-comics", selfComicsRoutes);
app.use("/api/self-chapters", selfChaptersRoutes);
const PORT = process.env.PORT || 5000;



const server = http.createServer(app);

const io = initSocket(server);

app.set("io", io);
server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});