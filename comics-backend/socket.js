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
* Build notification payload according to story type 
* comicKind: 
* - "external" 
* - "self" 
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
      title: "The author you follow has just posted a new novel.",
      body: comicName ? `${comicName}` : "There is a new comic available.",
      url: `/self-comics/${comicId}`,
    };
  }

  return {
    type: "NEW_COMIC",
    title: "The author you follow has just posted a new comic.",
    body: comicName ? `${comicName}` : "There is a new comic available.",
    url: `/truyen/${comicSlug}`,
  };
}

/**
 * Send notification to followers when an author posts a new comic
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
    socket.on("chapter:join", ({ chapterType, chapterId }) => {
      if (!chapterId) return;
      const room = chapterType
        ? `chapter:${chapterType}:${chapterId}`
        : `chapter:${chapterId}`;
      socket.join(room);
    });

    socket.on("chapter:leave", ({ chapterType, chapterId }) => {
      if (!chapterId) return;
      const room = chapterType
        ? `chapter:${chapterType}:${chapterId}`
        : `chapter:${chapterId}`;
      socket.leave(room);
    });

    // =========================
    // COMMENTS
    // REST API is the single source of truth for DB writes.
    // Socket handlers only rebroadcast the already-persisted data.
    // =========================
    socket.on("comment:create", ({ chapterType, chapterId, comment }) => {
      if (!chapterId || !comment) return;
      const room = chapterType
        ? `chapter:${chapterType}:${chapterId}`
        : `chapter:${chapterId}`;
      io.to(room).emit("comment:new", { chapterType, chapterId, comment });
    });

    socket.on("comment:delete", ({ chapterType, chapterId, commentId }) => {
      if (!chapterId || !commentId) return;
      const room = chapterType
        ? `chapter:${chapterType}:${chapterId}`
        : `chapter:${chapterId}`;
      io.to(room).emit("comment:deleted", {
        chapterType,
        chapterId,
        commentId: Number(commentId),
      });
    });

    // =========================
    // REACTIONS
    // REST API already toggled and returned updated counts.
    // Client forwards the result; socket rebroadcasts to room.
    // =========================
    socket.on("reaction:toggle", ({ chapterType, chapterId, likeCount, liked }) => {
      if (!chapterId) return;
      const room = chapterType
        ? `chapter:${chapterType}:${chapterId}`
        : `chapter:${chapterId}`;
      io.to(room).emit("reaction:update", {
        chapterType,
        chapterId,
        likeCount: Number(likeCount || 0),
        liked: !!liked,
      });
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