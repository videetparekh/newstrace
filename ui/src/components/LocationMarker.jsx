import { Marker, Popup } from 'react-leaflet'
import { useEffect, useRef } from 'react'
import L from 'leaflet'
import NewsPopup from './NewsPopup'

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

export default function LocationMarker({ location, onMouseOver, newsData, isLoading }) {
  const markerRef = useRef(null)

  useEffect(() => {
    if (newsData && markerRef.current) {
      markerRef.current.openPopup()
    }
  }, [newsData])

  return (
    <Marker
      ref={markerRef}
      position={[location.lat, location.lng]}
      icon={markerIcon}
      eventHandlers={{
        mouseover: () => {
          onMouseOver(location)
        },
      }}
    >
      <Popup
        closeButton={true}
        minWidth={320}
        maxWidth={400}
        autoPan={true}
        keepInView={true}
      >
        {isLoading ? (
          <div className="news-popup">
            <div className="news-popup-header">
              <h3>{location.city}, {location.country}</h3>
            </div>
            <p className="news-popup-no-data">Loading news...</p>
          </div>
        ) : newsData ? (
          <NewsPopup data={newsData} />
        ) : (
          <div className="news-popup">
            <div className="news-popup-header">
              <h3>{location.city}, {location.country}</h3>
            </div>
            <p className="news-popup-no-data">Hover to load news</p>
          </div>
        )}
      </Popup>
    </Marker>
  )
}
