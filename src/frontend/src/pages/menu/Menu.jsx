import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import HistoryModal from '../../components/HistoryModal';
import ChangePasswordModal from '../../components/ChangePasswordModal';
import './Menu.css';

export default function Menu() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showHistory, setShowHistory] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [duckJumping, setDuckJumping] = useState(false);

  const handleGoToLobby = () => {
    // Trigger duck jump animation
    setDuckJumping(true);
    
    // Set flag in sessionStorage to trigger landing animation in Lobby
    sessionStorage.setItem('duckLanding', 'true');
    
    // Navigate after animation completes (duck fully falls down)
    setTimeout(() => {
      navigate('/lobby');
    }, 1500);
  };

  const handleShowHistory = () => {
    setShowHistory(true);
  };

  const handleCloseHistory = () => {
    setShowHistory(false);
  };

  const handleShowChangePassword = () => {
    setShowChangePassword(true);
  };

  const handleCloseChangePassword = () => {
    setShowChangePassword(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="menu-page">
      <HistoryModal show={showHistory} onClose={handleCloseHistory} />
      <ChangePasswordModal show={showChangePassword} onClose={handleCloseChangePassword} />
      
      <div className="menu-container">
        <div className="menu-header">
          <h1 className="menu-title">Draw & Guess</h1>
          <div className="menu-user-info">
            <img 
              src="/assets/duck.gif" 
              alt="duck" 
              className={`menu-user-icon ${duckJumping ? 'duck-jumping' : ''}`}
            />
            <span className="menu-username">{user?.username || 'Player'}</span>
            <button className="menu-logout-btn" onClick={handleLogout}>
              Đăng xuất
            </button>
          </div>
        </div>

        <div className="menu-content">
          <button className="menu-btn menu-btn-primary" onClick={handleGoToLobby}>
            Vào Sảnh
          </button>
          <button className="menu-btn menu-btn-secondary" onClick={handleShowHistory}>
            Lịch Sử Chơi
          </button>
          <button className="menu-btn menu-btn-secondary" onClick={handleShowChangePassword}>
            Đổi Mật Khẩu
          </button>
        </div>

        <div className="menu-footer">
          <p>Chào mừng bạn đến với trò chơi!</p>
        </div>
      </div>
    </div>
  );
}

