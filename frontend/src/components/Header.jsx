import { Link, NavLink } from "react-router-dom";
import "./header.css";

export default function Header() {
  return (
    <header className="zt-header border-bottom bg-white">
      <nav className="navbar navbar-expand-lg navbar-light">
        <div className="container-fluid px-4">

          {/* Brand */}
          <Link to="/" className="navbar-brand d-flex align-items-center gap-2">
          <div className="d-flex align-items-center gap-2 mb-3 position-relative">
  <img
    src="https://www.zettruyen.space/images/logo.webp"
    alt="Ztruyen Logo"
    className="hero-logo"
  />

  <span className="brand-text">
    <span className="brand-z">Z</span>truyện
  </span>
</div>
        
          </Link>

          {/* Toggle */}
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#ztNav"
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div className="collapse navbar-collapse" id="ztNav">

            {/* Menu */}
            <ul className="navbar-nav mx-auto mb-2 mb-lg-0 zt-nav">
              <li className="nav-item">
                <NavLink className="nav-link" to="#">Thể loại</NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="#">Đang phát hành</NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="#">Hoàn thành</NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="#">Sắp ra mắt</NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="#">Truyện mới</NavLink>
              </li>
            </ul>

            {/* Search + User */}
            <div className="d-flex align-items-center gap-3">

              {/* Search */}
              <form className="d-flex align-items-center zt-search">
                <div className="input-group zt-search-group">
                  <input
                    type="search"
                    className="form-control zt-search-input"
                    placeholder="Tìm truyện..."
                  />
                  <button className="btn zt-search-btn">
                    <i className="bi bi-search" />
                  </button>
                </div>
              </form>

              {/* User Icon Dropdown */}
              <div className="dropdown">
                <button
                  className="btn user-btn dropdown-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                >
                  <i className="bi bi-person-circle fs-4"></i>
                </button>

                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <Link className="dropdown-item" to="/login">
                      <i className="bi bi-box-arrow-in-right me-2"></i>
                      Đăng nhập
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/register">
                      <i className="bi bi-person-plus me-2"></i>
                      Đăng ký
                    </Link>
                  </li>
                </ul>
              </div>

            </div>

          </div>
        </div>
      </nav>
    </header>
  );
}
