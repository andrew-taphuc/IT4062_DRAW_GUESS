import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import './Canvas.css';

const Canvas = forwardRef(function Canvas(
  { canDraw = false, onDraw, isWaiting = false },
  ref
) {
  const canvasElRef = useRef(null);
  const lastPosRef = useRef(null);
  const [isDrawingState, setIsDrawingState] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [isEraser, setIsEraser] = useState(false);
  const [isClearPressed, setIsClearPressed] = useState(false);
  const [isEraserPressed, setIsEraserPressed] = useState(false);

  // Kích thước canvas chuẩn (phải khớp với MAX_CANVAS_WIDTH và MAX_CANVAS_HEIGHT trong drawing.h)
  const STANDARD_CANVAS_WIDTH = 1920;
  const STANDARD_CANVAS_HEIGHT = 1080;

  // Danh sách màu cơ bản
  const colorPalette = [
    '#000000', // Đen
    '#FFFFFF', // Trắng
    '#FF0000', // Đỏ
    '#00FF00', // Xanh lá
    '#0000FF', // Xanh dương
    '#FFFF00', // Vàng
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#FFA500', // Cam
    '#800080', // Tím
    '#FFC0CB', // Hồng
    '#A52A2A', // Nâu
  ];

  const initCanvasSize = () => {
    const canvas = canvasElRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  };

  // Chuyển đổi tọa độ từ canvas thực tế sang tọa độ chuẩn (0-1920, 0-1080)
  const normalizeCoordinates = (x, y) => {
    const canvas = canvasElRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const scaleX = STANDARD_CANVAS_WIDTH / canvas.width;
    const scaleY = STANDARD_CANVAS_HEIGHT / canvas.height;
    return {
      x: Math.round(x * scaleX),
      y: Math.round(y * scaleY)
    };
  };

  // Chuyển đổi tọa độ từ chuẩn về canvas thực tế
  const denormalizeCoordinates = (x, y) => {
    const canvas = canvasElRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const scaleX = canvas.width / STANDARD_CANVAS_WIDTH;
    const scaleY = canvas.height / STANDARD_CANVAS_HEIGHT;
    return {
      x: x * scaleX,
      y: y * scaleY
    };
  };

  useEffect(() => {
    initCanvasSize();
    const onResize = () => initCanvasSize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useImperativeHandle(ref, () => ({
    clear() {
      const canvas = canvasElRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
    applyRemoteDraw(data) {
      const canvas = canvasElRef.current;
      if (!canvas || !data) return;
      const ctx = canvas.getContext('2d');

      if (data.action === 2) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      if (data.action === 1 || data.action === 3) {
        const colorHex = data.action === 3 ? '#FFFFFF' : (data.colorHex || '#000000');
        
        // Denormalize tọa độ từ chuẩn về canvas thực tế
        const p1 = denormalizeCoordinates(data.x1 || 0, data.y1 || 0);
        const p2 = denormalizeCoordinates(data.x2 || 0, data.y2 || 0);
        
        ctx.strokeStyle = colorHex;
        ctx.lineWidth = data.width || 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }
  }));

  const getPoint = (e) => {
    const canvas = canvasElRef.current;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e) => {
    if (!canDraw) return;
    setIsDrawingState(true);
    lastPosRef.current = getPoint(e);
  };

  const draw = (e) => {
    if (!canDraw || !isDrawingState) return;
    const canvas = canvasElRef.current;
    const ctx = canvas.getContext('2d');

    const p2 = getPoint(e);
    const p1 = lastPosRef.current;
    if (!p1) {
      lastPosRef.current = p2;
      return;
    }

    ctx.strokeStyle = isEraser ? '#FFFFFF' : currentColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    if (onDraw) {
      // Normalize tọa độ về kích thước chuẩn trước khi gửi
      const normalizedP1 = normalizeCoordinates(p1.x, p1.y);
      const normalizedP2 = normalizeCoordinates(p2.x, p2.y);
      
      onDraw({
        action: 1,
        x1: normalizedP1.x,
        y1: normalizedP1.y,
        x2: normalizedP2.x,
        y2: normalizedP2.y,
        color: currentColor,
        width: brushSize,
        isEraser
      });
    }

    lastPosRef.current = p2;
  };

  const stopDrawing = () => {
    setIsDrawingState(false);
    lastPosRef.current = null;
  };

  const clearCanvas = () => {
    if (!canDraw) return;
    const canvas = canvasElRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (onDraw) onDraw({ action: 2 });
  };

  return (
    <div className="canvas-container">
      {isWaiting && (
        <div className="canvas-waiting-overlay">
          <div className="waiting-content">
            <div className="hourglass-spinner">⏳</div>
            <p className="waiting-text">Vui lòng chờ chủ phòng bắt đầu!</p>
          </div>
        </div>
      )}

      <div className="canvas-tools">
        <div className="tool-group color-picker-group">
          <label>Màu:</label>
          <div className="color-palette">
            {colorPalette.map((color) => (
              <button
                key={color}
                type="button"
                className={`color-btn ${currentColor === color ? 'active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => !isEraser && setCurrentColor(color)}
                disabled={!canDraw || isEraser}
                title={color}
              />
            ))}
            <input
              type="color"
              className="color-picker-input"
              value={currentColor}
              onChange={(e) => !isEraser && setCurrentColor(e.target.value)}
              disabled={!canDraw || isEraser}
              title="Chọn màu tùy chỉnh"
            />
          </div>
        </div>
        <div className="tool-group">
          <label>Size:</label>
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
            disabled={!canDraw}
          />
          <span>{brushSize}</span>
        </div>
        <button 
          className={`eraser-btn ${isEraser ? 'active' : ''} ${isEraserPressed ? 'pressed' : ''}`}
          onClick={() => setIsEraser(!isEraser)}
          onMouseDown={() => setIsEraserPressed(true)}
          onMouseUp={() => setIsEraserPressed(false)}
          onMouseLeave={() => setIsEraserPressed(false)}
          disabled={!canDraw}
          title="Tẩy"
        >
          🧽
        </button>
        <button 
          className={`clear-btn ${isClearPressed ? 'pressed' : ''}`}
          onClick={clearCanvas} 
          onMouseDown={() => setIsClearPressed(true)}
          onMouseUp={() => setIsClearPressed(false)}
          onMouseLeave={() => setIsClearPressed(false)}
          disabled={!canDraw}
          title="Xóa canvas"
        >
          🧹
        </button>
      </div>

      {!canDraw && !isWaiting && (
        <div className="canvas-overlay">
          {/* Overlay để chặn vẽ, không hiển thị message */}
        </div>
      )}

      <canvas
        ref={canvasElRef}
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
      <div className="chicken-animation">
        <img src="/assets/chicken-2.gif" alt="Chicken" className="chicken-image" />
      </div>
    </div>
  );
});

export default Canvas;

