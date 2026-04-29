import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Carousel } from "bootstrap";
import "./featuredBanner.css";

const API_BASE = "http://localhost:5000";
const IMG_BASE = "https://img.otruyenapi.com/uploads/comics/";

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();

  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`API did not return JSON: ${url}`);
  }

  if (!res.ok) {
    throw new Error(json?.message || `HTTP ${res.status}`);
  }

  return json;
}

function buildCover(item) {
  if (!item?.cover_image) {
    return "https://via.placeholder.com/1200x500?text=No+Cover";
  }

  if (item.comic_type === "self") {
    const cover = item.cover_image;
    if (cover.startsWith("http")) return cover;
    if (cover.startsWith("data:image")) return cover;
    if (cover.startsWith("/")) return `${API_BASE}${cover}`;
    return cover;
  }

  if (String(item.cover_image).startsWith("http")) return item.cover_image;
  return `${IMG_BASE}${item.cover_image}`;
}

function buildDetailUrl(item) {
  if (item?.comic_type === "self") {
    return `/self-comics/${item?.id}`;
  }
  return `/truyen/${item?.slug}`;
}

function buildSubtitle(item, idx) {
  const topText =
    idx === 0 ? "Top 1 Most Read" : idx === 1 ? "Top 2 Featured" : "Top 3 Trending";

  let statusText = "Updating";
  if (item?.comic_type === "self") {
    statusText = Number(item?.status) === 1 ? "Visible" : "Hidden / Draft";
  } else {
    const raw = String(item?.status || "").toLowerCase();
    if (raw === "ongoing") statusText = "Ongoing";
    else if (raw === "completed") statusText = "Completed";
    else if (raw === "coming_soon") statusText = "Coming Soon";
  }

  return `${topText} • ${statusText} • ${Number(item?.read_count || 0)} reads`;
}

export default function FeaturedBanner() {
  const navigate = useNavigate();
  const carouselRef = useRef(null);
  const carouselInstanceRef = useRef(null);

  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setErr("");

        const data = await fetchJSON(`${API_BASE}/api/reading-history/top-comics?limit=3`);
        setSlides(Array.isArray(data?.data) ? data.data : []);
      } catch (e) {
        console.error(e);
        setErr(e.message || "Error loading banner");
        setSlides([]);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  useEffect(() => {
    if (!carouselRef.current) return;
    if (!slides.length) return;

    if (carouselInstanceRef.current) {
      carouselInstanceRef.current.dispose();
      carouselInstanceRef.current = null;
    }

    carouselInstanceRef.current = new Carousel(carouselRef.current, {
      interval: 3000,
      ride: "carousel",
      pause: false,
      wrap: true,
      touch: true,
    });

    carouselInstanceRef.current.cycle();

    return () => {
      if (carouselInstanceRef.current) {
        carouselInstanceRef.current.dispose();
        carouselInstanceRef.current = null;
      }
    };
  }, [slides]);

  if (loading) {
    return (
      <section className="fb-wrap">
        <div className="container-fluid px-4 py-4 text-secondary">Loading banner...</div>
      </section>
    );
  }

  if (err) {
    return (
      <section className="fb-wrap">
        <div className="container-fluid px-4 py-4">
          <div className="alert alert-danger mb-0">{err}</div>
        </div>
      </section>
    );
  }

  if (!slides.length) return null;

  return (
    <section className="fb-wrap">
      <div
        id="featuredCarousel"
        ref={carouselRef}
        className="carousel slide fb-carousel"
      >
        <div className="carousel-indicators">
          {slides.map((s, idx) => (
            <button
              key={`${s.comic_type}-${s.id}`}
              type="button"
              data-bs-target="#featuredCarousel"
              data-bs-slide-to={idx}
              className={idx === 0 ? "active" : ""}
              aria-current={idx === 0 ? "true" : "false"}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>

        <div className="carousel-inner">
          {slides.map((s, idx) => (
            <div
              key={`${s.comic_type}-${s.id}`}
              className={`carousel-item ${idx === 0 ? "active" : ""}`}
            >
              <div className="fb-slide">
                <img src={buildCover(s)} className="fb-bg-blur" alt="" aria-hidden="true" />
                <img src={buildCover(s)} className="fb-bg" alt={s.title} />
                <div className="fb-overlay" />

                <div className="fb-content container-fluid px-4">
                  <span className={`fb-badge fb-${String(s.badge || "top").toLowerCase()}`}>
                    {s.badge || "TOP"}
                  </span>

                  <h2 className="fb-title">{s.title}</h2>
                  <p className="fb-sub">{buildSubtitle(s, idx)}</p>

                  <div className="fb-actions">
                    <button
                      className="btn btn-primary fb-btn"
                      type="button"
                      onClick={() => navigate(buildDetailUrl(s))}
                    >
                     View details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          className="carousel-control-prev"
          type="button"
          data-bs-target="#featuredCarousel"
          data-bs-slide="prev"
          aria-label="Prev"
        >
          <span className="carousel-control-prev-icon" aria-hidden="true" />
        </button>

        <button
          className="carousel-control-next"
          type="button"
          data-bs-target="#featuredCarousel"
          data-bs-slide="next"
          aria-label="Next"
        >
          <span className="carousel-control-next-icon" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}