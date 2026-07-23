import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getSession } from "../lib/auth";

type ProtectedRouteProps = {
  children: ReactNode;
};

/**
 * Guards protected pages. Redirects to /login (preserving the attempted
 * location) when there is no active session.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const session = getSession();

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
