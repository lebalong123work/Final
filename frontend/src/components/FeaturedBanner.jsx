import "./featuredBanner.css";

const slides = [
  {
    id: 1,
    title: "Hệ Thống Bá Đạo",
    subtitle: "Top 1 tuần • Full HD",
    cover:
      "https://cdn-media.sforum.vn/storage/app/media/wp-content/uploads/2022/05/Destiny-Girl-codes.jpg",
    badge: "HOT",
  },
  {
    id: 2,
    title: "Ta Có Một Thành Phố",
    subtitle: "Đang phát hành • Chap mới",
    cover:
      "https://cdn-media.sforum.vn/storage/app/media/wp-content/uploads/2022/05/Destiny-Girl-codes.jpg",
    badge: "NEW",
  },
  {
    id: 3,
    title: "Kiếm Thần Trở Lại",
    subtitle: "Hành động • Tu tiên",
    cover:
      "https://cdn-media.sforum.vn/storage/app/media/wp-content/uploads/2022/05/Destiny-Girl-codes.jpg",
    badge: "TOP",
  },
];

export default function FeaturedBanner() {
  return (
    <section className="fb-wrap">
      <div
        id="featuredCarousel"
        className="carousel slide fb-carousel"
        data-bs-ride="carousel"
        data-bs-interval="3000"
        data-bs-pause="false"
      >
        {/* Indicators */}
        <div className="carousel-indicators">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              data-bs-target="#featuredCarousel"
              data-bs-slide-to={idx}
              className={idx === 0 ? "active" : ""}
              aria-current={idx === 0 ? "true" : "false"}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Slides */}
        <div className="carousel-inner">
          {slides.map((s, idx) => (
            <div
              key={s.id}
              className={`carousel-item ${idx === 0 ? "active" : ""}`}
            >
              <div className="fb-slide">
                {/* Background image */}
                <img src={s.cover} className="fb-bg" alt={s.title} />

                {/* overlay */}
                <div className="fb-overlay" />

                {/* content */}
                <div className="fb-content container-fluid px-4">
                  <span className={`fb-badge fb-${s.badge.toLowerCase()}`}>
                    {s.badge}
                  </span>

                  <h2 className="fb-title">{s.title}</h2>
                  <p className="fb-sub">{s.subtitle}</p>

                  <div className="fb-actions">
                    <button className="btn btn-primary fb-btn">
                      Đọc ngay
                    </button>
                    <button className="btn btn-outline-light fb-btn">
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
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
