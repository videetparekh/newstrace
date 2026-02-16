import { useState, useCallback } from 'react'

export function useNews() {
  const [headlines, setHeadlines] = useState(null)
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
      setHeadlines(data)
    } catch (err) {
      setError(err.message)
      setHeadlines(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const clearHeadlines = useCallback(() => {
    setHeadlines(null)
    setError(null)
  }, [])

  return { headlines, loading, error, fetchNews, clearHeadlines }
}
