import React, { useRef, useEffect, useState } from 'react';
import './Canvas.css';

export default function Canvas({ isDrawing = false, onDraw }) {
  const canvasRef = useRef(null);
  const [isDrawingState, setIsDrawingState] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Set default styles
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [currentColor, brushSize]);

  const startDrawing = (e) => {
    if (!isDrawing) return;
    setIsDrawingState(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    ctx.beginPath();
    ctx.moveTo(
      e.clientX - rect.left,
      e.clientY - rect.top
    );
  };

  const draw = (e) => {
    if (!isDrawingState || !isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    ctx.lineTo(
      e.clientX - rect.left,
      e.clientY - rect.top
    );
    ctx.stroke();

    // Gửi dữ liệu vẽ nếu có callback
    if (onDraw) {
      onDraw({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        color: currentColor,
        size: brushSize
      });
    }
  };

  const stopDrawing = () => {
    setIsDrawingState(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="canvas-container">
      {!isDrawing && (
        <div className="canvas-overlay">
          <div className="waiting-message">
            <div className="waiting-icon">⏳</div>
            <h3>ĐANG CHỜ</h3>
            <p>Đang chờ người chơi</p>
          </div>
        </div>
      )}

      

      <canvas
        ref={canvasRef}
        className="drawing-canvas"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={(e) => {
          e.preventDefault();
          startDrawing(e.touches[0]);
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          draw(e.touches[0]);
        }}
        onTouchEnd={stopDrawing}
      />
    </div>
  );
}

