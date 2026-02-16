import { useEffect, useState } from 'react'
import './HelpModal.css'

export default function HelpModal({ onClose }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/docs/how-to-use.md')
      .then((res) => res.text())
      .then((text) => {
        setContent(text)
        setLoading(false)
      })
      .catch(() => {
        setContent('Unable to load help content.')
        setLoading(false)
      })
  }, [])

  return (
    <div className="help-modal-overlay" onClick={onClose}>
      <div className="help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="help-modal-header">
          <h2>How to Use</h2>
          <button className="help-close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>
        <div className="help-modal-body">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }} />
          )}
        </div>
      </div>
    </div>
  )
}

function formatMarkdown(text) {
  return text
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[h|u|l])/gm, '<p>')
    .replace(/$/gm, '</p>')
    .replace(/<\/p><p><\/p>/g, '')
}
