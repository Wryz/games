import { GameStatus as BaseGameStatus } from '../../types/GameTypes';

interface GameStatusProps {
  status: BaseGameStatus;
  score: number;
  isMobile?: boolean;
}

const GameStatus = ({ status, score, isMobile = false }: GameStatusProps) => {
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
    <div className="text-center mb-4 sm:mb-6 px-2">
      <div className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-2 text-gray-100">
        Score: <span className="text-cyan-400">{score}</span>
      </div>
      <div className={`text-sm sm:text-base md:text-lg lg:text-xl font-semibold ${statusColor} leading-tight px-4`}>
        {statusMessage}
      </div>
    </div>
  );
};

export default GameStatus;
