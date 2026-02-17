import { useState, useCallback } from 'react'

/**
 * Custom hook for managing game state and API interactions
 */
export function useGame() {
  const [gameId, setGameId] = useState(null)
  const [currentRound, setCurrentRound] = useState(null)
  const [roundNumber, setRoundNumber] = useState(0)
  const [guessPin, setGuessPin] = useState(null)
  const [roundResult, setRoundResult] = useState(null)
  const [gameState, setGameState] = useState('idle') // idle | active | round_complete | game_complete
  const [totalScore, setTotalScore] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const startGame = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const resp = await fetch('/api/game/start', { method: 'POST' })
      if (!resp.ok) throw new Error('Failed to start game')

      const data = await resp.json()
      setGameId(data.game_id)
      setCurrentRound({
        number: data.current_round_number,
        headline: data.headline
      })
      setRoundNumber(1)
      setGameState('active')
      setTotalScore(0)
      setGuessPin(null)
      setRoundResult(null)
    } catch (err) {
      setError(err.message)
      console.error('Error starting game:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const placeGuess = useCallback((lat, lng) => {
    if (gameState !== 'active') return
    setGuessPin({ lat, lng })
  }, [gameState])

  const submitGuess = useCallback(async () => {
    if (!guessPin || !gameId) return

    setLoading(true)
    setError(null)
    try {
      const resp = await fetch(`/api/game/${gameId}/guess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: guessPin.lat, lng: guessPin.lng })
      })

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}))
        const detail = errData.detail || ''
        if (resp.status === 400 && detail.includes('not found')) {
          // Session expired (e.g. server restarted) — go back to start
          setGameState('idle')
          setGameId(null)
          setCurrentRound(null)
          setGuessPin(null)
          setError('Game session expired. Please start a new game.')
          return
        }
        throw new Error(detail || 'Failed to submit guess')
      }

      const data = await resp.json()
      setRoundResult(data)
      setTotalScore(data.total_score)
      setGameState('round_complete')
    } catch (err) {
      setError(err.message)
      console.error('Error submitting guess:', err)
    } finally {
      setLoading(false)
    }
  }, [guessPin, gameId])

  const nextRound = useCallback(async () => {
    if (!gameId) return

    // Check if this was the final round
    if (roundResult?.is_final_round) {
      setGameState('game_complete')
      return
    }

    setLoading(true)
    try {
      const resp = await fetch(`/api/game/${gameId}/next`)
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}))
        const detail = errData.detail || ''
        if (resp.status === 404 && detail.includes('completed or not found')) {
          setGameState('idle')
          setGameId(null)
          setCurrentRound(null)
          setError('Game session expired. Please start a new game.')
          return
        }
        throw new Error(detail || 'Failed to get next round')
      }

      const data = await resp.json()
      setCurrentRound({
        number: data.round_number,
        headline: data.headline
      })
      setRoundNumber(data.round_number)
      setGuessPin(null)
      setRoundResult(null)
      setGameState('active')
    } catch (err) {
      setError(err.message)
      console.error('Error getting next round:', err)
    } finally {
      setLoading(false)
    }
  }, [gameId, roundResult])

  const resetGame = useCallback(() => {
    setGameId(null)
    setCurrentRound(null)
    setRoundNumber(0)
    setGuessPin(null)
    setRoundResult(null)
    setGameState('idle')
    setTotalScore(0)
    setError(null)
  }, [])

  return {
    gameId,
    currentRound,
    roundNumber,
    guessPin,
    roundResult,
    gameState,
    totalScore,
    loading,
    error,
    startGame,
    placeGuess,
    submitGuess,
    nextRound,
    resetGame
  }
}
