import { useEffect, useState, useCallback } from 'react'
import type { SpotifyAuthState } from '@shared/spotify'

const defaultState: SpotifyAuthState = {
  status: 'loading',
  expiresAt: null,
}

export function useSpotifyAuth() {
  const [state, setState] = useState<SpotifyAuthState>(defaultState)

  useEffect(() => {
    let active = true

    window.spotifyAuth.getState()
      .then((current) => {
        if (active) {
          setState(current)
        }
      })
      .catch((error) => {
        if (active) {
          setState({ status: 'error', expiresAt: null, error: error instanceof Error ? error.message : String(error) })
        }
      })

    const unsubscribe = window.spotifyAuth.onStateChanged((nextState) => {
      if (active) {
        setState(nextState)
      }
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const login = useCallback(() => window.spotifyAuth.login(), [])
  const logout = useCallback(() => window.spotifyAuth.logout(), [])

  return { state, login, logout }
}

