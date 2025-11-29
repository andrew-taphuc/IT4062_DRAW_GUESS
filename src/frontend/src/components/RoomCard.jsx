import React from 'react';
import './RoomCard.css';

export default function RoomCard({ room, onJoin }) {
  return (
    <div className="room-card" onClick={() => onJoin && onJoin(room.id)}>
      <div className="room-icon">
        <span className="icon">🎮</span>
      </div>
      <div className="room-info">
        <h3 className="room-name">{room.name || `Phòng #${room.id}`}</h3>
        <div className="room-details">
          <span className="detail-item">
            <span className="icon">👥</span>
            {room.currentPlayers || 0}/{room.maxPlayers || 8}
          </span>
          <span className="detail-item">
            <span className="icon">💬</span>
            VI
          </span>
          <span className="detail-item">
            <span className="icon">🏆</span>
            {room.score || 0}/{room.maxScore || 120}
          </span>
        </div>
      </div>
      {room.isOfficial && (
        <div className="official-badge">✓</div>
      )}
    </div>
  );
}

