import { MapContainer, TileLayer } from 'react-leaflet'
import LocationMarker from './LocationMarker'
import 'leaflet/dist/leaflet.css'
import './WorldMap.css'

export default function WorldMap({ locations, onLocationClick }) {
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
        {locations.map((loc) => (
          <LocationMarker
            key={loc.location_id}
            location={loc}
            onClick={onLocationClick}
          />
        ))}
      </MapContainer>
    </div>
  )
}
