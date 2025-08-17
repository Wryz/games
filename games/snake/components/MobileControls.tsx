'use client'
import { Direction } from '../types/SnakeTypes';

interface MobileControlsProps {
  onDirectionChange: (direction: Direction) => void;
}

const MobileControls = ({ onDirectionChange }: MobileControlsProps) => {
  const handleDirectionPress = (direction: Direction) => {
    onDirectionChange(direction);
  };

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-10">
      <div className="relative w-32 h-32">
        {/* Center circle */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-gray-700 rounded-full border-2 border-gray-600"></div>
        
        {/* Up Arrow */}
        <button
          className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 rounded-lg shadow-lg flex items-center justify-center transition-colors duration-150"
          onTouchStart={(e) => {
            e.preventDefault();
            handleDirectionPress(Direction.UP);
          }}
          onClick={() => handleDirectionPress(Direction.UP)}
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
          </svg>
        </button>

        {/* Down Arrow */}
        <button
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 rounded-lg shadow-lg flex items-center justify-center transition-colors duration-150"
          onTouchStart={(e) => {
            e.preventDefault();
            handleDirectionPress(Direction.DOWN);
          }}
          onClick={() => handleDirectionPress(Direction.DOWN)}
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Left Arrow */}
        <button
          className="absolute left-0 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 rounded-lg shadow-lg flex items-center justify-center transition-colors duration-150"
          onTouchStart={(e) => {
            e.preventDefault();
            handleDirectionPress(Direction.LEFT);
          }}
          onClick={() => handleDirectionPress(Direction.LEFT)}
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Right Arrow */}
        <button
          className="absolute right-0 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 rounded-lg shadow-lg flex items-center justify-center transition-colors duration-150"
          onTouchStart={(e) => {
            e.preventDefault();
            handleDirectionPress(Direction.RIGHT);
          }}
          onClick={() => handleDirectionPress(Direction.RIGHT)}
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default MobileControls;
