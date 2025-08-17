'use client'
import { useRouter } from 'next/navigation';
import { SnakeGameProvider, useSnakeGame } from './context/SnakeGameContext';
import SnakeBoard from './components/SnakeBoard';
import GameStatus from './components/GameStatus';
import MobileControls from './components/MobileControls';
import { useIsMobile } from './hooks/useIsMobile';
import { GameStatus as BaseGameStatus } from '../types/GameTypes';

const SnakeGameContent = () => {
  const {
    gameState,
    config,
    changeDirection,
    startGame,
    stopGame,
    resetGame,
  } = useSnakeGame();
  
  const isMobile = useIsMobile();

  const handleMobileScreenTap = () => {
    if (!isMobile) return;
    
    if (gameState.status === BaseGameStatus.Playing) {
      stopGame();
    } else if (gameState.status === BaseGameStatus.Idle || gameState.status === BaseGameStatus.Paused) {
      startGame();
    } else if (gameState.status === BaseGameStatus.Lose) {
      resetGame();
      setTimeout(() => startGame(), 50);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 overflow-x-hidden">
      {/* Game content at top */}
      <div 
        className="flex-1 flex flex-col items-center justify-start p-2 sm:p-4 md:p-8 w-full"
        onClick={isMobile ? handleMobileScreenTap : undefined}
      >
        <GameStatus status={gameState.status} score={gameState.score} isMobile={isMobile} />
        
        <div className="mb-6 flex-shrink-0">
          <SnakeBoard
            snake={gameState.snake}
            apple={gameState.apple}
            boardWidth={config.boardWidth}
            boardHeight={config.boardHeight}
          />
        </div>
      </div>

      {/* Mobile controls at bottom */}
      {isMobile && (
        <MobileControls onDirectionChange={changeDirection} />
      )}

      {/* Desktop instructions */}
      {!isMobile && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 text-center">
          <div className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
            <p className="text-sm text-gray-400">
              Use <span className="text-cyan-400 font-semibold">Arrow Keys</span> to move • 
              Press <span className="text-cyan-400 font-semibold">Spacebar</span> to start/pause/reset
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const SnakeGame = () => {
  return (
    <SnakeGameProvider>
      <SnakeGameContent />
    </SnakeGameProvider>
  );
};

export default SnakeGame;
