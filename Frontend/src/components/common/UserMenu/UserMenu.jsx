import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../../hooks/useAuth";
import "./UserMenu.css";

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    function handleEscape(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (!user) return null;

  async function handleLogout() {
    setOpen(false);
    await logout();
    navigate("/login", { replace: true });
  }

  const initial = user.email?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        type="button"
        className="user-menu-avatar"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        onClick={() => setOpen((value) => !value)}
      >
        {initial}
      </button>

      {open && (
        <div className="user-menu-dropdown" role="menu">
          <div className="user-menu-header">
            <span className="user-menu-label">Signed in as</span>
            <span className="user-menu-email">{user.email}</span>
          </div>
          <Link
            to="/skills"
            role="menuitem"
            className="user-menu-item"
            onClick={() => setOpen(false)}
          >
            Skills
          </Link>
          <Link
            to="/profile"
            role="menuitem"
            className="user-menu-item"
            onClick={() => setOpen(false)}  

          >
            Settings
          </Link>
          <button
            type="button"
            role="menuitem"
            className="user-menu-item user-menu-item--danger"
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
