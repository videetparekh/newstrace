import { useState, useEffect } from 'react'

export function useLocations() {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/locations')
      .then((res) => res.json())
      .then((data) => {
        setLocations(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return { locations, loading }
}
