import { Link, NavLink, Outlet } from "react-router";
import UserMenu from "../UserMenu/UserMenu";
import { useAuth } from "../../../hooks/useAuth";

function Layout() {
  const { user } = useAuth();
  return (
    <>
      {user && (
        <header className="app-topbar">
          <div className="app-topbar-left">
            <Link to="/" className="app-topbar-brand">
              Resume Parser
            </Link>
            <nav className="app-topbar-links">
              <NavLink to="/upload">Analyze Resume</NavLink>
              <NavLink to="/history">History</NavLink>
            </nav>
          </div>
          <UserMenu />
        </header>
      )}
      {!import.meta.env.DEV && ( // leave this unless in development mode. Terrible coding ik
        <nav className="nav dev-nav">
          <span className="dev-nav-label">Dev</span>
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/upload">Upload</NavLink>
          <NavLink to="/profile">Profile</NavLink>
          <NavLink to="/login">Login</NavLink>
          <NavLink to="/register">Register</NavLink>
          <NavLink to="/reset-password">Reset Password</NavLink>
          <NavLink to="/history">History</NavLink>
        </nav>
      )}
      <main className="page">
        <Outlet />
      </main>
    </>
  );
}

export default Layout;
