import { Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

export default function LocationMarker({ location, onClick }) {
  return (
    <Marker
      position={[location.lat, location.lng]}
      icon={markerIcon}
      eventHandlers={{
        click: () => onClick(location),
      }}
    >
      <Tooltip direction="top" offset={[0, -40]}>
        {location.city}, {location.country}
      </Tooltip>
    </Marker>
  )
}
