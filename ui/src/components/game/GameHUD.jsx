import './GameHUD.css'

export default function GameHUD({
  roundNumber,
  totalScore,
  headline,
  hasGuess,
  onSubmit,
  isSubmitting
}) {
  return (
    <div className="game-hud">
      <div className="game-stats">
        <div className="stat">
          <span className="stat-label">Round</span>
          <span className="stat-value">{roundNumber} / 5</span>
        </div>
        <div className="stat">
          <span className="stat-label">Score</span>
          <span className="stat-value">{totalScore}</span>
        </div>
      </div>

      <div className="headline-display">
        <h3>Where is this news from?</h3>
        <p className="headline-text">{headline}</p>
      </div>

      <div className="game-controls">
        <p className="instruction">
          {hasGuess ? 'Click Submit to lock in your guess' : 'Click on the map to place your guess'}
        </p>
        <button
          className="submit-button"
          onClick={onSubmit}
          disabled={!hasGuess || isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Guess'}
        </button>
      </div>
    </div>
  )
}
