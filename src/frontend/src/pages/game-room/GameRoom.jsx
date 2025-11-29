import React, { useState } from 'react';
import Canvas from '../../components/Canvas';
import ChatPanel from '../../components/ChatPanel';
import PlayerList from '../../components/PlayerList';
import { useAuth } from '../../hooks/useAuth';
import './GameRoom.css';

const DEFAULT_ROUND_TIME = 60;

export default function GameRoom({ 
  roomId, 
  onLeaveRoom, 
  players = [], 
  messages = [], 
  gameState: externalGameState = 'waiting',
  timeLeft: externalTimeLeft = DEFAULT_ROUND_TIME,
  word: externalWord = '',
  isDrawing: externalIsDrawing = false
}) {
  const { user } = useAuth();
  const [isDrawing, setIsDrawing] = useState(externalIsDrawing);
  const [gameState, setGameState] = useState(externalGameState);
  const [timeLeft, setTimeLeft] = useState(externalTimeLeft);
  const [word, setWord] = useState(externalWord);

  const handleDraw = (drawData) => {
    // Xử lý dữ liệu vẽ
    console.log('Draw data:', drawData);
  };

  const handleSendMessage = (message) => {
    // Xử lý gửi tin nhắn
    console.log('Send message:', message);
  };

  const handleSendGuess = (guess) => {
    // Xử lý đoán từ
    console.log('Send guess:', guess);
  };

  return (
    <div className="game-room-page">
      {/* Header */}
      <header className="game-header">
        <div className="header-left">
          <button className="back-btn" onClick={onLeaveRoom}>
            ← Quay lại
          </button>
        </div>
        <div className="header-center">
          <h1 className="game-logo">Draw & Guess</h1>
        </div>
        <div className="header-right">
          <div className="game-info">
            <div className="timer">
              <span className="timer-icon">⏱️</span>
              <span className="timer-text">{timeLeft}s</span>
            </div>
            <button className="exit-btn">✕</button>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="game-main">
        <div className="game-layout">
          {/* Left Panel - Player List */}
          <aside className="game-sidebar left">
            <PlayerList players={players} currentUserId={user?.id} />
          </aside>

          {/* Center Panel - Canvas */}
          <section className="game-center">
            <div className="game-status">
              {gameState === 'waiting' && (
                <div className="status-banner waiting">
                  <h2>ĐANG CHỜ</h2>
                  <p>Đang chờ người chơi tham gia...</p>
                </div>
              )}
              {gameState === 'playing' && isDrawing && (
                <div className="status-banner drawing">
                  <h2>BẠN ĐANG VẼ</h2>
                  <p className="word-display">{word || 'Từ bí mật: ???'}</p>
                </div>
              )}
              {gameState === 'playing' && !isDrawing && (
                <div className="status-banner guessing">
                  <h2>ĐOÁN TỪ</h2>
                  <p>Hãy đoán từ mà người chơi đang vẽ!</p>
                </div>
              )}
            </div>
            <Canvas isDrawing={isDrawing && gameState === 'playing'} onDraw={handleDraw} />
          </section>

          {/* Right Panel - Chat */}
          <aside className="game-sidebar right">
            <ChatPanel
              messages={messages}
              onSendMessage={handleSendMessage}
              onSendGuess={handleSendGuess}
            />
          </aside>
        </div>
      </main>
    </div>
  );
}

