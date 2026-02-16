import { useState } from 'react'
import { useLocations } from './hooks/useLocations'
import { useNews } from './hooks/useNews'
import WorldMap from './components/WorldMap'
import LoadingState from './components/LoadingState'
import HelpModal from './components/HelpModal'
import ThemeToggle from './components/ThemeToggle'
import './App.css'

function App() {
  const { locations, loading: locationsLoading } = useLocations()
  const { headlines, loading: newsLoading, fetchNews } = useNews()
  const [showHelp, setShowHelp] = useState(false)
  const [hoveredLocationId, setHoveredLocationId] = useState(null)

  const handleLocationHover = (location) => {
    setHoveredLocationId(location.location_id)
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
            <p className="app-subtitle">Hover over a city to see top 3 breaking headlines</p>
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
        <WorldMap
          locations={locations}
          onLocationHover={handleLocationHover}
          newsData={headlines}
          isLoading={newsLoading}
          hoveredLocationId={hoveredLocationId}
        />
      </main>
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  )
}

export default App
