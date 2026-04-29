import { Link } from "react-router-dom";

export default function UserMenuDropdown({
  user,
  userMenuOpen,
  userMenuRef,
  onToggle,
  onLogout,
  setUserMenuOpen,
}) {
  const initial = user?.username ? user.username.charAt(0).toUpperCase() : null;

  return (
    <div className="rk-user-wrap" ref={userMenuRef}>
      {/* ── Avatar trigger ── */}
      <button
        className={`rk-user-btn ${userMenuOpen ? "open" : ""}`}
        type="button"
        onClick={onToggle}
        aria-expanded={userMenuOpen}
        aria-label="Account"
      >
        <span className="rk-avatar" aria-hidden="true">
          {initial || <i className="bi bi-person" />}
        </span>
        <span className="rk-user-name">{user ? user.username : "Account"}</span>
        <span className="rk-user-chev" aria-hidden="true">
          <i className="bi bi-chevron-down" />
        </span>
      </button>

      {/* ── Dropdown panel ── */}
      {userMenuOpen && (
        <ul className="rk-user-panel">
          {!user && (
            <>
              <li>
                <Link
                  className="rk-user-item"
                  to="/login"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <i className="bi bi-box-arrow-in-right" />
                  Login
                </Link>
              </li>
              <li>
                <Link
                  className="rk-user-item"
                  to="/register"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <i className="bi bi-person-plus" />
                  Register
                </Link>
              </li>
            </>
          )}

          {user && (
            <>
              <li>
                <Link
                  className="rk-user-item"
                  to="/profile"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <i className="bi bi-person" />
                  Profile
                </Link>
              </li>

              {(user.role === "admin" || user.role === "sub_admin") && (
                <li>
                  <Link
                    className="rk-user-item rk-user-item--admin"
                    to="/admin"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <i className="bi bi-speedometer2" />
                    Admin
                  </Link>
                </li>
              )}

              <li>
                <div className="rk-user-divider" aria-hidden="true" />
              </li>

              <li>
                <button
                  className="rk-user-item rk-user-item--logout"
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onLogout();
                  }}
                >
                  <i className="bi bi-box-arrow-right" />
                  Logout
                </button>
              </li>
            </>
          )}
        </ul>
      )}
    </div>
  );
}
