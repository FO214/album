import { EventEmitter } from 'node:events'
import type { SpotifyPlaybackState, SpotifyPlaybackStatus, SpotifyTrack } from '@shared/spotify'
import type { SpotifyAuth } from './auth'

interface SpotifyImage {
  url?: string
  width?: number
  height?: number
}

interface SpotifyArtist {
  name?: string
}

interface SpotifyAlbum {
  name?: string
  images?: SpotifyImage[]
}

interface SpotifyTrackPayload {
  id?: string
  uri?: string
  name?: string
  artists?: SpotifyArtist[]
  album?: SpotifyAlbum
  duration_ms?: number
  external_urls?: { spotify?: string }
}

interface SpotifyPlaybackPayload {
  item?: SpotifyTrackPayload | null
  is_playing?: boolean
  progress_ms?: number
  device?: { name?: string | null }
}

const CURRENTLY_PLAYING_ENDPOINT = 'https://api.spotify.com/v1/me/player/currently-playing?additional_types=track'
const PLAYER_ENDPOINT = 'https://api.spotify.com/v1/me/player'

const initialState: SpotifyPlaybackState = {
  status: 'unauthorized',
  track: null,
  progressMs: 0,
  updatedAt: Date.now(),
}

export interface PlaybackServiceOptions {
  intervalMs?: number
}

export class SpotifyPlaybackService extends EventEmitter {
  private state: SpotifyPlaybackState = initialState
  private timer: NodeJS.Timeout | null = null
  private readonly intervalMs: number
  private lastControlAt = 0

  constructor(private readonly auth: SpotifyAuth, options?: PlaybackServiceOptions) {
    super()
    this.intervalMs = options?.intervalMs ?? 3000
  }

  start() {
    if (this.timer) return
    this.timer = setInterval(() => {
      void this.refresh()
    }, this.intervalMs)
    void this.refresh()
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  getState() {
    return this.state
  }

  async forceRefresh() {
    await this.refresh(true)
  }

  async togglePlayback() {
    await this.withControl('play-pause', async (token) => {
      const endpoint = `${PLAYER_ENDPOINT}/${this.state.status === 'playing' ? 'pause' : 'play'}`
      await fetch(endpoint, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
    })
  }

  async nextTrack() {
    await this.withControl('next', async (token) => {
      await fetch(`${PLAYER_ENDPOINT}/next`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    })
  }

  async previousTrack() {
    await this.withControl('previous', async (token) => {
      await fetch(`${PLAYER_ENDPOINT}/previous`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    })
  }

  private async refresh(force = false) {
    const tokens = await this.auth.getValidTokens()
    if (!tokens) {
      if (this.state.status !== 'unauthorized' || force) {
        this.updateState(this.emptyState('unauthorized'))
      }
      return
    }

    try {
      const response = await fetch(CURRENTLY_PLAYING_ENDPOINT, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      })

      if (response.status === 204) {
        this.updateState({
          ...this.emptyState('idle'),
          error: 'No active Spotify session. Open Spotify and start playing.',
        })
        return
      }

      if (response.status === 401) {
        await this.auth.logout()
        this.updateState({
          ...this.emptyState('unauthorized'),
          error: 'Spotify session expired. Please reconnect.',
        })
        return
      }

      if (!response.ok) {
        const errorText = await response.text()
        this.setError(`API Error (${response.status}): ${errorText || 'Unknown error'}`)
        return
      }

      const payload = await response.json()
      const normalized = this.normalizePayload(payload)
      this.updateState(normalized)
    } catch (error) {
      this.setError(error instanceof Error ? error.message : String(error))
    }
  }

  private async withControl(_: 'play-pause' | 'next' | 'previous', fn: (accessToken: string) => Promise<void>) {
    if (Date.now() - this.lastControlAt < 500) {
      return
    }
    const tokens = await this.auth.getValidTokens()
    if (!tokens) return

    try {
      await fn(tokens.accessToken)
      this.lastControlAt = Date.now()
      await this.refresh(true)
    } catch (error) {
      this.setError(error instanceof Error ? error.message : String(error))
    }
  }

  private emptyState(status: SpotifyPlaybackStatus): SpotifyPlaybackState {
    return {
      status,
      track: null,
      progressMs: 0,
      updatedAt: Date.now(),
    }
  }

  private normalizePayload(payload: SpotifyPlaybackPayload): SpotifyPlaybackState {
    const track = payload?.item
    const artists: string = Array.isArray(track?.artists)
      ? track.artists.map((artist: { name?: string }) => artist?.name).filter(Boolean).join(', ')
      : 'Unknown artist'

    const albumImages = track?.album?.images ?? []
    const sortedImages = Array.isArray(albumImages)
      ? [...albumImages].sort((a, b) => (b?.width ?? 0) - (a?.width ?? 0))
      : []
    const albumImageUrl: string | null = sortedImages[0]?.url ?? null

    const normalizedTrack: SpotifyTrack | null = track
      ? {
          id: track.id ?? track.uri ?? 'unknown',
          name: track.name ?? 'Unknown track',
          artists: artists || 'Unknown artist',
          album: track.album?.name ?? 'Unknown album',
          albumImageUrl,
          durationMs: track.duration_ms ?? 0,
          spotifyUrl: track.external_urls?.spotify ?? null,
        }
      : null

    const status: SpotifyPlaybackStatus = normalizedTrack
      ? payload?.is_playing
        ? 'playing'
        : 'paused'
      : 'idle'

    return {
      status,
      track: normalizedTrack,
      progressMs: payload?.progress_ms ?? 0,
      deviceName: payload?.device?.name ?? null,
      updatedAt: Date.now(),
    }
  }

  private setError(message: string) {
    this.updateState({
      status: 'error',
      track: null,
      progressMs: 0,
      updatedAt: Date.now(),
      error: message,
    })
  }

  private updateState(next: SpotifyPlaybackState) {
    const hasMeaningfulChange =
      next.status !== this.state.status ||
      next.track?.id !== this.state.track?.id ||
      next.progressMs !== this.state.progressMs ||
      next.deviceName !== this.state.deviceName ||
      next.error !== this.state.error

    if (!hasMeaningfulChange) {
      return
    }

    this.state = next
    this.emit('state', this.state)
  }
}

