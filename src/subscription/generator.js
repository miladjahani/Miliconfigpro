// ============================================================================
// miliconfig v3.1 - تولیدکننده ساب‌لینک چندکاربره با نام‌گذاری number+miliconfig
// و اعمال دقیق تنظیمات هر کاربر + محدودیت تعداد نودها در ساب (subNodeCount)
// ============================================================================

import {
  BRAND_NAME,
  CF_EDGE_DOMAINS,
  CF_HTTPS_PORTS,
  CF_HTTP_PORTS,
  CONFIG_DEFAULTS,
  COUNTRY_PROXY_SOURCES,
  DIRECT_DOMAINS,
  FALLBACK_PROXY_IPS,
  FRAGMENT_PRESETS,
  HARDCODED_INFO_NODES,
  OFFICIAL_DIRECT_IPS,
  OFFICIAL_DIRECT_IPV6,
  OPENVPN_CSV_SOURCES,
  OPENVPN_PROFILE_SOURCES,
  OPENVPN_PUBLIC_PASS,
  OPENVPN_RAW_PROFILE_SOURCES,
  OPENVPN_PUBLIC_USER,
  WARP_DEFAULT_ADDRESS,
  WARP_DEFAULT_HOST,
  WARP_DEFAULT_PORT,
  WARP_ENDPOINT_IPS,
  WARP_ENDPOINT_PORTS,
  WARP_PEER_PUBLIC_KEY,
  WARP_REGISTRATION_URL,
  WARP_CLIENT_VERSION,
  isEnabledValue,
  normalizeAlpn,
  normalizeEffectiveConfig,
  parseNodePorts
} from '../config/defaults.js';
import {
  buildZip,
  createMiliNodeNamer,
  decodeBase64Utf8,
  encodeBase64Utf8,
  finalizeMiliSubscriptionLinks,
  isValidDomain,
  isValidIpAddress,
  md5Hex,
  normalizeNodeHost,
  parseAddressAndPort
} from '../core/utils.js';
import { verifyCountryProxies } from '../core/proxyGeo.js';
import {
  generateClashConfig,
  generateLoonConfig,
  generateQuanxConfig,
  generateResidentialChainConfig,
  generateSingboxConfig,
  generateSurgeConfig
} from './converters.js';

export function getOfficialDirectAddress() {
  const hit = OFFICIAL_DIRECT_IPS[Math.floor(Math.random() * OFFICIAL_DIRECT_IPS.length)];
  return {
    domain: hit,
    region: 'CF',
    regionCode: 'CF',
    port: 443
  };
}

function getNeighborRegions(region) {
  const map = {
    US: ['SG', 'JP', 'KR'],
    SG: ['JP', 'KR', 'US'],
    JP: ['SG', 'KR', 'US'],
    KR: ['JP', 'SG', 'US'],
    DE: ['NL', 'GB', 'SE', 'FI'],
    SE: ['DE', 'NL', 'FI', 'GB'],
    NL: ['DE', 'GB', 'SE', 'FI'],
    FI: ['SE', 'DE', 'NL', 'GB'],
    GB: ['DE', 'NL', 'SE', 'FI']
  };
  return map[region] || [];
}

function getOrderedRegions(region) {
  const neighbors = getNeighborRegions(region);
  const all = ['US', 'SG', 'JP', 'KR', 'DE', 'SE', 'NL', 'FI', 'GB'];
  return [region, ...neighbors, ...all.filter(r => r !== region && !neighbors.includes(r))];
}

export async function selectFallbackProxyAddress(workerRegion = '', enableRegionMatch = true) {
  if (!workerRegion || workerRegion === 'CF') {
    return getOfficialDirectAddress();
  }
  if (FALLBACK_PROXY_IPS.length === 0) {
    return getOfficialDirectAddress();
  }
  if (enableRegionMatch && workerRegion) {
    const ordered = getOrderedRegions(workerRegion);
    for (const r of ordered) {
      const found = FALLBACK_PROXY_IPS.find(item => item.regionCode === r);
      if (found) return found;
    }
  }
  return FALLBACK_PROXY_IPS[0];
}

// ============================================================================
// مقدار پارامتر ECH در لینک‌ها — همان قالب قبلی: «دامنه ECH + آدرس DNS»
// ============================================================================
export function buildEchParamValue(cfg = {}) {
  if (cfg.ech !== 'yes') return '';
  const dnsVal = cfg.customDNS || CONFIG_DEFAULTS.customDNS;
  const echDomain = cfg.customECHDomain || CONFIG_DEFAULTS.customECHDomain;
  return `${echDomain}+${dnsVal}`;
}

// مسیر یکتای هر نوع نود (vless/trojan/xhttp/ss) و هر کشور؛ ورکر به مسیر حساس نیست
// و همین مسیر را در درخواست WebSocket می‌بیند، پس تفکیک مسیرها اتصال را خراب نمی‌کند.
export function buildNodePath(proto, cfg = {}, wkOverride = '', item = null) {
  // الگوی مسیر انتخاب‌شده در پنل (patt) دقیقاً روی نودها اعمال می‌شود
  const pattern = String(cfg.patt || '/?ed=2048').replace(/\{random\}/g, () => Math.random().toString(36).slice(2, 10));
  const qIdx = pattern.indexOf('?');
  const rawPath = qIdx > -1 ? pattern.slice(0, qIdx) : pattern;
  const rawQuery = qIdx > -1 ? pattern.slice(qIdx + 1) : '';
  const pathName = rawPath.startsWith('/') ? rawPath : '/' + rawPath;
  const parts = [];
  if (rawQuery) parts.push(rawQuery);
  if (wkOverride) parts.push(`wk=${encodeURIComponent(wkOverride)}`);
  parts.push(`nt=${encodeURIComponent(proto)}`);
  const cc = String(item?.country || '').trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(cc)) parts.push(`cc=${cc}`);
  if (item?.proxy) parts.push(`s=${encodeProxyForPath(item.proxy)}`);
  return pathName + (parts.length ? '?' + parts.join('&') : '');
}

// پارامتر فرگمنت TLS مطابق فرمت کلاینتی v2rayNG/NekoBox: «طول,فاصله,نوع‌پکت»
export function buildFragmentValue(cfg = {}) {
  // کلید اصلی روشن/خاموش فرگمنت؛ شادوساکس همیشه بدون فرگمنت ساخته می‌شود
  if (cfg.frag === 'no') return '';
  const presetId = String(cfg.fragmentPreset || 'off');
  if (presetId === 'off') return '';
  const preset = FRAGMENT_PRESETS[presetId] || FRAGMENT_PRESETS.mci;
  if (!preset) return '';
  let length = preset.length;
  let interval = preset.interval;
  let packets = preset.packets;
  if (presetId === 'custom') {
    length = cfg.fragmentLength || preset.length;
    interval = cfg.fragmentInterval || preset.interval;
    packets = cfg.fragmentPackets || preset.packets;
  }
  if (!length || !interval) return '';
  return `${length},${interval},${packets || 'tlshello'}`;
}

// انتخاب پورت نود از لیست پنل (ports) — هر نود یک پورت، به‌صورت چرخشی
function chooseNodePort(cfg = {}, item = {}, index = 0) {
  const disableNonTls = cfg.dkby === 'yes' || cfg.ech === 'yes';
  const explicit = Number(item?.port) || 0;
  if (explicit) {
    return { port: explicit, tls: !CF_HTTP_PORTS.includes(explicit) };
  }
  let ports = parseNodePorts(cfg.ports);
  if (disableNonTls) ports = ports.filter(p => !CF_HTTP_PORTS.includes(p));
  if (!ports.length) ports = [443];
  const port = ports[Math.abs(index) % ports.length];
  return { port, tls: !CF_HTTP_PORTS.includes(port) };
}

// چیدمان متناوب آی‌پی‌ها و دامنه‌های پیش‌فرض CFnew: هر ۲ آی‌پی، یک دامنه،
// تا دامنه‌های cfnew حتی با سقف کم نود هم حتماً داخل سابلینک باشند.
function interleaveAddresses(ipNodes = [], domainNodes = []) {
  const out = [];
  const ips = [...ipNodes];
  const domains = [...domainNodes];
  let ipTurn = 0;
  while (ips.length || domains.length) {
    for (let i = 0; i < 2 && ips.length; i++) out.push(ips.shift());
    ipTurn++;
    if (domains.length) out.push(domains.shift());
  }
  return out;
}

// توزیع مساوی پروتکل‌ها در سابلینک (vless / trojan / ss / xhttp به‌صورت چرخشی)
function interleaveProtocols(groups = {}) {
  const order = ['vless', 'trojan', 'ss', 'xhttp'];
  const queues = order.map(key => (Array.isArray(groups[key]) ? [...groups[key]] : []));
  const total = queues.reduce((sum, q) => sum + q.length, 0);
  const out = [];
  let guard = 0;
  while (out.length < total && guard++ < total * 4) {
    let moved = false;
    for (const q of queues) {
      if (q.length) {
        out.push(q.shift());
        moved = true;
      }
    }
    if (!moved) break;
  }
  return out;
}

function isIpv6Literal(host) {
  return String(host || '').includes(':');
}

function isIpv4Literal(host) {
  return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(String(host || ''));
}

// اعمال واقعی سوییچ‌های IPv4/IPv6 روی تمام منابع آی‌پی (ثابت، ترجیحی، کشوری و ...)
export function filterAddressFamily(list, cfg = {}) {
  const allowV4 = cfg.ipv4 !== 'no';
  const allowV6 = cfg.ipv6 !== 'no';
  return (Array.isArray(list) ? list : []).filter(item => {
    if (!item) return false;
    const host = normalizeNodeHost(item.ip || item.domain);
    if (!host) return false;
    if (isIpv6Literal(host)) return allowV6;
    if (isIpv4Literal(host)) return allowV4;
    return true;
  });
}

export function getStaticCfAddresses(cfg = {}) {
  const v4 = cfg.ipv4 === 'no' ? [] : OFFICIAL_DIRECT_IPS.slice();
  const v6 = cfg.ipv6 === 'no' ? [] : OFFICIAL_DIRECT_IPV6.slice();
  return [...v4, ...v6];
}

// ساخت نودهای چندلوکیشن: آدرس = آی‌پی ثابت CF، و پروکسی کشور از طریق ?s= در مسیر ws
const LOCATION_PROXY_SCHEMES = ['socks5://', 'socks://', 'http://', 'https://'];

export function buildLocationSourceList(proxyPool = [], cfg = {}, fallbackHost = '') {
  const usable = (Array.isArray(proxyPool) ? proxyPool : []).filter(item => {
    const p = String(item?.proxy || '').trim();
    return LOCATION_PROXY_SCHEMES.some(s => p.toLowerCase().startsWith(s));
  });
  if (usable.length === 0) return [];

  // گروه‌بندی بر اساس کشور تا در حالت MULTI هر نود از یک کشور متفاوت بیاید
  const byCountry = new Map();
  for (const item of usable) {
    const code = String(item.country || '').trim().toUpperCase();
    if (!byCountry.has(code)) byCountry.set(code, []);
    byCountry.get(code).push(item);
  }
  const countryCodes = [...byCountry.keys()];

  // نودهای زنجیره‌ای همیشه روی آی‌پی ثابت واقعی کلادفلر سوار می‌شوند تا پینگ بگیرند
  const staticIps = getStaticCfAddresses(cfg);
  const addressPool = staticIps.length > 0 ? staticIps : (fallbackHost ? [fallbackHost] : []);
  if (addressPool.length === 0) return [];

  const wanted = Math.max(1, Math.min(parseInt(cfg.locationNodeCount, 10) || 8, usable.length));
  // چرخش پنج‌دقیقه‌ای پروکسی‌ها تا نودها همیشه از استخر تازه انتخاب شوند
  const bucket = Math.floor(Date.now() / (5 * 60 * 1000));

  // با گام‌بندی روی استخر، هم IPv4 و هم IPv6 (اگر فعال باشد) در ساب‌لینک حضور پیدا می‌کنند
  const stride = Math.max(1, Math.floor(addressPool.length / wanted));
  const out = [];
  for (let i = 0; i < wanted; i++) {
    const code = countryCodes[(bucket + i) % countryCodes.length];
    const group = byCountry.get(code) || usable;
    // اگر برای این کشور پروکسی تأییدشده وجود دارد، فقط همان‌ها استفاده می‍شوند تا
    // خروجی واقعاً از کشور انتخابی باشد؛ پروکسی خام فقط وقتی هیچ تأییدشده‌ای نیست.
    const verifiedGroup = group.filter(item => item.unverified !== true);
    const pickFrom = verifiedGroup.length ? verifiedGroup : group;
    const picked = pickFrom[(bucket + i) % pickFrom.length];
    out.push({
      ip: addressPool[(i * stride) % addressPool.length],
      // «?» یعنی پروکسی تأییدشده نبود (کشورش با برچسب نخواند یا هیچ پروکسی سالمی نبود)
      isp: `Loc-${picked.country || 'CF'}${picked.unverified ? '?' : ''}`,
      country: picked.country || '',
      unverified: picked.unverified === true,
      proxy: picked.proxy
    });
  }

  // تضمین حضور حداقل یک نود IPv6 وقتی کاربر IPv6 را فعال کرده است
  const v6Only = OFFICIAL_DIRECT_IPV6;
  if (cfg.ipv6 !== 'no' && v6Only.length > 0 && !out.some(n => isIpv6Literal(n.ip))) {
    out[out.length - 1].ip = v6Only[0];
  }
  return out;
}

export function getXhttpPaddingMeta(uuidStr) {
  const s = String(uuidStr || '');
  return {
    header: s.slice(1, 7) || 'x-mili',
    key: '_' + (s.slice(25, 31) || 'pad001')
  };
}

export function parseCustomPreferredString(yxStr = '') {
  const ipList = [];
  const domainList = [];
  const proxyList = [];
  if (!yxStr || !String(yxStr).trim()) {
    return { ipList, domainList, proxyList };
  }
  const items = String(yxStr)
    .split(',')
    .map(x => x.trim())
    .filter(Boolean);
  for (const item of items) {
    // خطوط پروکسی (socks5://...) آدرس نود نیستند و نباید در لیست آی‌پی ترجیحی بیایند
    if (item.includes('://')) continue;
    let nodeName = '';
    let addrPart = item;
    if (item.includes('#')) {
      const parts = item.split('#');
      addrPart = parts[0].trim();
      nodeName = parts.slice(1).join('#').trim();
    }
    const { address, port } = parseAddressAndPort(addrPart);
    if (!address) continue;
    if (!nodeName) {
      nodeName = `${address}${port ? ':' + port : ''}`;
    }
    // پورت غیر کلادفلر یعنی این خط یک پروکسی خروجی است (مثل socks5 روی 1080/11080) و آدرس نود نیست
    if (port && !CF_HTTPS_PORTS.includes(port) && !CF_HTTP_PORTS.includes(port)) {
      proxyList.push({ proxy: `socks5://${address}:${port}`, name: nodeName });
      continue;
    }
    if (isValidIpAddress(address)) {
      ipList.push({ ip: address, port: port || 443, isp: nodeName, name: nodeName });
    } else if (isValidDomain(address) || address.includes('.')) {
      domainList.push({ domain: address, port: port || 443, name: nodeName });
    }
  }
  return { ipList, domainList, proxyList };
}

export async function fetchUouinPreferredIps(cfg = {}) {
  const lineMap = {
    ctcc: '电信',
    cucc: '联通',
    cmcc: '移动',
    bgp: '多线',
    ipv6: 'IPv6'
  };
  const v4Enabled = cfg.ipv4 !== 'no';
  const v6Enabled = cfg.ipv6 !== 'no';
  const mobileEnabled = cfg.ispMobile !== 'no';
  const unicomEnabled = cfg.ispUnicom !== 'no';
  const telecomEnabled = cfg.ispTelecom !== 'no';

  try {
    const ts = String(Date.now());
    const innerHash = await md5Hex('DdlTxtN0sUOu');
    const keyHash = await md5Hex(innerHash + '70cloudflareapikey' + ts);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3200);
    const resp = await fetch(`https://api.uouin.com/index.php/index/Cloudflare?key=${keyHash}&time=${ts}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: controller.signal
    });
    clearTimeout(timer);
    if (!resp.ok) return [];
    const data = await resp.json();
    const groups = data && data.data;
    if (!groups) return [];
    const results = [];
    for (const groupKey of Object.keys(lineMap)) {
      const isV6 = groupKey === 'ipv6';
      if (isV6 && !v6Enabled) continue;
      if (!isV6 && !v4Enabled) continue;
      const lineName = lineMap[groupKey];
      if (lineName === '移动' && !mobileEnabled) continue;
      if (lineName === '联通' && !unicomEnabled) continue;
      if (lineName === '电信' && !telecomEnabled) continue;
      const groupObj = groups[groupKey];
      const infoList = groupObj && Array.isArray(groupObj.info) ? groupObj.info : [];
      for (const entry of infoList) {
        const ip = normalizeNodeHost(entry && entry.ip);
        if (!ip) continue;
        results.push({ isp: lineName, ip, port: 443, colo: entry?.colo || '' });
      }
    }
    return results;
  } catch (_e) {
    return [];
  }
}

export async function fetchPreferredFromUrls(urlListStr = '', defaultPort = '443', timeout = 3000) {
  if (!urlListStr || !String(urlListStr).trim()) return [];
  const urls = String(urlListStr)
    .split(',')
    .map(u => u.trim())
    .filter(Boolean);
  if (!urls.length) return [];

  // نگاشت «host:port» → آدرس کامل پروکسی (با scheme و رمز) برای استفاده در زنجیره خروجی
  const outMap = new Map();
  await Promise.allSettled(
    urls.map(async url => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);
        const resp = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);
        if (!resp.ok) return;
        const text = await resp.text();
        if (!text || !text.trim()) return;
        const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
        const isCsv = lines.length > 1 && lines[0].includes(',');
        const v6Pattern = /^[^\[\]]*:[^\[\]]*:[^\[\]]/;
        if (!isCsv) {
          for (const line of lines) {
            // پشتیبانی از خطوط scheme://user:pass@host:port (socks5/http) و host:port
            let clean = line;
            let proxyUrl = '';
            const schemeMatch = clean.match(/^([a-z0-9+.-]+):\/\//i);
            if (schemeMatch) {
              const scheme = schemeMatch[1].toLowerCase();
              if (['vless', 'vmess', 'trojan', 'ss', 'ssr'].includes(scheme)) continue;
              if (['socks5', 'socks', 'http', 'https'].includes(scheme)) proxyUrl = clean.trim();
              clean = clean.slice(schemeMatch[0].length);
            }
            if (clean.includes('@')) clean = clean.split('@').pop();
            clean = clean.split('/')[0];
            const hashIdx = clean.indexOf('#');
            const [hostPart, remark] = hashIdx > -1 ? [clean.substring(0, hashIdx), clean.substring(hashIdx)] : [clean, ''];
            let hasPort = false;
            if (hostPart.startsWith('[')) {
              hasPort = /\]:(\d+)$/.test(hostPart);
            } else {
              const colonIdx = hostPart.lastIndexOf(':');
              hasPort = colonIdx > -1 && /^\d+$/.test(hostPart.substring(colonIdx + 1));
            }
            const port = new URL(url).searchParams.get('port') || defaultPort;
            const key = hasPort ? clean : `${hostPart}:${port}${remark}`;
            if (!outMap.has(key) || proxyUrl) outMap.set(key, proxyUrl || key);
          }
        } else {
          const headers = lines[0].split(',').map(h => h.trim());
          const dataRows = lines.slice(1);
          if (headers.includes('IP地址') && headers.includes('端口')) {
            const ipIdx = headers.indexOf('IP地址');
            const portIdx = headers.indexOf('端口');
            const tlsIdx = headers.indexOf('TLS');
            for (const row of dataRows) {
              const cols = row.split(',').map(c => c.trim());
              if (tlsIdx !== -1 && cols[tlsIdx]?.toLowerCase() !== 'true') continue;
              const wrapped = v6Pattern.test(cols[ipIdx]) ? `[${cols[ipIdx]}]` : cols[ipIdx];
              const key = `${wrapped}:${cols[portIdx]}#CF`;
              if (!outMap.has(key)) outMap.set(key, '');
            }
          }
        }
      } catch (_e) {}
    })
  );

  const parsed = [];
  const regex = /^(\[[\da-fA-F:]+\]|[\d.]+|[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*)(?::(\d+))?(?:#(.+))?$/;
  for (const [item, proxyUrl] of outMap) {
    const m = item.match(regex);
    if (m) {
      parsed.push({
        ip: normalizeNodeHost(m[1]),
        port: parseInt(m[2] || '443', 10),
        name: m[3]?.trim() || m[1],
        proxy: proxyUrl && proxyUrl !== item ? proxyUrl : ''
      });
    }
  }
  return parsed;
}

// ============================================================================
// استخر تأییدشدهٔ هر کشور: پروکسی‌ها از فیدها خوانده و از طریق خودشان تست می‌شوند؛
// فقط آن‌هایی که loc خروجی‌شان با کد کشور یکی است نگه داشته می‌شوند.
// نتیجه ۱۰ دقیقه در cache کلادفلر می‌ماند تا هر درخواست ساب‌لینک گران نشود.
// ============================================================================
const COUNTRY_VERIFIED_CACHE_MS = 15 * 60 * 1000;
const COUNTRY_VERIFIED_CANDIDATES = 12;
const COUNTRY_VERIFIED_TIMEOUT_MS = 1800;
const COUNTRY_VERIFIED_DEADLINE_MS = 5000;
const COUNTRY_VERIFIED_CACHE_BASE = 'https://country-verify.miliconfig.internal';

// کشورهای تب چندلوکیشن — همین فهرست در cron هم تازه‌سازی می‌شود
export const MULTI_COUNTRY_CODES = ['DE', 'NL', 'US', 'GB', 'TR', 'AE', 'CA', 'SE'];

function getCountryCache() {
  try {
    return typeof caches !== 'undefined' ? caches.default : null;
  } catch (_e) {
    return null;
  }
}

// تازه‌سازی استخر یک کشور (برای cron / پيش‌گرم کردن D1)
export async function refreshCountryProxyPool(env, code) {
  const cc = String(code || '').trim().toUpperCase();
  const urls = (COUNTRY_PROXY_SOURCES[cc]?.urls || []).join(',');
  if (!env || !cc || !urls) return { code: cc, candidates: 0, verified: 0 };
  const found = await fetchPreferredFromUrls(urls);
  const candidates = [];
  for (const item of found) {
    if (!item.proxy || candidates.includes(item.proxy)) continue;
    candidates.push(item.proxy);
    if (candidates.length >= 16) break;
  }
  const results = await verifyCountryProxies(candidates, {
    need: 8,
    timeoutMs: 2000,
    deadline: Date.now() + 8000
  });
  const verified = results.filter(item => item.country === cc).map(item => ({ proxy: item.proxy, country: cc }));
  if (verified.length) await saveCountryProxyPool(env, cc, verified);
  return { code: cc, candidates: candidates.length, verified: verified.length };
}

async function getVerifiedCountryProxies(code, urls, options = {}) {
  const need = Math.max(1, parseInt(options.need, 10) || 4);
  const verify = options.verify !== false;
  const deadline = Number(options.deadline) || Date.now() + 3500;
  const env = options.env || null;

  // ۱) استخر ذخیره‌شده در D1 (تست واقعی قبلی) — سریع‌ترین مسیر و پایهٔ حالت MULTI
  if (env) {
    const stored = await loadCountryProxyPool(env, code);
    const storedVerified = stored.filter(item => !item.unverified);
    if (storedVerified.length) return storedVerified.slice(0, need);
  }

  const cache = getCountryCache();
  const bucket = Math.floor(Date.now() / COUNTRY_VERIFIED_CACHE_MS);
  const cacheKey = `${COUNTRY_VERIFIED_CACHE_BASE}/${code}/${bucket}/${need}/v${verify ? 1 : 0}`;

  if (cache) {
    try {
      const hit = await cache.match(cacheKey);
      if (hit) {
        const cached = await hit.json();
        if (Array.isArray(cached?.list)) return cached.list;
      }
    } catch (_e) {}
  }

  const found = await fetchPreferredFromUrls(urls);
  const candidates = [];
  for (const item of found) {
    if (!item.proxy || candidates.includes(item.proxy)) continue;
    candidates.push(item.proxy);
    if (candidates.length >= COUNTRY_VERIFIED_CANDIDATES) break;
  }

  let verified = [];
  if (verify && candidates.length) {
    const results = await verifyCountryProxies(candidates, {
      need,
      timeoutMs: COUNTRY_VERIFIED_TIMEOUT_MS,
      deadline
    });
    verified = results.filter(r => r.country === code).map(r => ({ proxy: r.proxy, country: code }));
  }

  // تأییدشده‌ها اول؛ اگر کمتر از نیاز بودند با پروکسی‌های خام (با برچسب هشدار «?»)
  // تکمیل می‌شود تا تب کشور خالی نماند.
  const verifiedSet = new Set(verified.map(v => v.proxy));
  const topUp = candidates
    .filter(proxy => !verifiedSet.has(proxy))
    .slice(0, Math.max(0, need - verified.length))
    .map(proxy => ({ proxy, country: code, unverified: true }));
  const list = [...verified, ...topUp];

  // نتیجهٔ تأییدشده در D1 ذخیره می‌شود تا حالت MULTI و درخواست‌های بعدی
  // بدون تست مجدد و بدون هزینهٔ زمانی از همان استفاده کنند.
  if (env && verified.length) {
    try { await saveCountryProxyPool(env, code, verified); } catch (_e) {}
  }

  // کل لیست (تأییدشده یا پشتیبان) کش می‌شود تا درخواست بعدی سریع باشد
  if (cache) {
    try {
      await cache.put(
        cacheKey,
        new Response(JSON.stringify({ list, checkedAt: Date.now() }), {
          headers: {
            'content-type': 'application/json',
            'cache-control': `max-age=${Math.floor(COUNTRY_VERIFIED_CACHE_MS / 1000)}`
          }
        })
      );
    } catch (_e) {}
  }

  return list;
}

function buildVlessLinks(list, userUuid, workerHost, cfg, namer, wkOverride = '') {
  const disableNonTls = cfg.dkby === 'yes' || cfg.ech === 'yes';
  const defaultHttps = [443];
  const defaultHttp = disableNonTls ? [] : [80];
  const links = [];
  const alpn = normalizeAlpn(cfg.alpn);
  const echValue = buildEchParamValue(cfg);
  const fragmentValue = cfg.fragmentValue || '';

  for (let idx = 0; idx < list.length; idx++) {
    const item = list[idx];
    const rawHost = normalizeNodeHost(item.ip || item.domain);
    if (!rawHost) continue;
    const safeAddr = rawHost.includes(':') ? `[${rawHost}]` : rawHost;
    const { port, tls } = chooseNodePort(cfg, item, idx);

    // مسیر یکتا برای نوع نود + کشور؛ پروکسی خروجی هم داخل همان مسیر به ورکر داده می‌شود
    const itemPath = buildNodePath('vless', cfg, wkOverride, item);

    {
      const nodeName = namer(item);
      if (tls) {
        const params = new URLSearchParams({
          encryption: 'none',
          security: 'tls',
          sni: workerHost,
          fp: cfg.fp || 'chrome',
          type: 'ws',
          host: workerHost,
          path: itemPath
        });
        if (alpn) params.set('alpn', alpn);
        if (echValue) params.set('ech', echValue);
        if (fragmentValue) params.set('fragment', fragmentValue);
        links.push(`vless://${userUuid}@${safeAddr}:${port}?${params.toString()}#${encodeURIComponent(nodeName)}`);
      } else {
        const params = new URLSearchParams({
          encryption: 'none',
          security: 'none',
          type: 'ws',
          host: workerHost,
          path: itemPath
        });
        links.push(`vless://${userUuid}@${safeAddr}:${port}?${params.toString()}#${encodeURIComponent(nodeName)}`);
      }
    }
  }
  return links;
}


export function rotateIpListByTimeBucket(list, rotationSetting = 'off') {
  if (!rotationSetting || rotationSetting === 'off' || !Array.isArray(list) || list.length <= 1) {
    return list;
  }
  let intervalMs = 0;
  if (rotationSetting === '5m') intervalMs = 5 * 60 * 1000;
  else if (rotationSetting === '15m') intervalMs = 15 * 60 * 1000;
  else if (rotationSetting === '30m') intervalMs = 30 * 60 * 1000;
  else if (rotationSetting === '1h') intervalMs = 60 * 60 * 1000;
  else if (rotationSetting === '6h') intervalMs = 6 * 3600 * 1000;
  else if (rotationSetting === '24h') intervalMs = 24 * 3600 * 1000;
  if (!intervalMs) return list;

  const bucket = Math.floor(Date.now() / intervalMs);
  const shift = bucket % list.length;
  if (shift === 0) return list;
  return [...list.slice(shift), ...list.slice(0, shift)];
}

export function buildShadowsocksLinks(list, userUuid, workerHost, cfg, namer) {
  const links = [];
  const sspass = (cfg.sspass && String(cfg.sspass).trim()) || userUuid;
  // این ورکر هدر Shadowsocks را به‌صورت متنی می‌خواند (parseShadowsocksHeader)، بنابراین cipher باید none باشد
  const cipher = 'none';
  const userinfo = encodeSip002UserInfo(`${cipher}:${sspass}`);

  for (let idx = 0; idx < list.length; idx++) {
    const item = list[idx];
    const rawHost = normalizeNodeHost(item.ip || item.domain);
    if (!rawHost) continue;
    const safeAddr = rawHost.includes(':') ? `[${rawHost}]` : rawHost;
    const { port } = chooseNodePort(cfg, item, idx);
    const nodeName = namer(item);
    const itemPath = buildNodePath('ss', cfg, '', item);
    const pluginOpts = `v2ray-plugin;mode=websocket;host=${workerHost};path=${itemPath};tls`;

    // دو قالب استاندارد شادوساکس برای سازگاری با کلاینت‌های مختلف:
    // ۱) SIP002 (userinfo جدا)  ۲) قالب قدیمی base64 کامل (method:pass@host:port)
    if (idx % 2 === 0) {
      links.push(
        `ss://${userinfo}@${safeAddr}:${port}/?plugin=${encodeURIComponent(pluginOpts)}#${encodeURIComponent(nodeName)}`
      );
    } else {
      const legacy = encodeBase64Utf8(`${cipher}:${sspass}@${safeAddr}:${port}`);
      links.push(
        `ss://${legacy}?plugin=${encodeURIComponent(pluginOpts)}#${encodeURIComponent(nodeName)}`
      );
    }
  }
  return links;
}

// آدرس پروکسی داخل مسیر ws قرار می‌گیرد؛ باید فقط یک‌بار دیکد شود تا ورکر آن را درست بخواند
function encodeProxyForPath(proxy) {
  return encodeURIComponent(String(proxy || ''))
    .replace(/%3A/gi, ':')
    .replace(/%2F/gi, '/')
    .replace(/%40/gi, '@');
}

function encodeSip002UserInfo(text) {
  return btoa(String(text || ''))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function buildTrojanLinks(list, userUuid, workerHost, cfg, namer, wkOverride = '') {
  const disableNonTls = cfg.dkby === 'yes' || cfg.ech === 'yes';
  const defaultHttps = [443];
  const defaultHttp = disableNonTls ? [] : [80];
  const links = [];
  const password = (cfg.tp && String(cfg.tp).trim()) || userUuid;
  const alpn = normalizeAlpn(cfg.alpn);
  const echValue = buildEchParamValue(cfg);
  const fragmentValue = cfg.fragmentValue || '';

  for (let idx = 0; idx < list.length; idx++) {
    const item = list[idx];
    const rawHost = normalizeNodeHost(item.ip || item.domain);
    if (!rawHost) continue;
    const safeAddr = rawHost.includes(':') ? `[${rawHost}]` : rawHost;
    const { port, tls } = chooseNodePort(cfg, item, idx);

    {
      const nodeName = namer(item);
      const itemPath = buildNodePath('trojan', cfg, wkOverride, item);
      if (tls) {
        const params = new URLSearchParams({
          security: 'tls',
          sni: workerHost,
          fp: cfg.fp || 'chrome',
          type: 'ws',
          host: workerHost,
          path: itemPath
        });
        if (alpn) params.set('alpn', alpn);
        if (echValue) params.set('ech', echValue);
        if (fragmentValue) params.set('fragment', fragmentValue);
        links.push(`trojan://${encodeURIComponent(password)}@${safeAddr}:${port}?${params.toString()}#${encodeURIComponent(nodeName)}`);
      } else {
        const params = new URLSearchParams({
          security: 'none',
          type: 'ws',
          host: workerHost,
          path: itemPath
        });
        links.push(`trojan://${encodeURIComponent(password)}@${safeAddr}:${port}?${params.toString()}#${encodeURIComponent(nodeName)}`);
      }
    }
  }
  return links;
}

function buildXhttpLinks(list, userUuid, workerHost, cfg, namer) {
  const links = [];
  const shortPath = String(userUuid || '').substring(0, 8);
  const alpn = normalizeAlpn(cfg.alpn);
  const echValue = buildEchParamValue(cfg);
  const fragmentValue = cfg.fragmentValue || '';
  const { header: xPadHeader, key: xPadKey } = getXhttpPaddingMeta(userUuid);

  for (let idx = 0; idx < list.length; idx++) {
    const item = list[idx];
    const rawHost = normalizeNodeHost(item.ip || item.domain);
    if (!rawHost) continue;
    const safeAddr = rawHost.includes(':') ? `[${rawHost}]` : rawHost;
    const { port } = chooseNodePort(cfg, item, idx);
    const nodeName = namer(item);
    // مسیر یکتای xHTTP + کشور + پروکسی خروجی
    let xhttpPath = `/${shortPath}?nt=xhttp`;
    const xhttpCountry = String(item.country || '').trim().toUpperCase();
    if (/^[A-Z]{2}$/.test(xhttpCountry)) xhttpPath += `&cc=${xhttpCountry}`;
    if (item.proxy) xhttpPath += `&s=${encodeProxyForPath(item.proxy)}`;
    const params = new URLSearchParams({
      encryption: 'none',
      security: 'tls',
      sni: workerHost,
      fp: cfg.fp || 'chrome',
      type: 'xhttp',
      host: workerHost,
      path: xhttpPath,
      mode: 'stream-one'
    });
    params.set(
      'extra',
      JSON.stringify({
        xPaddingObfsMode: true,
        xPaddingMethod: 'tokenish',
        xPaddingPlacement: 'queryInHeader',
        xPaddingHeader: xPadHeader,
        xPaddingKey: xPadKey
      })
    );
    if (alpn) params.set('alpn', alpn);
    if (echValue) params.set('ech', echValue);
    if (fragmentValue) params.set('fragment', fragmentValue);
    links.push(`vless://${userUuid}@${safeAddr}:${port}?${params.toString()}#${encodeURIComponent(nodeName)}`);
  }
  return links;
}

// ============================================================================
// نودهای «دامنهٔ پنل» — آدرس و SNI دقیقاً دامنهٔ همین ورکر/پیجز (بدون https://)
// ============================================================================
// انتخاب چرخشی از استخر دامنه‌های تأییدشدهٔ کلادفلر؛ هر ۱۵ دقیقه یک پنجرهٔ
// شروع تازه می‌گیرد تا سابلینک ثابت نماند (stride ۱۳ تا پراکندگی داشته باشد).
export function pickEdgeDomains(count) {
  const pool = CF_EDGE_DOMAINS;
  const wanted = Math.max(1, parseInt(count, 10) || 1);
  if (!pool.length) return [];
  const start = Math.floor(Date.now() / (15 * 60 * 1000)) % pool.length;
  const out = [];
  const seen = new Set();
  for (let step = 0; out.length < Math.min(wanted, pool.length) && step < pool.length * 2; step++) {
    const domain = pool[(start + step * 13) % pool.length];
    if (!domain || seen.has(domain)) continue;
    seen.add(domain);
    out.push(domain);
  }
  return out;
}

export function buildPanelDomainNodes(workerHost, cfg = {}) {
  const host = normalizeNodeHost(workerHost);
  if (!host) return [];
  const count = Math.max(1, Math.min(parseInt(cfg.pdCount, 10) || 2, 20));
  return Array.from({ length: count }, () => ({ ip: host, port: 443, isp: 'Panel' }));
}

// ============================================================================
// WARP / WARP PRO / WARP چندلوکیشن — تولید کانفیگ واقعی WireGuard
// خروجی سازگار با v2rayN / Hiddify / NekoBox (قالب wireguard://) و Mihomo/sing-box
// ============================================================================

const X25519_P = (1n << 255n) - 19n;
const X25519_A24 = 121665n;

function bytesToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(b64) {
  let clean = String(b64 || '').trim().replace(/-/g, '+').replace(/_/g, '/').replace(/\s+/g, '');
  while (clean.length % 4 !== 0) clean += '=';
  try {
    const bin = atob(clean);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch (_e) {
    return new Uint8Array(0);
  }
}

// بستن اسکالر کلید خصوصی طبق RFC 7748 (همان کلمپی که WireGuard انجام می‌دهد)
function clampScalar(raw) {
  const key = Uint8Array.from(raw);
  key[0] &= 248;
  key[31] &= 127;
  key[31] |= 64;
  return key;
}

// ضرب اسکالر منحنی Curve25519 روی نقطه پایه (X25519) — کلید عمومی از کلید خصوصی
function x25519PublicKey(privateKeyBytes) {
  let k = 0n;
  for (let i = 31; i >= 0; i--) k = (k << 8n) | BigInt(privateKeyBytes[i]);
  const inv = a => {
    let result = 1n;
    let base = a % X25519_P;
    let exp = X25519_P - 2n;
    while (exp > 0n) {
      if (exp & 1n) result = (result * base) % X25519_P;
      base = (base * base) % X25519_P;
      exp >>= 1n;
    }
    return result;
  };
  const x1 = 9n;
  let x2 = 1n;
  let z2 = 0n;
  let x3 = 9n;
  let z3 = 1n;
  let swap = 0n;
  for (let t = 254; t >= 0; t--) {
    const bit = (k >> BigInt(t)) & 1n;
    swap ^= bit;
    if (swap === 1n) {
      [x2, x3] = [x3, x2];
      [z2, z3] = [z3, z2];
    }
    swap = bit;
    const a = (x2 + z2) % X25519_P;
    const aa = (a * a) % X25519_P;
    const b = (x2 - z2 + X25519_P) % X25519_P;
    const bb = (b * b) % X25519_P;
    const e = (aa - bb + X25519_P) % X25519_P;
    const c = (x3 + z3) % X25519_P;
    const d = (x3 - z3 + X25519_P) % X25519_P;
    const da = (d * a) % X25519_P;
    const cb = (c * b) % X25519_P;
    const daCb = (da + cb) % X25519_P;
    const daCbNeg = (da - cb + X25519_P) % X25519_P;
    x3 = (daCb * daCb) % X25519_P;
    z3 = (x1 * ((daCbNeg * daCbNeg) % X25519_P)) % X25519_P;
    x2 = (aa * bb) % X25519_P;
    z2 = (e * ((aa + X25519_A24 * e) % X25519_P)) % X25519_P;
  }
  if (swap === 1n) {
    [x2, x3] = [x3, x2];
    [z2, z3] = [z3, z2];
  }
  const value = (x2 * inv(z2)) % X25519_P;
  const out = new Uint8Array(32);
  let rest = value;
  for (let i = 0; i < 32; i++) {
    out[i] = Number(rest & 255n);
    rest >>= 8n;
  }
  return out;
}

export function generateWireGuardIdentity() {
  const raw = new Uint8Array(32);
  crypto.getRandomValues(raw);
  const privateKeyBytes = clampScalar(raw);
  return {
    privateKey: bytesToBase64(privateKeyBytes),
    publicKey: bytesToBase64(x25519PublicKey(privateKeyBytes))
  };
}

// کش ثبت‌نام WARP در حافظهٔ ایزوله؛ از ثبت‌نام مجدد در هر درخواست ساب‌لینک جلوگیری می‌کند
let warpRegCache = { key: '', at: 0, data: null };
const WARP_REG_CACHE_TTL = 6 * 60 * 60 * 1000;

async function applyWarpLicense(deviceId, license) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const resp = await fetch(`${WARP_REGISTRATION_URL}/${deviceId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'CF-Client-Version': WARP_CLIENT_VERSION,
        'User-Agent': 'okhttp/3.12.1'
      },
      body: JSON.stringify({ license, warp_enabled: true }),
      signal: controller.signal
    });
    clearTimeout(timer);
    if (!resp.ok) return null;
    return await resp.json();
  } catch (_e) {
    return null;
  }
}

// ثبت‌نام دستگاه رایگان WARP برای دریافت reserved/آدرس تونل/کلید همتا (و ارتقای لایسنس در حالت PRO)
export async function fetchWarpRegistration(cfg = {}, force = false) {
  const license = String(cfg.warpLicense || '').trim();
  const cacheKey = license ? `lic:${license}` : 'free';
  if (!force && warpRegCache.data && warpRegCache.key === cacheKey && Date.now() - warpRegCache.at < WARP_REG_CACHE_TTL) {
    return warpRegCache.data;
  }
  try {
    const identity = generateWireGuardIdentity();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    const resp = await fetch(WARP_REGISTRATION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Client-Version': WARP_CLIENT_VERSION,
        'User-Agent': 'okhttp/3.12.1'
      },
      body: JSON.stringify({
        key: identity.publicKey,
        install_id: '',
        fcm_token: '',
        tos: new Date().toISOString(),
        model: 'PC',
        serial_number: '',
        locale: 'en_US'
      }),
      signal: controller.signal
    });
    clearTimeout(timer);
    if (!resp.ok) return null;
    let device = await resp.json();
    if (license && device?.id) {
      const upgraded = await applyWarpLicense(device.id, license);
      if (upgraded && upgraded.config) device = upgraded;
    }
    const peer = device?.config?.peers?.[0] || {};
    const endpointHostRaw = String(peer?.endpoint?.host || `${WARP_DEFAULT_HOST}:${WARP_DEFAULT_PORT}`);
    const [endpointHost, endpointPortRaw] = endpointHostRaw.split(':');
    const clientIdBytes = base64ToBytes(device?.config?.client_id || '');
    const data = {
      privateKey: identity.privateKey,
      publicKey: peer.public_key || WARP_PEER_PUBLIC_KEY,
      reserved: clientIdBytes.length >= 3 ? [...clientIdBytes.slice(0, 3)] : [0, 0, 0],
      address4: device?.config?.interface?.addresses?.v4 || WARP_DEFAULT_ADDRESS,
      address6: device?.config?.interface?.addresses?.v6 || '',
      server: endpointHost || WARP_DEFAULT_HOST,
      port: parseInt(endpointPortRaw, 10) || WARP_DEFAULT_PORT,
      license: device?.account?.license || '',
      registered: true
    };
    warpRegCache = { key: cacheKey, at: Date.now(), data };
    return data;
  } catch (_e) {
    return null;
  }
}

// پیکربندی پشتیبان وقتی سرویس ثبت‌نام در دسترس نیست (کلیدهای شناخته‌شدهٔ WARP)
export function buildFallbackWarpConfig() {
  const identity = generateWireGuardIdentity();
  return {
    privateKey: identity.privateKey,
    publicKey: WARP_PEER_PUBLIC_KEY,
    reserved: [0, 0, 0],
    address4: WARP_DEFAULT_ADDRESS,
    address6: '',
    server: WARP_DEFAULT_HOST,
    port: WARP_DEFAULT_PORT,
    license: '',
    registered: false
  };
}

// لیست نقاط پایانی: مقدار دستی پنل (ip:port#برچسب) یا رنج‌های رسمی WARP
function parseWarpEndpointList(raw, count) {
  const manual = String(raw || '')
    .split(',')
    .map(x => x.trim())
    .filter(Boolean);
  if (manual.length) {
    return manual.map(item => {
      const [addrPart, labelPart] = item.split('#');
      const clean = String(addrPart || '').trim();
      const bracketed = clean.match(/^\[([^\]]+)\](?::(\d+))?$/);
      const plain = clean.match(/^([^:]+)(?::(\d+))?$/);
      const host = bracketed ? bracketed[1] : (plain ? plain[1] : clean);
      const port = parseInt((bracketed ? bracketed[2] : plain?.[2]) || String(WARP_DEFAULT_PORT), 10);
      return { host, port, label: String(labelPart || '').trim() };
    }).filter(x => x.host);
  }
  const wanted = Math.max(1, Math.min(parseInt(count, 10) || WARP_ML_CONF_COUNT, 30));
  const bucket = Math.floor(Date.now() / (10 * 60 * 1000));
  const v4Hosts = WARP_ENDPOINT_IPS.filter(host => !String(host).includes(':'));
  const v6Hosts = WARP_ENDPOINT_IPS.filter(host => String(host).includes(':'));
  const out = [];
  for (let i = 0; i < wanted; i++) {
    // ترکیب دو طرفه: هر از گاهی اندپوینت IPv6 هم می‌آید تا کاربر نسخهٔ دوم را هم داشته باشد
    const useV6 = v6Hosts.length > 0 && wanted >= 4 && i % 3 === 2;
    const pool = useV6 ? v6Hosts : v4Hosts;
    const host = useV6
      ? pool[(bucket + i) % pool.length]
      : pool[(bucket + i) % pool.length];
    const port = WARP_ENDPOINT_PORTS[(bucket + i) % WARP_ENDPOINT_PORTS.length];
    out.push({ host, port, label: useV6 ? 'IPv6' : '' });
  }
  return out;
}

// ============================================================================
// AmneziaWG — همان WireGuard با پارامترهای مبهم‌سازی (Jc/Jmin/Jmax/S1/S2/H1..H4)
// مقادیر پایدار بر اساس سرور و پورت ساخته می‌شوند تا با هر بار تازه‌سازی ساب‌لینک
// عوض نشوند؛ بازه‌ها مطابق نمونه‌های رسمی AmneziaWG انتخاب شده‌اند.
// ============================================================================
function awgHash(text) {
  let h = 2166136261 >>> 0;
  const str = String(text || '');
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619) >>> 0;
  return h >>> 0;
}

export function buildAmneziaWgParams(config = {}) {
  const seed = `${config.seed || ''}:${config.server || WARP_DEFAULT_HOST}:${config.port || WARP_DEFAULT_PORT}:${config.publicKey || WARP_PEER_PUBLIC_KEY}`;
  let h = awgHash(seed) || 1;
  const next = (min, max) => {
    h = (Math.imul(h ^ (h >>> 15), 2246822507) + 0x9e3779b9) >>> 0;
    return min + (h % (max - min + 1));
  };
  const jmin = next(40, 70);
  const jmax = jmin + next(950, 1150);
  // سرورهای WARP وایرگارد استاندارد هستند: هدر و پدینگ دستکاری‌شده را رد می‌کنند.
  // پس برای WARP فقط بسته‌های Junk (Jc) فعال می‌ماند و S/H صفر می‌شود تا هندشیک
  // واقعاً برقرار شود؛ حالت کامل مبهم‌سازی فقط با obfuscateHandshake فعال می‌شود.
  const fullObfuscation = config.obfuscateHandshake === true;
  const h1 = fullObfuscation ? next(100000, 800000) : 0;
  return {
    jc: next(3, 8),
    jmin,
    jmax,
    s1: fullObfuscation ? next(20, 60) : 0,
    s2: fullObfuscation ? next(30, 90) : 0,
    h1,
    h2: fullObfuscation ? h1 + next(1, 4000) : 0,
    h3: fullObfuscation ? h1 + next(4001, 9000) : 0,
    h4: fullObfuscation ? h1 + next(9001, 16000) : 0
  };
}

// قالب استاندارد wireguard:// (سازگار با v2rayN/NekoBox/Hiddify) + پارامترهای AmneziaWG
export function buildWireguardLink(config = {}, name = 'WARP') {
  const host = String(config.server || WARP_DEFAULT_HOST);
  const endpoint = host.includes(':') ? `[${host}]` : host;
  const awg = config.awg === false ? null : buildAmneziaWgParams(config);
  const params = new URLSearchParams();
  params.set('publickey', config.publicKey || WARP_PEER_PUBLIC_KEY);
  params.set('reserved', (Array.isArray(config.reserved) ? config.reserved : [0, 0, 0]).join(','));
  const address = String(config.address4 || WARP_DEFAULT_ADDRESS);
  params.set('address', `${address}/32`);
  params.set('mtu', String(parseInt(config.mtu, 10) || 1280));
  params.set('dns', String(config.dns || '1.1.1.1, 1.0.0.1'));
  if (config.address6) params.set('address6', String(config.address6));
  if (awg) {
    params.set('awg', '1');
    params.set('jc', String(awg.jc));
    params.set('jmin', String(awg.jmin));
    params.set('jmax', String(awg.jmax));
    // مقادیر صفر در لینک نوشته نمی‌شوند (کلاینت آن‌ها را پیش‌فرض وایرگارد می‌گیرد)
    for (const key of ['s1', 's2', 'h1', 'h2', 'h3', 'h4']) {
      if (awg[key] > 0) params.set(key, String(awg[key]));
    }
  }
  const userInfo = encodeURIComponent(String(config.privateKey || ''));
  return `wireguard://${userInfo}@${endpoint}:${config.port || WARP_DEFAULT_PORT}?${params.toString()}#${encodeURIComponent(name)}`;
}

// فایل کانفیگ .conf قابل ایمپورت در AmneziaWG / WireGuard
// (کلیدهای Reserved عمداً به‌صورت کامنت می‌آیند تا پارسر کلاینت خطا ندهد)
export function buildWireGuardConf(config = {}, name = 'WARP') {
  const awg = buildAmneziaWgParams(config);
  const endpointHost = String(config.server || WARP_DEFAULT_HOST);
  const endpoint = endpointHost.includes(':') ? `[${endpointHost}]` : endpointHost;
  const reserved = (Array.isArray(config.reserved) ? config.reserved : [0, 0, 0]).join(', ');
  const mtu = parseInt(config.mtu, 10) || 1280;
  const dns = String(config.dns || '1.1.1.1, 1.0.0.1');
  const family = String(config.server || '').includes(':') ? 'IPv6' : 'IPv4';
  const lines = [
    `# ${name} — ${BRAND_NAME}`,
    `# AmneziaWG profile — junk packets only (Jc/Jmin/Jmax) keep WARP handshake intact`,
    `# endpoint family: ${family} | MTU ${mtu}`,
    `# Reserved (WARP client id): ${reserved}`,
    '[Interface]',
    `PrivateKey = ${config.privateKey || ''}`,
    `Address = ${config.address4 || WARP_DEFAULT_ADDRESS}/32`
  ];
  if (config.address6) lines.push(`Address = ${config.address6}`);
  lines.push(`DNS = ${dns}`, `MTU = ${mtu}`);
  lines.push(
    `Jc = ${awg.jc}`,
    `Jmin = ${awg.jmin}`,
    `Jmax = ${awg.jmax}`
  );
  // پارامترهای پدینگ/هدر فقط در حالت مبهم‌سازی کامل نوشته می‌شوند؛ صفر برای
  // WARP لازم است و گرنه هندشیک وایرگارد استاندارد رد می‌شود.
  for (const [key, value] of [['S1', awg.s1], ['S2', awg.s2], ['H1', awg.h1], ['H2', awg.h2], ['H3', awg.h3], ['H4', awg.h4]]) {
    if (value > 0) lines.push(`${key} = ${value}`);
  }
  lines.push(
    '[Peer]',
    `PublicKey = ${config.publicKey || WARP_PEER_PUBLIC_KEY}`,
    'AllowedIPs = 0.0.0.0/0, ::/0',
    'PersistentKeepalive = 25',
    `Endpoint = ${endpoint}:${config.port || WARP_DEFAULT_PORT}`
  );
  // لایسنس حساب هرگز داخل فایل کاربر نوشته نمی‌شود (نشت کلید پولی)
  return lines.join('\n') + '\n';
}

// بستهٔ کانفیگ‌های آمادهٔ WARP برای دانلود (zip) — بدون نیاز به هیچ تنظیمی در پنل:
// WARP، WARP PRO، ماتریس کامل اندپوینت‌های IPv4/IPv6 در چند پورت و چند پروفایل
// مبهم‌سازی. پارامترها بر اساس شناسهٔ کاربر ساخته می‌شوند تا هر کاربر بستهٔ
// اختصاصی خودش را بگیرد (امضای شبکه‌ای یکسان برای همهٔ کاربران خطرناک است).
const WARP_ML_CONF_COUNT = 8;

// پروفایل‌های آماده: MTU و DNS متفاوت → رفتار متفاوت در DPI اپراتورها
const WARP_PROFILE_PRESETS = {
  balanced: { mtu: 1280, dns: '1.1.1.1, 1.0.0.1' },
  aggressive: { mtu: 1180, dns: '1.1.1.1' },
  lite: { mtu: 1380, dns: '1.0.0.1, 1.1.1.1' },
  mobile: { mtu: 1240, dns: '1.1.1.1, 1.0.0.1' }
};

function warpEndpointTag(host) {
  return String(host).replace(/:/g, '-').replace(/-{2,}/g, '-').replace(/^-|-$/g, '');
}

export async function buildWarpConfBundle(cfg = {}, options = {}) {
  const registered = await fetchWarpRegistration(cfg);
  const base = registered || buildFallbackWarpConfig();
  const seed = String(options.seed || cfg.wk || BRAND_NAME);
  const v4Hosts = WARP_ENDPOINT_IPS.filter(host => !String(host).includes(':'));
  const v6Hosts = WARP_ENDPOINT_IPS.filter(host => String(host).includes(':'));
  const shift = awgHash(seed) % Math.max(1, v4Hosts.length);
  const v4Rotated = [...v4Hosts.slice(shift), ...v4Hosts.slice(0, shift)];
  const ports = WARP_ENDPOINT_PORTS;

  const entries = [];
  const add = (host, port, preset, kind) => entries.push({ host, port, preset, kind });
  // ۱) پروفایل اصلی روی اندپوینتی که ثبت‌نام برگرداند
  add(base.server || WARP_DEFAULT_HOST, base.port || WARP_DEFAULT_PORT, 'balanced', 'primary');
  add(base.server || WARP_DEFAULT_HOST, WARP_DEFAULT_PORT, 'aggressive', 'primary');
  // ۲) ماتریس IPv4: چهار آی‌پی × چهار پورت
  v4Rotated.slice(0, 4).forEach((host, idx) => {
    ports.forEach((port, pIdx) => {
      add(host, port, (idx + pIdx) % 2 === 0 ? 'balanced' : 'lite', 'v4');
    });
  });
  // ۳) اندپوینت‌های IPv6 — تونل دوطرفه (ترافیک v4/v6 از زیرساخت v6 عبور می‌کند)
  v6Hosts.forEach((host, idx) => {
    [2408, 500].forEach((port, pIdx) => {
      add(host, port, (idx + pIdx) % 2 === 0 ? 'mobile' : 'balanced', 'v6');
    });
  });
  // ۴) اندپوینت دامنه‌ای (dual-stack) برای شبکه‌هایی که IP خام را می‌بندند
  [2408, 1701].forEach((port, idx) => add(WARP_DEFAULT_HOST, port, idx === 0 ? 'balanced' : 'aggressive', 'dns'));

  const files = [];
  const used = new Set();
  const pushFile = (fileName, label, entry, presetId) => {
    const preset = WARP_PROFILE_PRESETS[presetId] || WARP_PROFILE_PRESETS.balanced;
    let name = fileName;
    let n = 2;
    while (used.has(name)) name = fileName.replace(/\.conf$/, `-${n++}.conf`);
    used.add(name);
    files.push({
      name,
      data: buildWireGuardConf(
        { ...base, server: entry.host, port: entry.port, mtu: preset.mtu, dns: preset.dns, seed: `${seed}:${name}` },
        label
      )
    });
  };

  pushFile('01-WARP.conf', 'WARP', entries[0], 'balanced');
  pushFile('02-WARP-PRO.conf', 'WARP PRO', entries[1], 'aggressive');
  entries.slice(2).forEach(entry => {
    const tag = `${entry.kind}-${warpEndpointTag(entry.host)}-${entry.port}`;
    pushFile(
      `WARP-${tag}-${entry.preset}.conf`,
      `WARP ${entry.kind.toUpperCase()} ${entry.host}:${entry.port} ${entry.preset}`,
      entry,
      entry.preset
    );
  });
  // پنجرهٔ امتحان پروفایل‌ها روی همان اندپوینت اصلی (برای تست MTU/DNS در اپراتور)
  for (const presetId of Object.keys(WARP_PROFILE_PRESETS)) {
    pushFile(`WARP-profile-${presetId}.conf`, `WARP ${presetId}`, entries[0], presetId);
  }

  const links = entries.map(entry => {
    const preset = WARP_PROFILE_PRESETS[entry.preset] || WARP_PROFILE_PRESETS.balanced;
    return buildWireguardLink(
      { ...base, server: entry.host, port: entry.port, mtu: preset.mtu, dns: preset.dns, seed: `${seed}:link:${entry.host}:${entry.port}` },
      `WARP ${entry.kind.toUpperCase()} ${entry.host}:${entry.port}`
    );
  });
  files.push({ name: 'links.txt', data: links.join('\n') + '\n' });

  const endpointList = [
    `# ${BRAND_NAME} — WARP endpoint matrix`,
    `# IPv4: ${v4Hosts.length} hosts x ${ports.length} ports`,
    `# IPv6: ${v6Hosts.length} hosts x 2 ports`,
    '',
    ...entries.map(entry => `${entry.kind}\t${entry.host}\t${entry.port}\t${entry.preset}`)
  ].join('\n');
  files.push({ name: 'endpoints.txt', data: endpointList + '\n' });

  files.push({
    name: 'README.txt',
    data: [
      `${BRAND_NAME} — WARP / WARP PRO / multi-location (AmneziaWG)`,
      '',
      `files: ${files.length + 1} — IPv4 + IPv6 endpoints, multiple UDP ports, 4 tuning profiles`,
      '',
      'Import any .conf into AmneziaWG (Windows/Android/iOS/macOS) or WireGuard.',
      'links.txt = same profiles as wireguard:// links (NekoBox/Hiddify/v2rayN).',
      'Jc/Jmin/Jmax send junk packets before the handshake; S/H stay 0 because',
      'Cloudflare WARP is a plain WireGuard peer and rejects modified headers.',
      'If a profile does not connect, try another port (500/1701/4500) or the IPv6 file.',
      '',
      `endpoint: ${base.server}:${base.port}`,
      `address:  ${base.address4}/32${base.address6 ? ' + ' + base.address6 : ''}`,
      `profile:  ${seed.slice(0, 8)}`
    ].join('\n')
  });
  return { config: base, files };
}

// خانوادهٔ WARP: یک نود WARP، یک نود WARP PRO (با لایسنس) و N نود چندلوکیشن
export async function buildWarpFamilyLinks(cfg = {}, options = {}) {
  const links = [];
  // always=true (ساب‌لینک و دانلود بدون تنظیم) → WARP و WARP PRO همیشه ساخته می‌شوند
  const always = options.always === true;
  const wantWarp = always || isEnabledValue(cfg.warp, true);
  const wantPro = always || isEnabledValue(cfg.warpPro, false);
  const wantMl = isEnabledValue(cfg.warpMl, true);
  if (!wantWarp && !wantPro && !wantMl) return links;

  const registered = await fetchWarpRegistration(cfg);
  const base = registered || buildFallbackWarpConfig();

  if (wantWarp) {
    links.push(buildWireguardLink(base, 'WARP'));
  }
  if (wantPro) {
    // بدون لایسنس هم ساخته می‌شود (کلید رایگان) تا کاربر هیچ تنظیمی لازم نداشته باشد
    links.push(buildWireguardLink(base, 'WARP PRO'));
  }
  if (wantMl) {
    const endpoints = parseWarpEndpointList(cfg.warpEndpoint, cfg.warpCount);
    endpoints.forEach((endpoint, idx) => {
      const suffix = endpoint.label ? ` ${endpoint.label}` : '';
      links.push(buildWireguardLink({ ...base, server: endpoint.host, port: endpoint.port }, `WARP-ML-${idx + 1}${suffix}`));
    });
  }
  return links;
}

// ============================================================================
// OpenVPN — پروفایل‌های رایگان و زنده (VPNGate) با پشتیبانی چندکشوری
// ============================================================================

let openVpnCache = { at: 0, items: [] };
const OPENVPN_CACHE_TTL = 30 * 60 * 1000;
const OPENVPN_ROTATE_MS = 30 * 60 * 1000;
const OPENVPN_MAX_CHARS = 320000; // برش امن برای جلوگیری از دریافت کل فایل ۱.۳ مگابایتی

function extractOvpnDirective(text, name) {
  const match = String(text || '').match(new RegExp(`^\\s*${name}\\s+(.+)$`, 'mi'));
  return match ? match[1].trim() : '';
}

function extractOvpnBlock(text, tag) {
  const match = String(text || '').match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i'));
  return match ? match[1].trim() : '';
}

async function readLimitedText(response, maxChars) {
  if (!response.body || typeof response.body.getReader !== 'function') {
    const full = await response.text();
    return full.slice(0, maxChars);
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  try {
    while (text.length < maxChars) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
    }
  } catch (_e) {
    // اگر برش خورد، همان مقدار خوانده‌شده کافی است
  }
  try { await reader.cancel(); } catch (_e) {}
  return text;
}

// تبدیل متن یک پروفایل ‎.ovpn‎ خام به نود قابل استفاده در Clash / خروجی ‎.ovpn‎
export function parseOvpnProfileText(profileText, meta = {}) {
  const profile = String(profileText || '').replace(/\r\n/g, '\n');
  if (!profile.includes('remote ')) return null;
  const remote = extractOvpnDirective(profile, 'remote').split(/\s+/);
  const server = remote[0];
  if (!server) return null;
  const ca = extractOvpnBlock(profile, 'ca');
  if (!ca) return null;
  const cc = String(meta.country || '').trim().toUpperCase();
  const proto = (extractOvpnDirective(profile, 'proto') || 'udp').toLowerCase();
  return {
    name: meta.name || `OpenVPN-${cc || 'ML'}-${(parseInt(meta.index, 10) || 0) + 1}`,
    country: cc,
    server,
    port: parseInt(remote[1], 10) || 1194,
    proto: proto.startsWith('tcp') ? 'tcp' : 'udp',
    cipher: extractOvpnDirective(profile, 'cipher') || 'AES-128-CBC',
    auth: extractOvpnDirective(profile, 'auth') || 'SHA1',
    ca,
    cert: extractOvpnBlock(profile, 'cert'),
    key: extractOvpnBlock(profile, 'key'),
    tlsAuth: extractOvpnBlock(profile, 'tls-auth') || extractOvpnBlock(profile, 'tls-crypt'),
    keyDirection: extractOvpnDirective(profile, 'key-direction') || '1',
    username: OPENVPN_PUBLIC_USER,
    password: OPENVPN_PUBLIC_PASS,
    profile
  };
}

// تبدیل خطوط CSV منبع VPNGate به نودهای OpenVPN
export function parseOpenVpnList(raw, cfg = {}) {
  if (!isEnabledValue(cfg.ovpn, true)) return [];
  const limit = Math.max(0, Math.min(parseInt(cfg.ovpnCount, 10) || 8, 24));
  if (limit === 0) return [];
  const countryFilter = String(cfg.ovpnCountries || '')
    .split(',')
    .map(x => x.trim().toUpperCase())
    .filter(Boolean);
  const seenCountries = new Set();
  const items = [];
  for (const line of String(raw || '').split(/\r?\n/)) {
    if (!line || line.startsWith('*') || line.startsWith('#')) continue;
    const cols = line.split(',');
    if (cols.length < 15) continue;
    const cc = String(cols[6] || '').trim().toUpperCase();
    const profileB64 = String(cols[cols.length - 1] || '').trim();
    if (!profileB64) continue;
    if (countryFilter.length && !countryFilter.includes(cc)) continue;
    // در حالت آزاد از هر کشور فقط یک سرور انتخاب می‌شود تا ساب‌لینک چندلوکیشن بماند
    if (!countryFilter.length && seenCountries.has(cc)) continue;
    const node = parseOvpnProfileText(decodeBase64Utf8(profileB64), { country: cc, index: items.length });
    if (!node) continue;
    items.push(node);
    seenCountries.add(cc);
    if (items.length >= limit) break;
  }
  return items;
}

// پروفایل‌های تنظیم کلاینت OpenVPN — هر پروفایل همان تونل است با MTU/DNS متفاوت،
// تا در هر اپراتور حداقل یکی از پروفایل‌ها بالا بیاید (ضد فیلترینگ عملی).
const OVPN_TUNING_PRESETS = [
  { id: 'balanced', mtu: 1400, dns: '1.1.1.1' },
  { id: 'mtu-safe', mtu: 1340, dns: '1.0.0.1' },
  { id: 'mobile', mtu: 1240, dns: '1.1.1.1' }
];

// افزودن تنظیمات امن/ضد DPI به یک پروفایل .ovpn بدون دست زدن به کلیدها و CA
// (هیچ دایرکتیو امنیتی سرور تغییر نمی‌کند؛ فقط پارامترهای سمت کلاینت تنظیم می‌شوند)
export function buildOvpnVariant(profileText, node = {}, preset = {}, seed = '') {
  const text = String(profileText || '').replace(/\r\n/g, '\n').trimEnd();
  if (!text.includes('remote ')) return text;
  const presetId = preset.id || 'balanced';
  // جیتر کوچک بر اساس کاربر: هر کاربر MTU کمی متفاوت دارد (امضای DPI یکسان نباشد)
  const jitter = awgHash(`${seed}:${node.server || ''}:${node.port || ''}:${presetId}`) % 21;
  const mtu = Math.max(1100, (parseInt(preset.mtu, 10) || 1400) - jitter);
  const mssfix = Math.max(1000, mtu - 60);
  const stripped = text
    .replace(/^\s*(tun-mtu|mssfix|sndbuf|rcvbuf|persist-tun|nobind|resolv-retry|connect-retry|connect-retry-max|tls-version-min|dhcp-option DNS)\b.*$/gmi, '')
    .replace(/\n{3,}/g, '\n\n');
  const extra = [
    `# --- ${BRAND_NAME} tuning (${presetId}) ---`,
    `tun-mtu ${mtu}`,
    `mssfix ${mssfix}`,
    'sndbuf 0',
    'rcvbuf 0',
    'persist-tun',
    'nobind',
    'resolv-retry infinite',
    'connect-retry 1 2',
    'connect-retry-max 8',
    'tls-version-min 1.2',
    `dhcp-option DNS ${preset.dns || '1.1.1.1'}`
  ];
  return `${stripped}\n\n${extra.join('\n')}\n`;
}

function isOvpnCsv(text) {
  const head = String(text || '').slice(0, 400);
  return head.includes('OpenVPN_ConfigData_Base64') || head.startsWith('*vpn_servers') || head.includes('#HostName,IP,');
}

// انتخاب منابع: لیست سفارشی مدیر (ovpnSource) یا فایل‌های ‎.ovpn‎ مخزن گیت‌هاب، با چرخش دوره‌ای
function pickOpenVpnSources(cfg = {}, limit = 4) {
  const custom = String(cfg.ovpnSource || '')
    .split(',')
    .map(x => x.trim())
    .filter(Boolean);
  const pool = custom.length ? custom : OPENVPN_RAW_PROFILE_SOURCES;
  const countryFilter = String(cfg.ovpnCountries || '')
    .split(',')
    .map(x => x.trim().toUpperCase())
    .filter(Boolean);
  const withCountry = pool.map(url => {
    const match = String(url).match(/_([A-Za-z]{2})\.ovpn(?:[?#]|$)/);
    return { url, country: match ? match[1].toUpperCase() : '' };
  });
  const filtered = countryFilter.length
    ? withCountry.filter(item => !item.country || countryFilter.includes(item.country))
    : withCountry;
  if (!filtered.length) return [];
  const bucket = Math.floor(Date.now() / OPENVPN_ROTATE_MS);
  const shift = bucket % filtered.length;
  const rotated = [...filtered.slice(shift), ...filtered.slice(0, shift)];
  return rotated.slice(0, Math.max(1, limit));
}

export async function fetchOpenVpnNodes(cfg = {}, force = false) {
  if (!isEnabledValue(cfg.ovpn, true)) return [];
  const limit = Math.max(0, Math.min(parseInt(cfg.ovpnCount, 10) || 8, 24));
  if (limit === 0) return [];
  // کش فقط وقتی کافی است که به اندازهٔ درخواست پروفایل داشته باشد
  if (!force && openVpnCache.items.length >= limit && Date.now() - openVpnCache.at < OPENVPN_CACHE_TTL) {
    return openVpnCache.items;
  }

  const fetchProfile = async (source, index) => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 7000);
      const resp = await fetch(source.url, {
        headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'text/plain' },
        signal: controller.signal
      });
      if (!resp.ok) return [];
      const text = await readLimitedText(resp, OPENVPN_MAX_CHARS);
      clearTimeout(timer);
      if (isOvpnCsv(text)) return parseOpenVpnList(text, cfg);
      const node = parseOvpnProfileText(text, { country: source.country, index });
      return node ? [node] : [];
    } catch (_e) {
      return [];
    }
  };

  const collected = [];
  // ۱) فهرست زندهٔ VPNGate: چندین کشور با یک درخواست (پایدارترین منبع)
  for (const url of OPENVPN_CSV_SOURCES) {
    const nodes = await fetchProfile({ url, country: '' }, 0);
    if (nodes.length) {
      collected.push(...nodes);
      break;
    }
  }
  // ۲) پروفایل‌های خام مخزن برای تنوع بیشتر کشورها (با چرخش دوره‌ای)
  if (collected.length < limit) {
    const sources = pickOpenVpnSources(cfg, limit - collected.length + 2);
    const results = await Promise.allSettled(sources.map(fetchProfile));
    for (const result of results) {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) collected.push(...result.value);
    }
  }

  const seen = new Set();
  const items = [];
  for (const node of collected) {
    const key = `${node.server}:${node.port}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(node);
    if (items.length >= limit) break;
  }

  if (items.length) openVpnCache = { at: Date.now(), items };
  return items;
}

// تولید لیست کامل لینک‌های نود برای کاربر با نام‌گذاری دقیق number+miliconfig و رعایت سقف تعداد نود در ساب
export async function generateUserNodesList(userOrConfig, workerHost, queryOverrides = {}) {
  const rawCfg = userOrConfig?.config ? userOrConfig.config : (userOrConfig || {});
  const cfg = normalizeEffectiveConfig(rawCfg);
  const userUuid = String(userOrConfig?.uuid || queryOverrides.uuid || '351c9981-04b6-4103-aa4b-864aa9c91469').toLowerCase();
  const nodeScope = queryOverrides.scope || userOrConfig?.nodeScope || 'all';
  const wkOverride = (queryOverrides.wk || cfg.wk || '').trim().toUpperCase();
  const protoFilter = (queryOverrides.proto || '').trim().toLowerCase();
  // ساب‌لینک اختصاصی «دامنه‌های لبهٔ کلادفلر»: ?set=domain
  // فقط نودهای دامنه‌محور می‌سازد و از استخر آی‌پی/کشوری/WARP استفاده نمی‌کند.
  const domainMode = String(queryOverrides.set || '').trim().toLowerCase() === 'domain';

  const evEnabled = protoFilter ? protoFilter === 'vless' : isEnabledValue(cfg.ev, true);
  const etEnabled = protoFilter ? protoFilter === 'trojan' : isEnabledValue(cfg.et, false);
  const exEnabled = protoFilter ? protoFilter === 'xhttp' : isEnabledValue(cfg.ex, false);
  const esEnabled = protoFilter ? (protoFilter === 'ss' || protoFilter === 'shadowsocks') : isEnabledValue(cfg.es, false);

  const namer = createMiliNodeNamer(BRAND_NAME);
  // هر پروتکل در گروه جداگانه ساخته می‌شود تا در پایان با چیدمان چرخشی
  // همه پروتکل‌ها به نسبت مساوی در سابلینک حاضر باشند (نه فقط VLESS).
  const protoGroups = { vless: [], trojan: [], ss: [], xhttp: [] };
  const rawLinks = [];

  // فرگمنت TLS بر اساس پریست انتخابی مدیر (off = بدون فرگمنت)
  // شادوساکس هیچ‌وقت پارامتر fragment نمی‌گیرد و همیشه در سابلینک می‌ماند.
  cfg.fragmentValue = buildFragmentValue(cfg);

  function appendFromSource(sourceList) {
    const safeList = filterAddressFamily(sourceList, cfg);
    if (!Array.isArray(safeList) || safeList.length === 0) return;
    if (evEnabled) protoGroups.vless.push(...buildVlessLinks(safeList, userUuid, workerHost, cfg, namer, wkOverride));
    if (etEnabled) protoGroups.trojan.push(...buildTrojanLinks(safeList, userUuid, workerHost, cfg, namer, wkOverride));
    if (exEnabled) protoGroups.xhttp.push(...buildXhttpLinks(safeList, userUuid, workerHost, cfg, namer));
    if (esEnabled) protoGroups.ss.push(...buildShadowsocksLinks(safeList, userUuid, workerHost, cfg, namer));
  }

  // نودهای «دامنهٔ کلادفلر»: آدرس نود فقط دامنه است (بدون آی‌پی). دامنه‌ها
  // از استخر تأییدشدهٔ CF_EDGE_DOMAINS به‌صورت چرخشی انتخاب می‌شوند.
  if (domainMode) {
    const wanted = Math.max(1, parseInt(
      queryOverrides.limit ?? userOrConfig?.subNodeCount ?? cfg.subNodeCount ?? 50,
      10
    ) || 50);
    const protocolCount = [evEnabled, etEnabled, exEnabled, esEnabled].filter(Boolean).length || 1;
    const addressCount = Math.max(4, Math.ceil(wanted / protocolCount) + 4);
    const domains = pickEdgeDomains(addressCount);
    appendFromSource(domains.map(domain => ({ ip: domain, port: 443, isp: 'CF-Domain', domain })));
  }

  // چندلوکیشن: پروکسی‌های کشوری به‌عنوان زنجیره خروجی سمت ورکر استفاده می‌شوند، نه به‌عنوان آدرس نود.
  // آدرس نود یک آی‌پی ثابت واقعی کلادفلر است تا پینگ بگیرد و ترافیک از کشور انتخابی خارج شود.
  let countryMode = false;
  const countryFilter = (queryOverrides.country || '').trim().toUpperCase();
  if (!domainMode && countryFilter) {
    const wantedCountries = countryFilter === 'MULTI' || countryFilter === 'ALL'
      ? MULTI_COUNTRY_CODES.slice()
      : (COUNTRY_PROXY_SOURCES[countryFilter] ? [countryFilter] : []);
    // اعتبارسنجی واقعی خروجی برای همهٔ کشورها: تا ۳.۵ ثانیه مهلت، نتیجه ۱۰ دقیقه کش می‌شود
    // تست واقعی پروکسی فقط برای یک یا دو کشور انجام می‌شود؛ در حالت MULTI تعداد
    // فیدها و اتصال‌های هم‌زمان از سقف subrequest ورکر می‌گذرد، پس همان رفتار قبلی
    // (بدون تست) حفظ می‌شود تا تعداد نودها کم نشود.
    const verifyEnabled = String(queryOverrides.verify || '') !== '0' && wantedCountries.length <= 2;
    const deadline = Date.now() + COUNTRY_VERIFIED_DEADLINE_MS;
    const needPerCountry = Math.max(2, Math.min(6, parseInt(cfg.locationNodeCount, 10) || 6));
    const countryLists = await Promise.all(wantedCountries.map(code => {
      const urls = (COUNTRY_PROXY_SOURCES[code]?.urls || []).join(',');
      if (!urls) return Promise.resolve(null);
      return getVerifiedCountryProxies(code, urls, { need: needPerCountry, deadline, verify: verifyEnabled, env: queryOverrides.env || null });
    }));
    const proxyPool = [];
    countryLists.forEach((list, idx) => {
      const code = wantedCountries[idx];
      for (const item of (list || [])) {
        proxyPool.push({ proxy: item.proxy, country: code, unverified: item.unverified === true });
      }
    });
    const locationNodes = buildLocationSourceList(proxyPool, cfg, workerHost);
    if (locationNodes.length > 0) {
      appendFromSource(locationNodes);
      countryMode = true;
    }
  }

  const disablePreferred = cfg.yxby === 'yes' || nodeScope === 'origin';
  const enableNative = cfg.ena === 'yes' || nodeScope === 'origin';

  if (!domainMode && enableNative && nodeScope !== 'edge') {
    appendFromSource([{ ip: workerHost, isp: 'Origin' }]);
  }

  // نودهای «دامنهٔ پنل» — آدرس و SNI دقیقاً دامنهٔ همین ورکر/پیجز (بدون https://)
  if (!domainMode && isEnabledValue(cfg.pd, true) && nodeScope !== 'origin') {
    const panelDomainNodes = buildPanelDomainNodes(workerHost, cfg);
    if (panelDomainNodes.length) appendFromSource(panelDomainNodes);
  }

  const { ipList: customIps, domainList: customDomains, proxyList: customProxies } = parseCustomPreferredString(cfg.yx);
  const hasCustomPreferred = customIps.length > 0 || customDomains.length > 0;

  // ورودی‌های پروکسی (پورت غیر CF) به نودهای زنجیره‌ای تبدیل می‌شوند تا پینگ بدهند
  if (!domainMode && !countryMode && customProxies.length > 0) {
    appendFromSource(buildLocationSourceList(customProxies, cfg, workerHost));
  }

  if (!domainMode && !disablePreferred && !countryMode) {
    if (hasCustomPreferred) {
      if (customIps.length > 0 && cfg.epi === 'yes') {
        appendFromSource(customIps);
      }
      if (customDomains.length > 0 && cfg.epd === 'yes') {
        appendFromSource(customDomains.map(d => ({ ip: d.domain, port: d.port, isp: d.name || d.domain })));
      }
    } else {
      // دامنه‌های پیش‌فرض CFnew همیشه حاضرند و با آی‌پی‌های ثابت به‌صورت متناوب
      // چیده می‌شوند تا با سقف کم نود هم حتماً در سایلینک باشند.
      const staticIpNodes = cfg.epi === 'yes'
        ? getStaticCfAddresses(cfg).map(ip => ({ ip, isp: 'CF-Static' }))
        : [];
      const domainNodes = cfg.epd === 'yes'
        ? DIRECT_DOMAINS.map(d => ({ ip: d.domain, isp: d.name || d.domain }))
        : [];
      if (staticIpNodes.length || domainNodes.length) {
        appendFromSource(interleaveAddresses(staticIpNodes, domainNodes));
      }
      // ۲) استخر آی‌پی‌های بهینه ارائه‌شده بر اساس اپراتور
      if (cfg.epi === 'yes' && !cfg.yxURL) {
        const uouinList = await fetchUouinPreferredIps(cfg);
        if (uouinList.length > 0) {
          appendFromSource(uouinList);
        }
      }
      if (cfg.egi === 'yes' && cfg.yxURL) {
        const urlList = await fetchPreferredFromUrls(cfg.yxURL);
        // خطوط دارای scheme (socks5/http) پروکسی خروجی هستند، نه آدرس نود:
        // آنها را به نودهای «آی‌پی ثابت CF + زنجیره پروکسی در مسیر» تبدیل می‌کنیم تا پینگ بدهند.
        const ipOnly = urlList.filter(x => !x.proxy);
        const proxyOnly = urlList.filter(x => x.proxy).map(x => ({ proxy: x.proxy, country: '' }));
        if (ipOnly.length > 0) {
          appendFromSource(ipOnly);
        }
        if (proxyOnly.length > 0) {
          appendFromSource(buildLocationSourceList(proxyOnly, cfg, workerHost));
        }
      }
      // اگر به هر دلیلی هیچ نودی ساخته نشد، از استخر رسمی CF استفاده می‌کنیم
      const builtCount = protoGroups.vless.length + protoGroups.trojan.length + protoGroups.ss.length + protoGroups.xhttp.length;
      if (builtCount < 15 && cfg.epi === 'yes') {
        appendFromSource(getStaticCfAddresses(cfg).map(ip => ({ ip, isp: 'CF-Direct' })));
      }
    }
  }

  if (protoGroups.vless.length === 0 && protoGroups.trojan.length === 0 && protoGroups.ss.length === 0 && protoGroups.xhttp.length === 0) {
    appendFromSource([{ ip: workerHost, port: 443, isp: 'Origin' }]);
  }

  // چیدمان چرخشی پروتکل‌ها: vless → trojan → ss → xhttp → تکرار
  const balancedLinks = interleaveProtocols(protoGroups);
  if (balancedLinks.length) rawLinks.push(...balancedLinks);

  const subNodeCount = queryOverrides.limit !== undefined
    ? parseInt(queryOverrides.limit, 10)
    : Number(userOrConfig?.subNodeCount ?? cfg.subNodeCount ?? 50);

  // اعمال چرخش خودکار آی‌پی در صورت تنظیم بازه زمانی توسط مدیر
  const rotatedLinks = rotateIpListByTimeBucket(rawLinks, cfg.ipRotation || 'off');

  // اعمال دقیق نام‌گذاری number+miliconfig و سقف تعداد نودهای ساب‌لینک کاربر
  const finalized = finalizeMiliSubscriptionLinks(rotatedLinks, subNodeCount, BRAND_NAME);

  // خانوادهٔ WARP (WARP / WARP PRO / WARP چندلوکیشن) در انتهای ساب‌لینک با نام اختصاصی خودش
  const warpAllowed = !protoFilter || protoFilter === 'warp' || protoFilter === 'wireguard';
  // WARP و WARP PRO بدون نیاز به هیچ تنظیمی همیشه حاضرند؛ فقط حذف کامل آن‌ها
  // با ?proto=vless (یا پروتکل دیگر) یا ?nowarp=1 ممکن است.
  const nowarp = String(queryOverrides.nowarp || '') === '1' || cfg.warp === 'no' && cfg.warpPro === 'no';
  const warpLinks = warpAllowed && !domainMode && !nowarp ? await buildWarpFamilyLinks(cfg, { always: true }) : [];

  // افزودن الزامی ۳ نود هاردکدشده اطلاع‌رسانی در صدر تمام ساب‌لینک‌ها
  return [...HARDCODED_INFO_NODES, ...finalized, ...warpLinks];
}

// تشخیص خودکار کلاینت از User-Agent در صورت عدم ارسال پارامتر target
export function detectTargetFromRequest(request, url) {
  const explicit = url.searchParams.get('target');
  if (explicit && explicit.trim()) return explicit.trim().toLowerCase();
  const ua = (request.headers.get('User-Agent') || '').toLowerCase();
  if (ua.includes('clash') || ua.includes('mihomo') || ua.includes('flclash') || ua.includes('stash') || ua.includes('verge')) {
    return 'clash';
  }
  if (ua.includes('sing-box') || ua.includes('singbox') || ua.includes('hiddify') || ua.includes('sfa') || ua.includes('sfm') || ua.includes('karing')) {
    return 'singbox';
  }
  if (ua.includes('surge')) return 'surge';
  if (ua.includes('quantumult')) return 'quanx';
  if (ua.includes('loon')) return 'loon';
  return 'base64';
}

export async function handleSubscriptionResponse(request, userOrConfig, url = null, env = null) {
  if (!url) url = new URL(request.url);
  const workerHost = url.hostname;
  const rawCfg = userOrConfig?.config ? userOrConfig.config : (userOrConfig || {});
  const cfg = normalizeEffectiveConfig(rawCfg);

  // بررسی وضعیت فعال بودن، حجم و انقضای کاربر
  if (userOrConfig && userOrConfig.enabled === false) {
    const disabledNode = `vless://00000000-0000-0000-0000-000000000000@127.0.0.1:443?encryption=none&security=tls&type=ws#${encodeURIComponent('1+' + BRAND_NAME)}`;
    return new Response(btoa(disabledNode), {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
    });
  }

  const target = detectTargetFromRequest(request, url);

  // ساب‌لینک OpenVPN: پروفایل خام (قابل ایمپورت در کلاینت‌های OpenVPN)
  if (['ovpn', 'openvpn'].includes(target)) {
    if (!isEnabledValue(cfg.ovpn, true)) {
      return new Response('نودهای OpenVPN در پنل مدیریت miliconfig خاموش است.', {
        status: 403,
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
      });
    }
    const ovpnNodes = await fetchOpenVpnNodes(cfg);
    if (!ovpnNodes.length) {
      return new Response('در حال حاضر پروفایل OpenVPN در دسترس نیست؛ لطفاً بعداً تلاش کنید.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
      });
    }
    // ?format=zip → همهٔ پروفایل‌ها در یک بستهٔ قابل دانلود؛ در غیر این صورت تک‌فایل .ovpn
    const wantZip = ['zip', 'bundle', 'pack'].includes(String(url.searchParams.get('format') || '').toLowerCase());
    if (wantZip) {
      const used = new Set();
      const files = [];
      const seed = String(userOrConfig?.uuid || cfg.wk || BRAND_NAME);
      ovpnNodes.slice(0, 10).forEach((node, idx) => {
        const code = String(node.country || 'ML').toUpperCase();
        for (const preset of OVPN_TUNING_PRESETS) {
          let name = `${BRAND_NAME}-${code}-${String(idx + 1).padStart(2, '0')}-${preset.id}.ovpn`;
          while (used.has(name)) name = name.replace(/\.ovpn$/, `-${Date.now() % 997}.ovpn`);
          used.add(name);
          const header = `# ${BRAND_NAME} OpenVPN — ${code} ${node.server}:${node.port}/${node.proto} (${preset.id})\n`;
          files.push({ name, data: header + buildOvpnVariant(node.profile, node, preset, seed) });
        }
      });
      files.push({
        name: 'servers.txt',
        data: [
          `# ${BRAND_NAME} OpenVPN servers in this bundle`,
          ...ovpnNodes.slice(0, 10).map((node, idx) =>
            `${String(idx + 1).padStart(2, '0')}\t${node.country || 'ML'}\t${node.server}\t${node.port}\t${node.proto}\t${node.cipher}`
          )
        ].join('\n') + '\n'
      });
      files.push({
        name: 'README.txt',
        data: [
          `${BRAND_NAME} — ${files.length} OpenVPN profile(s)`,
          '',
          'هر سرور در سه پروفایل تنظیم شده ارائه می‌شود (balanced / mtu-safe / mobile).',
          'اگر یکی وصل نشد، پروفایل بعدی همان کشور را امتحان کنید.',
          'Import into OpenVPN Connect / AmneziaVPN / OpenVPN GUI.',
          'Username/password for public VPNGate servers: vpn / vpn',
          '',
          `profiles: ${ovpnNodes.length} servers x ${OVPN_TUNING_PRESETS.length} tuning presets`
        ].join('\n')
      });
      return new Response(buildZip(files), {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': 'attachment; filename="miliconfig-openvpn.zip"',
          'Cache-Control': 'no-store',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    const first = ovpnNodes[0];
    const body = [
      `# ${BRAND_NAME} OpenVPN - ${first.country || 'ML'} (${first.server}:${first.port}/${first.proto})`,
      `# ${ovpnNodes.length} سرور در این ساب‌لینک موجود است؛ برای بستهٔ کامل ?format=zip`,
      buildOvpnVariant(first.profile, first, OVPN_TUNING_PRESETS[0], String(userOrConfig?.uuid || cfg.wk || BRAND_NAME))
    ].join('\n');
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-openvpn-profile; charset=utf-8',
        'Content-Disposition': 'attachment; filename="miliconfig-openvpn.ovpn"',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  const isJkTarget = ['vg', 'jk', 'jiakuan'].includes(target);
  if (isJkTarget && cfg.jk !== 'yes') {
    return new Response('زنجیره اینترنت خانگی فعال نیست. در پنل مدیریت miliconfig گزینه «فعال‌سازی زنجیره اینترنت خانگی (jk)» را روشن کنید.', {
      status: 403,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
    });
  }

  const queryOverrides = {
    wk: url.searchParams.get('wk') || '',
    proto: url.searchParams.get('proto') || '',
    country: url.searchParams.get('country') || '',
    verify: url.searchParams.get('verify') || '',
    set: url.searchParams.get('set') || '',
    nowarp: url.searchParams.get('nowarp') || '',
    env,
    scope: url.searchParams.get('scope') || userOrConfig?.nodeScope || 'all',
    limit: url.searchParams.get('limit') !== null ? url.searchParams.get('limit') : undefined
  };

  const finalLinks = await generateUserNodesList(userOrConfig, workerHost, queryOverrides);

  let bodyContent = '';
  let contentType = 'text/plain; charset=utf-8';

  switch (target) {
    case 'clash':
    case 'clashr':
    case 'stash':
    case 'meta':
    case 'clashmeta': {
      // نودهای OpenVPN (پروفایل‌های زندهٔ VPNGate) فقط در خروجی Clash/Mihomo قابل استفاده‌اند
      const ovpnNodes = await fetchOpenVpnNodes(cfg);
      bodyContent = generateClashConfig(finalLinks, { ...cfg, ovpnNodes });
      contentType = 'text/yaml; charset=utf-8';
      break;
    }
    case 'vg':
    case 'jk':
    case 'jiakuan':
      try {
        bodyContent = await generateResidentialChainConfig(finalLinks, {
          ...cfg,
          subNodeCount: userOrConfig?.subNodeCount ?? cfg.subNodeCount ?? 50
        });
        contentType = 'text/yaml; charset=utf-8';
      } catch (err) {
        return new Response('گره‌های اینترنت خانگی موقتاً در دسترس نیستند: ' + (err?.message || err), {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
        });
      }
      break;
    case 'singbox':
    case 'sing-box':
      bodyContent = generateSingboxConfig(finalLinks, cfg);
      contentType = 'application/json; charset=utf-8';
      break;
    case 'surge':
    case 'surge2':
    case 'surge3':
    case 'surge4':
      bodyContent = generateSurgeConfig(finalLinks, cfg);
      contentType = 'text/plain; charset=utf-8';
      break;
    case 'quantumult':
    case 'quanx':
      bodyContent = generateQuanxConfig(finalLinks, cfg);
      contentType = 'text/plain; charset=utf-8';
      break;
    case 'loon':
      bodyContent = generateLoonConfig(finalLinks, cfg);
      contentType = 'text/plain; charset=utf-8';
      break;
    case 'raw':
    case 'plain':
      bodyContent = finalLinks.join('\n');
      contentType = 'text/plain; charset=utf-8';
      break;
    default:
      bodyContent = btoa(finalLinks.join('\n'));
      contentType = 'text/plain; charset=utf-8';
      break;
  }

  const totalBytes = userOrConfig?.dataLimitGb > 0 ? Math.floor(userOrConfig.dataLimitGb * 1073741824) : 0;
  const usedBytes = Number(userOrConfig?.usedBytes || 0);
  const expireSec = userOrConfig?.expireAt > 0 ? Math.floor(userOrConfig.expireAt / 1000) : 0;
  const profileTitle = userOrConfig?.username ? `${BRAND_NAME} - ${userOrConfig.username}` : BRAND_NAME;

  const headers = {
    'Content-Type': contentType,
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Access-Control-Allow-Origin': '*',
    'Profile-Title': `base64:${encodeBase64Utf8(profileTitle)}`,
    'Profile-Update-Interval': '12',
    'Subscription-Userinfo': `upload=0; download=${usedBytes}; total=${totalBytes}; expire=${expireSec}`
  };

  if (cfg.ech === 'yes') {
    headers['X-ECH-Status'] = 'ENABLED';
  }

  return new Response(bodyContent, { headers });
}
