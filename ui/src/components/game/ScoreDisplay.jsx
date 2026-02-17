import './ScoreDisplay.css'

export default function ScoreDisplay({ roundNumber, totalScore }) {
  return (
    <div className="score-display-header">
      <div className="score-item">
        <span className="score-label">Round</span>
        <span className="score-value">{roundNumber}/5</span>
      </div>
      <div className="score-divider"></div>
      <div className="score-item">
        <span className="score-label">Score</span>
        <span className="score-value">{totalScore}</span>
      </div>
    </div>
  )
}
