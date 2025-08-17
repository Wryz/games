import { GameStatus } from '../../types/GameTypes';

interface GameControlsProps {
  status: GameStatus;
  onReset: () => void;
  onBackToHome: () => void;
  onStartStop: () => void;
}

const GameControls = ({ status, onReset, onBackToHome, onStartStop }: GameControlsProps) => {
  const getStartStopText = () => {
    switch (status) {
      case GameStatus.Playing:
        return 'Pause';
      case GameStatus.Idle:
      case GameStatus.Paused:
      case GameStatus.Draw:
        return 'Start';
      default:
        return 'Start';
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 mt-6">
      <div className="text-sm text-gray-400 text-center mt-4">
        <p className="text-lg font-semibold text-yellow-400 mb-2">Press <span className="text-cyan-400 bg-gray-800 px-2 py-1 rounded">SPACEBAR</span> to start!</p>
        <p>Use <span className="text-cyan-400 font-semibold">Arrow Keys</span> to control the snake</p>
        <p>Press <span className="text-cyan-400 font-semibold">Space</span> to pause/resume</p>
      </div>
    </div>
  );
};

export default GameControls;
