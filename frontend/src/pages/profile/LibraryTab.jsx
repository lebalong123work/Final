import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:5000";

function fmtDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString("vi-VN");
}

function mapLibraryStatus(item) {
  if (item?.comic_type === "self") return Number(item?.status) === 1 ? "Visible" : "Hidden / Draft";
  const raw = String(item?.status || "").toLowerCase();
  if (raw === "ongoing") return "Ongoing";
  if (raw === "completed") return "Completed";
  return item?.status || "—";
}

function buildLastFavoriteText(item) {
  const chapterTitle = String(item?.last_chapter_title || "").trim();
  const chapterId = String(item?.last_chapter_id || "").trim();
  if (chapterTitle) return `Liked chap: ${chapterTitle}`;
  if (chapterId) return `Liked chap: ${chapterId}`;
  return "Added to favorites";
}

function buildLibraryCover(item) {
  if (!item?.cover_image) return "https://via.placeholder.com/500x700?text=No+Cover";
  if (item.comic_type === "self") {
    const cover = item.cover_image;
    if (cover.startsWith("http") || cover.startsWith("data:image")) return cover;
    if (cover.startsWith("/")) return `${API_BASE}${cover}`;
    return cover;
  }
  if (String(item.cover_image).startsWith("http")) return item.cover_image;
  return `https://img.otruyenapi.com/uploads/comics/${item.cover_image}`;
}

function buildReadUrl(item) {
  if (item?.comic_type === "self") {
    if (!item?.id) return "#";
    if (!item?.last_chapter_id) return `/self-comics/${item.id}`;
    return `/doc-self?comicId=${encodeURIComponent(item.id)}&chapterId=${encodeURIComponent(item.last_chapter_id)}`;
  }
  if (!item?.slug) return "#";
  const chapValue = item?.last_chapter_api || "";
  const comicId = item?.id || "";
  if (!chapValue) return `/truyen/${encodeURIComponent(item.slug)}`;
  return `/doc?slug=${encodeURIComponent(item.slug)}&chap=${encodeURIComponent(chapValue)}&comicId=${encodeURIComponent(comicId)}`;
}

function buildDetailUrl(item) {
  if (item?.comic_type === "self") return `/self-comics/${item?.id}`;
  return item?.slug ? `/truyen/${item.slug}` : "#";
}

export default function LibraryTab({ q, setQ, libraryLoading, libraryErr, filteredLibrary }) {
  const navigate = useNavigate();

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body">
        <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center">
          <h5 className="fw-bold m-0">Favorite Library</h5>
          <div className="pw-search input-group">
            <span className="input-group-text"><i className="bi bi-search" /></span>
            <input
              className="form-control" placeholder="Search in library..."
              value={q} onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        {libraryErr ? <div className="alert alert-danger mt-3 mb-0">{libraryErr}</div> : null}

        {libraryLoading ? (
          <div className="text-center text-secondary py-5">Loading library...</div>
        ) : (
          <div className="row g-3 mt-2">
            {filteredLibrary.map((c) => (
              <div className="col-12 col-sm-6 col-lg-3" key={`${c.comic_type}-${c.id}`}>
                <div className="pw-comic">
                  <div className="pw-comic-thumb">
                    <img src={buildLibraryCover(c)} alt={c.title} />
                    <span className="pw-comic-chip">{mapLibraryStatus(c)}</span>
                  </div>
                  <div className="mt-2">
                    <div className="fw-bold text-truncate" title={c.title}>{c.title}</div>
                    <div className="small text-secondary">{buildLastFavoriteText(c)}</div>
                    <div className="small text-secondary mt-1">Favorited at {fmtDate(c.favorited_at)}</div>
                    <div className="d-flex gap-2 mt-2">
                      <button className="btn btn-primary btn-sm w-100" type="button" onClick={() => navigate(buildReadUrl(c))}>
                        Read
                      </button>
                      <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => navigate(buildDetailUrl(c))} title="View details">
                        <i className="bi bi-three-dots" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {!libraryLoading && filteredLibrary.length === 0 && (
              <div className="text-center text-secondary py-5">No comics found in library</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
