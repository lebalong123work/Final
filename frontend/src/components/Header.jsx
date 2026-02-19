import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./header.css";

export default function Header() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Lấy user từ localStorage
  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (raw) {
      setUser(JSON.parse(raw));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };
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
                  <i className="bi bi-person-circle fs-4 me-1"></i>
                  {user ? user.username : ""}
                </button>

                <ul className="dropdown-menu dropdown-menu-end">

                  {!user && (
                    <>
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
                    </>
                  )}

                  {user && (
                    <>
                      <li>
                        <Link className="dropdown-item" to="/profile">
                          <i className="bi bi-person me-2"></i>
                          Trang cá nhân
                        </Link>
                      </li>

                      {/* 🔥 Nếu admin */}
                      {user.role === "admin" && (
                        <li>
                          <Link className="dropdown-item text-danger" to="/admin">
                            <i className="bi bi-speedometer2 me-2"></i>
                            Quản trị
                          </Link>
                        </li>
                      )}

                      <li><hr className="dropdown-divider" /></li>

                      <li>
                        <button
                          className="dropdown-item"
                          onClick={handleLogout}
                        >
                          <i className="bi bi-box-arrow-right me-2"></i>
                          Đăng xuất
                        </button>
                      </li>
                    </>
                  )}

                </ul>
              </div>

            </div>

          </div>
        </div>
      </nav>
    </header>
  );
}
