import { Link, useLocation, useNavigate } from "react-router-dom";
import { Plane, LogOut } from "lucide-react";
import { getSession, logout } from "../lib/auth";
import Button from "./Button";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  // Re-reads on every navigation because useLocation() re-renders this component.
  const session = getSession();
  const path = location.pathname;

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-base-900/70 backdrop-blur-md">
      <nav
        className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6"
        aria-label="Primary"
      >
        <Link
          to="/"
          className="group flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amex"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amex to-aeroplan text-white">
            <Plane size={18} strokeWidth={2.5} />
          </span>
          <span className="text-lg font-bold tracking-tight text-white">
            PointPilot
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {session ? (
            path === "/dashboard" ? (
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut size={16} />
                Logout
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => navigate("/dashboard")}>
                Go to Dashboard
              </Button>
            )
          ) : path === "/login" ? (
            <Link to="/register">
              <Button variant="secondary">Sign up</Button>
            </Link>
          ) : path === "/register" ? (
            <Link to="/login">
              <Button variant="secondary">Login</Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link to="/register">
                <Button variant="primary">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
