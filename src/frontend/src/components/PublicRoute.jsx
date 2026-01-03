import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { isUserLoggedIn } from '../utils/userStorage';

/**
 * PublicRoute - Component cho các route công khai (như trang đăng nhập)
 * Nếu đã đăng nhập, sẽ redirect về trang menu
 */
export default function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  // Nếu đang loading (có thể đang auto-login), không redirect ngay
  if (isLoading) {
    return children; // Hiển thị trang đăng nhập trong khi đang loading
  }

  // Kiểm tra cả từ hook và localStorage để tránh flash
  // localStorage check là synchronous nên không gây delay
  const isLoggedIn = isAuthenticated || isUserLoggedIn();

  // Nếu đã đăng nhập, redirect về trang menu
  if (isLoggedIn) {
    return <Navigate to="/menu" replace />;
  }

  // Nếu chưa đăng nhập, render children (trang đăng nhập)
  return children;
}

