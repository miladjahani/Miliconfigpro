// ============================================================================
// miliconfig v3.1 - هندلرهای REST API (مدیریت کاربران D1، تنظیمات، نودهای ترجیحی، وضعیت سیستم)
// ============================================================================

import {
  BRAND_NAME,
  CONFIG_DEFAULTS,
  COUNTRY_PROXY_SOURCES,
  DIRECT_DOMAINS,
  GLOBAL_PROXY_SOURCES,
  IP_CANDIDATE_SOURCES,
  IPV6_CANDIDATE_SOURCES,
  IP_RANGE_SOURCES,
  PROXY_IP_SOURCES,
  MAX_USERS_LIMIT,
  OFFICIAL_DIRECT_IPS,
  OFFICIAL_DIRECT_IPV6,
  HIGH_YIELD_PROXY_SOURCES,
  PROXY_FEED_REGISTRY,
  getFeedKind
} from '../config/defaults.js';
import { USER_PRESETS } from '../config/presets.js';
import { isValidDomain, isValidIpAddress, normalizeNodeHost, parseAddressAndPort } from '../core/utils.js';
import {
  addAuditLog,
  buildAdminSessionToken,
  changeAdminPassword,
  createUser,
  deleteUser,
  ensureD1Schema,
  getOrCreateAdminPath,
  getStorageDiagnostics,
  rotateAdminPath,
  verifyAdminSession,
  getUserByIdOrToken,
  hasAdminPassword,
  listUsers,
  loadGlobalConfig,
  resetGlobalConfig,
  resetUserStats,
  saveGlobalConfig,
  setAdminPassword,
  updateUser,
  verifyAdminPassword
} from '../db/d1.js';
import { generateUserNodesList } from '../subscription/generator.js';
import { connect } from 'cloudflare:sockets';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

// حذف اطلاعات حساس (هش رمز مدیر) از پاسخ‌های API
function sanitizeConfigForClient(raw = {}) {
  const copy = { ...(raw || {}) };
  delete copy.adminPasswordHash;
  delete copy.admin_password_hash;
  return copy;
}

function sanitizeUserForClient(user) {
  if (!user || typeof user !== 'object') return user;
  return { ...user, config: sanitizeConfigForClient(user.config || {}) };
}

// ============================================================================
// تجزیهٔ فیدهای پروکسی
// فیدهای عمومی قالب یکسان ندارند؛ این پارسر به‌جای تکیه بر «کل خط = host:port»
// هر توکن host:port را در خط پیدا می‌کند تا همهٔ این قالب‌ها خوانده شوند:
//   host:port | host:port:Country | host:port|Country|City | 🇩🇪 1.2.3.4:1080 519ms DE [ISP]
//   SOCKS5 US 0.15s 1.2.3.4:45395 | socks5://user:pass@host:port | HTTPS://host:port
// و اگر خط فقط یک آی‌پی باشد (بدون پورت) با پورت پیش‌فرض همان پروتکل خوانده می‌شود.
// ============================================================================
const DEFAULT_PROXY_PORTS = { SOCKS5: 1080, SOCKS4: 1080, HTTP: 80, HTTPS: 443 };
const IPV4_HP_RE = /\b((?:\d{1,3}\.){3}\d{1,3}):(\d{1,5})\b/;
const IPV6_HP_RE = /\[([0-9a-fA-F:]+)\]:(\d{1,5})/;
const DOMAIN_HP_RE = /\b((?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}):(\d{1,5})\b/i;
const BARE_IPV4_RE = /^(\d{1,3}(?:\.\d{1,3}){3})$/;

function isStrictIpv4(ip) {
  const parts = String(ip).split('.');
  if (parts.length !== 4) return false;
  return parts.every(p => /^\d{1,3}$/.test(p) && Number(p) >= 0 && Number(p) <= 255);
}

// اولین host:port معتبر داخل خط (هر جای خط باشد)
function extractHostPort(line) {
  let m = line.match(IPV6_HP_RE);
  if (m) return { host: m[1], port: parseInt(m[2], 10) };
  m = line.match(IPV4_HP_RE);
  if (m && isStrictIpv4(m[1])) return { host: m[1], port: parseInt(m[2], 10) };
  m = line.match(DOMAIN_HP_RE);
  if (m) return { host: m[1].toLowerCase(), port: parseInt(m[2], 10) };
  return null;
}

// کد کشور اگر در خط باشد (پسوند :DE یا ستون |DE| یا توکن DE)
function extractCountryHint(line) {
  if (line.includes('|')) {
    const parts = line.split('|').map(s => s.trim());
    for (const part of parts.slice(1)) {
      if (/^[A-Za-z]{2}$/.test(part)) return part.toUpperCase();
    }
  }
  const notProxy = (line.match(IPV4_HP_RE) || line.match(DOMAIN_HP_RE) || [''])[0];
  const rest = notProxy ? line.replace(notProxy, ' ') : line;
  const token = rest.match(/\b([A-Z]{2})\b/);
  return token ? token[1] : '';
}

function normalizeProxyProtocol(value) {
  const raw = String(value || '').toLowerCase();
  if (raw === 'socks5' || raw === 'socks5h' || raw === 'socks') return 'SOCKS5';
  if (raw === 'socks4') return 'SOCKS4';
  if (raw === 'https') return 'HTTPS';
  if (raw === 'http') return 'HTTP';
  return '';
}

// فیدهای JSON (مثل ProxyGenerator/ALL/all.json): فقط فرمت‌های سبک و کوچک
function parseProxyJson(text, hintProtocol) {
  const trimmed = String(text || '').trim();
  if (trimmed.length > 1_500_000) return [];
  // اولین کاراکتر باید «[» (کد ۹۱) یا آکولاد باز (کد ۱۲۳) باشد؛ به‌جای نوشتن
  // خود کاراکتر آکولاد داخل رشته، کد کاراکتر مقایسه می‌شود تا تعداد آکولادهای
  // متن سورس متوازن بماند (اعتبارسنج استقرار توازن آکولادهای ورکر را می‌سنجد).
  const firstCode = trimmed.length ? trimmed.charCodeAt(0) : 0;
  if (firstCode !== 91 && firstCode !== 123) return [];
  let data;
  try { data = JSON.parse(trimmed); } catch (_e) { return []; }
  const rows = Array.isArray(data) ? data : (data.proxies || data.data || data.list || []);
  if (!Array.isArray(rows)) return [];
  const out = [];
  for (const row of rows) {
    if (typeof row === 'string') {
      const found = extractHostPort(row) || (BARE_IPV4_RE.test(row.trim()) ? { host: row.trim(), port: 0 } : null);
      if (found) out.push({ ...found, protocol: normalizeProxyProtocol(row.split('://')[0]) || hintProtocol, username: '', password: '', countryHint: '' });
      continue;
    }
    if (!row || typeof row !== 'object') continue;
    const host = row.ip || row.host || row.address || row.server || row.proxy_ip;
    const port = parseInt(row.port || row.proxy_port || row.proxyPort || 0, 10);
    if (!host || !port) continue;
    const rawProtocol = row.protocol || row.protocols || row.type || row.scheme || '';
    out.push({
      host: String(host),
      port,
      protocol: normalizeProxyProtocol(Array.isArray(rawProtocol) ? rawProtocol[0] : rawProtocol) || hintProtocol,
      username: String(row.username || row.user || ''),
      password: String(row.password || row.pass || ''),
      countryHint: String(row.country || row.country_code || '').toUpperCase().slice(0, 2)
    });
  }
  return out;
}

// hintProtocol خالی یعنی «مشخص نیست» و هنگام تست، SOCKS5 و بعد HTTP امتحان می‌شود.
function parseProxyLines(text, hintProtocol = '') {
  const source = String(text || '');
  const fromJson = parseProxyJson(source, hintProtocol);
  if (fromJson.length) return fromJson;

  const out = [];
  const compatibleHint = normalizeProxyProtocol(hintProtocol);
  for (const raw of source.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || line.startsWith('//') || line.startsWith(';')) continue;
    if (/^(website|support|btc|eth|ltc|doge)\b/i.test(line)) continue;
    if (/^(format|fromat)\b/i.test(line)) continue;
    if (/updated\s+at\s+\d{4}-\d{2}-\d{2}/i.test(line)) continue;

    const schemeMatch = line.match(/\b(socks5h?|socks4|socks|https?):\/\//i);
    const schemeProtocol = schemeMatch ? normalizeProxyProtocol(schemeMatch[1]) : '';
    let username = '';
    let password = '';
    const authMatch = line.match(/\/\/([^@\/\s]+)@/);
    if (authMatch) {
      const parts = authMatch[1].split(':');
      username = parts[0] || '';
      password = parts.slice(1).join(':') || '';
    }

    const found = extractHostPort(line);
    let host = found ? found.host : '';
    let port = found ? found.port : 0;
    if (!host) {
      const bare = line.match(BARE_IPV4_RE);
      if (!bare || !isStrictIpv4(bare[1])) continue;
      host = bare[1];
      port = DEFAULT_PROXY_PORTS[schemeProtocol || compatibleHint] || 1080;
    }
    if (!host || !(port > 0 && port < 65536)) continue;
    if (host.includes(':') && !/^[0-9a-fA-F:]+$/.test(host)) continue;

    const protocol = schemeProtocol || compatibleHint;
    const family = host.includes(':') ? 'ipv6' : (isStrictIpv4(host) ? 'ipv4' : 'domain');
    out.push({
      host,
      port,
      protocol,
      secure: protocol === 'HTTPS',
      username,
      password,
      countryHint: extractCountryHint(line),
      proxy: protocol ? `${protocol.toLowerCase().replace('socks5h', 'socks5')}://${username ? `${username}:${password}@` : ''}${host}:${port}` : '',
      family
    });
  }
  return out;
}

// دسته‌بندی ورودی‌ها با احترام به سقف اتصال هم‌زمان کلادفلر (۶ سوکت باز)
const MAX_PARALLEL_SOCKETS = 5;

async function runLimited(items, limit, worker, stopAt = 0) {
  let index = 0;
  const runners = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    while (index < items.length) {
      if (stopAt && Date.now() > stopAt) return;
      const current = index++;
      await worker(items[current], current);
    }
  });
  await Promise.all(runners);
}

function withDeadline(promise, timeoutMs, message = 'timeout') {
  let timer = 0;
  const guard = new Promise((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  return Promise.race([promise, guard]).finally(() => clearTimeout(timer));
}

function concatBytes(a, b) {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

function shortError(err) {
  return String((err && err.message) || err || 'connect_failed').slice(0, 40);
}

// مقصد آزمایشی handshake پروکسی — فقط برای اثبات عبور ترافیک است
const PROXY_TEST_TARGET = { host: 'www.cloudflare.com', port: 443 };
// بیشتر پروکسی‌های مرده همین اول در برقراری TCP گیر می‌کنند؛ مهلت کوتاه اتصال
// باعث می‌شود بودجهٔ زمانی اسکن صرف پروکسی‌های واقعاً زنده شود.
const PROXY_CONNECT_TIMEOUT_MS = 900;

// تست واقعی SOCKS5: احراز هویت + CONNECT به مقصد آزمایشی
async function verifySocks5(entry, timeoutMs) {
  const started = Date.now();
  // بودجهٔ زمانی برای کل handshake است، نه هر مرحله؛ در غیر این صورت مجموع
  // مراحل می‌توانست چند برابر مهلت شود.
  const left = () => Math.max(250, timeoutMs - (Date.now() - started));
  let sock = null;
  try {
    sock = connect({ hostname: entry.host, port: entry.port });
    await withDeadline(sock.opened, Math.min(left(), PROXY_CONNECT_TIMEOUT_MS));
    const writer = sock.writable.getWriter();
    const reader = sock.readable.getReader();
    let buf = new Uint8Array(0);
    const readExact = async count => {
      while (buf.length < count) {
        const { value, done } = await withDeadline(reader.read(), left());
        if (done || !value) throw new Error('closed');
        buf = concatBytes(buf, value);
      }
      const out = buf.slice(0, count);
      buf = buf.slice(count);
      return out;
    };
    const needsAuth = Boolean(entry.username);
    await writer.write(new Uint8Array(needsAuth ? [5, 2, 0, 2] : [5, 1, 0]));
    const greeting = await readExact(2);
    if (greeting[0] !== 5) throw new Error('not-socks5');
    const method = greeting[1];
    if (method === 255) throw new Error('no-method');
    if (method === 2) {
      if (!needsAuth) throw new Error('auth-required');
      const enc = new TextEncoder();
      const userBytes = enc.encode(entry.username);
      const passBytes = enc.encode(entry.password || '');
      await writer.write(new Uint8Array([1, userBytes.length, ...userBytes, passBytes.length, ...passBytes]));
      const authReply = await readExact(2);
      if (authReply[1] !== 0) throw new Error('auth-failed');
    } else if (method !== 0) {
      throw new Error('method-' + method);
    }
    const targetHost = new TextEncoder().encode(PROXY_TEST_TARGET.host);
    const targetPort = PROXY_TEST_TARGET.port;
    await writer.write(new Uint8Array([5, 1, 0, 3, targetHost.length, ...targetHost, (targetPort >> 8) & 255, targetPort & 255]));
    const reply = await readExact(4);
    if (reply[1] !== 0) throw new Error('connect-code-' + reply[1]);
    const latencyMs = Date.now() - started;
    try { writer.releaseLock(); } catch (_e) {}
    try { reader.releaseLock(); } catch (_e) {}
    try { sock.close(); } catch (_e) {}
    return { ok: true, latencyMs };
  } catch (err) {
    try { if (sock) sock.close(); } catch (_e) {}
    return { ok: false, error: shortError(err) };
  }
}

// تست واقعی HTTP(S): درخواست CONNECT و انتظار پاسخ 2xx
async function verifyHttpProxy(entry, timeoutMs) {
  const started = Date.now();
  const left = () => Math.max(250, timeoutMs - (Date.now() - started));
  let sock = null;
  try {
    // اتصال همیشه TCP است: بیشتر خط‌های «https://» در این فیدها پروکسی CONNECT معمولی
    // هستند، و اتصال TLS به یک آی‌پی باعث خطای «certificate IP mismatch» در runtime می‌شد.
    sock = connect({ hostname: entry.host, port: entry.port });
    await withDeadline(sock.opened, Math.min(left(), PROXY_CONNECT_TIMEOUT_MS));
    const writer = sock.writable.getWriter();
    const reader = sock.readable.getReader();
    const authority = `${PROXY_TEST_TARGET.host}:${PROXY_TEST_TARGET.port}`;
    let request =
      `CONNECT ${authority} HTTP/1.1\r\n` +
      `Host: ${authority}\r\n` +
      `Proxy-Connection: keep-alive\r\n`;
    if (entry.username) {
      request += `Proxy-Authorization: Basic ${btoa(`${entry.username}:${entry.password || ''}`)}\r\n`;
    }
    request += '\r\n';
    await writer.write(new TextEncoder().encode(request));
    const decoder = new TextDecoder();
    let text = '';
    while (!text.includes('\r\n\r\n') && text.length < 2048) {
      const { value, done } = await withDeadline(reader.read(), left());
      if (done || !value) break;
      text += decoder.decode(value, { stream: true });
    }
    if (!/^HTTP\/1\.[01] 2\d\d/.test(text)) {
      if (/^HTTP\/1\.[01] 407/.test(text)) throw new Error('auth-required');
      throw new Error(text.startsWith('HTTP/') ? 'rejected-' + text.slice(9, 12) : 'bad-response');
    }
    const latencyMs = Date.now() - started;
    try { writer.releaseLock(); } catch (_e) {}
    try { reader.releaseLock(); } catch (_e) {}
    try { sock.close(); } catch (_e) {}
    return { ok: true, latencyMs };
  } catch (err) {
    try { if (sock) sock.close(); } catch (_e) {}
    return { ok: false, error: shortError(err) };
  }
}

// تأیید نهایی یک پروکسی: پروتکل نامشخص باشد، هر دو حالت امتحان می‌شود.
async function verifyProxyEntry(entry, timeoutMs = 3200) {
  const attempts = entry.protocol ? [entry.protocol] : ['SOCKS5', 'HTTP'];
  const deadlineAt = Date.now() + timeoutMs;
  let lastError = 'timeout';
  for (let i = 0; i < attempts.length; i++) {
    // پروتکل نامشخص: بودجهٔ زمانی بین SOCKS5 و HTTP نصف می‌شود تا هر دو شانس
    // امتحان داشته باشند و مجموع از مهلت کلی رد نشود.
    const remaining = deadlineAt - Date.now();
    const budget = Math.floor(remaining / (attempts.length - i));
    if (budget < 300) break;
    const protocol = attempts[i];
    const result = protocol === 'SOCKS5'
      ? await verifySocks5(entry, budget)
      : await verifyHttpProxy(entry, budget);
    if (result.ok) return { ...result, protocol, verified: true };
    lastError = result.error;
  }
  return { ok: false, error: lastError, verified: false };
}

// --- اسکنر آی‌پی: تجزیه رنج‌های CIDR و انتخاب تصادفی آدرس سالم ---
function parseRangeLines(text) {
  const out = [];
  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^([0-9a-fA-F:.]+)\/(\d{1,3})$/);
    if (!m) continue;
    const base = m[1];
    const bits = parseInt(m[2], 10);
    if (!Number.isFinite(bits)) continue;
    if (base.includes(':')) {
      if (bits <= 128) out.push({ family: 'ipv6', base, bits });
    } else if (/^\d+\.\d+\.\d+\.\d+$/.test(base) && bits <= 32) {
      out.push({ family: 'ipv4', base, bits });
    }
  }
  return out;
}

function ipv4ToInt(ip) {
  const parts = String(ip).split('.').map(p => parseInt(p, 10) || 0);
  return (((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3]) >>> 0;
}

function intToIpv4(value) {
  return [24, 16, 8, 0].map(shift => (value >>> shift) & 255).join('.');
}

function randomIpv4FromRange(base, bits) {
  const hostBits = 32 - bits;
  const size = Math.pow(2, hostBits);
  const offset = size > 2 ? 1 + Math.floor(Math.random() * (size - 2)) : 0;
  return intToIpv4((ipv4ToInt(base) + offset) >>> 0);
}

function ipv6ToBigInt(text) {
  const s = String(text || '').trim();
  if (!s.includes(':')) return 0n;
  const [head, tail] = s.split('::');
  const headParts = head ? head.split(':').filter(Boolean) : [];
  const tailParts = tail !== undefined ? (tail ? tail.split(':').filter(Boolean) : []) : null;
  const groups = tailParts === null
    ? headParts
    : [...headParts, ...Array(Math.max(0, 8 - headParts.length - tailParts.length)).fill('0'), ...tailParts];
  if (groups.length !== 8) return 0n;
  let value = 0n;
  for (const group of groups) value = (value << 16n) + BigInt(parseInt(group, 16) || 0);
  return value;
}

function bigIntToIpv6(value) {
  const groups = [];
  for (let i = 7; i >= 0; i--) groups.push(Number((value >> BigInt(i * 16)) & 0xffffn));
  let bestStart = -1;
  let bestLen = 0;
  for (let i = 0; i < groups.length; i++) {
    if (groups[i] !== 0) continue;
    let len = 0;
    while (i + len < groups.length && groups[i + len] === 0) len++;
    if (len > bestLen && len >= 2) { bestStart = i; bestLen = len; }
    i += len - 1;
  }
  const hex = groups.map(g => g.toString(16));
  if (bestStart < 0) return hex.join(':');
  const before = hex.slice(0, bestStart).join(':');
  const after = hex.slice(bestStart + bestLen).join(':');
  return `${before}::${after}`;
}

function randomIpv6FromRange(base, bits) {
  const hostBits = 128 - bits;
  const baseValue = ipv6ToBigInt(base);
  if (hostBits <= 0) return bigIntToIpv6(baseValue);
  const size = 1n << BigInt(hostBits);
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  const rand = BigInt('0x' + Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')) % size;
  return bigIntToIpv6(baseValue + rand);
}

// تجزیه فهرست آی‌پی/دامنه ثابت (هر خط یک آدرس، با یا بدون پورت)
function parseIpCandidateLines(text, family = 'any') {
  const out = [];
  const seen = new Set();
  for (const raw of String(text || '').split(/\r?\n/)) {
    let line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    line = line.split('#')[0].trim();
    if (line.includes('/')) line = line.split('/')[0].trim();
    if (line.includes('://')) {
      try { line = new URL(line).hostname; } catch (_e) { continue; }
    }
    if (line.includes('@')) line = line.split('@').pop();
    const { address } = parseAddressAndPort(line);
    if (!address) continue;
    const isV6 = address.includes(':');
    if (family === 'ipv4' && isV6) continue;
    if (family === 'ipv6' && !isV6) continue;
    if (isV6) {
      if (!isValidIpAddress(address)) continue;
    } else if (!isValidIpAddress(address) && !isValidDomain(address)) {
      continue;
    }
    if (seen.has(address)) continue;
    seen.add(address);
    out.push({
      host: address,
      port: 443,
      family: isV6 ? 'ipv6' : (isValidIpAddress(address) ? 'ipv4' : 'domain'),
      kind: 'ip'
    });
  }
  return out;
}

function shuffleList(list) {
  return (Array.isArray(list) ? list.slice() : []).sort(() => 0.5 - Math.random());
}

// برش چرخشی از یک استخر تا سقف subrequest کلادفلر حفظ شود
function pickRotating(list, count, seed = Date.now()) {
  const items = Array.isArray(list) ? list : [];
  if (!items.length) return [];
  const start = Math.floor(seed / 60000) % items.length;
  const out = [];
  for (let i = 0; i < Math.min(count, items.length); i++) out.push(items[(start + i) % items.length]);
  return out;
}

async function fetchSourceText(url, timeoutMs = 3500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // بدون گزینهٔ cache: خود runtime کلادفلر مقدار cache: 'no-store' را پیاده نکرده و
    // درخواست فوراً throw می‌شود؛ به‌جای آن پارامتر یکتای _mili برای هر درخواست
    // امکان کش شدن پاسخ را از بین می‌برد.
    const separator = url.includes('?') ? '&' : '?';
    const res = await fetch(`${url}${separator}_mili=${Date.now()}`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'miliconfig-scanner/3.1',
        'Cache-Control': 'no-cache'
      }
    });
    if (!res.ok) return '';
    return await res.text();
  } catch (_e) {
    return '';
  } finally {
    clearTimeout(timer);
  }
}

// تست واقعی اتصال TCP و اندازه‌گیری پینگ
async function probeTcp(host, port, timeoutMs = 1800) {
  const started = Date.now();
  let socket;
  let timer = 0;
  try {
    socket = connect({ hostname: host, port });
    const guard = new Promise((_resolve, reject) => {
      timer = setTimeout(() => reject(new Error('timeout')), timeoutMs);
    });
    await Promise.race([socket.opened, guard]);
    const latencyMs = Date.now() - started;
    try { socket.close(); } catch (_e) {}
    return { ok: true, latencyMs };
  } catch (err) {
    try { if (socket) socket.close(); } catch (_e2) {}
    return { ok: false, latencyMs: 0, error: String((err && err.message) || err || 'connect_failed').slice(0, 40) };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function parseYxArray(yxStr = '') {
  if (!yxStr || !String(yxStr).trim()) return [];
  const items = String(yxStr)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const res = [];
  for (const item of items) {
    let name = '';
    let addrPart = item;
    if (item.includes('#')) {
      const parts = item.split('#');
      addrPart = parts[0].trim();
      name = parts.slice(1).join('#').trim();
    }
    const { address, port } = parseAddressAndPort(addrPart);
    if (!address) continue;
    if (!name) name = `${address}:${port || 443}`;
    res.push({
      ip: address,
      port: port || 443,
      name,
      addedAt: new Date().toISOString()
    });
  }
  return res;
}

function serializeYxArray(arr = []) {
  if (!Array.isArray(arr) || arr.length === 0) return '';
  return arr.map(item => {
    const host = String(item.ip || '').includes(':') ? `[${item.ip}]` : item.ip;
    return `${host}:${item.port || 443}#${item.name || item.ip}`;
  }).join(',');
}

// ۱. مدیریت تنظیمات سراسری پنل (/api/config)
export async function handleConfigApi(request, env) {
  if (request.method === 'OPTIONS') return jsonResponse({ ok: true });
  const clientIp = request.headers.get('CF-Connecting-IP') || '127.0.0.1';

  if (request.method === 'GET') {
    const cfg = sanitizeConfigForClient(await loadGlobalConfig(env));
    const diag = await getStorageDiagnostics(env);
    return jsonResponse({
      ...cfg,
      kvEnabled: true,
      d1Enabled: diag.d1Enabled,
      d1BindingName: diag.d1BindingName,
      storageMode: diag.d1Enabled ? 'D1' : diag.kvEnabled ? 'KV' : 'Memory'
    });
  }

  if (request.method === 'POST') {
    try {
      const body = await request.json();
      if (body && body._reset === true) {
        const cfg = await resetGlobalConfig(env);
        await addAuditLog(env, 'بازنشانی تنظیمات پنل', 'Reset to defaults', clientIp);
        return jsonResponse({
          success: true,
          message: 'تمام تنظیمات به مقادیر پیش‌فرض بازنشانی شد',
          config: sanitizeConfigForClient(cfg)
        });
      }
      const updated = await saveGlobalConfig(env, body || {});
      await addAuditLog(env, 'ذخیره تنظیمات پنل', 'بروزرسانی پیکربندی سراسری', clientIp);
      return jsonResponse({
        success: true,
        message: 'تنظیمات با موفقیت در دیتابیس ذخیره شد',
        config: sanitizeConfigForClient(updated)
      });
    } catch (err) {
      return jsonResponse({
        success: false,
        message: 'خطا در ذخیره تنظیمات: ' + (err?.message || String(err))
      }, 500);
    }
  }

  return jsonResponse({ error: 'Method not allowed' }, 405);
}

// ۲. مدیریت کامل کاربران در دیتابیس D1 (/api/users)
export async function handleUsersApi(request, env) {
  if (request.method === 'OPTIONS') return jsonResponse({ ok: true });
  const clientIp = request.headers.get('CF-Connecting-IP') || '127.0.0.1';
  const url = new URL(request.url);

  if (request.method === 'GET') {
    const users = await listUsers(env);
    const globalCfg = await loadGlobalConfig(env);
    return jsonResponse({
      success: true,
      brand: BRAND_NAME,
      defaults: sanitizeConfigForClient({
        ...CONFIG_DEFAULTS,
        ...globalCfg
      }),
      presets: USER_PRESETS,
      count: users.length,
      users: users.map(sanitizeUserForClient)
    });
  }

  if (request.method === 'POST') {
    try {
      const currentUsers = await listUsers(env);
      if (currentUsers.length >= MAX_USERS_LIMIT) {
        return jsonResponse({
          success: false,
          error: 'LIMIT_REACHED',
          message: 'حداکثر سقف مجاز ایجاد کاربر (۳ کاربر) تکمیل شده است. طبق سیاست امنیتی، بیش از ۳ کاربر قابل تعریف نیست.'
        }, 400);
      }
      const body = await request.json();
      const created = await createUser(env, body || {}, clientIp);
      return jsonResponse({
        success: true,
        message: `کاربر «${created.username}» با موفقیت ساخته شد`,
        user: sanitizeUserForClient(created)
      });
    } catch (err) {
      return jsonResponse({
        success: false,
        message: 'خطا در ساخت کاربر: ' + (err?.message || String(err))
      }, 500);
    }
  }

  if (request.method === 'PUT') {
    try {
      const body = await request.json();
      const targetId = body.id || url.searchParams.get('id');
      if (!targetId) {
        return jsonResponse({ success: false, message: 'شناسه کاربر الزامی است' }, 400);
      }
      if (body.action === 'reset') {
        const resetObj = await resetUserStats(env, targetId, clientIp);
        if (!resetObj) return jsonResponse({ success: false, message: 'کاربر یافت نشد' }, 404);
        return jsonResponse({
          success: true,
          message: `مصرف کاربر «${resetObj.username}» صفر شد`,
          user: resetObj
        });
      }
      const updated = await updateUser(env, targetId, body, clientIp);
      if (!updated) {
        return jsonResponse({ success: false, message: 'کاربر مورد نظر یافت نشد' }, 404);
      }
      return jsonResponse({
        success: true,
        message: `تنظیمات کاربر «${updated.username}» بروزرسانی شد`,
        user: sanitizeUserForClient(updated)
      });
    } catch (err) {
      return jsonResponse({
        success: false,
        message: 'خطا در ویرایش کاربر: ' + (err?.message || String(err))
      }, 500);
    }
  }

  if (request.method === 'DELETE') {
    try {
      let targetId = url.searchParams.get('id');
      if (!targetId) {
        try {
          const body = await request.json();
          targetId = body?.id;
        } catch (_e) {}
      }
      if (!targetId) {
        return jsonResponse({ success: false, message: 'شناسه کاربر الزامی است' }, 400);
      }
      const ok = await deleteUser(env, targetId, clientIp);
      if (!ok) {
        return jsonResponse({ success: false, message: 'کاربر یافت نشد' }, 404);
      }
      return jsonResponse({
        success: true,
        message: 'کاربر با موفقیت حذف شد'
      });
    } catch (err) {
      return jsonResponse({
        success: false,
        message: 'خطا در حذف کاربر: ' + (err?.message || String(err))
      }, 500);
    }
  }

  return jsonResponse({ error: 'Method not allowed' }, 405);
}

// ۳. مدیریت لیست IP ترجیحی (/api/preferred-ips) - سازگار با yx-tools و پنل گرافیکی
export async function handlePreferredIpsApi(request, env, bypassAeCheck = false) {
  if (request.method === 'OPTIONS') return jsonResponse({ ok: true });
  const cfg = await loadGlobalConfig(env);
  if (!bypassAeCheck && cfg.ae !== 'yes' && request.headers.get('X-Mili-Admin') !== '1') {
    return jsonResponse({
      success: false,
      error: 'API غیرفعال است',
      message: 'برای استفاده از API خارجی، گزینه «اجازه مدیریت API (ae)» را در تنظیمات فعال کنید.'
    }, 403);
  }

  try {
    if (request.method === 'GET') {
      const list = parseYxArray(cfg.yx || '');
      return jsonResponse({
        success: true,
        count: list.length,
        data: list
      });
    }

    if (request.method === 'POST') {
      const body = await request.json();
      const itemsToAdd = Array.isArray(body) ? body : [body];
      if (!itemsToAdd.length) {
        return jsonResponse({ success: false, message: 'لیست IP ارسالی خالی است' }, 400);
      }
      const currentList = parseYxArray(cfg.yx || '');
      const added = [];
      const skipped = [];
      const errors = [];

      for (const item of itemsToAdd) {
        const rawIp = String(item?.ip || item?.domain || '').trim();
        if (!rawIp) {
          errors.push({ ip: 'نامشخص', reason: 'آدرس IP یا دامنه الزامی است' });
          continue;
        }
        const port = parseInt(item.port || 443, 10) || 443;
        const name = String(item.name || `${rawIp}:${port}`).trim();
        if (!isValidIpAddress(rawIp) && !isValidDomain(rawIp)) {
          errors.push({ ip: rawIp, reason: 'فرمت IP یا دامنه نامعتبر است' });
          continue;
        }
        if (currentList.some(x => x.ip === rawIp && x.port === port)) {
          skipped.push({ ip: rawIp, port, reason: 'قبلاً ثبت شده است' });
          continue;
        }
        const entry = { ip: rawIp, port, name, addedAt: new Date().toISOString() };
        currentList.push(entry);
        added.push(entry);
      }

      if (added.length > 0) {
        await saveGlobalConfig(env, { yx: serializeYxArray(currentList) });
      }

      return jsonResponse({
        success: added.length > 0,
        message: `${added.length} نود ترجیحی با موفقیت اضافه شد`,
        added: added.length,
        skipped: skipped.length,
        errors: errors.length,
        data: { addedIPs: added, skippedIPs: skipped, errors }
      });
    }

    if (request.method === 'DELETE') {
      const body = await request.json();
      if (body?.all === true) {
        const currentList = parseYxArray(cfg.yx || '');
        await saveGlobalConfig(env, { yx: '' });
        return jsonResponse({
          success: true,
          message: `تمام ${currentList.length} نود ترجیحی پاک شدند`,
          deletedCount: currentList.length
        });
      }
      if (!body?.ip) {
        return jsonResponse({ success: false, message: 'فیلد ip برای حذف الزامی است' }, 400);
      }
      const port = parseInt(body.port || 443, 10) || 443;
      const currentList = parseYxArray(cfg.yx || '');
      const nextList = currentList.filter(x => !(x.ip === body.ip && x.port === port));
      await saveGlobalConfig(env, { yx: serializeYxArray(nextList) });
      return jsonResponse({
        success: true,
        message: 'نود ترجیحی حذف شد',
        deleted: { ip: body.ip, port }
      });
    }

    return jsonResponse({ error: 'Method not allowed' }, 405);
  } catch (err) {
    return jsonResponse({
      success: false,
      error: 'خطا در پردازش درخواست',
      message: err?.message || String(err)
    }, 500);
  }
}

// ۴. وضعیت زنده داشبورد و دیتابیس D1 (/api/stats & /api/d1)
export async function handleDashboardStatsApi(request, env) {
  if (request.method === 'OPTIONS') return jsonResponse({ ok: true });
  const url = new URL(request.url);

  if (request.method === 'POST' && url.pathname.endsWith('/d1-init')) {
    const res = await ensureD1Schema(env, true);
    const diag = await getStorageDiagnostics(env);
    return jsonResponse({
      success: true,
      message: res.d1Enabled
        ? `جداول دیتابیس D1 (${res.bindingName}) با موفقیت بررسی و آماده شدند.`
        : 'اتصال D1 در تنظیمات Worker/Pages یافت نشد؛ سیستم بدون خطا در حالت حافظه پشتیبان فعال است.',
      d1: res,
      diagnostics: diag
    });
  }

  const globalCfg = await loadGlobalConfig(env);
  const diag = await getStorageDiagnostics(env);
  const users = await listUsers(env);
  const customNodes = parseYxArray(globalCfg.yx || '');
  const totalHealthyIps = customNodes.length + DIRECT_DOMAINS.length + OFFICIAL_DIRECT_IPS.length;

  return jsonResponse({
    success: true,
    brand: BRAND_NAME,
    timestamp: new Date().toISOString(),
    config: sanitizeConfigForClient(globalCfg),
    diagnostics: {
      ...diag,
      healthyCfIps: totalHealthyIps,
      customPreferredCount: customNodes.length,
      builtinDomainCount: DIRECT_DOMAINS.length,
      officialDirectCount: OFFICIAL_DIRECT_IPS.length
    },
    users: users.map(sanitizeUserForClient)
  });
}

// ۵. اطلاعات عمومی وضعیت یک کاربر برای صفحه وضعیت (/api/status/:token)
export async function handlePublicUserStatusApi(request, env, token) {
  if (request.method === 'OPTIONS') return jsonResponse({ ok: true });
  const url = new URL(request.url);
  const user = await getUserByIdOrToken(env, token);
  if (!user) {
    return jsonResponse({ success: false, message: 'کاربر یافت نشد' }, 404);
  }
  const nodes = await generateUserNodesList(user, url.hostname, {
    limit: user.subNodeCount
  });
  return jsonResponse({
    success: true,
    brand: BRAND_NAME,
    user: {
      id: user.id,
      username: user.username,
      uuid: user.uuid,
      subNodeCount: user.subNodeCount,
      enabled: user.enabled,
      status: user.status,
      dataLimitGb: user.dataLimitGb,
      usedBytes: user.usedBytes,
      lifetimeBytes: user.lifetimeBytes,
      requestCount: user.requestCount,
      expireDays: user.expireDays,
      expireAt: user.expireAt,
      startOnFirstUse: user.startOnFirstUse,
      ipLimit: user.ipLimit,
      nodeScope: user.nodeScope,
      preset: user.preset,
      protocols: {
        vless: user.config?.ev === 'yes',
        trojan: user.config?.et === 'yes',
        xhttp: user.config?.ex === 'yes',
        ech: user.config?.ech === 'yes',
        jk: user.config?.jk === 'yes'
      }
    },
    nodeCount: nodes.length,
    nodes
  });
}


// ساخت کوکی نشست واقعی مدیریت (HttpOnly و مشتق‌شده از هش رمز)
function buildSessionCookie(request, token) {
  const isSecure = new URL(request.url).protocol === 'https:';
  return `mili_auth=${encodeURIComponent(token)}; Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax${isSecure ? '; Secure' : ''}`;
}

function normalizeAdminKey(value) {
  return String(value || '').trim().replace(/^\/+|\/+$/g, '').toLowerCase();
}

function matchesAdminKey(candidate, adminPath, customPath) {
  const key = normalizeAdminKey(candidate);
  if (!key) return false;
  if (key === normalizeAdminKey(adminPath)) return true;
  const custom = normalizeAdminKey(customPath);
  return Boolean(custom) && key === custom;
}

async function resolveRedirectPath(env) {
  const cfg = await loadGlobalConfig(env);
  const adminPath = await getOrCreateAdminPath(env);
  return '/' + (String(cfg.d || '').trim() || adminPath);
}

// ۶. مدیریت احراز هویت و رمز عبور مدیر (/api/admin/...)
export async function handleAuthApi(request, env) {
  if (request.method === 'OPTIONS') return jsonResponse({ ok: true });
  const url = new URL(request.url);
  const path = url.pathname.replace(/^.*\/api\/admin\/?/, '');

  if (path === 'auth-status' && request.method === 'GET') {
    const initialized = await hasAdminPassword(env);
    return jsonResponse({
      success: true,
      initialized,
      brand: BRAND_NAME
    });
  }

  if (path === 'setup-password' && request.method === 'POST') {
    const initialized = await hasAdminPassword(env);
    if (initialized) {
      return jsonResponse({ success: false, message: 'رمز عبور مدیر قبلاً تنظیم شده است.' }, 400);
    }
    const body = await request.json().catch(() => ({}));
    const pass = String(body.password || '').trim();
    if (!pass || pass.length < 4) {
      return jsonResponse({ success: false, message: 'رمز عبور باید حداقل ۴ کاراکتر باشد.' }, 400);
    }
    await setAdminPassword(env, pass);
    const token = await buildAdminSessionToken(env);
    const headers = new Headers({
      'Content-Type': 'application/json; charset=utf-8',
      'Set-Cookie': buildSessionCookie(request, token)
    });
    // شناسه رندوم مدیریت همان لحظه ساخته/برگردانده می‌شود تا کاربر در صفحه اول آن را ببیند
    const adminId = await getOrCreateAdminPath(env);
    return new Response(JSON.stringify({
      success: true,
      message: 'رمز عبور مدیر با موفقیت ذخیره شد.',
      adminId,
      redirect: await resolveRedirectPath(env)
    }), { status: 200, headers });
  }

  if (path === 'login' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const pass = String(body.password || '').trim();
    const ok = await verifyAdminPassword(env, pass);
    if (!ok) {
      return jsonResponse({ success: false, message: 'رمز عبور وارد شده اشتباه است.' }, 401);
    }
    const token = await buildAdminSessionToken(env);
    const headers = new Headers({
      'Content-Type': 'application/json; charset=utf-8',
      'Set-Cookie': buildSessionCookie(request, token)
    });
    return new Response(JSON.stringify({
      success: true,
      message: 'ورود با موفقیت انجام شد.',
      redirect: await resolveRedirectPath(env)
    }), { status: 200, headers });
  }

  // بازیابی رمز از طریق UUID/مسیر مدیریت (مالکیت مسیر = احراز هویت)
  if (path === 'reset-password' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const key = String(body.uuid || body.key || body.adminPath || '').trim();
    const newPass = String(body.password || '').trim();
    if (newPass.length < 4) {
      return jsonResponse({ success: false, message: 'رمز عبور جدید باید حداقل ۴ کاراکتر باشد.' }, 400);
    }
    const adminPath = await getOrCreateAdminPath(env);
    const cfg = await loadGlobalConfig(env);
    if (!matchesAdminKey(key, adminPath, cfg.d)) {
      return jsonResponse({ success: false, message: 'UUID/مسیر مدیریت نامعتبر است.' }, 403);
    }
    await setAdminPassword(env, newPass);
    const token = await buildAdminSessionToken(env);
    const headers = new Headers({
      'Content-Type': 'application/json; charset=utf-8',
      'Set-Cookie': buildSessionCookie(request, token)
    });
    return new Response(JSON.stringify({
      success: true,
      message: 'رمز عبور با موفقیت بازیابی شد.',
      adminId: adminPath,
      redirect: '/' + (String(cfg.d || '').trim() || adminPath)
    }), { status: 200, headers });
  }

  if (path === 'change-password' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const oldPass = String(body.oldPassword || '').trim();
    const newPass = String(body.newPassword || '').trim();
    if (!newPass || newPass.length < 4) {
      return jsonResponse({ success: false, message: 'رمز عبور جدید باید حداقل ۴ کاراکتر باشد.' }, 400);
    }
    const ok = await changeAdminPassword(env, oldPass, newPass);
    if (!ok) {
      return jsonResponse({ success: false, message: 'رمز عبور فعلی نامعتبر است.' }, 400);
    }
    // نشست فعلی با هش جدید بازسازی می‌شود تا کاربر بلافاصله بیرون نیفتد
    const token = await buildAdminSessionToken(env);
    const headers = new Headers({
      'Content-Type': 'application/json; charset=utf-8',
      'Set-Cookie': buildSessionCookie(request, token)
    });
    return new Response(JSON.stringify({ success: true, message: 'رمز عبور مدیر با موفقیت بروزرسانی شد.' }), { status: 200, headers });
  }

  // چرخش مسیر مدیریت (نیازمند نشست معتبر)
  if (path === 'rotate-path' && request.method === 'POST') {
    const rawCookie = request.headers.get('Cookie') || '';
    const tokenMatch = rawCookie.match(/(?:^|;\s*)mili_auth=([^;]*)/);
    const sessionToken = tokenMatch ? decodeURIComponent(tokenMatch[1]) : '';
    if (!(await verifyAdminSession(env, sessionToken))) {
      return jsonResponse({ success: false, message: 'دسترسی غیرمجاز' }, 403);
    }
    const newPath = await rotateAdminPath(env);
    return jsonResponse({ success: true, message: 'مسیر مدیریت جدید ساخته شد', redirect: '/' + newPath, adminPath: newPath });
  }

  if (path === 'logout' && request.method === 'POST') {
    const headers = new Headers({
      'Content-Type': 'application/json; charset=utf-8',
      'Set-Cookie': 'mili_auth=; Path=/; Max-Age=0'
    });
    return new Response(JSON.stringify({ success: true, message: 'با موفقیت خارج شدید.' }), { status: 200, headers });
  }

  return jsonResponse({ error: 'Endpoint not found' }, 404);
}

// ۷. اسکنر زنده پروکسی‌های کشوری و ساخت سابلینک مولتی‌لوکیشن (/api/scanner/...)
export async function handleScannerApi(request, env) {
  if (request.method === 'OPTIONS') return jsonResponse({ ok: true });
  const url = new URL(request.url);
  const action = url.pathname.replace(/^.*\/api\/scanner\/?/, '');

  // تست اتصال TCP به نودها از سمت ورکر (بررسی دسترس‌پذیری آدرس/پورت نود)
  if (action === 'test-nodes' && request.method === 'POST') {
    try {
      const body = await request.json().catch(() => ({}));
      const nodes = Array.isArray(body.nodes) ? body.nodes.slice(0, 12) : [];
      const results = await Promise.all(nodes.map(async node => {
        const host = normalizeNodeHost(node && (node.host || node.ip));
        const port = parseInt(node && node.port, 10) || 443;
        if (!host || (!isValidIpAddress(host) && !isValidDomain(host))) {
          return { host, port, ok: false, latencyMs: 0, error: 'invalid-host' };
        }
        const probe = await probeTcp(host, port, 2500);
        return { host, port, ok: probe.ok, latencyMs: probe.latencyMs, error: probe.error || '' };
      }));
      const online = results.filter(item => item.ok).length;
      return jsonResponse({
        success: online > 0,
        tested: results.length,
        online,
        results,
        message: `${online} از ${results.length} نود از سمت ورکر پاسخ داد`
      });
    } catch (_e) {
      return jsonResponse({ success: false, message: 'تست نود ناموفق بود' }, 400);
    }
  }

  if (action === 'countries' && request.method === 'GET') {
    const countries = Object.keys(COUNTRY_PROXY_SOURCES).map(code => ({
      code,
      name: COUNTRY_PROXY_SOURCES[code].name,
      sourceCount: COUNTRY_PROXY_SOURCES[code].urls.length
    }));
    return jsonResponse({
      success: true,
      countries,
      globalSources: {
        socks5: GLOBAL_PROXY_SOURCES.socks5.length,
        http: GLOBAL_PROXY_SOURCES.http.length,
        mixed: (GLOBAL_PROXY_SOURCES.mixed || []).length,
        ipv4: IP_RANGE_SOURCES.ipv4.length,
        ipv6: IP_RANGE_SOURCES.ipv6.length
      },
      // آی‌پی‌ها و دامنه‌های پیش‌فرض CFnew برای افزودن مستقیم به yx از داخل اسکنر
      officialIps: OFFICIAL_DIRECT_IPS,
      officialIpv6: OFFICIAL_DIRECT_IPV6,
      directDomains: DIRECT_DOMAINS.map(item => item.domain)
    });
  }

  // رجیستری فیدها: همهٔ آدرس‌هایی که اسکنر از آنها تغذیه می‌شود، به‌صورت JSON
  // (?scope=country|global و ?country=DE و ?kind=socks5|http|mixed برای فیلتر)
  // این همان «سازوکار اتصال» به مخازن بیرونی است؛ هر ابزار بیرونی می‌تواند از
  // همین خروجی فهرست منابع را بخواند و مستقیم همان آدرس‌ها را دریافت کند.
  if (action === 'sources' && request.method === 'GET') {
    const scope = String(url.searchParams.get('scope') || '').toLowerCase();
    const countryFilter = String(url.searchParams.get('country') || '').toUpperCase();
    const kindFilter = String(url.searchParams.get('kind') || '').toLowerCase();
    let feeds = PROXY_FEED_REGISTRY.slice();
    if (scope === 'global' || scope === 'country') feeds = feeds.filter(feed => feed.scope === scope);
    if (countryFilter) feeds = feeds.filter(feed => feed.country === countryFilter);
    if (kindFilter) feeds = feeds.filter(feed => feed.kind === kindFilter);
    return jsonResponse({
      success: true,
      count: feeds.length,
      total: PROXY_FEED_REGISTRY.length,
      kinds: ['socks5', 'http', 'mixed'],
      // روش‌های خواندن هر فید: خطوط host:port، host:port:CC، host:port|CC|City،
      // خطوط بس‌شدهٔ آی‌پی، فیدهای JSON، و پروکسی‌های دارای user:pass@
      supportedFormats: ['host:port', 'scheme://host:port', 'user:pass@host:port', 'host:port:CC', 'host:port|CC|City', 'bare-ip', 'json'],
      feeds
    });
  }

  // اسکن زنده: هر بار لیست‌ها از منابع خوانده می‌شوند (بدون کش) و فقط یک برش چرخشی تست می‌شود
  if (action === 'fetch-and-test' && request.method === 'POST') {
    try {
      const body = await request.json().catch(() => ({}));
      const kind = body.kind === 'ip' ? 'ip' : 'proxy';
      const family = body.family === 'ipv4' || body.family === 'ipv6' ? body.family : 'any';
      const limit = Math.min(Math.max(parseInt(body.limit || '10', 10), 1), 25);
      const requested = String(body.country || 'DE').toUpperCase();
      const multi = requested === 'MULTI' || requested === 'ALL';
      const code = multi ? 'MULTI' : (COUNTRY_PROXY_SOURCES[requested] ? requested : 'DE');
      const countryLabel = multi ? 'چند کشور' : COUNTRY_PROXY_SOURCES[code].name;

      // ---- اسکن آی‌پی ثابت (IPv4 / IPv6) از رنج‌های کلادفلر ----
      if (kind === 'ip') {
        const curatedV4 = OFFICIAL_DIRECT_IPS.map(ip => ({ host: ip, port: 443, family: 'ipv4', kind: 'ip' }));
        const curatedV6 = OFFICIAL_DIRECT_IPV6.map(ip => ({ host: ip, port: 443, family: 'ipv6', kind: 'ip' }));
        // لیست IPv6 واقعیِ منبع چینی خودبه‌روز (bestcfv6) — قبل از ساختن آدرس تصادفی
        const listedV6 = family === 'ipv6'
          ? parseIpCandidateLines(await fetchSourceText(pickRotating(IPV6_CANDIDATE_SOURCES, 1)[0], 4000), 'ipv6').map(i => i.host)
          : [];

        // ورکرهای کلادفلر خروجی IPv6 ندارند، بنابراین تست TCP روی IPv6 از این محیط ممکن نیست.
        // در این حالت آدرس‌های Anycast معتبر از رنج‌های زنده کلادفلر نمونه‌گیری می‌شوند و
        // به‌عنوان پیشنهاد (verified:false) برگردانده می‌شوند تا در yx قابل استفاده باشند.
        const ipv6Control = family === 'ipv4' ? null : await probeTcp(OFFICIAL_DIRECT_IPV6[0], 443, 2200);
        if (family === 'ipv6' && ipv6Control && !ipv6Control.ok) {
          const rangeTexts = await Promise.all(
            pickRotating(IP_RANGE_SOURCES.ipv6, 2).map(src => fetchSourceText(src, 4000))
          );
          const ranges = rangeTexts.flatMap(text => parseRangeLines(text)).filter(r => r && r.family === 'ipv6');
          const seenV6 = new Set();
          const picked = [];
          for (const ip of shuffleList(listedV6)) {
            if (picked.length >= limit) break;
            if (seenV6.has(ip)) continue;
            seenV6.add(ip);
            picked.push(ip);
          }
          for (const item of shuffleList(curatedV6)) {
            if (picked.length >= limit) break;
            if (seenV6.has(item.host)) continue;
            seenV6.add(item.host);
            picked.push(item.host);
          }
          let guard = 0;
          while (picked.length < limit && ranges.length && guard < 120) {
            guard++;
            const range = ranges[Math.floor(Math.random() * ranges.length)];
            const ip = randomIpv6FromRange(range.base, range.bits);
            if (!ip || seenV6.has(ip) || !isValidIpAddress(ip)) continue;
            seenV6.add(ip);
            picked.push(ip);
          }
          const proxies = picked.slice(0, limit).map(ip => ({
            kind: 'ip',
            ip,
            port: 443,
            name: ip,
            country: countryLabel,
            code,
            family: 'ipv6',
            protocol: 'IPv6',
            latencyMs: 0,
            status: 'unverified',
            verified: false
          }));
          return jsonResponse({
            success: proxies.length > 0, kind, family: 'ipv6', country: countryLabel, code,
            count: proxies.length, sourceCount: ranges.length + curatedV6.length + listedV6.length, testedCount: 0,
            verified: false, proxies,
            attempts: [{ ip: OFFICIAL_DIRECT_IPV6[0], control: 'ipv6', ok: false, latencyMs: ipv6Control.latencyMs, error: ipv6Control.error || '' }],
            message: proxies.length
              ? `${proxies.length} آدرس IPv6 کلادفلر از رنج‌های زنده انتخاب شد؛ ورکر خروجی IPv6 ندارد، پس تست TCP ممکن نیست — با کلاینت خودتان امتحان کنید.`
              : 'منبع رنج IPv6 در دسترس نبود؛ دوباره تلاش کنید.'
          });
        }

        const curatedPool = [
          ...(family === 'ipv6' ? [] : curatedV4),
          ...(family === 'ipv4' ? [] : curatedV6)
        ];

        // لیست زنده آی‌پی‌های فرانت‌شده کلادفلر (Z-E-U-S)؛ آدرس‌های تصادفی داخل رنج‌ها
        // از داخل ورکر کلادفلر قابل اتصال نیستند، بنابراین از خود لیست نمونه می‌گیریم.
        // فیدهای همیشه‌به‌روز: آی‌پی‌های تست‌شدهٔ IPDB (BestCF) و پروکسی‌آی‌پی‌های آمادهٔ (BestProxy)
        const ipListSources = family === 'ipv6' ? [] : [...IP_CANDIDATE_SOURCES, ...PROXY_IP_SOURCES];
        const listSource = ipListSources.length ? pickRotating(ipListSources, 1)[0] : null;
        const listText = listSource ? await fetchSourceText(listSource, 5000) : '';
        const listed = listText ? parseIpCandidateLines(listText, family) : [];

        const wanted = Math.min(limit * 3, 30);
        const curatedPick = shuffleList(curatedPool).slice(0, Math.max(3, Math.ceil(wanted / 2)));
        const seenHosts = new Set(curatedPick.map(p => p.host));
        const listedPick = [];
        for (const item of shuffleList(listed)) {
          if (listedPick.length >= wanted - curatedPick.length) break;
          if (seenHosts.has(item.host)) continue;
          seenHosts.add(item.host);
          listedPick.push(item);
        }
        const candidates = [...curatedPick, ...listedPick];

        if (!candidates.length) {
          return jsonResponse({
            success: false, kind, family, country: countryLabel, code,
            count: 0, sourceCount: 0, testedCount: 0, proxies: [],
            message: 'منبع آی‌پی در دسترس نبود؛ دوباره تلاش کنید.'
          });
        }

        const controlV4 = await probeTcp('172.71.218.190', 443, 2500);
        const controlV6 = ipv6Control;
        const probed = await Promise.all(candidates.map(async p => ({ ...p, ...(await probeTcp(p.host, 443, 2500)) })));
        const online = probed.filter(p => p.ok).sort((a, b) => a.latencyMs - b.latencyMs).slice(0, limit);
        const attempts = [
          { ip: '172.71.218.190', control: 'ipv4', ok: controlV4.ok, latencyMs: controlV4.latencyMs, error: controlV4.error || '' },
          ...(controlV6 ? [{ ip: OFFICIAL_DIRECT_IPV6[0], control: 'ipv6', ok: controlV6.ok, latencyMs: controlV6.latencyMs, error: controlV6.error || '' }] : []),
          ...probed.slice(0, 8).map(p => ({ ip: p.host, ok: p.ok, latencyMs: p.latencyMs, error: p.error || '' }))
        ];
        const proxies = online.map(p => ({
          kind: 'ip',
          ip: p.host,
          port: 443,
          name: p.host,
          country: countryLabel,
          code,
          family: p.family,
          protocol: p.family === 'ipv6' ? 'IPv6' : (p.family === 'domain' ? 'Domain' : 'IPv4'),
          latencyMs: p.latencyMs,
          status: 'online'
        }));
        const noV6Egress = family !== 'ipv4' && controlV6 && !controlV6.ok;

        return jsonResponse({
          success: proxies.length > 0, kind, family, country: countryLabel, code,
          count: proxies.length, sourceCount: candidates.length, testedCount: probed.length, proxies, attempts,
          message: proxies.length
            ? `${proxies.length} آی‌پی سالم از ${probed.length} آدرس تست‌شده (${family === 'any' ? 'IPv4 + IPv6' : family.toUpperCase()})`
            : (noV6Egress
              ? 'این محیط خروجی IPv6 ندارد؛ IPv6 فقط به‌عنوان نود ثابت در ساب‌لینک استفاده می‌شود.'
              : `از ${probed.length} آی‌پی هیچ‌کدام پاسخ نداد؛ دوباره تلاش کنید.`)
        });
      }

      // ---- اسکن پروکسی (SOCKS5/HTTP) با منابع کشوری + لیست‌های عمومی ----
      // برای کشور مشخص فقط منابع همان کشور خوانده می‌شود تا نتیجه واقعاً به آن کشور تعلق داشته باشد؛
      // لیست‌های عمومی فقط در حالت «چند کشور» استفاده می‌شوند.
      //
      // هر پروکسی قبل از نمایش، handshake واقعی پروتکل را پاس می‌کند (SOCKS5 CONNECT یا
      // HTTP CONNECT). باز بودن پورت به‌تنهایی معیار نیست: بیشتر پروکسی‌های منقضی پورت
      // باز دارند ولی ترافیک را عبور نمی‌دهند و همین باعث می‌شد نودهای «آنلاین» کار نکنند.
      const countrySources = multi
        ? pickRotating(Object.keys(COUNTRY_PROXY_SOURCES), 3).flatMap(c => pickRotating(COUNTRY_PROXY_SOURCES[c].urls || [], 1))
        : pickRotating(COUNTRY_PROXY_SOURCES[code].urls || [], 5);
      // فیدهای با بازده بالا اولویت دارند؛ در حالت کشوری هم دو فید عمومی
      // با بازده بالا اضافه می‌شود تا استخر تست کوچک نماند.
      const highYield = pickRotating(HIGH_YIELD_PROXY_SOURCES, multi ? 4 : 2);
      const sources = [...new Set([...countrySources, ...highYield])].slice(0, 8);

      const feedResults = await Promise.all(sources.map(async src => {
        const text = await fetchSourceText(src, 4000);
        const kind = getFeedKind(src);
        const hint = kind === 'socks5' ? 'SOCKS5' : kind === 'http' ? 'HTTP' : '';
        return { url: src, reachable: text.length > 0, entries: text ? parseProxyLines(text, hint) : [] };
      }));

      const seen = new Set();
      const candidates = [];
      for (const feed of feedResults) {
        for (const p of feed.entries) {
          if (family !== 'any' && p.family && p.family !== family && p.family !== 'domain') continue;
          const key = p.host + ':' + p.port;
          if (seen.has(key)) continue;
          seen.add(key);
          candidates.push(p);
        }
      }

      // گزارش وضعیت هر فید — برای این‌که پنل بتواند دلیل نتیجه صفر را نشان دهد
      const diagnostics = feedResults.map(feed => ({
        source: feed.url,
        kind: getFeedKind(feed.url),
        reachable: feed.reachable,
        entries: feed.entries.length
      }));
      const deadFeeds = diagnostics.filter(item => !item.reachable || item.entries === 0).length;

      if (!candidates.length) {
        return jsonResponse({
          success: false, kind, family, country: countryLabel, code,
          count: 0, sourceCount: sources.length, testedCount: 0, proxies: [], diagnostics,
          message: `از ${sources.length} منبع هیچ ورودی پروکسی خوانده نشد (${deadFeeds} منبع خالی یا در دسترس نبود). چند لحظه بعد دوباره تلاش کنید.`
        });
      }

      // سقف ۴ سوکت هم‌زمان (runtime کلادفلر حداکثر ۶ اتصال هم‌زمان می‌دهد) و
      // سقف زمانی، تا اسکن هیچ‌وقت با خطای «Too many open connections» یا timeout نکشد.
      const startedAt = Date.now();
      const scanDeadline = startedAt + 24000;
      const pool = shuffleList(candidates).slice(0, Math.min(candidates.length, 45));
      const verifiedProxies = [];
      let testedCount = 0;
      // آمار دلیل ردشدن‌ها — برای این‌که معلوم باشد مشکل «کد» است یا «خشک بودن استخر»
      const failures = {};

      await runLimited(pool, MAX_PARALLEL_SOCKETS, async candidate => {
        if (verifiedProxies.length >= limit || Date.now() > scanDeadline) return;
        testedCount++;
        const result = await verifyProxyEntry(candidate, 3200);
        if (result.ok) {
          verifiedProxies.push({ ...candidate, ...result });
        } else {
          const reason = String(result.error || 'unknown').split('-')[0];
          failures[reason] = (failures[reason] || 0) + 1;
        }
      }, scanDeadline);

      const online = verifiedProxies
        .sort((a, b) => a.latencyMs - b.latencyMs)
        .slice(0, limit);

      const proxies = online.map(p => {
        const scheme = (p.protocol || 'SOCKS5').toLowerCase() === 'https' ? 'http' : (p.protocol || 'SOCKS5').toLowerCase();
        const auth = p.username ? `${p.username}:${p.password || ''}@` : '';
        return {
          kind: 'proxy',
          ip: p.host,
          port: p.port,
          name: `${p.host}:${p.port}`,
          proxy: `${scheme}://${auth}${p.host}:${p.port}`,
          country: countryLabel,
          code: p.countryHint && COUNTRY_PROXY_SOURCES[p.countryHint] ? p.countryHint : code,
          family: p.family || '',
          protocol: p.protocol,
          latencyMs: p.latencyMs,
          verified: true,
          status: 'online'
        };
      });

      return jsonResponse({
        success: proxies.length > 0, kind, family, country: countryLabel, code,
        count: proxies.length, sourceCount: candidates.length, testedCount, proxies, diagnostics,
        failures,
        elapsedMs: Date.now() - startedAt,
        message: proxies.length
          ? `${proxies.length} پروکسی تأییدشده (handshake کامل) از ${testedCount} مورد تست‌شده در ${sources.length} منبع`
          : `از ${testedCount} پروکسی تست‌شده هیچ‌کدام handshake را پاس نکردند${deadFeeds ? ` (${deadFeeds} منبع خالی/۴۰۴)` : ''}؛ دوباره تلاش کنید یا حالت «چند کشور» را انتخاب کنید.`
      });
    } catch (err) {
      return jsonResponse({ success: false, message: 'خطا در اسکنر: ' + (err?.message || err) }, 500);
    }
  }

  // اتصال نتیجه اسکن: آی‌پی‌ها به yx و پروکسی‌ها به s
  if (action === 'apply' && request.method === 'POST') {
    if (request.headers.get('X-Mili-Admin') !== '1') {
      return jsonResponse({ success: false, message: 'دسترسی غیرمجاز' }, 403);
    }
    try {
      const body = await request.json().catch(() => ({}));
      const target = body.target === 's' ? 's' : body.target === 'yx' ? 'yx' : '';
      const items = Array.isArray(body.items) ? body.items : [body];
      const cfg = await loadGlobalConfig(env);

      if (target === 's') {
        const item = items[0] || {};
        const proxyUrl = String(item.proxy || '').trim();
        if (!proxyUrl) return jsonResponse({ success: false, message: 'پروکسی معتبری ارسال نشد' }, 400);
        await saveGlobalConfig(env, { s: proxyUrl });
        return jsonResponse({ success: true, s: proxyUrl, message: 'پروکسی خروجی (s) تنظیم شد' });
      }

      if (target === 'yx') {
        const list = parseYxArray(cfg.yx || '');
        let added = 0;
        for (const item of items) {
          const ip = String(item?.ip || '').trim();
          const port = parseInt(item?.port || 443, 10) || 443;
          if (!ip || (!isValidIpAddress(ip) && !isValidDomain(ip))) continue;
          if (list.some(x => x.ip === ip && x.port === port)) continue;
          list.push({ ip, port, name: String(item?.name || ip) });
          added++;
        }
        if (added > 0) await saveGlobalConfig(env, { yx: serializeYxArray(list) });
        return jsonResponse({
          success: added > 0,
          added,
          total: list.length,
          message: added > 0 ? `${added} آی‌پی به نودهای ترجیحی (yx) اضافه شد` : 'آی‌پی جدیدی برای افزودن نبود'
        });
      }

      return jsonResponse({ success: false, message: 'مقصد نامعتبر است (yx یا s)' }, 400);
    } catch (err) {
      return jsonResponse({ success: false, message: 'خطا در اعمال نتیجه اسکن: ' + (err?.message || err) }, 500);
    }
  }

  return jsonResponse({ error: 'Endpoint not found' }, 404);
}
