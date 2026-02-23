const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const db = require("./db");

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:5173", "http://localhost:3000"],
      credentials: true,
    },
    transports: ["websocket", "polling"], 
  });


  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "") ||
        "";

      if (!token) {
        // không login vẫn cho connect (đọc comment/like), nhưng không cho tạo comment
        socket.user = null;
        return next();
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = { id: payload.id, role: payload.role }; // tùy payload của bạn
      return next();
    } catch (e) {
      socket.user = null;
      return next(); // không block connect
    }
  });

  io.on("connection", (socket) => {
    console.log("socket connected:", socket.id, "user:", socket.user?.id || "guest");

    socket.on("disconnect", (reason) => {
      console.log("socket disconnected:", socket.id, reason);
    });

    // Join/leave room theo chapterId
    socket.on("chapter:join", ({ chapterId }) => {
      if (!chapterId) return;
      socket.join(`chapter:${chapterId}`);
    });

    socket.on("chapter:leave", ({ chapterId }) => {
      if (!chapterId) return;
      socket.leave(`chapter:${chapterId}`);
    });

    socket.on("comment:create", async ({ chapterId, text, parentId }) => {
      try {
        const user = socket.user; 
        if (!user?.id) {
          socket.emit("comment:error", { message: "Bạn cần đăng nhập để bình luận" });
          return;
        }

        if (!chapterId || !String(text || "").trim()) return;

        const cleanText = String(text).trim();
        const pId = parentId ? Number(parentId) : null;

        const r = await db.query(
          `
          INSERT INTO chapter_comments (chapter_id, user_id, parent_id, text)
          VALUES ($1,$2,$3,$4)
          RETURNING id, chapter_id, parent_id, text, created_at
          `,
          [chapterId, user.id, pId, cleanText]
        );

        const u = await db.query(`SELECT username FROM users WHERE id=$1`, [user.id]);

        const comment = {
          ...r.rows[0],
          user_id: user.id,
          user_name: u.rows[0]?.username || "User",
        };

        io.to(`chapter:${chapterId}`).emit("comment:new", { chapterId, comment });
      } catch (e) {
        console.error("socket comment:create error:", e);
        socket.emit("comment:error", { message: "Server lỗi khi gửi bình luận" });
      }
    });
    
    socket.on("comment:delete", async ({ chapterId, commentId }) => {
      try {
        const user = socket.user;
        if (!user?.id) return;
        if (!chapterId || !commentId) return;

        const check = await db.query(
          `SELECT id, user_id, chapter_id FROM chapter_comments WHERE id=$1`,
          [commentId]
        );
        const row = check.rows[0];
        if (!row) return;

        // chỉ cho xoá comment của mình (hoặc admin)
        const isOwner = Number(row.user_id) === Number(user.id);
        const isAdmin = user.role === "admin";
        if (!isOwner && !isAdmin) return;

        await db.query(`DELETE FROM chapter_comments WHERE id=$1`, [commentId]);

        io.to(`chapter:${chapterId}`).emit("comment:deleted", {
          chapterId,
          commentId: Number(commentId),
        });
      } catch (e) {
        console.error("socket comment:delete error:", e);
      }
    });
    
    socket.on("reaction:toggle", async ({ chapterId }) => {
      try {
        if (!chapterId) return;

        const cnt = await db.query(
          `SELECT COUNT(*)::int AS cnt FROM chapter_reactions WHERE chapter_id=$1`,
          [chapterId]
        );

        io.to(`chapter:${chapterId}`).emit("reaction:update", {
          chapterId,
          likeCount: cnt.rows[0]?.cnt || 0,
        });
      } catch (e) {
        console.error("socket reaction:toggle error:", e);
      }
    });
  });

  return io;
}

module.exports = { initSocket };