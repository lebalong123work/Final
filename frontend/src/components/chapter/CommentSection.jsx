import { useMemo, useRef } from "react";

export default function CommentSection({
  token,
  myId,
  comments,
  commentText,
  setCommentText,
  replyTo,
  setReplyTo,
  onSendComment,
  onDeleteComment,
}) {
  const listRef = useRef(null);

  const fmtTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("vi-VN");
  };

  const rootComments = useMemo(
    () => comments.filter((c) => !c.parent_id),
    [comments],
  );

  const repliesByParent = useMemo(() => {
    const map = new Map();
    for (const c of comments) {
      if (!c.parent_id) continue;
      const arr = map.get(c.parent_id) || [];
      arr.push(c);
      map.set(c.parent_id, arr);
    }
    return map;
  }, [comments]);

  return (
    <section className="rc-comments">
      {/* ── Header ── */}
      <div className="rc-commentsHead">
        <h3 className="rc-commentsTitle">
          <i className="bi bi-chat-left-text" />
          Comments
          {comments.length > 0 && (
            <span className="rc-commentCount">{comments.length}</span>
          )}
        </h3>
        <p className="rc-commentsHint">
          Comments are visible to everyone immediately.
        </p>
      </div>

      {/* ── Composer ── */}
      <div className="rc-composer">
        {replyTo ? (
          <div className="rc-replyTo">
            <span>
              <i className="bi bi-reply me-1" />
              Replying to <strong>{replyTo.replyName || "user"}</strong>
            </span>
            <button
              className="rc-x"
              onClick={() => setReplyTo(null)}
              type="button"
              aria-label="Cancel reply"
            >
              <i className="bi bi-x-lg" />
            </button>
          </div>
        ) : null}

        <textarea
          className="rc-input"
          rows={3}
          placeholder={token ? "Write your comment..." : "Log in to comment..."}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          disabled={!token}
        />

        <div className="rc-composerActions">
          <button
            className="rc-clearBtn"
            type="button"
            onClick={() => setCommentText("")}
            disabled={!token}
          >
            Clear
          </button>
          <button
            className="rc-sendBtn"
            type="button"
            onClick={onSendComment}
            disabled={!token || !commentText.trim()}
          >
            <i className="bi bi-send-fill" />
            Send
          </button>
        </div>
      </div>

      {/* ── Comment list ── */}
      <div className="rc-commentList rc-scroll5" ref={listRef}>
        {rootComments.length === 0 ? (
          <div className="rc-empty">
            <i className="bi bi-chat-square-dots" />
            <p>No comments yet. Be the first!</p>
          </div>
        ) : (
          rootComments.map((c) => {
            const replies = repliesByParent.get(c.id) || [];
            const isMine = Number(c.user_id) === Number(myId);

            return (
              <article className="rc-cmt" key={c.id}>
                <div className="rc-cmtAvatar">
                  <img
                    src={
                      c.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(c.user_name || "U")}&background=random`
                    }
                    alt="avt"
                  />
                </div>

                <div className="rc-cmtBody">
                  <div className="rc-cmtTop">
                    <span className="rc-cmtName">{c.user_name || "User"}</span>
                    <span className="rc-cmtTime">{fmtTime(c.created_at)}</span>
                  </div>

                  <p className="rc-cmtText">{c.text}</p>

                  <div className="rc-cmtActions">
                    <button
                      className="rc-linkBtn"
                      type="button"
                      onClick={() =>
                        setReplyTo({ rootId: c.id, replyName: c.user_name })
                      }
                      disabled={!token}
                    >
                      <i className="bi bi-reply" />
                      Reply
                    </button>

                    {isMine ? (
                      <button
                        className="rc-iconBtn danger"
                        type="button"
                        onClick={() => onDeleteComment(c.id)}
                        title="Delete comment"
                      >
                        <i className="bi bi-trash3" />
                      </button>
                    ) : null}
                  </div>

                  {replies.length ? (
                    <div className="rc-replies">
                      {replies.map((r) => {
                        const isMineReply = Number(r.user_id) === Number(myId);
                        return (
                          <div className="rc-reply" key={r.id}>
                            <div className="rc-replyTop">
                              <div>
                                <span className="rc-replyName">
                                  {r.user_name || "User"}
                                </span>{" "}
                                <span className="rc-replyTime">
                                  {fmtTime(r.created_at)}
                                </span>
                              </div>

                              {isMineReply ? (
                                <button
                                  className="rc-iconBtn danger"
                                  type="button"
                                  onClick={() => onDeleteComment(r.id)}
                                  title="Delete comment"
                                >
                                  <i className="bi bi-trash3" />
                                </button>
                              ) : null}
                            </div>

                            <p className="rc-replyText">{r.text}</p>

                            <div className="rc-replyActions">
                              <button
                                className="rc-linkBtn"
                                type="button"
                                onClick={() =>
                                  setReplyTo({
                                    rootId: c.id,
                                    replyName: r.user_name,
                                  })
                                }
                                disabled={!token}
                              >
                                <i className="bi bi-reply" />
                                Reply
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
