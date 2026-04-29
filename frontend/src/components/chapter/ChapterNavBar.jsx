import { Link } from "react-router-dom";

export default function ChapterNavBar({
  slug,
  comicName,
  chapterName,
  prevChap,
  nextChap,
  onGoChap,
}) {
  return (
    <nav className="rc-topbar">
      <div className="rc-topbar-inner">
        <Link className="rc-back" to={`/truyen/${slug}`}>
          <span className="rc-back-icon">
            <i className="bi bi-arrow-left" />
          </span>
          <span className="rc-back-label">Back to comic</span>
        </Link>

        <div className="rc-title">
          <div className="rc-comic">{comicName || "—"}</div>
          <div className="rc-chap">
            <i className="bi bi-bookmark-fill" />
            Chap {chapterName || ""}
          </div>
        </div>

        <div className="rc-nav">
          <button
            className="rc-navBtn"
            disabled={!prevChap}
            onClick={() => prevChap && onGoChap(prevChap.api)}
            title="Previous chap"
          >
            <i className="bi bi-chevron-left" />
            <span className="rc-navLabel">Prev</span>
          </button>

          <button
            className="rc-navBtn"
            disabled={!nextChap}
            onClick={() => nextChap && onGoChap(nextChap.api)}
            title="Next chap"
          >
            <span className="rc-navLabel">Next</span>
            <i className="bi bi-chevron-right" />
          </button>
        </div>
      </div>
    </nav>
  );
}
