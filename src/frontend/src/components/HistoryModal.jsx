import React, { useEffect, useState } from 'react';
import { getServices } from '../services/Services';
import './HistoryModal.css';

export default function HistoryModal({ show, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (show) {
      fetchHistory();
    }
  }, [show]);

  // Close modal khi ấn ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && show) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [show, onClose]);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const services = getServices();
      console.log('[HistoryModal] Fetching game history...');
      const response = await services.getGameHistory();
      console.log('[HistoryModal] Received response:', response);
      
      if (response && response.history) {
        console.log('[HistoryModal] Setting history:', response.history);
        setHistory(response.history);
      } else {
        console.log('[HistoryModal] No history in response, setting empty array');
        setHistory([]);
      }
    } catch (err) {
      console.error('[HistoryModal] Failed to fetch game history:', err);
      setError('Không thể tải lịch sử chơi');
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý click outside modal
  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('history-modal-backdrop')) {
      onClose();
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankClass = (rank) => {
    if (rank === 1) return 'rank-gold';
    if (rank === 2) return 'rank-silver';
    if (rank === 3) return 'rank-bronze';
    return 'rank-normal';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      // Cộng thêm 7 tiếng để chuyển sang GMT+7
      date.setHours(date.getHours() + 7);
      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  if (!show) return null;

  return (
    <div className="history-modal-backdrop" onClick={handleBackdropClick}>
      <div className="history-modal">
        <button className="history-close-btn" onClick={onClose}>✕</button>
        
        <h2 className="history-title">Lịch Sử Chơi</h2>
        
        {loading && (
          <div className="history-loading">
            <div className="history-spinner"></div>
            <p>Đang tải...</p>
          </div>
        )}
        
        {error && (
          <div className="history-error">
            <p>{error}</p>
            <button onClick={fetchHistory}>Thử lại</button>
          </div>
        )}
        
        {!loading && !error && history.length === 0 && (
          <div className="history-empty">
            <p>🎮 Chưa có lịch sử chơi nào</p>
            <p className="history-empty-sub">Hãy bắt đầu chơi để xem lịch sử!</p>
          </div>
        )}
        
        {!loading && !error && history.length > 0 && (
          <div className="history-list">
            <div className="history-stats">
              <div className="history-stat-item">
                <div className="history-stat-box">
                  <span className="history-stat-label">Tổng số ván</span>
                  <span className="history-stat-value">{history.length}</span>
                </div>
              </div>
              <div className="history-stat-item">
                <div className="history-stat-box">
                  <span className="history-stat-label">Số lần thắng</span>
                  <span className="history-stat-value">
                    {history.filter(h => h.rank === 1).length}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="history-items">
              {history.map((item, index) => (
                <div key={index} className={`history-item ${getRankClass(item.rank)}`}>
                  <div className="history-item-rank">
                    {getRankBadge(item.rank)}
                  </div>
                  <div className="history-item-content">
                    <div className="history-item-score">
                      <span className="history-score-label">Điểm:</span>
                      <span className="history-score-value">{item.score}</span>
                    </div>
                    <div className="history-item-time">
                      {formatDate(item.finished_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

