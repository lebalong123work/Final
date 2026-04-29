import { Link, NavLink } from "react-router-dom";

export default function CategoryNav({
  visibleCategories,
  moreCategories,
  otherCategories,
  otherCatLoading,
  otherCatErr,
  moreOpen,
  textOpen,
  setMoreOpen,
  setTextOpen,
  onCategoryClick,
  onSelfCategoryClick,
}) {
  return (
    <ul className="rk-cat-list">
      {/* ── Visible category chips ── */}
      {visibleCategories.map((cat) => (
        <li className="rk-cat-item" key={cat.id}>
          <NavLink
            className="rk-cat-link"
            to={`/truyen?category=${cat.slug}`}
            onClick={onCategoryClick}
          >
            {cat.name}
          </NavLink>
        </li>
      ))}

      {/* ── "More categories" dropdown ── */}
      {moreCategories.length > 0 ? (
        <li className="rk-cat-item">
          <button
            type="button"
            className={`rk-cat-toggle ${moreOpen ? "open" : ""}`}
            onClick={() => {
              setMoreOpen((v) => !v);
              setTextOpen(false);
            }}
          >
            More
            <span className="rk-cat-chev">
              <i className={`bi bi-chevron-${moreOpen ? "up" : "down"}`} />
            </span>
          </button>

          <div className={`rk-cat-dropdown ${moreOpen ? "open" : ""}`}>
            <span className="rk-dropdown-label">Genres</span>
            <div className="rk-dropdown-grid">
              {moreCategories.map((cat) => (
                <Link
                  key={cat.id}
                  className="rk-dropdown-item"
                  to={`/truyen?category=${cat.slug}`}
                  onClick={() => {
                    setMoreOpen(false);
                    onCategoryClick();
                  }}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </li>
      ) : null}

      {/* ── "Novels" dropdown ── */}
      <li className="rk-cat-item">
        <button
          type="button"
          className={`rk-cat-toggle rk-cat-toggle--text ${textOpen ? "open" : ""}`}
          onClick={() => {
            setTextOpen((v) => !v);
            setMoreOpen(false);
          }}
        >
          Novels
          <span className="rk-cat-chev">
            <i className={`bi bi-chevron-${textOpen ? "up" : "down"}`} />
          </span>
        </button>

        <div className={`rk-cat-dropdown ${textOpen ? "open" : ""}`}>
          <span className="rk-dropdown-label">Novels</span>

          <Link
            className="rk-dropdown-item--all"
            to="/self-comics?page=1"
            onClick={() => {
              setTextOpen(false);
              onCategoryClick();
            }}
          >
            <i className="bi bi-journals" />
            All Novels
          </Link>

          {otherCatLoading ? (
            <div className="rk-dropdown-status">Loading...</div>
          ) : otherCatErr ? (
            <div className="rk-dropdown-status" style={{ color: "#f87171" }}>
              {otherCatErr}
            </div>
          ) : otherCategories.length === 0 ? (
            <div className="rk-dropdown-status">No data available.</div>
          ) : (
            <div className="rk-dropdown-grid">
              {otherCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className="rk-dropdown-item"
                  onClick={() => onSelfCategoryClick(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </li>
    </ul>
  );
}
