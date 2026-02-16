import './LoadingState.css'

export default function LoadingState() {
  return (
    <div className="loading-state">
      <div className="spinner" />
      <p>Fetching latest news...</p>
    </div>
  )
}
