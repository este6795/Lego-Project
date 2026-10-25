import { Navigate } from "react-router";

function NotFoundPage() {
  return <Navigate to="/" replace />;
}

export default NotFoundPage;
