import { useGame } from './hooks/useGame'
import WorldMap from './components/WorldMap'
import GameStartScreen from './components/game/GameStartScreen'
import ScoreDisplay from './components/game/ScoreDisplay'
import HeadlineBox from './components/game/HeadlineBox'
import RoundResultModal from './components/game/RoundResultModal'
import GameResultsScreen from './components/game/GameResultsScreen'
import ThemeToggle from './components/ThemeToggle'
import './App.css'

function App() {
  const game = useGame()

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-content">
          <h1 className="app-title">Global News Guessing Game</h1>
          <div className="header-buttons">
            {(game.gameState === 'active' || game.gameState === 'round_complete') && (
              <ScoreDisplay
                roundNumber={game.roundNumber}
                totalScore={game.totalScore}
              />
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="app-main">
        {game.gameState === 'idle' && (
          <GameStartScreen onStart={game.startGame} isLoading={game.loading} />
        )}

        {(game.gameState === 'active' || game.gameState === 'round_complete') && (
          <div className="game-container">
            <WorldMap
              gameMode={true}
              guessPin={game.guessPin}
              onMapClick={game.placeGuess}
              roundResult={game.roundResult}
            />
            <HeadlineBox
              headline={game.currentRound?.headline || ''}
              hasGuess={!!game.guessPin}
              onSubmit={game.submitGuess}
              isSubmitting={game.loading}
            />
          </div>
        )}

        {game.gameState === 'round_complete' && game.roundResult && (
          <RoundResultModal
            result={game.roundResult}
            onNext={game.nextRound}
            isFinalRound={game.roundResult.is_final_round}
          />
        )}

        {game.gameState === 'game_complete' && (
          <GameResultsScreen
            gameId={game.gameId}
            onPlayAgain={() => {
              game.resetGame()
              game.startGame()
            }}
          />
        )}

        {game.error && (
          <div className="error-message">
            Error: {game.error}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
