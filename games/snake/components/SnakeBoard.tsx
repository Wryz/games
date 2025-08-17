import { useState, useEffect, useLayoutEffect } from 'react';
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
    if (typeof window === 'undefined') return 20; // Conservative default for SSR
    
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const isMobile = screenWidth <= 768;
    
    if (isMobile) {
      // On mobile, make cells fit the screen width with padding
      const availableWidth = screenWidth - 32; // 16px padding on each side
      const availableHeight = screenHeight - 200; // Account for controls and status
      
      const widthBasedSize = Math.floor(availableWidth / boardWidth);
      const heightBasedSize = Math.floor(availableHeight / boardHeight);
      
      // Use the smaller of the two to ensure the board fits both dimensions
      const calculatedSize = Math.min(widthBasedSize, heightBasedSize);
      return Math.max(8, Math.min(calculatedSize, 25)); // Min 8px, max 25px on mobile
    } else {
      // On desktop, ensure it fits the screen
      const availableWidth = Math.min(screenWidth - 64, 1200); // Max width constraint
      const availableHeight = screenHeight - 150; // Account for header/footer
      
      const widthBasedSize = Math.floor(availableWidth / boardWidth);
      const heightBasedSize = Math.floor(availableHeight / boardHeight);
      
      const calculatedSize = Math.min(widthBasedSize, heightBasedSize);
      return Math.max(15, Math.min(calculatedSize, 35)); // Min 15px, max 35px on desktop
    }
  };

  const [cellSize, setCellSize] = useState(() => {
    // Initialize with a safe default that will be updated immediately
    if (typeof window === 'undefined') return 20;
    return calculateCellSize();
  });
  const [isClient, setIsClient] = useState(false);

  // Use useLayoutEffect to update cell size before paint
  useLayoutEffect(() => {
    setIsClient(true);
    setCellSize(calculateCellSize());
  }, [boardWidth, boardHeight]);

  useEffect(() => {
    if (!isClient) return;
    
    const handleResize = () => {
      setCellSize(calculateCellSize());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [boardWidth, boardHeight, isClient]);

  console.log('SnakeBoard render - Snake:', JSON.stringify(snake), 'Apple:', JSON.stringify(apple));

  // Generate grid cells for visibility
  const gridCells = [];
  for (let y = 0; y < boardHeight; y++) {
    for (let x = 0; x < boardWidth; x++) {
      gridCells.push({ x, y });
    }
  }

  // Don't render until we have proper client-side dimensions
  if (!isClient) {
    return (
      <div className="w-full flex justify-center items-center" style={{ height: '400px' }}>
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center items-center overflow-hidden px-2">
       <div
          className="relative"
          style={{
            width: Math.min(boardWidth * cellSize, window.innerWidth - 32),
            height: Math.min(boardHeight * cellSize, window.innerHeight - 200),
            maxWidth: '100vw',
            maxHeight: '100vh',
          }}
        >
      {/* Render grid background */}
      {gridCells.map(({ x, y }) => (
        <div
          key={`grid-${x}-${y}`}
          className="absolute border-[1px] border-neutral-800/50"
          style={{
            left: x * cellSize,
            top: y * cellSize,
            width: cellSize,
            height: cellSize,
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
