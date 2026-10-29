// ============================================================================
// miliconfig v3.1 - استخر منابع زنده اسکنر (پروکسی‌های SOCKS5/HTTP، لیست‌های کشوری و رنج‌های IP)
// همه لیست‌ها هر بار به‌صورت زنده خوانده می‌شوند (بدون کش سمت سرور) و اسکنر
// از هر استخر یک برش چرخشی برمی‌دارد تا سقف subrequest کلادفلر رعایت شود.
//
// نکته مهم درباره فهرست فیدها: هر آدرسی که در این فایل می‌ماند باید زنده باشد.
// در بازبینی اکتبر ۲۰۲۶، ۴۸ آدرس از فهرست قبلی (dimzon، residential ها،
// monosans/geolocation، ipverse و بخشی از proxy_vip) ۴۰۴ بودند و حذف شدند؛
// یک فید ۴۰۴ فقط یک subrequest هدر می‌دهد و ممکن است سهم فیدهای سالم را
// از برش چرخشی بگیرد. آدرس‌های جایگزین زنده به فهرست اضافه شده‌اند.
// ============================================================================

const RAW = 'https://raw.githubusercontent.com/';
const raw = path => RAW + path;

// نوع فید:
//   socks5 → همهٔ خطوط پروکسی SOCKS5 هستند
//   http   → همهٔ خطوط پروکسی HTTP/HTTPS هستند
//   mixed  → هر دو نوع (یا نامشخص)؛ اسکنر خودش پروتکل را با handshake تشخیص می‌دهد
//   any    → فید ترکیبی بدون پروتکل مشخص
export const PROXY_FEED_TYPES = ['socks5', 'http', 'mixed', 'any'];

// ---------------------------------------------------------------------------
// فیدهای عمومی SOCKS5 — همه در اکتبر ۲۰۲۶ پاسخ ۲۰۰ داده‌اند
// ---------------------------------------------------------------------------
const SOCKS5_FEEDS = [
  'monosans/proxy-list/main/proxies/socks5.txt',
  'rdavydov/proxy-list/main/proxies/socks5.txt',
  'rdavydov/proxy-list/main/proxies_anonymous/socks5.txt',
  'rdavydov/proxy-list/main/proxies_geolocation/socks5.txt',
  'rdavydov/proxy-list/main/proxies_geolocation_anonymous/socks5.txt',
  'zloi-user/hideip.me/main/socks5.txt',
  'vakhov/fresh-proxy-list/master/socks5.txt',
  'hookzof/socks5_list/master/proxy.txt',
  'MuRongPIG/Proxy-Master/main/socks5.txt',
  'Noctiro/getproxy/master/file/socks5.txt',
  'Noctiro/getproxy/master/file/socks5_with_protocol.txt',
  'roosterkid/openproxylist/main/SOCKS5_RAW.txt',
  'roosterkid/openproxylist/main/SOCKS5.txt',
  'sunny9577/proxy-scraper/master/generated/socks5_proxies.txt',
  'trio666/proxy-checker/main/socks5.txt',
  'TheSpeedX/SOCKS-List/master/socks5.txt',
  'proxifly/free-proxy-list/main/proxies/protocols/socks5/data.txt',
  'ProxyScrape/free-proxy-list/main/proxies/protocols/socks5/data.txt',
  'ikimono-afk/proxy-api/main/proxies/socks5.txt',
  'ikimono-afk/proxy-api/main/proxies_anonymous/socks5.txt',
  'ikimono-afk/proxy-api/main/proxies_geolocation/socks5.txt',
  'ikimono-afk/proxy-api/main/proxies_geolocation_anonymous/socks5.txt',
  'ProxyScraper/ProxyScraper/main/socks5.txt',
  'r00tee/Proxy-List/main/Socks5.txt',
  'jetkai/proxy-list/main/archive/txt/proxies-socks5.txt',
  'iplocate/free-proxy-list/main/protocols/socks5.txt',
  'officialputuid/KangProxy/main/socks5/socks5.txt',
  'karimi-mohammad/SOCKS5-Proxy-Checker/main/socks5.txt',
  'FosterG4/proxy-list/main/socks5.txt',
  'yosephplex/proxy-updater/main/proxies/socks5.txt',
  'readloud/clauneck/main/PROXY-List/socks5.txt',
  'ItzRazvyy/ProxyList/main/socks5.txt',
  'i-am-unbekannt/BLITZPROXY/main/out-files/socks5.txt',
  'ProxyListt/PROXY-list/main/socks5.txt',
  'Daniel3356/Proxy_Full-list/main/socks5.txt',
  'proxygenerator1/ProxyGenerator/main/MostStable/socks5.txt',
  'proxygenerator1/ProxyGenerator/main/Stable/socks5.txt',
  'proxmint/free-proxy-list/main/proxies/socks5.txt',
  'Thordata/awesome-free-proxy-list/main/proxies/socks5.txt',
  'ClearProxy/checked-proxy-list/main/socks5/raw/all.txt',
  'VPSLabCloud/VPSLab-Free-Proxy-List/main/socks5_all.txt',
  'komutan234/Proxy-List-Free/main/proxies/socks5.txt',
  'ALIILAPRO/Proxy/main/socks5.txt'
];

// ---------------------------------------------------------------------------
// فیدهای عمومی HTTP / HTTPS — همه پاسخ ۲۰۰
// ---------------------------------------------------------------------------
const HTTP_FEEDS = [
  'monosans/proxy-list/main/proxies/http.txt',
  'rdavydov/proxy-list/main/proxies/http.txt',
  'rdavydov/proxy-list/main/proxies_anonymous/http.txt',
  'rdavydov/proxy-list/main/proxies_geolocation/http.txt',
  'rdavydov/proxy-list/main/proxies_geolocation_anonymous/http.txt',
  'zloi-user/hideip.me/main/http.txt',
  'zloi-user/hideip.me/main/https.txt',
  'vakhov/fresh-proxy-list/master/http.txt',
  'vakhov/fresh-proxy-list/master/https.txt',
  'Vadim287/free-proxy/main/proxies/http.txt',
  'MuRongPIG/Proxy-Master/main/http.txt',
  'Noctiro/getproxy/master/file/http.txt',
  'Noctiro/getproxy/master/file/https.txt',
  'Noctiro/getproxy/master/file/http_with_protocol.txt',
  'Noctiro/getproxy/master/file/https_with_protocol.txt',
  'roosterkid/openproxylist/main/HTTPS_RAW.txt',
  'roosterkid/openproxylist/main/HTTPS.txt',
  'sunny9577/proxy-scraper/master/generated/http_proxies.txt',
  'trio666/proxy-checker/main/http.txt',
  'trio666/proxy-checker/main/https.txt',
  'TheSpeedX/PROXY-List/master/http.txt',
  'proxifly/free-proxy-list/main/proxies/protocols/http/data.txt',
  'proxifly/free-proxy-list/main/proxies/protocols/https/data.txt',
  'ProxyScrape/free-proxy-list/main/proxies/protocols/http/data.txt',
  'ikimono-afk/proxy-api/main/proxies/http.txt',
  'ikimono-afk/proxy-api/main/proxies_anonymous/http.txt',
  'ikimono-afk/proxy-api/main/proxies_geolocation/http.txt',
  'ikimono-afk/proxy-api/main/proxies_geolocation_anonymous/http.txt',
  'ProxyScraper/ProxyScraper/main/http.txt',
  'r00tee/Proxy-List/main/Https.txt',
  'jetkai/proxy-list/main/archive/txt/proxies-http.txt',
  'jetkai/proxy-list/main/archive/txt/proxies-https.txt',
  'iplocate/free-proxy-list/main/protocols/http.txt',
  'iplocate/free-proxy-list/main/protocols/https.txt',
  'officialputuid/KangProxy/main/http/http.txt',
  'officialputuid/KangProxy/main/https/https.txt',
  'elliottophellia/yakumo/master/results/http/global/http_checked.txt',
  'Zaeem20/FREE_PROXIES_LIST/master/http.txt',
  'Zaeem20/FREE_PROXIES_LIST/master/https.txt',
  'Anonym0usWork1221/Free-Proxies/main/proxy_files/http_proxies.txt',
  'Anonym0usWork1221/Free-Proxies/main/proxy_files/https_proxies.txt',
  'dpangestuw/Free-Proxy/main/http_proxies.txt',
  'Tsprnay/Proxy-lists/master/proxies/http.txt',
  'Tsprnay/Proxy-lists/master/proxies/https.txt',
  'mzyui/proxy-list/main/http.txt',
  'ErcinDedeoglu/proxies/main/proxies/http.txt',
  'ErcinDedeoglu/proxies/main/proxies/https.txt',
  'ALIILAPRO/Proxy/main/http.txt',
  'Skillter/ProxyGather/master/proxies/working-proxies-http.txt',
  'SevenworksDev/proxy-list/main/proxies/http.txt',
  'SevenworksDev/proxy-list/main/proxies/https.txt',
  'Vann-Dev/proxy-list/main/proxies/http.txt',
  'Vann-Dev/proxy-list/main/proxies/https.txt',
  'TuanMinPay/live-proxy/master/http.txt',
  'vmheaven/VMHeaven-Free-Proxy-Updated/main/http.txt',
  'vmheaven/VMHeaven-Free-Proxy-Updated/main/https.txt',
  'yosephplex/proxy-updater/main/proxies/http.txt',
  'readloud/clauneck/main/PROXY-List/http.txt',
  'ItzRazvyy/ProxyList/main/http.txt',
  'i-am-unbekannt/BLITZPROXY/main/out-files/http.txt',
  'ProxyListt/PROXY-list/main/http.txt',
  'Daniel3356/Proxy_Full-list/main/http.txt',
  'proxygenerator1/ProxyGenerator/main/MostStable/http.txt',
  'proxygenerator1/ProxyGenerator/main/Stable/http.txt',
  'proxmint/free-proxy-list/main/proxies/http.txt',
  'Thordata/awesome-free-proxy-list/main/proxies/http.txt',
  'ClearProxy/checked-proxy-list/main/http/raw/all.txt',
  'VPSLabCloud/VPSLab-Free-Proxy-List/main/http_all.txt',
  'komutan234/Proxy-List-Free/main/proxies/http.txt'
];

// ---------------------------------------------------------------------------
// فیدهای ترکیبی (هر دو پروتکل در یک فایل) — پروتکل هنگام تست handshake مشخص می‌شود
// ---------------------------------------------------------------------------
const MIXED_FEEDS = [
  'proxygenerator1/ProxyGenerator/main/MostStable/ALL.txt',
  'proxygenerator1/ProxyGenerator/main/Stable/ALL.txt'
];

// ---------------------------------------------------------------------------
// فیدهای با بازده بالا — در سنجش واقعی اکتبر ۲۰۲۶ (handshake کامل SOCKS5/HTTP)
// بیشترین نرخ اتصال را داشتند. اسکنر اول از این‌ها برمی‌دارد و بعد از بقیه.
// ---------------------------------------------------------------------------
export const HIGH_YIELD_PROXY_SOURCES = [
  'zloi-user/hideip.me/main/socks5.txt',
  'iplocate/free-proxy-list/main/protocols/socks5.txt',
  'ProxyScrape/free-proxy-list/main/proxies/protocols/socks5/data.txt',
  'monosans/proxy-list/main/proxies/socks5.txt',
  'proxygenerator1/ProxyGenerator/main/MostStable/ALL.txt',
  'proxygenerator1/ProxyGenerator/main/Stable/ALL.txt',
  'vmheaven/VMHeaven-Free-Proxy-Updated/main/http.txt',
  'iplocate/free-proxy-list/main/protocols/http.txt',
  'ProxyScrape/free-proxy-list/main/proxies/protocols/http/data.txt',
  'proxygenerator1/ProxyGenerator/main/MostStable/http.txt',
  'monosans/proxy-list/main/proxies/http.txt',
  'zloi-user/hideip.me/main/http.txt'
].map(raw);

// ---------------------------------------------------------------------------
// فیدهای کشوری
// ---------------------------------------------------------------------------
export const COUNTRY_META = {
  AE: { name: 'امارات متحده عربی', flag: '🇦🇪' },
  BG: { name: 'بلغارستان', flag: '🇧🇬' },
  CA: { name: 'کانادا', flag: '🇨🇦' },
  DE: { name: 'آلمان', flag: '🇩🇪' },
  GB: { name: 'بریتانیا', flag: '🇬🇧' },
  IT: { name: 'ایتالیا', flag: '🇮🇹' },
  KZ: { name: 'قزاقستان', flag: '🇰🇿' },
  LV: { name: 'لتونی', flag: '🇱🇻' },
  NL: { name: 'هلند', flag: '🇳🇱' },
  NO: { name: 'نروژ', flag: '🇳🇴' },
  SE: { name: 'سوئد', flag: '🇸🇪' },
  TH: { name: 'تایلند', flag: '🇹🇭' },
  TR: { name: 'ترکیه', flag: '🇹🇷' },
  US: { name: 'ایالات متحده آمریکا', flag: '🇺🇸' },
  UZ: { name: 'ازبکستان', flag: '🇺🇿' },
  FR: { name: 'فرانسه', flag: '🇫🇷' },
  FI: { name: 'فنلاند', flag: '🇫🇮' },
  SG: { name: 'سنگاپور', flag: '🇸🇬' },
  RU: { name: 'روسیه', flag: '🇷🇺' },
  CN: { name: 'چین', flag: '🇨🇳' },
  CH: { name: 'سوئیس', flag: '🇨🇭' },
  KR: { name: 'کره‌جنوبی', flag: '🇰🇷' },
  UA: { name: 'اوکراین', flag: '🇺🇦' },
  VN: { name: 'ویتنام', flag: '🇻🇳' },
  BR: { name: 'برزیل', flag: '🇧🇷' },
  IN: { name: 'هند', flag: '🇮🇳' },
  RS: { name: 'صربستان', flag: '🇷🇸' },
  SK: { name: 'اسلواکی', flag: '🇸🇰' }
};

// فقط این کشورها در مخزن Z-E-U-S فایل proxy_vip دارند (بقیه ۴۰۴ هستند)
const ZEUS_VIP_COUNTRIES = new Set(['CA', 'DE', 'GB', 'TH', 'TR', 'US']);
const zeusVip = code => raw(`panel-zeus/Z-E-U-S/main/proxy_vip/${code}.txt`);

// کدام کشورها در کدام قالب کشوری فایل دارند (بازبینی اکتبر ۲۰۲۶).
// برای کشورهای غایب، ساختن آدرس فقط یک ۴۰۴ و یک subrequest هدر است.
const COUNTRY_FEED_AVAILABILITY = {
  clearSocks: new Set('CA DE GB IT NL US FR FI SG RU CN KR VN IN'.split(' ')),
  clearHttp: new Set('DE GB NL TH TR US UZ FR RU SG CN KR VN BR IN'.split(' ')),
  scrapeSocks: new Set('AE CA DE GB IT LV NL SE TH US FR FI RU SG CN KR VN UA IN BR'.split(' ')),
  scrapeHttp: new Set('AE BG CA DE GB IT KZ NL TH SE US TR UZ FI FR RU SG CH CN KR UA VN BR IN'.split(' ')),
  trioSocks: new Set('AE BG CA DE GB IT NL SE TH US FI FR SG RU CN KR CH VN UA BR IN RS SK'.split(' ')),
  trioHttp: new Set('AE CA GB DE IT KZ NL NO SE TH TR US UZ FI FR RU SG CN CH KR UA VN BR IN RS'.split(' '))
};

// منابع کشوری هر کد کشور: هر کد از چند مخزن مستقل تغذیه می‌شود تا ۴۰۴ شدن یک
// مخزن باعث خالی شدن اسکن آن کشور نشود.
export function buildCountryFeeds(code) {
  const cc = String(code || '').toUpperCase();
  if (!COUNTRY_META[cc]) return [];
  const lower = cc.toLowerCase();
  const available = COUNTRY_FEED_AVAILABILITY;
  const feeds = [
    raw(`proxifly/free-proxy-list/main/proxies/countries/${cc}/data.txt`)
  ];
  if (available.scrapeSocks.has(cc)) feeds.push(raw(`ProxyScrape/free-proxy-list/main/proxies/countries/${lower}/socks5/data.txt`));
  if (available.scrapeHttp.has(cc)) feeds.push(raw(`ProxyScrape/free-proxy-list/main/proxies/countries/${lower}/http/data.txt`));
  if (available.clearSocks.has(cc)) feeds.push(raw(`ClearProxy/checked-proxy-list/main/socks5/raw/country/${cc}.txt`));
  if (available.clearHttp.has(cc)) feeds.push(raw(`ClearProxy/checked-proxy-list/main/http/raw/country/${cc}.txt`));
  if (available.trioSocks.has(cc)) feeds.push(raw(`trio666/proxy-checker/main/country/${cc}/socks5.txt`));
  if (available.trioHttp.has(cc)) feeds.push(raw(`trio666/proxy-checker/main/country/${cc}/http.txt`));
  if (ZEUS_VIP_COUNTRIES.has(cc)) feeds.unshift(zeusVip(cc));
  return feeds;
}

export const COUNTRY_EXTRA_PROXY_SOURCES = (() => {
  const map = {};
  for (const code of Object.keys(COUNTRY_META)) map[code] = buildCountryFeeds(code);
  return map;
})();

// فیدهایی که خودشان آدرس کامل هستند (GitHub Pages) و با raw() ساخته نمی‌شوند
const ABSOLUTE_FEEDS = [
  { url: 'https://sunny9577.github.io/proxy-scraper/generated/socks5_proxies.txt', kind: 'socks5' },
  { url: 'https://sunny9577.github.io/proxy-scraper/generated/http_proxies.txt', kind: 'http' }
];

// ---------------------------------------------------------------------------
// لیست‌های عمومی
// ---------------------------------------------------------------------------
export const GLOBAL_SOCKS5_SOURCES = [
  ...SOCKS5_FEEDS.map(raw),
  ...ABSOLUTE_FEEDS.filter(feed => feed.kind === 'socks5').map(feed => feed.url)
];
export const GLOBAL_HTTP_SOURCES = [
  ...HTTP_FEEDS.map(raw),
  ...ABSOLUTE_FEEDS.filter(feed => feed.kind === 'http').map(feed => feed.url)
];
export const GLOBAL_MIXED_SOURCES = MIXED_FEEDS.map(raw);

// فید عمومی residential در حال حاضر هیچ منبع زنده‌ای ندارد؛ به‌جای نگه‌داشتن
// آدرس‌های ۴۰۴ این فهرست خالی است تا subrequest هدر نرود.
export const RESIDENTIAL_SOURCES = [];

// ---------------------------------------------------------------------------
// رجیستری یکپارچه فیدها — همین فهرست در /api/scanner/sources هم برگردانده می‌شود
// ---------------------------------------------------------------------------
export const PROXY_FEED_REGISTRY = [
  ...SOCKS5_FEEDS.map(path => ({ url: raw(path), kind: 'socks5', scope: 'global' })),
  ...HTTP_FEEDS.map(path => ({ url: raw(path), kind: 'http', scope: 'global' })),
  ...MIXED_FEEDS.map(path => ({ url: raw(path), kind: 'mixed', scope: 'global' })),
  ...ABSOLUTE_FEEDS.map(feed => ({ url: feed.url, kind: feed.kind, scope: 'global' })),
  ...Object.keys(COUNTRY_META).flatMap(code =>
    buildCountryFeeds(code).map(url => ({
      url,
      kind: guessFeedKind(url),
      scope: 'country',
      country: code
    }))
  )
];

// نوع فید از روی مسیر فایل تشخیص داده می‌شود، نه کل آدرس؛ در غیر این صورت
// خود «https://» باعث می‌شود همه چیز http شناسایی شود.
function guessFeedKind(url) {
  const path = String(url || '').toLowerCase().replace(/^https?:\/\//, '');
  if (/socks/.test(path)) return 'socks5';
  if (/https?/.test(path)) return 'http';
  return 'mixed';
}

const FEED_KIND_BY_URL = new Map(PROXY_FEED_REGISTRY.map(feed => [feed.url, feed.kind]));

// نوع اعلام‌شدهٔ یک فید (برای انتخاب پارسر و پورت پیش‌فرض)
export function getFeedKind(url) {
  return FEED_KIND_BY_URL.get(url) || guessFeedKind(url);
}

// ---------------------------------------------------------------------------
// آی‌پی‌ها
// ---------------------------------------------------------------------------
// لیست آی‌پی/دامنه ثابت کلادفلر (هر خط یک آدرس) — نمونه‌گیری زنده برای yx
export const IP_CANDIDATE_SOURCES = [
  'https://raw.githubusercontent.com/panel-zeus/Z-E-U-S/main/ips.txt'
];

// رنج‌های IPv4/IPv6 کلادفلر و سایر ارائه‌دهندگان (همه ۲۰۰ در بازبینی)
export const IP_RANGE_SOURCES = {
  ipv4: [
    'https://raw.githubusercontent.com/lord-alfred/ipranges/main/cloudflare/ipv4.txt',
    'https://raw.githubusercontent.com/mrkhachaturov/ipranges/main/cloudflare/ipv4.txt'
  ],
  ipv6: [
    'https://raw.githubusercontent.com/lord-alfred/ipranges/main/cloudflare/ipv6.txt',
    'https://raw.githubusercontent.com/lord-alfred/ipranges/main/cloudflare/ipv6_merged.txt',
    'https://raw.githubusercontent.com/mrkhachaturov/ipranges/main/cloudflare/ipv6.txt',
    'https://raw.githubusercontent.com/mrkhachaturov/ipranges/main/cloudflare/ipv6_merged.txt',
    'https://raw.githubusercontent.com/lord-alfred/ipranges/main/telegram/ipv6.txt',
    'https://raw.githubusercontent.com/lord-alfred/ipranges/main/telegram/ipv6_merged.txt',
    'https://raw.githubusercontent.com/lord-alfred/ipranges/main/google/ipv6.txt',
    'https://raw.githubusercontent.com/lord-alfred/ipranges/main/google/ipv6_merged.txt',
    'https://raw.githubusercontent.com/lord-alfred/ipranges/main/apple-proxy/ipv6.txt',
    'https://raw.githubusercontent.com/lord-alfred/ipranges/main/apple-proxy/ipv6_merged.txt',
    'https://raw.githubusercontent.com/lord-alfred/ipranges/main/microsoft/ipv6.txt',
    'https://raw.githubusercontent.com/lord-alfred/ipranges/main/microsoft/ipv6_merged.txt',
    'https://raw.githubusercontent.com/XIU2/CloudflareSpeedTest/master/ipv6.txt'
  ],
  // رنج‌های IPv6 سایر ارائه‌دهندگان (برای تست دستی/پیشرفته)
  extraIpv6: [
    'https://raw.githubusercontent.com/lord-alfred/ipranges/main/all/ipv6.txt',
    'https://raw.githubusercontent.com/lord-alfred/ipranges/main/digitalocean/ipv6.txt',
    'https://raw.githubusercontent.com/lord-alfred/ipranges/main/linode/ipv6.txt',
    'https://raw.githubusercontent.com/lord-alfred/ipranges/main/vultr/ipv6.txt',
    'https://raw.githubusercontent.com/lord-alfred/ipranges/main/amazon/ipv6.txt',
    'https://raw.githubusercontent.com/mrkhachaturov/ipranges/main/all/ipv6.txt',
    'https://raw.githubusercontent.com/dibdot/DoH-IP-blocklists/master/doh-ipv6.txt',
    'https://raw.githubusercontent.com/oneoffdallas/dohservers/master/ipv6list.txt'
  ]
};

// ============================================================================
// WARP (Cloudflare WireGuard) — ثابت‌های رسمی و نقاط پایانی شناخته‌شده
// ============================================================================

// سرویس ثبت‌نام دستگاه WARP (عمومی و بدون احراز هویت) — برای دریافت reserved و آدرس تونل
export const WARP_REGISTRATION_URL = 'https://api.cloudflareclient.com/v0a2158/reg';
export const WARP_CLIENT_VERSION = 'a-6.30-2158';

// کلید عمومی همتا (پیش‌فرض کلادفلر) — از پاسخ همان سرویس ثبت‌نام
export const WARP_PEER_PUBLIC_KEY = 'bmXOC+F1FxEMF9dyiK2H5/1SUtzH0JuVo51h2wPfgyo=';
export const WARP_DEFAULT_HOST = 'engage.cloudflareclient.com';
export const WARP_DEFAULT_PORT = 2408;
export const WARP_DEFAULT_ADDRESS = '172.16.0.2';

// پورت‌های رسمی WARP (به ترتیب اولویت)
export const WARP_ENDPOINT_PORTS = [2408, 500, 1701, 4500];

// رنج‌های رسمی ingress کلادفلر — چندلوکیشن با همین نقاط پایانی ساخته می‌شود
export const WARP_ENDPOINT_IPS = [
  '162.159.192.1',
  '162.159.193.1',
  '162.159.195.1',
  '162.159.204.1',
  '188.114.96.1',
  '188.114.97.1',
  '188.114.98.1',
  '188.114.99.1',
  '2606:4700:d0::a29f:c001',
  '2606:4700:d1::a29f:c001'
];

// ============================================================================
// OpenVPN — منابع زندهٔ پروفایل عمومی
// ۱) مخزن گیت‌هاب با پروفایل‌های ‎.ovpn‎ به‌صورت فایل مستقل (از داخل ورکر قابل خواندن است)
// ۲) لیست CSV ونگیت (در برخی شبکه‌های خروجی کلادفلر مسدود است؛ فقط به‌عنوان پشتیبان)
// ============================================================================

const AUTO_OVPN = file => `https://raw.githubusercontent.com/9xN/auto-ovpn/main/configs/${file}`;

export const OPENVPN_RAW_PROFILE_SOURCES = [
  AUTO_OVPN('server_0_JP.ovpn'),
  AUTO_OVPN('server_48_US.ovpn'),
  AUTO_OVPN('server_20_GB.ovpn'),
  AUTO_OVPN('server_12_KR.ovpn'),
  AUTO_OVPN('server_40_TH.ovpn'),
  AUTO_OVPN('server_63_FR.ovpn'),
  AUTO_OVPN('server_66_BR.ovpn'),
  AUTO_OVPN('server_71_RU.ovpn'),
  AUTO_OVPN('server_29_RO.ovpn'),
  AUTO_OVPN('server_23_TH.ovpn'),
  AUTO_OVPN('server_93_RU.ovpn'),
  AUTO_OVPN('server_59_KR.ovpn')
];

export const OPENVPN_CSV_SOURCES = [
  'https://www.vpngate.net/api/iphone/'
];

// نام قدیمی برای سازگاری
export const OPENVPN_PROFILE_SOURCES = OPENVPN_RAW_PROFILE_SOURCES;

// کاربر/رمز عمومی سرورهای VPNGate
export const OPENVPN_PUBLIC_USER = 'vpn';
export const OPENVPN_PUBLIC_PASS = 'vpn';
