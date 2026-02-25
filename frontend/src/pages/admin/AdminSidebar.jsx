import { NavLink } from "react-router-dom";
import "./adminSidebar.css";

export default function AdminSidebar() {
  const items = [
    { to: "#", icon: "bi-grid", label: "Dashboard", end: true },
    { to: "#", icon: "bi-people", label: "Quản lý người dùng" },
    { to: "/admin/comics", icon: "bi-journal-bookmark", label: "Quản lý truyện" },
    { to: "#", icon: "bi-bag-check", label: "Đơn hàng" },
    { to: "/admin/transactions", icon: "bi-receipt", label: "Giao dịch" },
    { to: "/", icon: "bi-house-fill", label: "Trang chủ" },
    { to: "/admin/levels", icon: "bi-layers", label: "Quản lý level" }
  ];

  return (
    <aside className="ad-side">
      <div className="ad-side-brand">
             <div className="d-flex align-items-center gap-2 mb-3 position-relative">
  <img
    src="https://www.zettruyen.space/images/logo.webp"
    alt="Ztruyen Logo"
    className="hero-logo"
  />
</div>
        <div>
          <div className="ad-side-name">Ztruyện Admin</div>
          <div className="ad-side-sub">Quản trị hệ thống</div>
        </div>
      </div>

      <nav className="ad-side-nav">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            className={({ isActive }) =>
              `ad-side-link ${isActive ? "active" : ""}`
            }
          >
            <i className={`bi ${it.icon}`} />
            <span>{it.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="ad-side-footer">
        <button className="btn btn-outline-light w-100" type="button">
          <i className="bi bi-box-arrow-right me-2" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
