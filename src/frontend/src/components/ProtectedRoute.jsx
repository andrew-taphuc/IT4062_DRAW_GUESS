import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { isUserLoggedIn } from '../utils/userStorage';

/**
 * ProtectedRoute - Component bảo vệ route, chỉ cho phép truy cập khi đã đăng nhập
 * Nếu chưa đăng nhập, sẽ redirect về trang đăng nhập
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Kiểm tra cả từ hook và localStorage để tránh flash
  // localStorage check là synchronous nên không gây delay
  const isLoggedIn = isAuthenticated || isUserLoggedIn();

  // Nếu chưa đăng nhập, redirect về trang đăng nhập
  if (!isLoggedIn) {
    // Lưu location hiện tại để có thể redirect lại sau khi đăng nhập (optional)
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Nếu đã đăng nhập, render children
  return children;
}

