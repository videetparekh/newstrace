import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import LocationMarker from './LocationMarker'
import 'leaflet/dist/leaflet.css'
import './WorldMap.css'

// Custom marker icons for game mode
const guessPinIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const correctPinIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// Map click handler component
function MapClickHandler({ onMapClick, isActive }) {
  useMapEvents({
    click: (e) => {
      if (isActive) {
        onMapClick(e.latlng.lat, e.latlng.lng)
      }
    }
  })
  return null
}

export default function WorldMap({
  locations = [],
  onLocationHover,
  newsData,
  isLoading,
  hoveredLocationId,
  // Game mode props
  gameMode = false,
  guessPin = null,
  onMapClick = null,
  roundResult = null
}) {
  return (
    <div className="world-map">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={10}
        scrollWheelZoom={true}
        className="map-container"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Map click handler for game mode */}
        {gameMode && (
          <MapClickHandler
            onMapClick={onMapClick}
            isActive={!roundResult}
          />
        )}

        {/* Location markers (only in viewer mode or after round complete) */}
        {!gameMode && locations.map((loc) => (
          <LocationMarker
            key={loc.location_id}
            location={loc}
            onMouseOver={onLocationHover}
            newsData={hoveredLocationId === loc.location_id ? newsData : null}
            isLoading={hoveredLocationId === loc.location_id && isLoading}
          />
        ))}

        {/* Guess pin (blue) in game mode */}
        {gameMode && guessPin && (
          <Marker
            position={[guessPin.lat, guessPin.lng]}
            icon={guessPinIcon}
          />
        )}

        {/* Correct location (green) + distance line after guess submission */}
        {gameMode && roundResult && (
          <>
            <Marker
              position={[
                roundResult.correct_location.lat,
                roundResult.correct_location.lng
              ]}
              icon={correctPinIcon}
            />
            <Polyline
              positions={[
                [roundResult.guess_location.lat, roundResult.guess_location.lng],
                [roundResult.correct_location.lat, roundResult.correct_location.lng]
              ]}
              color="red"
              weight={3}
              dashArray="5, 10"
            />
          </>
        )}
      </MapContainer>
    </div>
  )
}
