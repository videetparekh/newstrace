import './RoundResultModal.css'

export default function RoundResultModal({ result, onNext, isFinalRound }) {
  return (
    <div className="modal-overlay">
      <div className="round-result-modal">
        <h2>Round {result.current_round_number} Results</h2>

        <div className="result-details">
          <div className="correct-location">
            <h3>Correct Answer</h3>
            <p className="city-name">
              {result.correct_location.city}, {result.correct_location.country}
            </p>
          </div>

          <div className="distance-display">
            <span className="distance-label">Your guess was</span>
            <span className="distance-value">
              {Math.round(result.distance_km).toLocaleString()} km
            </span>
            <span className="distance-label">away</span>
          </div>

          <div className="score-display">
            <div className="round-score">
              <span className="score-label">Round Score</span>
              <span className="score-value">+{result.round_score}</span>
            </div>
            <div className="total-score">
              <span className="score-label">Total Score</span>
              <span className="score-value">{result.total_score} / 5000</span>
            </div>
          </div>
        </div>

        <button className="next-button" onClick={onNext}>
          {isFinalRound ? 'See Final Results' : 'Next Round'}
        </button>
      </div>
    </div>
  )
}
