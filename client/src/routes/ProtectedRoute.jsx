import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

// Pages that need a logged-in user (checkout, orders)
const ProtectedRoute = ({ children }) => {
  const { userLoading, user } = useAuth();
  const location = useLocation();

  if (userLoading) {
    return (
      <main className="flex min-h-96 items-center justify-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
};

export default ProtectedRoute;
