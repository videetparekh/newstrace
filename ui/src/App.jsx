import { useState } from 'react'
import { useLocations } from './hooks/useLocations'
import { useNews } from './hooks/useNews'
import WorldMap from './components/WorldMap'
import HeadlineCard from './components/HeadlineCard'
import LoadingState from './components/LoadingState'
import HelpModal from './components/HelpModal'
import ThemeToggle from './components/ThemeToggle'
import './App.css'

function App() {
  const { locations, loading: locationsLoading } = useLocations()
  const { headline, loading: newsLoading, error, fetchNews, clearHeadline } = useNews()
  const [showHelp, setShowHelp] = useState(false)

  const handleLocationClick = (location) => {
    fetchNews(location.location_id)
  }

  if (locationsLoading) {
    return (
      <div className="app">
        <header className="app-header">
          <h1 className="app-title">Global News Map</h1>
        </header>
        <LoadingState />
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-content">
          <div>
            <h1 className="app-title">Global News Map</h1>
            <p className="app-subtitle">Click a city to see the latest headline</p>
          </div>
          <div className="header-buttons">
            <ThemeToggle />
            <button className="help-button" onClick={() => setShowHelp(true)}>
              How to Use
            </button>
          </div>
        </div>
      </header>
      <main className="app-main">
        <WorldMap locations={locations} onLocationClick={handleLocationClick} />
        <aside className="app-sidebar">
          {newsLoading && <LoadingState />}
          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}
          {!newsLoading && !error && headline && (
            <HeadlineCard data={headline} onClose={clearHeadline} />
          )}
          {!newsLoading && !error && !headline && (
            <div className="placeholder">
              <p>Select a city on the map to view the latest breaking news.</p>
            </div>
          )}
        </aside>
      </main>
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  )
}

export default App
