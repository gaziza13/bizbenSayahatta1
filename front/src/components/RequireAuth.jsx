import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { getStoredAccessToken } from "../utils/sessionData";

export default function RequireAuth({ children }) {
  const location = useLocation();
  const { isAuthenticated, token } = useSelector((state) => state.auth);

  // Check both Redux state and localStorage as fallback
  const hasToken = isAuthenticated && token;
  const localToken = getStoredAccessToken();

  if (!hasToken && !localToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
