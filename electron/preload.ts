import { ipcRenderer, contextBridge } from 'electron'
import type {
  SpotifyAuthRendererAPI,
  SpotifyAuthState,
  SpotifyPlaybackRendererAPI,
  SpotifyPlaybackState,
} from '@shared/spotify'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // You can expose other APTs you need here.
  // ...
})

const authChannel = {
  login: 'spotify:login',
  logout: 'spotify:logout',
  state: 'spotify:auth-state',
  getState: 'spotify:get-state',
} as const

const playbackChannel = {
  state: 'spotify:player-state',
  refresh: 'spotify:player-refresh',
  getState: 'spotify:player-get-state',
  playPause: 'spotify:player-play-pause',
  next: 'spotify:player-next',
  previous: 'spotify:player-prev',
} as const

const spotifyAuth: SpotifyAuthRendererAPI = {
  login: () => ipcRenderer.invoke(authChannel.login),
  logout: () => ipcRenderer.invoke(authChannel.logout),
  getState: () => ipcRenderer.invoke(authChannel.getState),
  onStateChanged: (listener) => {
    const wrapped = (_: Electron.IpcRendererEvent, state: SpotifyAuthState) => listener(state)
    ipcRenderer.on(authChannel.state, wrapped)
    return () => {
      ipcRenderer.off(authChannel.state, wrapped)
    }
  },
}

contextBridge.exposeInMainWorld('spotifyAuth', spotifyAuth)

const playbackApi: SpotifyPlaybackRendererAPI = {
  getState: () => ipcRenderer.invoke(playbackChannel.getState),
  forceRefresh: () => ipcRenderer.invoke(playbackChannel.refresh),
  playPause: () => ipcRenderer.invoke(playbackChannel.playPause),
  nextTrack: () => ipcRenderer.invoke(playbackChannel.next),
  previousTrack: () => ipcRenderer.invoke(playbackChannel.previous),
  onStateChanged: (listener) => {
    const handler = (_: Electron.IpcRendererEvent, state: SpotifyPlaybackState) => listener(state)
    ipcRenderer.on(playbackChannel.state, handler)
    return () => {
      ipcRenderer.off(playbackChannel.state, handler)
    }
  },
}

contextBridge.exposeInMainWorld('spotifyPlayback', playbackApi)
