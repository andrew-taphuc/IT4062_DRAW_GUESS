import { useState } from 'react'
import LoginRegister from './pages/login-register/LoginRegister'
import Lobby from './pages/lobby/Lobby'
import GameRoom from './pages/game-room/GameRoom'

export default function App() {
  const [currentPage, setCurrentPage] = useState('login'); // 'login', 'lobby', 'game'
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  const handleLoginSuccess = () => {
    setCurrentPage('lobby');
  };

  const handleJoinRoom = (roomId) => {
    setSelectedRoomId(roomId);
    setCurrentPage('game');
  };

  const handleCreateRoom = () => {
    // Tạo phòng mới và join vào
    const newRoomId = 'new-room-' + Date.now();
    setSelectedRoomId(newRoomId);
    setCurrentPage('game');
  };

  const handleLeaveRoom = () => {
    setSelectedRoomId(null);
    setCurrentPage('lobby');
  };

  return (
    <>
      {currentPage === 'login' && (
        <LoginRegister onLoginSuccess={handleLoginSuccess} />
      )}
      {currentPage === 'lobby' && (
        <Lobby 
          onJoinRoom={handleJoinRoom}
          onCreateRoom={handleCreateRoom}
          rooms={[]}
        />
      )}
      {currentPage === 'game' && (
        <GameRoom 
          roomId={selectedRoomId}
          onLeaveRoom={handleLeaveRoom}
          players={[]}
          messages={[]}
        />
      )}
    </>
  )
}

