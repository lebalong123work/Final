import { useMemo, useState } from "react";
import "./comicSlider.css";

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function ComicSlider({
  title = "Truyện Sắp Ra Mắt",
  items = [],
  perPage = 4, 
}) {
  const pages = useMemo(() => chunk(items, perPage), [items, perPage]);
  const [page, setPage] = useState(0);

  const prev = () => setPage((p) => (p - 1 + pages.length) % pages.length);
  const next = () => setPage((p) => (p + 1) % pages.length);

  const current = pages[page] || [];

  return (
    <section className="cs-wrap">
      <div className="d-flex align-items-center justify-content-between mb-3 py-3">
        <h5 className="cs-title m-0">{title}</h5>

        <div className="cs-controls d-none d-md-flex gap-2">
          <button className="btn cs-btn" onClick={prev} aria-label="Prev">
            <i className="bi bi-chevron-left" />
          </button>
          <button className="btn cs-btn" onClick={next} aria-label="Next">
            <i className="bi bi-chevron-right" />
          </button>
        </div>
      </div>

      <div className="position-relative py-3">
     
        <button
          className="cs-fab cs-fab-left"
          onClick={prev}
          aria-label="Prev"
        >
          <i className="bi bi-chevron-left" />
        </button>

        <button
          className="cs-fab cs-fab-right"
          onClick={next}
          aria-label="Next"
        >
          <i className="bi bi-chevron-right" />
        </button>

        {/* Grid 4 columns */}
        <div className="row g-3">
          {current.map((c) => (
            <div key={c.id} className="col-12 col-sm-6 col-lg-3">
              <div className="cs-card">
                <div className="cs-thumb">
                  <img src={c.cover} alt={c.name} />
                  <div className="cs-tags">
                    {(c.tags || []).slice(0, 2).map((t) => (
                      <span key={t} className="cs-tag">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="cs-body">
                  <div className="cs-name" title={c.name}>
                    {c.name}
                  </div>
                  <div className="cs-update">
                    Cập nhật <span>{c.updated}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dots */}
        <div className="cs-dots mt-3">
          {pages.map((_, idx) => (
            <button
              key={idx}
              className={`cs-dot ${idx === page ? "active" : ""}`}
              onClick={() => setPage(idx)}
              aria-label={`Page ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
