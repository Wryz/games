'use client'
import { Direction } from '../types/SnakeTypes';

interface MobileControlsProps {
  onDirectionChange: (direction: Direction) => void;
  onReset?: () => void;
}

const MobileControls = ({ onDirectionChange, onReset }: MobileControlsProps) => {
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
          className="w-15 h-15 min-w-[48px] min-h-[48px] bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 rounded-[8px] shadow-lg border border-cyan-400 flex items-center justify-center transition-all duration-150"
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

        {/* Empty top-right */}
        <div></div>

        {/* Left Arrow */}
        <button
          className="w-15 h-15 min-w-[48px] min-h-[48px] bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 rounded-[8px] shadow-lg border border-cyan-400 flex items-center justify-center transition-all duration-150"
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

        {/* Center reset button */}
        <button
          className="w-15 h-15 min-w-[48px] min-h-[48px] bg-red-600 hover:bg-red-500 active:bg-red-700 rounded-[8px] border border-red-400 shadow-md flex items-center justify-center transition-colors duration-150"
          onClick={onReset}
          onTouchStart={(e) => {
            e.preventDefault();
            onReset?.();
          }}
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        {/* Right Arrow */}
        <button
          className="w-15 h-15 min-w-[48px] min-h-[48px] bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 rounded-[8px] shadow-lg border border-cyan-400 flex items-center justify-center transition-all duration-150"
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

        {/* Empty bottom-left */}
        <div></div>

        {/* Down Arrow */}
        <button
          className="w-15 h-15 min-w-[48px] min-h-[48px] bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 rounded-[8px] shadow-lg border border-cyan-400 flex items-center justify-center transition-all duration-150"
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

        {/* Empty bottom-right */}
        <div></div>
      </div>
    </div>
  );
};

export default MobileControls;
