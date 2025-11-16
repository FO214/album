import { useCallback, useEffect, useState } from 'react'
import type { SpotifyPlaybackState } from '@shared/spotify'

const defaultPlayback: SpotifyPlaybackState = {
  status: 'unauthorized',
  track: null,
  progressMs: 0,
  updatedAt: Date.now(),
}

export function useSpotifyPlayback() {
  const [state, setState] = useState<SpotifyPlaybackState>(defaultPlayback)

  useEffect(() => {
    let active = true

    window.spotifyPlayback.getState()
      .then((current) => {
        if (active) {
          setState(current)
        }
      })
      .catch((error) => {
        if (active) {
          setState({
            status: 'error',
            track: null,
            progressMs: 0,
            updatedAt: Date.now(),
            error: error instanceof Error ? error.message : String(error),
          })
        }
      })

    const unsubscribe = window.spotifyPlayback.onStateChanged((next) => {
      if (active) {
        setState(next)
      }
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const forceRefresh = useCallback(() => window.spotifyPlayback.forceRefresh(), [])

  return { state, forceRefresh }
}

