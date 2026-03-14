const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const db = require("./db");

function getUserFromToken(token) {
  try {
    if (!token) return null;
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return {
      id: payload.id,
      role: payload.role || payload.role_id || "user",
    };
  } catch {
    return null;
  }
}

/**
 * Build payload notification theo loại truyện
 * comicKind:
 *   - "external"
 *   - "self"
 */
function buildComicNotificationPayload({
  comicKind,
  comicSlug,
  comicId,
  comicName,
}) {
  if (comicKind === "self") {
    return {
      type: "NEW_SELF_COMIC",
      title: "Tác giả bạn theo dõi vừa đăng truyện chữ mới",
      body: comicName ? `${comicName}` : "Có truyện chữ mới",
      url: `/self-comics/${comicId}`,
    };
  }

  return {
    type: "NEW_COMIC",
    title: "Tác giả bạn theo dõi vừa đăng truyện mới",
    body: comicName ? `${comicName}` : "Có truyện mới",
    url: `/truyen/${comicSlug}`,
  };
}

/**
 * Gửi thông báo cho follower khi tác giả đăng truyện mới
 *
 * payload:
 * {
 *   ownerUserId: number,
 *   comicKind: "external" | "self",
 *   comicSlug?: string,
 *   comicId?: number,
 *   comicName?: string
 * }
 */
async function notifyFollowersNewComic(
  io,
  { ownerUserId, comicKind = "external", comicSlug, comicId, comicName }
) {
  if (!ownerUserId) return;

  if (comicKind === "external" && !comicSlug) {
    console.warn("notifyFollowersNewComic: thiếu comicSlug cho external comic");
    return;
  }

  if (comicKind === "self" && !comicId) {
    console.warn("notifyFollowersNewComic: thiếu comicId cho self comic");
    return;
  }

  const fr = await db.query(
    `
    SELECT follower_id
    FROM user_follows
    WHERE followee_id = $1
    `,
    [ownerUserId]
  );

  const followers = fr.rows.map((x) => Number(x.follower_id)).filter(Boolean);
  if (!followers.length) return;

  const { type, title, body, url } = buildComicNotificationPayload({
    comicKind,
    comicSlug,
    comicId,
    comicName,
  });

  for (const uid of followers) {
    const r = await db.query(
      `
      INSERT INTO notifications (
        user_id,
        actor_user_id,
        type,
        title,
        body,
        url,
        created_at,
        read_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,NOW(),NULL)
      RETURNING id, user_id, actor_user_id, type, title, body, url, created_at, read_at
      `,
      [uid, ownerUserId, type, title, body, url]
    );

    const notif = r.rows[0];

    io.to(`user:${uid}`).emit("notif:new", { notification: notif });
    io.to(`user:${uid}`).emit("notif:updated", { notification: notif });

    const cnt = await db.query(
      `
      SELECT COUNT(*)::int AS unread
      FROM notifications
      WHERE user_id = $1 AND read_at IS NULL
      `,
      [uid]
    );

    io.to(`user:${uid}`).emit("notif:unread", {
      unread: cnt.rows[0]?.unread || 0,
    });
  }
}

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

      const user = getUserFromToken(token);
      socket.user = user;
      return next();
    } catch {
      socket.user = null;
      return next();
    }
  });

  io.on("connection", (socket) => {
    console.log("socket connected:", socket.id, "user:", socket.user?.id || "guest");

    if (socket.user?.id) {
      socket.join(`user:${socket.user.id}`);
    }

    socket.on("disconnect", (reason) => {
      console.log("socket disconnected:", socket.id, reason);
    });

    // =========================
    // CHAPTER ROOMS
    // =========================
    socket.on("chapter:join", ({ chapterId }) => {
      if (!chapterId) return;
      socket.join(`chapter:${chapterId}`);
    });

    socket.on("chapter:leave", ({ chapterId }) => {
      if (!chapterId) return;
      socket.leave(`chapter:${chapterId}`);
    });

    // =========================
    // COMMENTS
    // =========================
    socket.on("comment:create", async ({ chapterId, text, parentId }) => {
      try {
        const user = socket.user;
        if (!user?.id) {
          socket.emit("comment:error", {
            message: "Bạn cần đăng nhập để bình luận",
          });
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

        const u = await db.query(`SELECT username FROM users WHERE id = $1`, [user.id]);

        const comment = {
          ...r.rows[0],
          user_id: user.id,
          user_name: u.rows[0]?.username || "User",
        };

        io.to(`chapter:${chapterId}`).emit("comment:new", {
          chapterId,
          comment,
        });
      } catch (e) {
        console.error("socket comment:create error:", e);
        socket.emit("comment:error", {
          message: "Server lỗi khi gửi bình luận",
        });
      }
    });

    socket.on("comment:delete", async ({ chapterId, commentId }) => {
      try {
        const user = socket.user;
        if (!user?.id) return;
        if (!chapterId || !commentId) return;

        const check = await db.query(
          `SELECT id, user_id, chapter_id FROM chapter_comments WHERE id = $1`,
          [commentId]
        );

        const row = check.rows[0];
        if (!row) return;

        const isOwner = Number(row.user_id) === Number(user.id);
        const isAdmin = user.role === "admin" || user.role === 2;
        if (!isOwner && !isAdmin) return;

        await db.query(`DELETE FROM chapter_comments WHERE id = $1`, [commentId]);

        io.to(`chapter:${chapterId}`).emit("comment:deleted", {
          chapterId,
          commentId: Number(commentId),
        });
      } catch (e) {
        console.error("socket comment:delete error:", e);
      }
    });

    // =========================
    // REACTIONS
    // =========================
    socket.on("reaction:toggle", async ({ chapterId }) => {
      try {
        if (!chapterId) return;

        const cnt = await db.query(
          `SELECT COUNT(*)::int AS cnt FROM chapter_reactions WHERE chapter_id = $1`,
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

    // =========================
    // NOTIFICATIONS
    // =========================
    socket.on("notif:unread:get", async () => {
      try {
        const me = socket.user;
        if (!me?.id) return;

        const cnt = await db.query(
          `
          SELECT COUNT(*)::int AS unread
          FROM notifications
          WHERE user_id = $1 AND read_at IS NULL
          `,
          [me.id]
        );

        socket.emit("notif:unread", {
          unread: cnt.rows[0]?.unread || 0,
        });
      } catch (e) {
        console.error("notif:unread:get error", e);
      }
    });

    socket.on("notif:read", async ({ notifId }) => {
      try {
        const me = socket.user;
        if (!me?.id || !notifId) return;

        await db.query(
          `UPDATE notifications SET read_at = NOW() WHERE id = $1 AND user_id = $2`,
          [Number(notifId), me.id]
        );

        const cnt = await db.query(
          `
          SELECT COUNT(*)::int AS unread
          FROM notifications
          WHERE user_id = $1 AND read_at IS NULL
          `,
          [me.id]
        );

        io.to(`user:${me.id}`).emit("notif:unread", {
          unread: cnt.rows[0]?.unread || 0,
        });
      } catch (e) {
        console.error("notif:read error", e);
      }
    });

    /**
     * INTERNAL EVENT:
     * - external comic
     * - self comic
     *
     * payload ví dụ external:
     * {
     *   ownerUserId: 16,
     *   comicKind: "external",
     *   comicSlug: "ten-truyen",
     *   comicName: "Tên truyện"
     * }
     *
     * payload ví dụ self:
     * {
     *   ownerUserId: 16,
     *   comicKind: "self",
     *   comicId: 2,
     *   comicName: "Tên truyện chữ"
     * }
     */
    socket.on(
      "internal:new_comic",
      async ({ ownerUserId, comicKind, comicSlug, comicId, comicName }) => {
        try {
          const me = socket.user;
          const isAdmin = me?.role === "admin" || me?.role === 2;
          if (!isAdmin) return;

          await notifyFollowersNewComic(io, {
            ownerUserId,
            comicKind,
            comicSlug,
            comicId,
            comicName,
          });
        } catch (e) {
          console.error("internal:new_comic error", e);
        }
      }
    );
  });

  // expose helper cho routes gọi trực tiếp
  io.notifyFollowersNewComic = (payload) => notifyFollowersNewComic(io, payload);

  return io;
}

module.exports = { initSocket };