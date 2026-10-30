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
    const picked = group[(bucket + i) % group.length];
    out.push({
      ip: addressPool[(i * stride) % addressPool.length],
      isp: `Loc-${picked.country || 'CF'}`,
      country: picked.country || '',
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
  const wanted = Math.max(1, Math.min(parseInt(count, 10) || 6, 30));
  const bucket = Math.floor(Date.now() / (10 * 60 * 1000));
  const out = [];
  for (let i = 0; i < wanted; i++) {
    const endpoint = iranWarpEndpoint(bucket + i * 3);
    out.push({ host: endpoint.host, port: endpoint.port, label: '' });
  }
  return out;
}

// ============================================================================
// AmneziaWG — همان WireGuard با پارامترهای مبهم‌سازی، بهینه‌شده برای DPI اپراتورهای ایران:
// Jc/Jmin/Jmax کوچک، S1-S4 صفر و دو بستهٔ جعلی SIP (I1/I2) که پیش از handshake
// فرستاده می‌شوند تا الگوی ترافیک شبیه تماس VoIP دیده شود. مقادیر پایدار هستند تا
// با هر بار تازه‌سازی ساب‌لینک عوض نشوند.
// ============================================================================
// بسته‌های جعلی SIP (I1/I2): امضایی که DPI اپراتورهای ایران را رد می‌کند.
// متن SIP در زمان اجرا به هگز تبدیل می‌شود تا رشتهٔ دستی و خطاپذیر نداشته باشیم.
const WARP_AWG_SIP_INVITE = [
  'INVITE sip:bob@biloxi.com SIP/2.0',
  'Via: SIP/2.0/UDP pc33.atlanta.com;branch=z9hG4bK776asdhds',
  'Max-Forwards: 70',
  'To: Bob <sip:bob@biloxi.com>',
  'From: Alice <sip:alice@atlanta.com>;tag=1928301774',
  'Call-ID: a84b4c76e66710@pc33.atlanta.com',
  'CSeq: 314159 INVITE',
  'Contact: <sip:alice@pc33.atlanta.com>',
  'Content-Type: application/sdp',
  'Content-Length: 0',
  '',
  ''
].join('\r\n');

const WARP_AWG_SIP_TRYING = [
  'SIP/2.0 100 Trying',
  'Via: SIP/2.0/UDP pc33.atlanta.com;branch=z9hG4bK776asdhds',
  'To: Bob <sip:bob@biloxi.com>',
  'From: Alice <sip:alice@atlanta.com>;tag=1928301774',
  'Call-ID: a84b4c76e66710@pc33.atlanta.com',
  'CSeq: 314159 INVITE',
  'Content-Length: 0',
  '',
  ''
].join('\r\n');

function awgBinaryPacket(text) {
  let hex = '';
  for (let i = 0; i < text.length; i++) hex += text.charCodeAt(i).toString(16).padStart(2, '0');
  return `<b 0x${hex}>`;
}

const WARP_AWG_I1 = awgBinaryPacket(WARP_AWG_SIP_INVITE);
const WARP_AWG_I2 = awgBinaryPacket(WARP_AWG_SIP_TRYING);


// نقطهٔ پایانی پیش‌فرض وارپ برای ایران (همان host:port که در کانفیگ‌های آزمایش‌شده
// روی اپراتورهای ایران جواب می‌دهد).
function iranWarpEndpoint(offset = 0) {
  const ipv4 = WARP_ENDPOINT_IPS.filter(h => !String(h).includes(':'));
  const pool = ipv4.length ? ipv4 : WARP_ENDPOINT_IPS;
  const idx = Math.abs(offset) % pool.length;
  const port = WARP_ENDPOINT_PORTS[Math.abs(offset) % WARP_ENDPOINT_PORTS.length];
  return { host: pool[idx], port };
}

function awgHash(text) {
  let h = 2166136261 >>> 0;
  const str = String(text || '');
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619) >>> 0;
  return h >>> 0;
}

export function buildAmneziaWgParams(config = {}) {
  const seed = `${config.server || WARP_DEFAULT_HOST}:${config.port || WARP_DEFAULT_PORT}:${config.publicKey || WARP_PEER_PUBLIC_KEY}`;
  let h = awgHash(seed) || 1;
  const next = (min, max) => {
    h = (Math.imul(h ^ (h >>> 15), 2246822507) + 0x9e3779b9) >>> 0;
    return min + (h % (max - min + 1));
  };
  // بازه‌های کوچک (مطابق کانفیگ‌های آزمایش‌شده روی اپراتورهای ایران):
  // بسته‌های junk کم‌حجم‌ترند تا handshake در شبکه‌های پرافت‌وخیز کامل شود.
  const jmin = next(40, 60);
  const jmax = jmin + next(20, 60);
  const h1 = next(0x100000, 0x7fff0000);
  return {
    jc: next(3, 6),
    jmin,
    jmax,
    s1: 0,
    s2: 0,
    s3: 0,
    s4: 0,
    h1,
    h2: h1 + next(1, 4000),
    h3: h1 + next(4001, 9000),
    h4: h1 + next(9001, 16000)
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
  params.set('address', `${config.address4 || WARP_DEFAULT_ADDRESS}/32`);
  params.set('mtu', '1280');
  params.set('dns', '1.1.1.1, 1.0.0.1');
  if (awg) {
    params.set('awg', '1');
    params.set('jc', String(awg.jc));
    params.set('jmin', String(awg.jmin));
    params.set('jmax', String(awg.jmax));
    params.set('s1', String(awg.s1));
    params.set('s2', String(awg.s2));
    params.set('h1', String(awg.h1));
    params.set('h2', String(awg.h2));
    params.set('h3', String(awg.h3));
    params.set('h4', String(awg.h4));
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
  const lines = [
    `# ${name} — ${BRAND_NAME}`,
    '# AmneziaWG 1.5 profile — Iran-optimized (Jc/Jmin/Jmax/S1-S4 + I1/I2)',
    `# Reserved (WARP client id): ${reserved}`,
    '[Interface]',
    `PrivateKey = ${config.privateKey || ''}`,
    `Address = ${config.address4 || WARP_DEFAULT_ADDRESS}/32`
  ];
  if (config.address6) lines.push(`Address = ${config.address6}`);
  lines.push('DNS = 1.1.1.1, 1.0.0.1, 2606:4700:4700::1111, 2606:4700:4700::1001', 'MTU = 1280');
  lines.push(
    `Jc = ${awg.jc}`,
    `Jmin = ${awg.jmin}`,
    `Jmax = ${awg.jmax}`,
    `S1 = ${awg.s1}`,
    `S2 = ${awg.s2}`,
    `S3 = ${awg.s3}`,
    `S4 = ${awg.s4}`,
    `H1 = ${awg.h1}`,
    `H2 = ${awg.h2}`,
    `H3 = ${awg.h3}`,
    `H4 = ${awg.h4}`,
    `I1 = ${WARP_AWG_I1}`,
    `I2 = ${WARP_AWG_I2}`
  );
  lines.push(
    '[Peer]',
    `PublicKey = ${config.publicKey || WARP_PEER_PUBLIC_KEY}`,
    'AllowedIPs = 0.0.0.0/0, ::/0',
    `Endpoint = ${endpoint}:${config.port || WARP_DEFAULT_PORT}`
  );
  // لایسنس حساب هرگز داخل فایل کاربر نوشته نمی‌شود (نشت کلید پولی)
  return lines.join('\n') + '\n';
}

// بستهٔ کانفیگ‌های آمادهٔ WARP برای دانلود (zip) — بدون نیاز به هیچ تنظیمی در پنل:
// WARP، WARP PRO (اگر لایسنس تنظیم شده باشد) و چندلوکیشن
const WARP_ML_CONF_COUNT = 6;

export async function buildWarpConfBundle(cfg = {}) {
  const registered = await fetchWarpRegistration(cfg);
  const base = registered || buildFallbackWarpConfig();
  // نقطهٔ پایانی پیش‌فرض هم روی ingress/پورت بهینهٔ ایران تنظیم می‌شود
  const primary = iranWarpEndpoint(0);
  const main = { ...base, server: primary.host, port: primary.port };
  const files = [];
  files.push({ name: 'WARP.conf', data: buildWireGuardConf(main, 'WARP') });
  // WARP PRO همیشه هست: با لایسنس پنل اگر تنظیم شده باشد، وگرنه با کلید رایگان
  files.push({ name: 'WARP-PRO.conf', data: buildWireGuardConf(main, 'WARP PRO') });
  const endpoints = parseWarpEndpointList(cfg.warpEndpoint, cfg.warpCount || WARP_ML_CONF_COUNT);
  endpoints.forEach((endpoint, idx) => {
    const label = endpoint.label ? ` ${endpoint.label}` : '';
    files.push({
      name: `WARP-ML-${idx + 1}.conf`,
      data: buildWireGuardConf({ ...base, server: endpoint.host, port: endpoint.port }, `WARP-ML-${idx + 1}${label}`)
    });
  });
  files.push({
    name: 'README.txt',
    data: [
      `${BRAND_NAME} — WARP configs (AmneziaWG)`,
      '',
      'Import any .conf into an AmneziaWG 1.5+ client (AmneziaWG app, Hiddify, WG Tunnel, Amnezia).',
      'Jc/Jmin/Jmax/S1-S4/H1-H4 and I1/I2 are AmneziaWG obfuscation parameters.',
      'I1/I2 are fake SIP packets used to pass Iranian operators DPI.',
      'If one endpoint does not connect, try the next WARP-ML-*.conf file (different port).',
      'WARP-PRO is the same tunnel profile; with a panel WARP+ license it runs on the plus tier.',
      'WARP-ML-* are the same tunnel from different Cloudflare endpoints.',
      '',
      `endpoint: ${base.server}:${base.port}`,
      `address: ${base.address4}`
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
  const fallback = registered || buildFallbackWarpConfig();
  // نودهای WARP/WARP PRO روی ingress و پورت بهینهٔ ایران ساخته می‌شوند
  const iran = iranWarpEndpoint(0);
  const base = { ...fallback, server: iran.host, port: iran.port };

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
  const limit = Math.max(0, Math.min(parseInt(cfg.ovpnCount, 10) || 4, 12));
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
  if (!force && openVpnCache.items.length && Date.now() - openVpnCache.at < OPENVPN_CACHE_TTL) {
    return openVpnCache.items;
  }
  const limit = Math.max(0, Math.min(parseInt(cfg.ovpnCount, 10) || 4, 12));
  if (limit === 0) return [];

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

  const sources = pickOpenVpnSources(cfg, limit);
  const collected = [];
  const results = await Promise.allSettled(sources.map(fetchProfile));
  for (const result of results) {
    if (result.status === 'fulfilled' && Array.isArray(result.value)) collected.push(...result.value);
  }

  // پشتیبان: لیست CSV ونگیت (در برخی شبکه‌های خروجی کلودفلر در دسترس نیست)
  if (!collected.length) {
    for (const url of OPENVPN_CSV_SOURCES) {
      const nodes = await fetchProfile({ url, country: '' }, 0);
      if (nodes.length) {
        collected.push(...nodes);
        break;
      }
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
      ? ['DE', 'NL', 'US', 'GB', 'TR', 'AE', 'CA', 'SE']
      : (COUNTRY_PROXY_SOURCES[countryFilter] ? [countryFilter] : []);
    const proxyPool = [];
    for (const code of wantedCountries) {
      const urls = (COUNTRY_PROXY_SOURCES[code]?.urls || []).join(',');
      if (!urls) continue;
      const found = await fetchPreferredFromUrls(urls);
      for (const item of found) {
        if (item.proxy) proxyPool.push({ proxy: item.proxy, country: code });
      }
    }
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

export async function handleSubscriptionResponse(request, userOrConfig, url = null) {
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
      const files = ovpnNodes.slice(0, 20).map((node, idx) => {
        const code = String(node.country || 'ML').toUpperCase();
        let name = `miliconfig-${code}-${idx + 1}.ovpn`;
        while (used.has(name)) name = `miliconfig-${code}-${idx + 1}-${Date.now() % 1000}.ovpn`;
        used.add(name);
        const header = `# miliconfig OpenVPN - ${code} (${node.server}:${node.port}/${node.proto})\n`;
        return { name, data: header + node.profile };
      });
      files.push({
        name: 'README.txt',
        data: `miliconfig — ${files.length} OpenVPN profile(s)\nImport the .ovpn files into OpenVPN Connect / AmneziaVPN / OpenVPN GUI.\n`
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
      `# miliconfig OpenVPN - ${first.country || 'ML'} (${first.server}:${first.port}/${first.proto})`,
      `# ${ovpnNodes.length} پروفایل در این ساب‌لینک موجود است`,
      first.profile
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
    set: url.searchParams.get('set') || '',
    nowarp: url.searchParams.get('nowarp') || '',
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
