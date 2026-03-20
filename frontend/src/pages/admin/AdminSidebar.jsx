import { NavLink, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import "./adminSidebar.css";

export default function AdminSidebar() {
  const navigate = useNavigate();

  const me = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const role = me?.role ;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };


  const items = [
    { to: "/admin", icon: "bi-grid", label: "Dashboard", end: true, allow: ["admin", "sub_admin"] },

   
    { to: "/admin/users", icon: "bi-people", label: "Quản lý người dùng", allow: ["admin"] },

    
    { to: "/admin/comics", icon: "bi-journal-bookmark", label: "Quản lý truyện", allow: ["admin", "sub_admin"] },

{ to: "/admin/categories", icon: "bi-collection", label: "Quản lý danh mục", allow: ["admin", "sub_admin"] },
   
    { to: "/admin/transactions", icon: "bi-receipt", label: "Giao dịch", allow: ["admin"] },

    
    { to: "/admin/levels", icon: "bi-layers", label: "Quản lý level", allow: ["admin"] },

 
    { to: "/", icon: "bi-house-fill", label: "Trang chủ", allow: ["admin", "sub_admin", ""] },
  ];

  
  const visibleItems = items.filter((it) => it.allow.includes(role));

  return (
    <aside className="ad-side">
      <div className="ad-side-brand">
        <div className="d-flex align-items-center gap-2 mb-3 position-relative">
          <a href="/"><img  className="hero-logo" src="https://i.ibb.co/MxWp9rJW/logo-fotor-bg-remover-202603048410-2.png" alt="logo-fotor-bg-remover-202603048410-1" border="0"/></a>
          
        </div>
        <div>
          <div className="ad-side-name">Readink Admin</div>
          <div className="ad-side-sub">
            {role === "admin" ? "Admin chính" : role === "sub_admin" ? "Admin phụ" : "User"}
          </div>
        </div>
      </div>

      <nav className="ad-side-nav">
        {visibleItems.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            className={({ isActive }) => `ad-side-link ${isActive ? "active" : ""}`}
          >
            <i className={`bi ${it.icon}`} />
            <span>{it.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="ad-side-footer">
        <button className="btn btn-outline-light w-100" type="button" onClick={handleLogout}>
          <i className="bi bi-box-arrow-right me-2" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}