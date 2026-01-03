import { Routes, Route } from 'react-router-dom'
import LoginRegister from './pages/login-register/LoginRegister'
import Menu from './pages/menu/Menu'
import Lobby from './pages/lobby/Lobby'
import GameRoom from './pages/game-room/GameRoom'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'

export default function App() {
  return (
    <Routes>
      {/* Trang đăng nhập - chỉ cho phép truy cập khi chưa đăng nhập */}
      <Route 
        path="/" 
        element={
          <PublicRoute>
            <LoginRegister />
          </PublicRoute>
        } 
      />
      
      {/* Các route được bảo vệ - chỉ cho phép truy cập khi đã đăng nhập */}
      <Route 
        path="/menu" 
        element={
          <ProtectedRoute>
            <Menu />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/lobby" 
        element={
          <ProtectedRoute>
            <Lobby />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/game/:roomId" 
        element={
          <ProtectedRoute>
            <GameRoom />
          </ProtectedRoute>
        } 
      />
    </Routes>
  )
}

