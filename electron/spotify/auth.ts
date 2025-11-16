import { BrowserWindow, shell } from 'electron'
import keytar from 'keytar'
import crypto from 'node:crypto'
import { EventEmitter } from 'node:events'
import type { SpotifyAuthState } from '@shared/spotify'

interface SpotifyAuthConfig {
  clientId: string
  redirectUri: string
  scope?: string
}

export interface SpotifyTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

interface SpotifyTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  scope: string
  token_type: string
}

const SERVICE = 'spotify-overlay'
const ACCOUNT = 'auth-tokens'

const DEFAULT_SCOPE = [
  'user-read-playback-state',
  'user-read-currently-playing',
  'user-modify-playback-state',
].join(' ')

const REFRESH_BUFFER_MS = 60 * 1000

export class SpotifyAuth extends EventEmitter {
  private tokens: SpotifyTokens | null = null
  private refreshTimer: NodeJS.Timeout | null = null
  private readonly scope: string
  private readonly ready: Promise<void>

  constructor(private readonly config: SpotifyAuthConfig) {
    super()
    this.scope = config.scope ?? DEFAULT_SCOPE
    this.ready = this.restoreTokens()
    void this.ready.then(() => this.emitState())
  }

  async login(): Promise<SpotifyAuthState> {
    await this.ensureReady()
    this.assertClientId()

    this.emitLoadingState()
    try {
      const { verifier, challenge } = await this.createPkcePair()
      const stateParam = crypto.randomUUID()
      const authUrl = new URL('https://accounts.spotify.com/authorize')
      authUrl.search = new URLSearchParams({
        client_id: this.config.clientId,
        response_type: 'code',
        redirect_uri: this.config.redirectUri,
        code_challenge_method: 'S256',
        code_challenge: challenge,
        scope: this.scope,
        state: stateParam,
        show_dialog: 'true',
      }).toString()

      const code = await this.openAuthWindow(authUrl.toString(), stateParam)
      const tokens = await this.requestTokens({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.config.redirectUri,
        client_id: this.config.clientId,
        code_verifier: verifier,
      })

      return this.persistTokens(tokens)
    } catch (error) {
      this.emitState(error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  async logout() {
    await this.ensureReady()
    this.clearRefreshTimer()
    this.tokens = null
    await keytar.deletePassword(SERVICE, ACCOUNT)
    this.emitState()
  }

  async getAuthState(): Promise<SpotifyAuthState> {
    await this.ensureReady()
    return this.buildState()
  }

  async getValidTokens(): Promise<SpotifyTokens | null> {
    await this.ensureReady()
    if (!this.tokens) {
      return null
    }

    if (this.tokens.expiresAt - REFRESH_BUFFER_MS <= Date.now()) {
      const refreshed = await this.refreshTokens()
      if (!refreshed) {
        return null
      }
    }

    return this.tokens
  }

  private async refreshTokens(): Promise<SpotifyAuthState | null> {
    if (!this.tokens?.refreshToken) {
      await this.logout()
      return null
    }

    this.assertClientId()
    this.emitLoadingState()
    const response = await this.requestTokens({
      grant_type: 'refresh_token',
      refresh_token: this.tokens.refreshToken,
      client_id: this.config.clientId,
    })

    return this.persistTokens({
      access_token: response.access_token,
      refresh_token: response.refresh_token ?? this.tokens.refreshToken,
      expires_in: response.expires_in,
      scope: response.scope,
      token_type: response.token_type,
    })
  }

  private async requestTokens(params: Record<string, string>): Promise<SpotifyTokenResponse> {
    const body = new URLSearchParams(params)
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Spotify token request failed: ${errorText}`)
    }

    const tokenPayload = await response.json() as SpotifyTokenResponse
    return tokenPayload
  }

  private async persistTokens(response: SpotifyTokenResponse): Promise<SpotifyAuthState> {
    const refreshToken = response.refresh_token ?? this.tokens?.refreshToken
    if (!refreshToken) {
      throw new Error('Spotify did not return a refresh token')
    }

    const tokens: SpotifyTokens = {
      accessToken: response.access_token,
      refreshToken,
      expiresAt: Date.now() + response.expires_in * 1000,
    }

    this.tokens = tokens
    await keytar.setPassword(SERVICE, ACCOUNT, JSON.stringify(tokens))
    this.scheduleRefresh()
    return this.emitState()
  }

  private async openAuthWindow(url: string, expectedState: string): Promise<string> {
    return new Promise((resolve, reject) => {
      let settled = false
      const authWindow = new BrowserWindow({
        width: 420,
        height: 720,
        resizable: false,
        autoHideMenuBar: true,
        webPreferences: {
          nodeIntegration: false,
        },
      })

      const cleanup = () => {
        authWindow.webContents.off('will-redirect', handleRedirect)
        authWindow.webContents.off('will-navigate', handleRedirect)
      }

      const finish = (handler: () => void) => {
        if (settled) return
        settled = true
        cleanup()
        handler()
      }

      authWindow.on('closed', () => {
        finish(() => reject(new Error('Spotify login was closed before completion')))
      })
      authWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url)
        return { action: 'deny' }
      })

      const handleRedirect = (_: unknown, targetUrl: string) => {
        if (!targetUrl.startsWith(this.config.redirectUri)) {
          return
        }
        const parsed = new URL(targetUrl)
        const code = parsed.searchParams.get('code')
        const state = parsed.searchParams.get('state')
        const error = parsed.searchParams.get('error')

        if (state && state !== expectedState) {
          finish(() => reject(new Error('State mismatch during Spotify authentication')))
          authWindow.close()
          return
        }

        if (error) {
          finish(() => reject(new Error(`Spotify authentication failed: ${error}`)))
          authWindow.close()
          return
        }

        if (!code) {
          finish(() => reject(new Error('Missing authorization code from Spotify')))
          authWindow.close()
          return
        }

        finish(() => resolve(code))
        authWindow.close()
      }

      authWindow.webContents.on('will-redirect', handleRedirect)
      authWindow.webContents.on('will-navigate', handleRedirect)
      authWindow.loadURL(url).catch((error) => finish(() => reject(error)))
    })
  }

  private scheduleRefresh() {
    this.clearRefreshTimer()
    if (!this.tokens) {
      return
    }

    const delay = Math.max(this.tokens.expiresAt - Date.now() - REFRESH_BUFFER_MS, 0)
    this.refreshTimer = setTimeout(() => {
      void this.refreshTokens().catch((error) => {
        this.emitState(error instanceof Error ? error.message : String(error))
      })
    }, delay)
  }

  private clearRefreshTimer() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }
  }

  private buildState(error?: string): SpotifyAuthState {
    return {
      status: error ? 'error' : this.tokens ? 'authenticated' : 'signed-out',
      expiresAt: this.tokens?.expiresAt ?? null,
      ...(error ? { error } : {}),
    }
  }

  private emitState(error?: string): SpotifyAuthState {
    const state = this.buildState(error)
    this.emit('auth-state', state)
    return state
  }

  private emitLoadingState() {
    const state: SpotifyAuthState = {
      status: 'loading',
      expiresAt: this.tokens?.expiresAt ?? null,
    }
    this.emit('auth-state', state)
  }

  private assertClientId() {
    if (!this.config.clientId) {
      throw new Error('Missing SPOTIFY_CLIENT_ID environment variable')
    }
  }

  private async restoreTokens() {
    const stored = await keytar.getPassword(SERVICE, ACCOUNT)
    if (!stored) {
      return
    }

    try {
      const parsed = JSON.parse(stored) as SpotifyTokens
      this.tokens = parsed
      this.scheduleRefresh()
    } catch (error) {
      await keytar.deletePassword(SERVICE, ACCOUNT)
      this.emitState(error instanceof Error ? error.message : String(error))
    }
  }

  private ensureReady() {
    return this.ready
  }

  private async createPkcePair() {
    const verifier = this.base64UrlEncode(crypto.randomBytes(32).toString('base64url'))
    const challenge = this.base64UrlEncode(
      crypto.createHash('sha256').update(verifier).digest('base64'),
    )
    return { verifier, challenge }
  }

  private base64UrlEncode(value: string) {
    return value
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
  }
}

