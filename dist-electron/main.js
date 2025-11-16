var re = Object.defineProperty;
var ne = (t, o, e) => o in t ? re(t, o, { enumerable: !0, configurable: !0, writable: !0, value: e }) : t[o] = e;
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
import { EventEmitter as z } from "node:events";
var w = { exports: {} };
const fe = "17.2.3", pe = {
  version: fe
}, M = oe, U = ae, ge = ie, me = ce, ye = pe, G = ye.version, j = [
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
  return j[Math.floor(Math.random() * j.length)];
}
function D(t) {
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
  let s;
  for (; (s = _e.exec(e)) != null; ) {
    const n = s[1];
    let r = s[2] || "";
    r = r.trim();
    const a = r[0];
    r = r.replace(/^(['"`])([\s\S]*)\1$/mg, "$2"), a === '"' && (r = r.replace(/\\n/g, `
`), r = r.replace(/\\r/g, "\r")), o[n] = r;
  }
  return o;
}
function ke(t) {
  t = t || {};
  const o = J(t);
  t.path = o;
  const e = u.configDotenv(t);
  if (!e.parsed) {
    const a = new Error(`MISSING_DATA: Cannot parse ${o} for an unknown reason`);
    throw a.code = "MISSING_DATA", a;
  }
  const s = Q(t).split(","), n = s.length;
  let r;
  for (let a = 0; a < n; a++)
    try {
      const i = s[a].trim(), h = Se(e, i);
      r = u.decrypt(h.ciphertext, h.key);
      break;
    } catch (i) {
      if (a + 1 >= n)
        throw i;
    }
  return u.parse(r);
}
function Oe(t) {
  console.error(`[dotenv@${G}][WARN] ${t}`);
}
function I(t) {
  console.log(`[dotenv@${G}][DEBUG] ${t}`);
}
function H(t) {
  console.log(`[dotenv@${G}] ${t}`);
}
function Q(t) {
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
  const s = e.password;
  if (!s) {
    const i = new Error("INVALID_DOTENV_KEY: Missing key part");
    throw i.code = "INVALID_DOTENV_KEY", i;
  }
  const n = e.searchParams.get("environment");
  if (!n) {
    const i = new Error("INVALID_DOTENV_KEY: Missing environment part");
    throw i.code = "INVALID_DOTENV_KEY", i;
  }
  const r = `DOTENV_VAULT_${n.toUpperCase()}`, a = t.parsed[r];
  if (!a) {
    const i = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${r} in your .env.vault file.`);
    throw i.code = "NOT_FOUND_DOTENV_ENVIRONMENT", i;
  }
  return { ciphertext: a, key: s };
}
function J(t) {
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
function q(t) {
  return t[0] === "~" ? U.join(ge.homedir(), t.slice(1)) : t;
}
function be(t) {
  const o = D(process.env.DOTENV_CONFIG_DEBUG || t && t.debug), e = D(process.env.DOTENV_CONFIG_QUIET || t && t.quiet);
  (o || !e) && H("Loading env from encrypted .env.vault");
  const s = u._parseVault(t);
  let n = process.env;
  return t && t.processEnv != null && (n = t.processEnv), u.populate(n, s, t), { parsed: s };
}
function De(t) {
  const o = U.resolve(process.cwd(), ".env");
  let e = "utf8", s = process.env;
  t && t.processEnv != null && (s = t.processEnv);
  let n = D(s.DOTENV_CONFIG_DEBUG || t && t.debug), r = D(s.DOTENV_CONFIG_QUIET || t && t.quiet);
  t && t.encoding ? e = t.encoding : n && I("No encoding is specified. UTF-8 is used by default");
  let a = [o];
  if (t && t.path)
    if (!Array.isArray(t.path))
      a = [q(t.path)];
    else {
      a = [];
      for (const l of t.path)
        a.push(q(l));
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
  const p = u.populate(s, h, t);
  if (n = D(s.DOTENV_CONFIG_DEBUG || n), r = D(s.DOTENV_CONFIG_QUIET || r), n || !r) {
    const l = Object.keys(p).length, d = [];
    for (const E of a)
      try {
        const g = U.relative(process.cwd(), E);
        d.push(g);
      } catch (g) {
        n && I(`Failed to load ${E} ${g.message}`), i = g;
      }
    H(`injecting env (${l}) from ${d.join(",")} ${Ee(`-- tip: ${ve()}`)}`);
  }
  return i ? { parsed: h, error: i } : { parsed: h };
}
function Ne(t) {
  if (Q(t).length === 0)
    return u.configDotenv(t);
  const o = J(t);
  return o ? u._configVault(t) : (Oe(`You set DOTENV_KEY but you are missing a .env.vault file at ${o}. Did you forget to build it?`), u.configDotenv(t));
}
function Ie(t, o) {
  const e = Buffer.from(o.slice(-64), "hex");
  let s = Buffer.from(t, "base64");
  const n = s.subarray(0, 12), r = s.subarray(-16);
  s = s.subarray(12, -16);
  try {
    const a = me.createDecipheriv("aes-256-gcm", e, n);
    return a.setAuthTag(r), `${a.update(s)}${a.final()}`;
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
  const s = !!(e && e.debug), n = !!(e && e.override), r = {};
  if (typeof o != "object") {
    const a = new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
    throw a.code = "OBJECT_REQUIRED", a;
  }
  for (const a of Object.keys(o))
    Object.prototype.hasOwnProperty.call(t, a) ? (n === !0 && (t[a] = o[a], r[a] = o[a]), s && I(n === !0 ? `"${a}" is already defined and WAS overwritten` : `"${a}" is already defined and was NOT overwritten`)) : (t[a] = o[a], r[a] = o[a]);
  return r;
}
const u = {
  configDotenv: De,
  _configVault: be,
  _parseVault: ke,
  config: Ne,
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
  const e = o.reduce(function(s, n) {
    const r = n.match(Re);
    return r && (s[r[1]] = r[2]), s;
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
].join(" "), W = 60 * 1e3;
class Ue extends z {
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
      const { verifier: e, challenge: s } = await this.createPkcePair(), n = $.randomUUID(), r = new URL("https://accounts.spotify.com/authorize");
      r.search = new URLSearchParams({
        client_id: this.config.clientId,
        response_type: "code",
        redirect_uri: this.config.redirectUri,
        code_challenge_method: "S256",
        code_challenge: s,
        scope: this.scope,
        state: n,
        show_dialog: "true"
      }).toString();
      const a = await this.openAuthWindow(r.toString(), n), i = await this.requestTokens({
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
    return await this.ensureReady(), !this.tokens || this.tokens.expiresAt - W <= Date.now() && !await this.refreshTokens() ? null : this.tokens;
  }
  async refreshTokens() {
    var s;
    if (!((s = this.tokens) != null && s.refreshToken))
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
    const s = new URLSearchParams(e), n = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: s
    });
    if (!n.ok) {
      const a = await n.text();
      throw new Error(`Spotify token request failed: ${a}`);
    }
    return await n.json();
  }
  async persistTokens(e) {
    var r;
    const s = e.refresh_token ?? ((r = this.tokens) == null ? void 0 : r.refreshToken);
    if (!s)
      throw new Error("Spotify did not return a refresh token");
    const n = {
      accessToken: e.access_token,
      refreshToken: s,
      expiresAt: Date.now() + e.expires_in * 1e3
    };
    return this.tokens = n, await R.setPassword(P, x, JSON.stringify(n)), this.scheduleRefresh(), this.emitState();
  }
  async openAuthWindow(e, s) {
    return new Promise((n, r) => {
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
        p(() => r(new Error("Spotify login was closed before completion")));
      }), i.webContents.setWindowOpenHandler(({ url: d }) => (le.openExternal(d), { action: "deny" }));
      const l = (d, E) => {
        if (!E.startsWith(this.config.redirectUri))
          return;
        const g = new URL(E), N = g.searchParams.get("code"), m = g.searchParams.get("state"), b = g.searchParams.get("error");
        if (m && m !== s) {
          p(() => r(new Error("State mismatch during Spotify authentication"))), i.close();
          return;
        }
        if (b) {
          p(() => r(new Error(`Spotify authentication failed: ${b}`))), i.close();
          return;
        }
        if (!N) {
          p(() => r(new Error("Missing authorization code from Spotify"))), i.close();
          return;
        }
        p(() => n(N)), i.close();
      };
      i.webContents.on("will-redirect", l), i.webContents.on("will-navigate", l), i.loadURL(e).catch((d) => p(() => r(d)));
    });
  }
  scheduleRefresh() {
    if (this.clearRefreshTimer(), !this.tokens)
      return;
    const e = Math.max(this.tokens.expiresAt - Date.now() - W, 0);
    this.refreshTimer = setTimeout(() => {
      this.refreshTokens().catch((s) => {
        this.emitState(s instanceof Error ? s.message : String(s));
      });
    }, e);
  }
  clearRefreshTimer() {
    this.refreshTimer && (clearTimeout(this.refreshTimer), this.refreshTimer = null);
  }
  buildState(e) {
    var s;
    return {
      status: e ? "error" : this.tokens ? "authenticated" : "signed-out",
      expiresAt: ((s = this.tokens) == null ? void 0 : s.expiresAt) ?? null,
      ...e ? { error: e } : {}
    };
  }
  emitState(e) {
    const s = this.buildState(e);
    return this.emit("auth-state", s), s;
  }
  emitLoadingState() {
    var s;
    const e = {
      status: "loading",
      expiresAt: ((s = this.tokens) == null ? void 0 : s.expiresAt) ?? null
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
        const s = JSON.parse(e);
        this.tokens = s, this.scheduleRefresh();
      } catch (s) {
        await R.deletePassword(P, x), this.emitState(s instanceof Error ? s.message : String(s));
      }
  }
  ensureReady() {
    return this.ready;
  }
  async createPkcePair() {
    const e = this.base64UrlEncode($.randomBytes(32).toString("base64url")), s = this.base64UrlEncode(
      $.createHash("sha256").update(e).digest("base64")
    );
    return { verifier: e, challenge: s };
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
class Fe extends z {
  constructor(e, s) {
    super();
    y(this, "state", Le);
    y(this, "timer", null);
    y(this, "intervalMs");
    y(this, "lastControlAt", 0);
    this.auth = e, this.intervalMs = (s == null ? void 0 : s.intervalMs) ?? 3e3;
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
      const s = `${L}/${this.state.status === "playing" ? "pause" : "play"}`;
      await fetch(s, {
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
    const s = await this.auth.getValidTokens();
    if (!s) {
      (this.state.status !== "unauthorized" || e) && this.updateState(this.emptyState("unauthorized"));
      return;
    }
    try {
      const n = await fetch($e, {
        headers: {
          Authorization: `Bearer ${s.accessToken}`
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
      const r = await n.json(), a = this.normalizePayload(r);
      this.updateState(a);
    } catch (n) {
      this.setError(n instanceof Error ? n.message : String(n));
    }
  }
  async withControl(e, s) {
    if (Date.now() - this.lastControlAt < 500)
      return;
    const n = await this.auth.getValidTokens();
    if (n)
      try {
        await s(n.accessToken), this.lastControlAt = Date.now(), await this.refresh(!0);
      } catch (r) {
        this.setError(r instanceof Error ? r.message : String(r));
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
    var l, d, E, g, N;
    const s = e == null ? void 0 : e.item, n = Array.isArray(s == null ? void 0 : s.artists) ? s.artists.map((m) => m == null ? void 0 : m.name).filter(Boolean).join(", ") : "Unknown artist", r = ((l = s == null ? void 0 : s.album) == null ? void 0 : l.images) ?? [], i = ((d = (Array.isArray(r) ? [...r].sort((m, b) => ((b == null ? void 0 : b.width) ?? 0) - ((m == null ? void 0 : m.width) ?? 0)) : [])[0]) == null ? void 0 : d.url) ?? null, h = s ? {
      id: s.id ?? s.uri ?? "unknown",
      name: s.name ?? "Unknown track",
      artists: n || "Unknown artist",
      album: ((E = s.album) == null ? void 0 : E.name) ?? "Unknown album",
      albumImageUrl: i,
      durationMs: s.duration_ms ?? 0,
      spotifyUrl: ((g = s.external_urls) == null ? void 0 : g.spotify) ?? null
    } : null;
    return {
      status: h ? e != null && e.is_playing ? "playing" : "paused" : "idle",
      track: h,
      progressMs: (e == null ? void 0 : e.progress_ms) ?? 0,
      deviceName: ((N = e == null ? void 0 : e.device) == null ? void 0 : N.name) ?? null,
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
    var n, r;
    (e.status !== this.state.status || ((n = e.track) == null ? void 0 : n.id) !== ((r = this.state.track) == null ? void 0 : r.id) || e.progressMs !== this.state.progressMs || e.deviceName !== this.state.deviceName || e.error !== this.state.error) && (this.state = e, this.emit("state", this.state));
  }
}
const X = v.dirname(he(import.meta.url));
process.env.APP_ROOT = v.join(X, "..");
const Y = process.env.VITE_DEV_SERVER_URL, nt = v.join(process.env.APP_ROOT, "dist-electron"), Z = v.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = Y ? v.join(process.env.APP_ROOT, "public") : Z;
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
async function K() {
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
      preload: v.join(X, "preload.mjs"),
      backgroundThrottling: !1
    }
  }), c.setMenuBarVisibility(!1), c.setAlwaysOnTop(!0, "screen-saver");
  try {
    c.setVisibleOnAllWorkspaces(!0, { visibleOnFullScreen: !0 });
  } catch {
    c.setVisibleOnAllWorkspaces(!0);
  }
  c.webContents.on("did-finish-load", () => {
    c == null || c.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString()), S.getAuthState().then((s) => {
      c == null || c.webContents.send(A.state, s);
    });
    const e = f.getState();
    c == null || c.webContents.send(O.state, e);
  }), c.webContents.on("before-input-event", (e, s) => {
    var r;
    s.type === "keyDown" && ((s.meta || s.control) && s.shift && ((r = s.key) == null ? void 0 : r.toLowerCase()) === "i" || s.key === "F12") && e.preventDefault();
  }), c.webContents.on("devtools-opened", () => {
    c == null || c.webContents.closeDevTools();
  }), c.webContents.setWindowOpenHandler(() => ({ action: "deny" })), process.platform === "darwin" && typeof c.setWindowButtonVisibility == "function" && c.setWindowButtonVisibility(!1), Y ? c.loadURL(Y) : c.loadFile(v.join(Z, "index.html"));
}
async function je() {
  if (!c || c.isDestroyed()) {
    await K();
    return;
  }
  c.isVisible() ? c.hide() : (c.show(), c.focus(), c.setAlwaysOnTop(!0, "screen-saver"));
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
function se() {
  T.unregister(B), T.register(B, () => {
    S.logout().then(() => f.forceRefresh());
  }) || console.warn(`Failed to register shortcut: ${B}`);
}
C.on("window-all-closed", () => {
  process.platform !== "darwin" && (C.quit(), c = null);
});
C.on("activate", () => {
  V.getAllWindows().length === 0 && (K(), ee(), te(), se());
});
C.whenReady().then(() => {
  f.start(), K(), ee(), te(), se(), c == null || c.once("ready-to-show", () => {
    c == null || c.show();
  });
});
C.on("will-quit", () => {
  T.unregisterAll();
});
export {
  nt as MAIN_DIST,
  Z as RENDERER_DIST,
  Y as VITE_DEV_SERVER_URL
};
