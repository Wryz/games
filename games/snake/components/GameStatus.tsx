import { GameStatus as BaseGameStatus } from '../../types/GameTypes';

interface GameStatusProps {
  status: BaseGameStatus;
  score: number;
  isMobile?: boolean;
  onReset?: () => void;
}

const GameStatus = ({ status, score, isMobile = false, onReset }: GameStatusProps) => {
  let statusMessage = '';
  let statusColor = 'text-gray-300';

  switch (status) {
    case BaseGameStatus.Playing:
      statusMessage = isMobile ? 'Playing - Use controls below to move' : 'Playing - Use arrow keys to move';
      statusColor = 'text-cyan-400';
      break;
    case BaseGameStatus.Lose:
      statusMessage = isMobile ? 'Game Over! Tap screen to play again' : 'Game Over! Press SPACEBAR to play again';
      statusColor = 'text-red-400';
      break;
    case BaseGameStatus.Idle:
      statusMessage = isMobile ? 'Tap screen to start playing!' : 'Press SPACEBAR to start playing!';
      statusColor = 'text-yellow-400';
      break;
    case BaseGameStatus.Paused:
      statusMessage = isMobile ? 'Paused - Tap screen to continue' : 'Paused - Press SPACEBAR to continue';
      statusColor = 'text-yellow-400';
      break;
    case BaseGameStatus.Win:
      statusMessage = 'You Win! Amazing!';
      statusColor = 'text-green-400';
      break;
    case BaseGameStatus.Draw:
      statusMessage = 'Game Paused';
      statusColor = 'text-yellow-400';
      break;
  }

  return (
    <div className="relative w-full text-center mb-4 sm:mb-6 px-2">
      <div className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-2 text-gray-100">
        Score: <span className="text-cyan-400">{score}</span>
      </div>
      <div className={`text-sm sm:text-base md:text-lg lg:text-xl font-semibold ${statusColor} leading-tight px-4`}>
        {statusMessage}
      </div>
      
      {/* Reset button positioned to the right on mobile */}
      {isMobile && onReset && (
        <button
          className="absolute top-2 right-2 w-12 h-12 min-w-[40px] min-h-[40px] bg-red-600 hover:bg-red-500 active:bg-red-700 rounded-[8px] border border-red-400 shadow-lg flex items-center justify-center transition-colors duration-150"
          onClick={onReset}
          onTouchStart={(e) => {
            e.preventDefault();
            onReset();
          }}
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default GameStatus;
