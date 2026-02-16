import './HeadlineCard.css'

export default function HeadlineCard({ data, onClose }) {
  if (!data) return null

  const { city, country, headline } = data
  const publishedDate = headline.published_at
    ? new Date(headline.published_at).toLocaleString()
    : 'Unknown'

  return (
    <div className="headline-card">
      <div className="headline-card-header">
        <div>
          <h2 className="headline-city">{city}</h2>
          <span className="headline-country">{country}</span>
        </div>
        <button className="headline-close" onClick={onClose} aria-label="Close">
          &times;
        </button>
      </div>
      <div className="headline-card-body">
        <h3 className="headline-title">{headline.title}</h3>
        <div className="headline-meta">
          <span className="headline-source">{headline.source}</span>
          <span className="headline-time">{publishedDate}</span>
        </div>
        <a
          className="headline-link"
          href={headline.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Read full article
        </a>
      </div>
    </div>
  )
}
