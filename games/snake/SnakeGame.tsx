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
  console.log(isMobile);

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
    <div className="min-h-screen overflow-hidden">
      {/* Game content at top */}
      <div 
        className="flex-1 p-2 sm:p-4 md:p-6 w-full snake-game-content max-w-full"
        onClick={isMobile ? handleMobileScreenTap : undefined}
      >
        <GameStatus 
          status={gameState.status} 
          score={gameState.score} 
          isMobile={isMobile}
          onReset={() => {
            resetGame();
            setTimeout(() => startGame(), 50);
          }}
        />
        
        <div className="mb-4 flex-shrink-0 w-full max-w-full">
          <SnakeBoard
            snake={gameState.snake}
            apple={gameState.apple}
            boardWidth={config.boardWidth}
            boardHeight={config.boardHeight}
          />
        </div>
      </div>

      {/* Mobile controls at bottom - Always show for now to test */}
      {isMobile && <MobileControls 
        onDirectionChange={changeDirection} 
      />}
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
