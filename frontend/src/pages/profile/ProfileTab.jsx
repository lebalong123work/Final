import { useNavigate } from "react-router-dom";

function fmtVND(n) { return new Intl.NumberFormat("vi-VN").format(Number(n || 0)) + " ₫"; }

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
  const API_BASE = "http://localhost:5000";
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

export default function ProfileTab({ me, balance, libraryLoading, quickLibrary, setTab }) {
  const navigate = useNavigate();

  return (
    <div className="row g-3">
      <div className="col-lg-7">
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <h5 className="fw-bold mb-3">Social Profile</h5>
            <div className="pw-info-grid">
              <div className="pw-info-item">
                <div className="text-secondary small">Name</div>
                <div className="fw-semibold">{me?.username}</div>
              </div>
              <div className="pw-info-item">
                <div className="text-secondary small">Email</div>
                <div className="fw-semibold">{me?.email}</div>
              </div>
              <div className="pw-info-item">
                <div className="text-secondary small">Phone</div>
                <div className="fw-semibold">{me?.phone || "-"}</div>
              </div>
              <div className="pw-info-item">
                <div className="text-secondary small">Wallet Balance</div>
                <div className="fw-semibold">{fmtVND(balance)}</div>
              </div>
            </div>
            <div className="alert alert-light border mt-3 mb-0">
              <i className="bi bi-info-circle me-2" />
              Tip: top up to increase your level and purchase comics.
            </div>
          </div>
        </div>
      </div>

      <div className="col-lg-5">
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <h5 className="fw-bold mb-3">Quick Library</h5>
            {libraryLoading ? (
              <div className="text-secondary">Loading library...</div>
            ) : quickLibrary.length === 0 ? (
              <div className="text-secondary">You have no comics in your library yet.</div>
            ) : (
              <div className="pw-mini-shelf">
                {quickLibrary.map((c) => (
                  <div className="pw-mini-item" key={`${c.comic_type}-${c.id}`}>
                    <img className="pw-mini-cover" src={buildLibraryCover(c)} alt={c.title} />
                    <div className="min-w-0">
                      <div className="fw-semibold text-truncate">{c.title}</div>
                      <div className="small text-secondary">{mapLibraryStatus(c)} • {buildLastFavoriteText(c)}</div>
                    </div>
                    <button className="btn btn-outline-primary btn-sm" type="button" onClick={() => navigate(buildReadUrl(c))}>
                      Read
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button className="btn btn-primary w-100 mt-3" type="button" onClick={() => setTab("library")}>
              View full library
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
