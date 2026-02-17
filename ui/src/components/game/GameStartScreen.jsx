import './GameStartScreen.css'

export default function GameStartScreen({ onStart, isLoading }) {
  return (
    <div className="game-start-screen">
      <div className="game-start-content">
        <h1>Global News Guessing Game</h1>
        <p className="game-subtitle">
          Test your geography knowledge by guessing where news is happening!
        </p>

        <div className="game-rules">
          <h2>How to Play</h2>
          <ol>
            <li>You'll see a news headline from somewhere in the world</li>
            <li>Click on the map where you think the news is from</li>
            <li>Submit your guess to see how close you were</li>
            <li>Earn up to 1,000 points per round based on accuracy</li>
            <li>Play 5 rounds and try to maximize your score!</li>
          </ol>

          <div className="scoring-info">
            <h3>Scoring</h3>
            <p>Perfect guess (0 km away): 1,000 points</p>
            <p>10,000 km away: 500 points</p>
            <p>20,000+ km away: 0 points</p>
            <p className="max-score">Maximum score: 5,000 points</p>
          </div>
        </div>

        <button
          className="start-game-button"
          onClick={onStart}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner"></span>
              Loading headlines...
            </>
          ) : (
            'Start Game'
          )}
        </button>
      </div>
    </div>
  )
}
