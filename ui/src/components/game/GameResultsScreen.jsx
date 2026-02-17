import { useState, useEffect } from 'react'
import './GameResultsScreen.css'

export default function GameResultsScreen({ gameId, onPlayAgain }) {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchResults() {
      try {
        const resp = await fetch(`/api/game/${gameId}/results`)
        const data = await resp.json()
        setResults(data)
      } catch (err) {
        console.error('Failed to fetch results:', err)
      } finally {
        setLoading(false)
      }
    }

    if (gameId) {
      fetchResults()
    }
  }, [gameId])

  if (loading) {
    return (
      <div className="game-results-screen loading">
        <div className="loading-spinner"></div>
        <p>Loading results...</p>
      </div>
    )
  }

  if (!results) {
    return <div className="game-results-screen error">Failed to load results</div>
  }

  const percentage = ((results.total_score / results.max_possible_score) * 100).toFixed(1)

  return (
    <div className="game-results-screen">
      <div className="results-header">
        <h1>Game Complete!</h1>
        <div className="final-score">
          <div className="score-number">{results.total_score}</div>
          <div className="score-max">/ {results.max_possible_score}</div>
          <div className="score-percentage">{percentage}%</div>
        </div>
      </div>

      <div className="results-stats">
        <div className="stat-card">
          <span className="stat-value">
            {Math.round(results.average_distance_km).toLocaleString()} km
          </span>
          <span className="stat-label">Average Distance</span>
        </div>
      </div>

      <div className="rounds-breakdown">
        <h2>Round Breakdown</h2>
        <table className="rounds-table">
          <thead>
            <tr>
              <th>Round</th>
              <th>Location</th>
              <th>Distance</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {results.rounds_summary.map((round) => (
              <tr key={round.round_number}>
                <td>{round.round_number}</td>
                <td>{round.city}, {round.country}</td>
                <td>{Math.round(round.distance_km).toLocaleString()} km</td>
                <td>{round.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button className="play-again-button" onClick={onPlayAgain}>
        Play Again
      </button>
    </div>
  )
}
