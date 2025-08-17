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
    <div className="w-full h-full flex items-center justify-center">
        <div className="grid grid-cols-3 grid-rows-3 gap-2 w-fit">
          {/* Empty top-left */}
          <div></div>
          
          {/* Up Arrow */}
          <button
            className="w-20 h-20 min-w-[64px] min-h-[64px] bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 rounded-[12px] shadow-lg border border-cyan-400 flex items-center justify-center transition-all duration-150"
            onTouchStart={(e) => {
              e.preventDefault();
              handleDirectionPress(Direction.UP);
            }}
            onClick={() => handleDirectionPress(Direction.UP)}
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
            </svg>
          </button>

          {/* Empty top-right */}
          <div></div>

          {/* Left Arrow */}
          <button
            className="w-20 h-20 min-w-[64px] min-h-[64px] bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 rounded-[12px] shadow-lg border border-cyan-400 flex items-center justify-center transition-all duration-150"
            onTouchStart={(e) => {
              e.preventDefault();
              handleDirectionPress(Direction.LEFT);
            }}
            onClick={() => handleDirectionPress(Direction.LEFT)}
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Empty center */}
          <div></div>

          {/* Right Arrow */}
          <button
            className="w-20 h-20 min-w-[64px] min-h-[64px] bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 rounded-[12px] shadow-lg border border-cyan-400 flex items-center justify-center transition-all duration-150"
            onTouchStart={(e) => {
              e.preventDefault();
              handleDirectionPress(Direction.RIGHT);
            }}
            onClick={() => handleDirectionPress(Direction.RIGHT)}
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Empty bottom-left */}
          <div></div>

          {/* Down Arrow */}
          <button
            className="w-20 h-20 min-w-[64px] min-h-[64px] bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 rounded-[12px] shadow-lg border border-cyan-400 flex items-center justify-center transition-all duration-150"
            onTouchStart={(e) => {
              e.preventDefault();
              handleDirectionPress(Direction.DOWN);
            }}
            onClick={() => handleDirectionPress(Direction.DOWN)}
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Empty bottom-right */}
          <div></div>
        </div>
    </div>
  );
};

export default MobileControls;
