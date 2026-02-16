import { useState, useCallback } from 'react'

export function useNews() {
  const [headline, setHeadline] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchNews = useCallback(async (locationId) => {
    setLoading(true)
    setError(null)
    try {
      const resp = await fetch(`/api/news/${locationId}`)
      if (!resp.ok) {
        throw new Error(resp.status === 503 ? 'News unavailable for this location' : 'Failed to fetch news')
      }
      const data = await resp.json()
      setHeadline(data)
    } catch (err) {
      setError(err.message)
      setHeadline(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const clearHeadline = useCallback(() => {
    setHeadline(null)
    setError(null)
  }, [])

  return { headline, loading, error, fetchNews, clearHeadline }
}
