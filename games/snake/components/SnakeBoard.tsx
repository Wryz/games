import { useState, useEffect } from 'react';
import { Position } from '../types/SnakeTypes';

interface SnakeBoardProps {
  snake: Position[];
  apple: Position;
  boardWidth: number;
  boardHeight: number;
}

const SnakeBoard = ({ snake, apple, boardWidth, boardHeight }: SnakeBoardProps) => {
  // Calculate responsive cell size based on screen width
  const calculateCellSize = () => {
    if (typeof window === 'undefined') return 40; // Default for SSR
    
    const screenWidth = window.innerWidth;
    const isMobile = screenWidth <= 768;
    
    if (isMobile) {
      // On mobile, make cells fit the screen width with some padding
      const availableWidth = screenWidth - 32; // 16px padding on each side
      const calculatedSize = Math.floor(availableWidth / boardWidth);
      return Math.max(12, Math.min(calculatedSize, 30)); // Min 12px, max 30px on mobile
    } else {
      // On desktop, use fixed size but ensure it fits
      const availableWidth = screenWidth - 64; // More padding on desktop
      const calculatedSize = Math.floor(availableWidth / boardWidth);
      return Math.min(40, calculatedSize); // Max 40px but ensure it fits
    }
  };

  const [cellSize, setCellSize] = useState(calculateCellSize());

  useEffect(() => {
    const handleResize = () => {
      setCellSize(calculateCellSize());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [boardWidth]);

  console.log('SnakeBoard render - Snake:', JSON.stringify(snake), 'Apple:', JSON.stringify(apple));

  // Generate grid cells for visibility
  const gridCells = [];
  for (let y = 0; y < boardHeight; y++) {
    for (let x = 0; x < boardWidth; x++) {
      gridCells.push({ x, y });
    }
  }

  return (
    <div className="w-full flex justify-center overflow-hidden">
      <div
        className="relative bg-gray-900 border-2 border-gray-700 rounded-lg shadow-2xl max-w-full"
        style={{
          width: boardWidth * cellSize,
          height: boardHeight * cellSize,
        }}
      >
      {/* Render grid background */}
      {gridCells.map(({ x, y }) => (
        <div
          key={`grid-${x}-${y}`}
          className="absolute"
          style={{
            left: x * cellSize,
            top: y * cellSize,
            width: cellSize,
            height: cellSize,
            border: '1px solid #374151', // Very dark gray border
            backgroundColor: 'transparent',
          }}
        />
      ))}
      
      {/* Render snake segments */}
      {snake.map((segment, index) => (
        <div
          key={`snake-${index}`}
          className="absolute border border-cyan-300 rounded-sm"
          style={{
            left: segment.x * cellSize,
            top: segment.y * cellSize,
            width: cellSize,
            height: cellSize,
            backgroundColor: index === 0 ? '#22d3ee' : 'rgba(34, 211, 238, 0.9)', // cyan-400 and cyan-400/90
            boxShadow: index === 0 
              ? '0 0 10px rgba(34, 211, 238, 0.5), 0 0 20px rgba(34, 211, 238, 0.3)' 
              : '0 0 8px rgba(34, 211, 238, 0.4)',
          }}
        />
      ))}
      
      {/* Render apple */}
      <div
        className="absolute rounded-full border border-red-400"
        style={{
          left: apple.x * cellSize,
          top: apple.y * cellSize,
          width: cellSize,
          height: cellSize,
          backgroundColor: '#ef4444', // Bright red
          boxShadow: '0 0 15px rgba(239, 68, 68, 0.8), 0 0 30px rgba(239, 68, 68, 0.4), inset 0 0 10px rgba(255, 255, 255, 0.2)',
        }}
      />
      </div>
    </div>
  );
};

export default SnakeBoard;
