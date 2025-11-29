import React, { useState } from 'react';
import './ChatPanel.css';

export default function ChatPanel({ messages = [], onSendMessage, onSendGuess, isWaiting = false }) {
  const [activeTab, setActiveTab] = useState('answer');
  const [inputValue, setInputValue] = useState('');

  const displayMessages = messages;

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    if (activeTab === 'answer') {
      if (onSendGuess) {
        onSendGuess(inputValue);
      }
    } else {
      if (onSendMessage) {
        onSendMessage(inputValue);
      }
    }
    setInputValue('');
  };

  return (
    <div className="chat-panel">
      <div className="chat-tabs">
        <button
          className={`chat-tab ${activeTab === 'answer' ? 'active' : ''}`}
          onClick={() => setActiveTab('answer')}
        >
          TRẢ LỜI
        </button>
        <button
          className={`chat-tab ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          TRÒ CHUYỆN
        </button>
      </div>

      <div className="chat-messages">
        {displayMessages.length > 0 ? (
          displayMessages.map((msg, index) => (
            <div key={index} className={`message ${msg.type}`}>
              {msg.username && <span className="message-username">{msg.username}:</span>}
              <span className="message-text">{msg.text}</span>
            </div>
          ))
        ) : (
          <div className="message system">
            <span className="message-text">{isWaiting ? 'Đang chờ người chơi' : 'Chưa có tin nhắn nào'}</span>
          </div>
        )}
      </div>

      <form className="chat-input-form" onSubmit={handleSend}>
        <input
          type="text"
          className="chat-input"
          placeholder={activeTab === 'answer' ? 'Đang chờ...' : 'Nhập tin nhắn...'}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={activeTab === 'answer' && isWaiting}
        />
        <button type="submit" className="chat-send-btn">
          Gửi
        </button>
      </form>
    </div>
  );
}

