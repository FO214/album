export type SpotifyAuthStatus = 'signed-out' | 'authenticated' | 'error' | 'loading'

export interface SpotifyAuthState {
  status: SpotifyAuthStatus
  expiresAt: number | null
  error?: string
}

export interface SpotifyAuthRendererAPI {
  login: () => Promise<SpotifyAuthState>
  logout: () => Promise<void>
  getState: () => Promise<SpotifyAuthState>
  onStateChanged: (listener: (state: SpotifyAuthState) => void) => () => void
}

export type SpotifyPlaybackStatus = 'idle' | 'playing' | 'paused' | 'unauthorized' | 'error'

export interface SpotifyTrack {
  id: string
  name: string
  artists: string
  album: string
  albumImageUrl: string | null
  durationMs: number
  spotifyUrl: string | null
}

export interface SpotifyPlaybackState {
  status: SpotifyPlaybackStatus
  track: SpotifyTrack | null
  progressMs: number
  deviceName?: string | null
  updatedAt: number
  error?: string
}

export interface SpotifyPlaybackRendererAPI {
  getState: () => Promise<SpotifyPlaybackState>
  forceRefresh: () => Promise<void>
  onStateChanged: (listener: (state: SpotifyPlaybackState) => void) => () => void
  playPause: () => Promise<void>
  nextTrack: () => Promise<void>
  previousTrack: () => Promise<void>
}

