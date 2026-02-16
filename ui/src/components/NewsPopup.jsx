import './NewsPopup.css'

export default function NewsPopup({ data }) {
  if (!data || !data.headlines || data.headlines.length === 0) {
    return (
      <div className="news-popup">
        <div className="news-popup-header">
          <h3>{data?.city}, {data?.country}</h3>
        </div>
        <p className="news-popup-no-data">No news available</p>
      </div>
    )
  }

  const { city, country, headlines } = data

  return (
    <div className="news-popup">
      <div className="news-popup-header">
        <h3>{city}, {country}</h3>
        <span className="news-popup-count">Top {headlines.length} Headlines</span>
      </div>
      <div className="news-popup-items">
        {headlines.map((headline, index) => (
          <div key={index} className="news-popup-item">
            <div className="news-popup-item-number">{index + 1}</div>
            <div className="news-popup-item-content">
              <h4 className="news-popup-title">{headline.title}</h4>
              <div className="news-popup-meta">
                <span className="news-popup-source">{headline.source}</span>
              </div>
              <a
                className="news-popup-link"
                href={headline.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                Read more →
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
