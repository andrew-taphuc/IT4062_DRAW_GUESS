import React from 'react';
import './PlayerList.css';

const MAX_PLAYERS = 8;

export default function PlayerList({ players = [], currentUserId = null, maxPlayers = MAX_PLAYERS }) {
  // Tạo danh sách đầy đủ với các slot trống
  const displayPlayers = [];
  
  // Thêm players hiện có
  players.forEach(player => {
    displayPlayers.push({
      ...player,
      isEmpty: false
    });
  });
  
  // Thêm các slot trống
  for (let i = players.length; i < maxPlayers; i++) {
    displayPlayers.push({
      id: `empty-${i}`,
      username: 'Trống',
      avatar: '👤',
      score: 0,
      isDrawing: false,
      isEmpty: true
    });
  }

  return (
    <div className="player-list">
      <div className="player-list-header">
        <h3>Draw & Guess</h3>
      </div>
      <div className="players-container">
        {displayPlayers.map((player) => (
          <div
            key={player.id}
            className={`player-item ${player.id === currentUserId ? 'current-player' : ''} ${player.isDrawing ? 'drawing' : ''} ${player.isEmpty ? 'empty-slot' : ''}`}
          >
            <div className="player-avatar">
              <span>{player.avatar || '👤'}</span>
              {player.isDrawing && <span className="drawing-badge">✏️</span>}
            </div>
            <div className="player-info">
              <div className="player-name">{player.username}</div>
              <div className="player-score">{player.score || 0} điểm</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

