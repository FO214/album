import 'dotenv/config'
import { app, BrowserWindow, ipcMain, globalShortcut, nativeImage } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { readFile } from 'node:fs/promises'
import { SpotifyAuth } from './spotify/auth'
import { SpotifyPlaybackService } from './spotify/player'
import type { SpotifyAuthState, SpotifyPlaybackState } from '@shared/spotify'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null
const OVERLAY_TOGGLE_SHORTCUT = 'CommandOrControl+Shift+Space'
const PLAY_PAUSE_SHORTCUT = 'CommandOrControl+Shift+P'
const NEXT_SHORTCUT = 'CommandOrControl+Shift+.'
const PREV_SHORTCUT = 'CommandOrControl+Shift+,'
const RESET_SESSION_SHORTCUT = 'CommandOrControl+Shift+K'

const authChannels = {
  state: 'spotify:auth-state',
  login: 'spotify:login',
  logout: 'spotify:logout',
  getState: 'spotify:get-state',
} as const

const playbackChannels = {
  state: 'spotify:player-state',
  refresh: 'spotify:player-refresh',
  getState: 'spotify:player-get-state',
  playPause: 'spotify:player-play-pause',
  next: 'spotify:player-next',
  previous: 'spotify:player-prev',
} as const

const SPOTIFY_CLIENT_ID = '58c69d9d3a844904b116cd3df94a04a2'
const SPOTIFY_REDIRECT_URI = 'https://album-drab-chi.vercel.app/api/callback'

const spotifyAuth = new SpotifyAuth({
  clientId: SPOTIFY_CLIENT_ID,
  redirectUri: SPOTIFY_REDIRECT_URI,
})

const playbackService = new SpotifyPlaybackService(spotifyAuth, { intervalMs: 3000 })

spotifyAuth.on('auth-state', (state: SpotifyAuthState) => {
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send(authChannels.state, state)
  })
})

playbackService.on('state', (state: SpotifyPlaybackState) => {
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send(playbackChannels.state, state)
  })
})

ipcMain.handle(authChannels.login, async () => {
  try {
    return await spotifyAuth.login()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const state: SpotifyAuthState = { status: 'error', error: message, expiresAt: null }
    return state
  }
})

ipcMain.handle(authChannels.logout, async () => {
  await spotifyAuth.logout()
})

ipcMain.handle(authChannels.getState, () => spotifyAuth.getAuthState())
ipcMain.handle(playbackChannels.getState, () => playbackService.getState())
ipcMain.handle(playbackChannels.refresh, () => playbackService.forceRefresh())
ipcMain.handle(playbackChannels.playPause, () => playbackService.togglePlayback())
ipcMain.handle(playbackChannels.next, () => playbackService.nextTrack())
ipcMain.handle(playbackChannels.previous, () => playbackService.previousTrack())

async function createWindow() {
  const iconBuffer = await readFile(path.join(process.env.VITE_PUBLIC, 'album-icon.png')).catch(() => null)
  const windowIcon = iconBuffer ? nativeImage.createFromBuffer(iconBuffer) : undefined

  win = new BrowserWindow({
    width: 360,
    height: 460,
    icon: windowIcon ?? path.join(process.env.VITE_PUBLIC, 'album-icon.png'),
    frame: false,
    transparent: true,
    resizable: false,
    fullscreenable: false,
    minimizable: false,
    maximizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    hasShadow: false,
    backgroundColor: '#00000000',
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      backgroundThrottling: false,
    },
  })

  win.setMenuBarVisibility(false)
  win.setAlwaysOnTop(true, 'screen-saver')
  try {
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  } catch {
    win.setVisibleOnAllWorkspaces(true)
  }

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
    void spotifyAuth.getAuthState().then((state) => {
      win?.webContents.send(authChannels.state, state)
    })
  const playbackState = playbackService.getState()
  win?.webContents.send(playbackChannels.state, playbackState)
  })

  win.webContents.on('before-input-event', (event, input) => {
    const blockedDevtools =
      input.type === 'keyDown' &&
      ((input.meta || input.control) && input.shift && input.key?.toLowerCase() === 'i'
        || input.key === 'F12')
    if (blockedDevtools) {
      event.preventDefault()
    }
  })

  win.webContents.on('devtools-opened', () => {
    win?.webContents.closeDevTools()
  })

  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  if (process.platform === 'darwin' && typeof win.setWindowButtonVisibility === 'function') {
    win.setWindowButtonVisibility(false)
  }

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

function toggleOverlayVisibility() {
  if (!win) {
    return
  }

  if (win.isVisible()) {
    win.hide()
  } else {
    win.show()
    win.focus()
    win.setAlwaysOnTop(true, 'screen-saver')
  }
}

function registerVisibilityShortcut() {
  globalShortcut.unregister(OVERLAY_TOGGLE_SHORTCUT)
  const success = globalShortcut.register(OVERLAY_TOGGLE_SHORTCUT, toggleOverlayVisibility)
  if (!success) {
    console.warn(`Failed to register overlay toggle shortcut: ${OVERLAY_TOGGLE_SHORTCUT}`)
  }
}

function registerPlaybackShortcuts() {
  const bindings: Array<[string, () => void]> = [
    [PLAY_PAUSE_SHORTCUT, () => { void playbackService.togglePlayback() }],
    [NEXT_SHORTCUT, () => { void playbackService.nextTrack() }],
    [PREV_SHORTCUT, () => { void playbackService.previousTrack() }],
  ]

  bindings.forEach(([combo, handler]) => {
    globalShortcut.unregister(combo)
    const ok = globalShortcut.register(combo, handler)
    if (!ok) {
      console.warn(`Failed to register shortcut: ${combo}`)
    }
  })
}

function registerSessionShortcut() {
  globalShortcut.unregister(RESET_SESSION_SHORTCUT)
  const ok = globalShortcut.register(RESET_SESSION_SHORTCUT, () => {
    void spotifyAuth.logout().then(() => playbackService.forceRefresh())
  })
  if (!ok) {
    console.warn(`Failed to register shortcut: ${RESET_SESSION_SHORTCUT}`)
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
    registerVisibilityShortcut()
    registerPlaybackShortcuts()
    registerSessionShortcut()
  }
})

app.whenReady().then(() => {
  playbackService.start()
  createWindow()
  registerVisibilityShortcut()
  registerPlaybackShortcuts()
  registerSessionShortcut()
  win?.once('ready-to-show', () => {
    win?.show()
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

