var se = Object.defineProperty;
var ne = (t, o, e) => o in t ? se(t, o, { enumerable: !0, configurable: !0, writable: !0, value: e }) : t[o] = e;
var y = (t, o, e) => ne(t, typeof o != "symbol" ? o + "" : o, e);
import oe from "fs";
import ae from "path";
import ie from "os";
import ce from "crypto";
import { BrowserWindow as V, shell as le, ipcMain as _, app as C, globalShortcut as T, nativeImage as ue } from "electron";
import { fileURLToPath as he } from "node:url";
import v from "node:path";
import { readFile as de } from "node:fs/promises";
import R from "keytar";
import $ from "node:crypto";
import { EventEmitter as W } from "node:events";
var w = { exports: {} };
const fe = "17.2.3", pe = {
  version: fe
}, M = oe, U = ae, ge = ie, me = ce, ye = pe, G = ye.version, K = [
  "🔐 encrypt with Dotenvx: https://dotenvx.com",
  "🔐 prevent committing .env to code: https://dotenvx.com/precommit",
  "🔐 prevent building .env in docker: https://dotenvx.com/prebuild",
  "📡 add observability to secrets: https://dotenvx.com/ops",
  "👥 sync secrets across teammates & machines: https://dotenvx.com/ops",
  "🗂️ backup and recover secrets: https://dotenvx.com/ops",
  "✅ audit secrets and track compliance: https://dotenvx.com/ops",
  "🔄 add secrets lifecycle management: https://dotenvx.com/ops",
  "🔑 add access controls to secrets: https://dotenvx.com/ops",
  "🛠️  run anywhere with `dotenvx run -- yourcommand`",
  "⚙️  specify custom .env file path with { path: '/custom/path/.env' }",
  "⚙️  enable debug logging with { debug: true }",
  "⚙️  override existing env vars with { override: true }",
  "⚙️  suppress all logs with { quiet: true }",
  "⚙️  write to custom object with { processEnv: myObject }",
  "⚙️  load multiple .env files with { path: ['.env.local', '.env'] }"
];
function ve() {
  return K[Math.floor(Math.random() * K.length)];
}
function N(t) {
  return typeof t == "string" ? !["false", "0", "no", "off", ""].includes(t.toLowerCase()) : !!t;
}
function we() {
  return process.stdout.isTTY;
}
function Ee(t) {
  return we() ? `\x1B[2m${t}\x1B[0m` : t;
}
const _e = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;
function Te(t) {
  const o = {};
  let e = t.toString();
  e = e.replace(/\r\n?/mg, `
`);
  let r;
  for (; (r = _e.exec(e)) != null; ) {
    const n = r[1];
    let s = r[2] || "";
    s = s.trim();
    const a = s[0];
    s = s.replace(/^(['"`])([\s\S]*)\1$/mg, "$2"), a === '"' && (s = s.replace(/\\n/g, `
`), s = s.replace(/\\r/g, "\r")), o[n] = s;
  }
  return o;
}
function ke(t) {
  t = t || {};
  const o = Q(t);
  t.path = o;
  const e = u.configDotenv(t);
  if (!e.parsed) {
    const a = new Error(`MISSING_DATA: Cannot parse ${o} for an unknown reason`);
    throw a.code = "MISSING_DATA", a;
  }
  const r = H(t).split(","), n = r.length;
  let s;
  for (let a = 0; a < n; a++)
    try {
      const i = r[a].trim(), h = Se(e, i);
      s = u.decrypt(h.ciphertext, h.key);
      break;
    } catch (i) {
      if (a + 1 >= n)
        throw i;
    }
  return u.parse(s);
}
function Oe(t) {
  console.error(`[dotenv@${G}][WARN] ${t}`);
}
function I(t) {
  console.log(`[dotenv@${G}][DEBUG] ${t}`);
}
function z(t) {
  console.log(`[dotenv@${G}] ${t}`);
}
function H(t) {
  return t && t.DOTENV_KEY && t.DOTENV_KEY.length > 0 ? t.DOTENV_KEY : process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0 ? process.env.DOTENV_KEY : "";
}
function Se(t, o) {
  let e;
  try {
    e = new URL(o);
  } catch (i) {
    if (i.code === "ERR_INVALID_URL") {
      const h = new Error("INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development");
      throw h.code = "INVALID_DOTENV_KEY", h;
    }
    throw i;
  }
  const r = e.password;
  if (!r) {
    const i = new Error("INVALID_DOTENV_KEY: Missing key part");
    throw i.code = "INVALID_DOTENV_KEY", i;
  }
  const n = e.searchParams.get("environment");
  if (!n) {
    const i = new Error("INVALID_DOTENV_KEY: Missing environment part");
    throw i.code = "INVALID_DOTENV_KEY", i;
  }
  const s = `DOTENV_VAULT_${n.toUpperCase()}`, a = t.parsed[s];
  if (!a) {
    const i = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${s} in your .env.vault file.`);
    throw i.code = "NOT_FOUND_DOTENV_ENVIRONMENT", i;
  }
  return { ciphertext: a, key: r };
}
function Q(t) {
  let o = null;
  if (t && t.path && t.path.length > 0)
    if (Array.isArray(t.path))
      for (const e of t.path)
        M.existsSync(e) && (o = e.endsWith(".vault") ? e : `${e}.vault`);
    else
      o = t.path.endsWith(".vault") ? t.path : `${t.path}.vault`;
  else
    o = U.resolve(process.cwd(), ".env.vault");
  return M.existsSync(o) ? o : null;
}
function j(t) {
  return t[0] === "~" ? U.join(ge.homedir(), t.slice(1)) : t;
}
function be(t) {
  const o = N(process.env.DOTENV_CONFIG_DEBUG || t && t.debug), e = N(process.env.DOTENV_CONFIG_QUIET || t && t.quiet);
  (o || !e) && z("Loading env from encrypted .env.vault");
  const r = u._parseVault(t);
  let n = process.env;
  return t && t.processEnv != null && (n = t.processEnv), u.populate(n, r, t), { parsed: r };
}
function Ne(t) {
  const o = U.resolve(process.cwd(), ".env");
  let e = "utf8", r = process.env;
  t && t.processEnv != null && (r = t.processEnv);
  let n = N(r.DOTENV_CONFIG_DEBUG || t && t.debug), s = N(r.DOTENV_CONFIG_QUIET || t && t.quiet);
  t && t.encoding ? e = t.encoding : n && I("No encoding is specified. UTF-8 is used by default");
  let a = [o];
  if (t && t.path)
    if (!Array.isArray(t.path))
      a = [j(t.path)];
    else {
      a = [];
      for (const l of t.path)
        a.push(j(l));
    }
  let i;
  const h = {};
  for (const l of a)
    try {
      const d = u.parse(M.readFileSync(l, { encoding: e }));
      u.populate(h, d, t);
    } catch (d) {
      n && I(`Failed to load ${l} ${d.message}`), i = d;
    }
  const p = u.populate(r, h, t);
  if (n = N(r.DOTENV_CONFIG_DEBUG || n), s = N(r.DOTENV_CONFIG_QUIET || s), n || !s) {
    const l = Object.keys(p).length, d = [];
    for (const E of a)
      try {
        const g = U.relative(process.cwd(), E);
        d.push(g);
      } catch (g) {
        n && I(`Failed to load ${E} ${g.message}`), i = g;
      }
    z(`injecting env (${l}) from ${d.join(",")} ${Ee(`-- tip: ${ve()}`)}`);
  }
  return i ? { parsed: h, error: i } : { parsed: h };
}
function De(t) {
  if (H(t).length === 0)
    return u.configDotenv(t);
  const o = Q(t);
  return o ? u._configVault(t) : (Oe(`You set DOTENV_KEY but you are missing a .env.vault file at ${o}. Did you forget to build it?`), u.configDotenv(t));
}
function Ie(t, o) {
  const e = Buffer.from(o.slice(-64), "hex");
  let r = Buffer.from(t, "base64");
  const n = r.subarray(0, 12), s = r.subarray(-16);
  r = r.subarray(12, -16);
  try {
    const a = me.createDecipheriv("aes-256-gcm", e, n);
    return a.setAuthTag(s), `${a.update(r)}${a.final()}`;
  } catch (a) {
    const i = a instanceof RangeError, h = a.message === "Invalid key length", p = a.message === "Unsupported state or unable to authenticate data";
    if (i || h) {
      const l = new Error("INVALID_DOTENV_KEY: It must be 64 characters long (or more)");
      throw l.code = "INVALID_DOTENV_KEY", l;
    } else if (p) {
      const l = new Error("DECRYPTION_FAILED: Please check your DOTENV_KEY");
      throw l.code = "DECRYPTION_FAILED", l;
    } else
      throw a;
  }
}
function Ce(t, o, e = {}) {
  const r = !!(e && e.debug), n = !!(e && e.override), s = {};
  if (typeof o != "object") {
    const a = new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
    throw a.code = "OBJECT_REQUIRED", a;
  }
  for (const a of Object.keys(o))
    Object.prototype.hasOwnProperty.call(t, a) ? (n === !0 && (t[a] = o[a], s[a] = o[a]), r && I(n === !0 ? `"${a}" is already defined and WAS overwritten` : `"${a}" is already defined and was NOT overwritten`)) : (t[a] = o[a], s[a] = o[a]);
  return s;
}
const u = {
  configDotenv: Ne,
  _configVault: be,
  _parseVault: ke,
  config: De,
  decrypt: Ie,
  parse: Te,
  populate: Ce
};
w.exports.configDotenv = u.configDotenv;
w.exports._configVault = u._configVault;
w.exports._parseVault = u._parseVault;
w.exports.config = u.config;
w.exports.decrypt = u.decrypt;
w.exports.parse = u.parse;
w.exports.populate = u.populate;
w.exports = u;
var Ve = w.exports;
const k = {};
process.env.DOTENV_CONFIG_ENCODING != null && (k.encoding = process.env.DOTENV_CONFIG_ENCODING);
process.env.DOTENV_CONFIG_PATH != null && (k.path = process.env.DOTENV_CONFIG_PATH);
process.env.DOTENV_CONFIG_QUIET != null && (k.quiet = process.env.DOTENV_CONFIG_QUIET);
process.env.DOTENV_CONFIG_DEBUG != null && (k.debug = process.env.DOTENV_CONFIG_DEBUG);
process.env.DOTENV_CONFIG_OVERRIDE != null && (k.override = process.env.DOTENV_CONFIG_OVERRIDE);
process.env.DOTENV_CONFIG_DOTENV_KEY != null && (k.DOTENV_KEY = process.env.DOTENV_CONFIG_DOTENV_KEY);
var Ae = k;
const Re = /^dotenv_config_(encoding|path|quiet|debug|override|DOTENV_KEY)=(.+)$/;
var Pe = function(o) {
  const e = o.reduce(function(r, n) {
    const s = n.match(Re);
    return s && (r[s[1]] = s[2]), r;
  }, {});
  return "quiet" in e || (e.quiet = "true"), e;
};
(function() {
  Ve.config(
    Object.assign(
      {},
      Ae,
      Pe(process.argv)
    )
  );
})();
const P = "spotify-overlay", x = "auth-tokens", xe = [
  "user-read-playback-state",
  "user-read-currently-playing",
  "user-modify-playback-state"
].join(" "), q = 60 * 1e3;
class Ue extends W {
  constructor(e) {
    super();
    y(this, "tokens", null);
    y(this, "refreshTimer", null);
    y(this, "scope");
    y(this, "ready");
    this.config = e, this.scope = e.scope ?? xe, this.ready = this.restoreTokens(), this.ready.then(() => this.emitState());
  }
  async login() {
    await this.ensureReady(), this.assertClientId(), this.emitLoadingState();
    try {
      const { verifier: e, challenge: r } = await this.createPkcePair(), n = $.randomUUID(), s = new URL("https://accounts.spotify.com/authorize");
      s.search = new URLSearchParams({
        client_id: this.config.clientId,
        response_type: "code",
        redirect_uri: this.config.redirectUri,
        code_challenge_method: "S256",
        code_challenge: r,
        scope: this.scope,
        state: n,
        show_dialog: "true"
      }).toString();
      const a = await this.openAuthWindow(s.toString(), n), i = await this.requestTokens({
        grant_type: "authorization_code",
        code: a,
        redirect_uri: this.config.redirectUri,
        client_id: this.config.clientId,
        code_verifier: e
      });
      return this.persistTokens(i);
    } catch (e) {
      throw this.emitState(e instanceof Error ? e.message : String(e)), e;
    }
  }
  async logout() {
    await this.ensureReady(), this.clearRefreshTimer(), this.tokens = null, await R.deletePassword(P, x), this.emitState();
  }
  async getAuthState() {
    return await this.ensureReady(), this.buildState();
  }
  async getValidTokens() {
    return await this.ensureReady(), !this.tokens || this.tokens.expiresAt - q <= Date.now() && !await this.refreshTokens() ? null : this.tokens;
  }
  async refreshTokens() {
    var r;
    if (!((r = this.tokens) != null && r.refreshToken))
      return await this.logout(), null;
    this.assertClientId(), this.emitLoadingState();
    const e = await this.requestTokens({
      grant_type: "refresh_token",
      refresh_token: this.tokens.refreshToken,
      client_id: this.config.clientId
    });
    return this.persistTokens({
      access_token: e.access_token,
      refresh_token: e.refresh_token ?? this.tokens.refreshToken,
      expires_in: e.expires_in,
      scope: e.scope,
      token_type: e.token_type
    });
  }
  async requestTokens(e) {
    const r = new URLSearchParams(e), n = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: r
    });
    if (!n.ok) {
      const a = await n.text();
      throw new Error(`Spotify token request failed: ${a}`);
    }
    return await n.json();
  }
  async persistTokens(e) {
    var s;
    const r = e.refresh_token ?? ((s = this.tokens) == null ? void 0 : s.refreshToken);
    if (!r)
      throw new Error("Spotify did not return a refresh token");
    const n = {
      accessToken: e.access_token,
      refreshToken: r,
      expiresAt: Date.now() + e.expires_in * 1e3
    };
    return this.tokens = n, await R.setPassword(P, x, JSON.stringify(n)), this.scheduleRefresh(), this.emitState();
  }
  async openAuthWindow(e, r) {
    return new Promise((n, s) => {
      let a = !1;
      const i = new V({
        width: 420,
        height: 720,
        resizable: !1,
        autoHideMenuBar: !0,
        webPreferences: {
          nodeIntegration: !1
        }
      }), h = () => {
        i.webContents.off("will-redirect", l), i.webContents.off("will-navigate", l);
      }, p = (d) => {
        a || (a = !0, h(), d());
      };
      i.on("closed", () => {
        p(() => s(new Error("Spotify login was closed before completion")));
      }), i.webContents.setWindowOpenHandler(({ url: d }) => (le.openExternal(d), { action: "deny" }));
      const l = (d, E) => {
        if (!E.startsWith(this.config.redirectUri))
          return;
        const g = new URL(E), D = g.searchParams.get("code"), m = g.searchParams.get("state"), b = g.searchParams.get("error");
        if (m && m !== r) {
          p(() => s(new Error("State mismatch during Spotify authentication"))), i.close();
          return;
        }
        if (b) {
          p(() => s(new Error(`Spotify authentication failed: ${b}`))), i.close();
          return;
        }
        if (!D) {
          p(() => s(new Error("Missing authorization code from Spotify"))), i.close();
          return;
        }
        p(() => n(D)), i.close();
      };
      i.webContents.on("will-redirect", l), i.webContents.on("will-navigate", l), i.loadURL(e).catch((d) => p(() => s(d)));
    });
  }
  scheduleRefresh() {
    if (this.clearRefreshTimer(), !this.tokens)
      return;
    const e = Math.max(this.tokens.expiresAt - Date.now() - q, 0);
    this.refreshTimer = setTimeout(() => {
      this.refreshTokens().catch((r) => {
        this.emitState(r instanceof Error ? r.message : String(r));
      });
    }, e);
  }
  clearRefreshTimer() {
    this.refreshTimer && (clearTimeout(this.refreshTimer), this.refreshTimer = null);
  }
  buildState(e) {
    var r;
    return {
      status: e ? "error" : this.tokens ? "authenticated" : "signed-out",
      expiresAt: ((r = this.tokens) == null ? void 0 : r.expiresAt) ?? null,
      ...e ? { error: e } : {}
    };
  }
  emitState(e) {
    const r = this.buildState(e);
    return this.emit("auth-state", r), r;
  }
  emitLoadingState() {
    var r;
    const e = {
      status: "loading",
      expiresAt: ((r = this.tokens) == null ? void 0 : r.expiresAt) ?? null
    };
    this.emit("auth-state", e);
  }
  assertClientId() {
    if (!this.config.clientId)
      throw new Error("Missing SPOTIFY_CLIENT_ID environment variable");
  }
  async restoreTokens() {
    const e = await R.getPassword(P, x);
    if (e)
      try {
        const r = JSON.parse(e);
        this.tokens = r, this.scheduleRefresh();
      } catch (r) {
        await R.deletePassword(P, x), this.emitState(r instanceof Error ? r.message : String(r));
      }
  }
  ensureReady() {
    return this.ready;
  }
  async createPkcePair() {
    const e = this.base64UrlEncode($.randomBytes(32).toString("base64url")), r = this.base64UrlEncode(
      $.createHash("sha256").update(e).digest("base64")
    );
    return { verifier: e, challenge: r };
  }
  base64UrlEncode(e) {
    return e.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
}
const $e = "https://api.spotify.com/v1/me/player/currently-playing?additional_types=track", L = "https://api.spotify.com/v1/me/player", Le = {
  status: "unauthorized",
  track: null,
  progressMs: 0,
  updatedAt: Date.now()
};
class Fe extends W {
  constructor(e, r) {
    super();
    y(this, "state", Le);
    y(this, "timer", null);
    y(this, "intervalMs");
    y(this, "lastControlAt", 0);
    this.auth = e, this.intervalMs = (r == null ? void 0 : r.intervalMs) ?? 3e3;
  }
  start() {
    this.timer || (this.timer = setInterval(() => {
      this.refresh();
    }, this.intervalMs), this.refresh());
  }
  stop() {
    this.timer && (clearInterval(this.timer), this.timer = null);
  }
  getState() {
    return this.state;
  }
  async forceRefresh() {
    await this.refresh(!0);
  }
  async togglePlayback() {
    await this.withControl("play-pause", async (e) => {
      const r = `${L}/${this.state.status === "playing" ? "pause" : "play"}`;
      await fetch(r, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${e}`,
          "Content-Type": "application/json"
        }
      });
    });
  }
  async nextTrack() {
    await this.withControl("next", async (e) => {
      await fetch(`${L}/next`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${e}`
        }
      });
    });
  }
  async previousTrack() {
    await this.withControl("previous", async (e) => {
      await fetch(`${L}/previous`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${e}`
        }
      });
    });
  }
  async refresh(e = !1) {
    const r = await this.auth.getValidTokens();
    if (!r) {
      (this.state.status !== "unauthorized" || e) && this.updateState(this.emptyState("unauthorized"));
      return;
    }
    try {
      const n = await fetch($e, {
        headers: {
          Authorization: `Bearer ${r.accessToken}`
        }
      });
      if (n.status === 204) {
        this.updateState(this.emptyState("idle"));
        return;
      }
      if (n.status === 401) {
        await this.auth.logout(), this.updateState({
          ...this.emptyState("unauthorized"),
          error: "Spotify session expired. Please reconnect."
        });
        return;
      }
      if (!n.ok) {
        const i = await n.text();
        this.setError(`Playback refresh failed (${n.status}): ${i}`);
        return;
      }
      const s = await n.json(), a = this.normalizePayload(s);
      this.updateState(a);
    } catch (n) {
      this.setError(n instanceof Error ? n.message : String(n));
    }
  }
  async withControl(e, r) {
    if (Date.now() - this.lastControlAt < 500)
      return;
    const n = await this.auth.getValidTokens();
    if (n)
      try {
        await r(n.accessToken), this.lastControlAt = Date.now(), await this.refresh(!0);
      } catch (s) {
        this.setError(s instanceof Error ? s.message : String(s));
      }
  }
  emptyState(e) {
    return {
      status: e,
      track: null,
      progressMs: 0,
      updatedAt: Date.now()
    };
  }
  normalizePayload(e) {
    var l, d, E, g, D;
    const r = e == null ? void 0 : e.item, n = Array.isArray(r == null ? void 0 : r.artists) ? r.artists.map((m) => m == null ? void 0 : m.name).filter(Boolean).join(", ") : "Unknown artist", s = ((l = r == null ? void 0 : r.album) == null ? void 0 : l.images) ?? [], i = ((d = (Array.isArray(s) ? [...s].sort((m, b) => ((b == null ? void 0 : b.width) ?? 0) - ((m == null ? void 0 : m.width) ?? 0)) : [])[0]) == null ? void 0 : d.url) ?? null, h = r ? {
      id: r.id ?? r.uri ?? "unknown",
      name: r.name ?? "Unknown track",
      artists: n || "Unknown artist",
      album: ((E = r.album) == null ? void 0 : E.name) ?? "Unknown album",
      albumImageUrl: i,
      durationMs: r.duration_ms ?? 0,
      spotifyUrl: ((g = r.external_urls) == null ? void 0 : g.spotify) ?? null
    } : null;
    return {
      status: h ? e != null && e.is_playing ? "playing" : "paused" : "idle",
      track: h,
      progressMs: (e == null ? void 0 : e.progress_ms) ?? 0,
      deviceName: ((D = e == null ? void 0 : e.device) == null ? void 0 : D.name) ?? null,
      updatedAt: Date.now()
    };
  }
  setError(e) {
    this.updateState({
      status: "error",
      track: null,
      progressMs: 0,
      updatedAt: Date.now(),
      error: e
    });
  }
  updateState(e) {
    var n, s;
    (e.status !== this.state.status || ((n = e.track) == null ? void 0 : n.id) !== ((s = this.state.track) == null ? void 0 : s.id) || e.progressMs !== this.state.progressMs || e.deviceName !== this.state.deviceName || e.error !== this.state.error) && (this.state = e, this.emit("state", this.state));
  }
}
const J = v.dirname(he(import.meta.url));
process.env.APP_ROOT = v.join(J, "..");
const Y = process.env.VITE_DEV_SERVER_URL, nt = v.join(process.env.APP_ROOT, "dist-electron"), X = v.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = Y ? v.join(process.env.APP_ROOT, "public") : X;
let c;
const F = "CommandOrControl+Shift+Space", Be = "CommandOrControl+Shift+P", Me = "CommandOrControl+Shift+.", Ye = "CommandOrControl+Shift+,", B = "CommandOrControl+Shift+K", A = {
  state: "spotify:auth-state",
  login: "spotify:login",
  logout: "spotify:logout",
  getState: "spotify:get-state"
}, O = {
  state: "spotify:player-state",
  refresh: "spotify:player-refresh",
  getState: "spotify:player-get-state",
  playPause: "spotify:player-play-pause",
  next: "spotify:player-next",
  previous: "spotify:player-prev"
}, Ge = "58c69d9d3a844904b116cd3df94a04a2", Ke = "https://album-drab-chi.vercel.app/api/callback", S = new Ue({
  clientId: Ge,
  redirectUri: Ke
}), f = new Fe(S, { intervalMs: 3e3 });
S.on("auth-state", (t) => {
  V.getAllWindows().forEach((o) => {
    o.webContents.send(A.state, t);
  });
});
f.on("state", (t) => {
  V.getAllWindows().forEach((o) => {
    o.webContents.send(O.state, t);
  });
});
_.handle(A.login, async () => {
  try {
    return await S.login();
  } catch (t) {
    return { status: "error", error: t instanceof Error ? t.message : String(t), expiresAt: null };
  }
});
_.handle(A.logout, async () => {
  await S.logout();
});
_.handle(A.getState, () => S.getAuthState());
_.handle(O.getState, () => f.getState());
_.handle(O.refresh, () => f.forceRefresh());
_.handle(O.playPause, () => f.togglePlayback());
_.handle(O.next, () => f.nextTrack());
_.handle(O.previous, () => f.previousTrack());
async function Z() {
  const t = await de(v.join(process.env.VITE_PUBLIC, "album-icon.png")).catch(() => null), o = t ? ue.createFromBuffer(t) : void 0;
  c = new V({
    width: 360,
    height: 460,
    icon: o ?? v.join(process.env.VITE_PUBLIC, "album-icon.png"),
    frame: !1,
    transparent: !0,
    resizable: !1,
    fullscreenable: !1,
    minimizable: !1,
    maximizable: !1,
    alwaysOnTop: !0,
    skipTaskbar: !0,
    show: !1,
    hasShadow: !1,
    backgroundColor: "#00000000",
    titleBarStyle: "hidden",
    webPreferences: {
      preload: v.join(J, "preload.mjs"),
      backgroundThrottling: !1
    }
  }), c.setMenuBarVisibility(!1), c.setAlwaysOnTop(!0, "screen-saver");
  try {
    c.setVisibleOnAllWorkspaces(!0, { visibleOnFullScreen: !0 });
  } catch {
    c.setVisibleOnAllWorkspaces(!0);
  }
  c.webContents.on("did-finish-load", () => {
    c == null || c.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString()), S.getAuthState().then((r) => {
      c == null || c.webContents.send(A.state, r);
    });
    const e = f.getState();
    c == null || c.webContents.send(O.state, e);
  }), c.webContents.on("before-input-event", (e, r) => {
    var s;
    r.type === "keyDown" && ((r.meta || r.control) && r.shift && ((s = r.key) == null ? void 0 : s.toLowerCase()) === "i" || r.key === "F12") && e.preventDefault();
  }), c.webContents.on("devtools-opened", () => {
    c == null || c.webContents.closeDevTools();
  }), c.webContents.setWindowOpenHandler(() => ({ action: "deny" })), process.platform === "darwin" && typeof c.setWindowButtonVisibility == "function" && c.setWindowButtonVisibility(!1), Y ? c.loadURL(Y) : c.loadFile(v.join(X, "index.html"));
}
function je() {
  c && (c.isVisible() ? c.hide() : (c.show(), c.focus(), c.setAlwaysOnTop(!0, "screen-saver")));
}
function ee() {
  T.unregister(F), T.register(F, je) || console.warn(`Failed to register overlay toggle shortcut: ${F}`);
}
function te() {
  [
    [Be, () => {
      f.togglePlayback();
    }],
    [Me, () => {
      f.nextTrack();
    }],
    [Ye, () => {
      f.previousTrack();
    }]
  ].forEach(([o, e]) => {
    T.unregister(o), T.register(o, e) || console.warn(`Failed to register shortcut: ${o}`);
  });
}
function re() {
  T.unregister(B), T.register(B, () => {
    S.logout().then(() => f.forceRefresh());
  }) || console.warn(`Failed to register shortcut: ${B}`);
}
C.on("window-all-closed", () => {
  process.platform !== "darwin" && (C.quit(), c = null);
});
C.on("activate", () => {
  V.getAllWindows().length === 0 && (Z(), ee(), te(), re());
});
C.whenReady().then(() => {
  f.start(), Z(), ee(), te(), re(), c == null || c.once("ready-to-show", () => {
    c == null || c.show();
  });
});
C.on("will-quit", () => {
  T.unregisterAll();
});
export {
  nt as MAIN_DIST,
  X as RENDERER_DIST,
  Y as VITE_DEV_SERVER_URL
};
