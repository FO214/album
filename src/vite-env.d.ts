/// <reference types="vite/client" />

import type { SpotifyAuthRendererAPI, SpotifyPlaybackRendererAPI } from '@shared/spotify'

declare global {
  interface Window {
    spotifyAuth: SpotifyAuthRendererAPI
    spotifyPlayback: SpotifyPlaybackRendererAPI
  }
}