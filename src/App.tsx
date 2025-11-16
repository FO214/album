import './App.css'
import { useEffect } from 'react'
import { useSpotifyAuth } from './hooks/useSpotifyAuth'
import { useSpotifyPlayback } from './hooks/useSpotifyPlayback'

const formatTime = (ms: number) => {
  if (!ms || ms < 0) return '0:00'
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function App() {
  const { state: authState, login } = useSpotifyAuth()
  const { state: playbackState } = useSpotifyPlayback()

  const isAuthed = authState.status === 'authenticated'
  const progressPercent = playbackState.track?.durationMs
    ? Math.min(100, Math.max(0, Math.round((playbackState.progressMs / playbackState.track.durationMs) * 100)))
    : 0

  const trackTitle = playbackState.track?.name ?? 'Waiting for playback'
  const trackArtist = playbackState.track?.artists ?? 'Play something on Spotify'

  const elapsedLabel = formatTime(playbackState.progressMs)
  const durationLabel = formatTime(playbackState.track?.durationMs ?? 0)
  const authBusy = authState.status === 'loading'
  const statusLabel = playbackState.status === 'playing'
    ? 'Playing'
    : playbackState.status === 'paused'
      ? 'Paused'
      : playbackState.status === 'error'
        ? 'Error'
        : 'Idle'
  const hasTrack = Boolean(playbackState.track)

  useEffect(() => {
    if (!isAuthed || !hasTrack) {
      return
    }

    const handler = (event: KeyboardEvent) => {
      if (!event.code?.startsWith('Media')) return
      event.preventDefault()
    }

    window.addEventListener('keydown', handler, { capture: true })
    return () => window.removeEventListener('keydown', handler, { capture: true })
  }, [isAuthed, hasTrack])

  if (!isAuthed) {
    return (
      <main className="overlay-root overlay-root--auth">
        <section className="auth-card">
          <h1>Welcome to Album.</h1>
          <button
            type="button"
            className="primary-btn"
            onClick={() => {
              if (!authBusy) {
                void login()
              }
            }}
            disabled={authBusy}
          >
            {authBusy ? 'Connecting…' : 'Connect Spotify'}
          </button>
          {(authState.error || playbackState.error) && (
            <p className="error-chip">{authState.error ?? playbackState.error}</p>
          )}
        </section>
      </main>
    )
  }

  return (
    <main className="overlay-root overlay-root--compact">
      <section className="vinyl-card" data-status={playbackState.status}>
        <div className="vinyl-stage">
          <div className="vinyl-shell" data-playing={playbackState.status === 'playing'}>
            <div className="vinyl-grooves" />
            <div className="vinyl-label">
              {playbackState.track?.albumImageUrl ? (
                <img
                  src={playbackState.track.albumImageUrl}
                  alt={playbackState.track.album ?? 'Album art'}
                  draggable={false}
                />
              ) : (
                <span className="vinyl-placeholder">No Art</span>
              )}
            </div>
          </div>
          <span className={`playback-pill playback-pill--${playbackState.status}`}>
            {statusLabel}
          </span>
        </div>
        <div className="track-meta track-meta--compact">
          <p className="track-title">{trackTitle}</p>
          <p className="track-artist">{trackArtist}</p>
        </div>
        <div className="timeline">
          <div className="timeline-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="timeline-times">
          <span>{elapsedLabel}</span>
          <span>{durationLabel}</span>
        </div>
        {playbackState.error && (
          <p className="error-chip" style={{ marginTop: '8px' }}>{playbackState.error}</p>
        )}
      </section>
    </main>
  )
}

export default App
