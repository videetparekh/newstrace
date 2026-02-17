import './HeadlineBox.css'

export default function HeadlineBox({ headline, hasGuess, onSubmit, isSubmitting }) {
  return (
    <div className="headline-box">
      <div className="headline-content">
        <h4 className="headline-title">Where is this news from?</h4>
        <p className="headline-text">{headline}</p>
      </div>
      <div className="headline-controls">
        <p className="headline-instruction">
          {hasGuess ? 'Click Submit to lock in your guess' : 'Click on the map to place your guess'}
        </p>
        <button
          className="headline-submit-button"
          onClick={onSubmit}
          disabled={!hasGuess || isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Guess'}
        </button>
      </div>
    </div>
  )
}
