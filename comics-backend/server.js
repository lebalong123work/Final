require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const db = require("./db");

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

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port", PORT));
