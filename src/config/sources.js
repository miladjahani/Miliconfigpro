// ============================================================================
// miliconfig v3.1 - استخر منابع زنده اسکنر (پروکسی‌های کشوری، لیست‌های عمومی و رنج‌های IP)
// همه لیست‌ها هر بار به‌صورت زنده خوانده می‌شوند (بدون کش سمت سرور) و اسکنر
// از هر استخر یک برش چرخشی برمی‌دارد تا سقف subrequest کلادفلر رعایت شود.
// ============================================================================

const ZEUS_VIP = code => `https://raw.githubusercontent.com/panel-zeus/Z-E-U-S/main/proxy_vip/${code}.txt`;
const TRIO = (code, kind) => `https://raw.githubusercontent.com/trio666/proxy-checker/main/country/${code}/${kind}.txt`;
// منابع تازه و فعال (بررسی‌شده) — تاریخچه به‌روزرسانی خودکار دارند
const CLEARPROXY = (code, kind) => `https://raw.githubusercontent.com/ClearProxy/checked-proxy-list/main/${kind}/raw/country/${code}.txt`;
const PROXYSCRAPE = (code, kind) => `https://raw.githubusercontent.com/ProxyScrape/free-proxy-list/main/proxies/countries/${String(code).toLowerCase()}/${kind}/data.txt`;
const PROXIFLY_CC = code => `https://raw.githubusercontent.com/proxifly/free-proxy-list/main/proxies/countries/${String(code).toUpperCase()}/data.txt`;

// منابع اختصاصی هر کشور (Z-E-U-S vip + trio666 کشوری)
export const COUNTRY_EXTRA_PROXY_SOURCES = {
  AE: [ZEUS_VIP('AE')],
  BG: [ZEUS_VIP('BG')],
  CA: [ZEUS_VIP('CA')],
  DE: [ZEUS_VIP('DE'), TRIO('DE', 'socks5'), TRIO('DE', 'http')],
  GB: [ZEUS_VIP('GB')],
  IT: [ZEUS_VIP('IT')],
  KZ: [ZEUS_VIP('KZ')],
  LV: [ZEUS_VIP('LV')],
  NL: [ZEUS_VIP('NL'), TRIO('NL', 'socks5'), TRIO('NL', 'http')],
  NO: [ZEUS_VIP('NO')],
  SE: [ZEUS_VIP('SE')],
  TH: [ZEUS_VIP('TH'), TRIO('TH', 'socks5'), TRIO('TH', 'http')],
  TR: [ZEUS_VIP('TR')],
  US: [ZEUS_VIP('US'), TRIO('US', 'socks5'), TRIO('US', 'http')],
  UZ: [ZEUS_VIP('UZ')],
  FR: ['https://raw.githubusercontent.com/dimzon/scaling-sniffle/main/by-country/FR.txt'],
  FI: [TRIO('FI', 'socks5'), TRIO('FI', 'http')],
  SG: [TRIO('SG', 'socks5'), TRIO('SG', 'http')],
  RU: [TRIO('RU', 'socks5'), TRIO('RU', 'http'), 'https://raw.githubusercontent.com/dimzon/scaling-sniffle/main/by-country/RU.txt'],
  CN: [TRIO('CN', 'socks5'), TRIO('CN', 'http')],
  CH: [TRIO('CH', 'socks5'), TRIO('CH', 'http')],
  KR: [TRIO('KR', 'socks5'), TRIO('KR', 'http')],
  UA: [TRIO('UA', 'socks5'), TRIO('UA', 'http')],
  VN: [TRIO('VN', 'socks5'), TRIO('VN', 'http')],
  BR: [TRIO('BR', 'socks5'), TRIO('BR', 'http')],
  IN: [TRIO('IN', 'socks5'), TRIO('IN', 'http')],
  RS: [TRIO('RS', 'socks5'), TRIO('RS', 'http')],
  SK: [TRIO('SK', 'socks5'), TRIO('SK', 'http')]
};

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

// همه کشورها علاوه بر منابع اختصاصی، از سه منبع زنده کشوری جدید هم تغذیه می‌شوند
for (const code of Object.keys(COUNTRY_META)) {
  const extra = COUNTRY_EXTRA_PROXY_SOURCES[code] || [];
  COUNTRY_EXTRA_PROXY_SOURCES[code] = [...new Set([
    ...extra,
    CLEARPROXY(code, 'socks5'),
    CLEARPROXY(code, 'http'),
    PROXYSCRAPE(code, 'socks5'),
    PROXYSCRAPE(code, 'http'),
    PROXIFLY_CC(code)
  ])];
}

// لیست‌های عمومی SOCKS5 (هر بار زنده، برش چرخشی)
export const GLOBAL_SOCKS5_SOURCES = [
  'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/socks5.txt',
  'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies_anonymous/socks5.txt',
  'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies_geolocation/socks5.txt',
  'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies_geolocation_anonymous/socks5.txt',
  'https://raw.githubusercontent.com/rdavydov/proxy-list/main/proxies/socks5.txt',
  'https://raw.githubusercontent.com/rdavydov/proxy-list/main/proxies_anonymous/socks5.txt',
  'https://raw.githubusercontent.com/rdavydov/proxy-list/main/proxies_geolocation/socks5.txt',
  'https://raw.githubusercontent.com/rdavydov/proxy-list/main/proxies_geolocation_anonymous/socks5.txt',
  'https://raw.githubusercontent.com/zloi-user/hideip.me/main/socks5.txt',
  'https://raw.githubusercontent.com/vakhov/fresh-proxy-list/master/socks5.txt',
  'https://raw.githubusercontent.com/hookzof/socks5_list/master/proxy.txt',
  'https://raw.githubusercontent.com/MuRongPIG/Proxy-Master/main/socks5.txt',
  'https://raw.githubusercontent.com/Noctiro/getproxy/master/file/socks5.txt',
  'https://raw.githubusercontent.com/Noctiro/getproxy/master/file/socks5_with_protocol.txt',
  'https://raw.githubusercontent.com/roosterkid/openproxylist/main/SOCKS5_RAW.txt',
  'https://raw.githubusercontent.com/roosterkid/openproxylist/main/SOCKS5.txt',
  'https://raw.githubusercontent.com/sunny9577/proxy-scraper/master/generated/socks5_proxies.txt',
  'https://sunny9577.github.io/proxy-scraper/generated/socks5_proxies.txt',
  'https://raw.githubusercontent.com/trio666/proxy-checker/main/socks5.txt',
  'https://raw.githubusercontent.com/TheSpeedX/SOCKS-List/master/socks5.txt',
  'https://raw.githubusercontent.com/proxifly/free-proxy-list/main/proxies/protocols/socks5/data.txt',
  'https://raw.githubusercontent.com/ikimono-afk/proxy-api/main/proxies/socks5.txt',
  'https://raw.githubusercontent.com/ikimono-afk/proxy-api/main/proxies_anonymous/socks5.txt',
  'https://raw.githubusercontent.com/ikimono-afk/proxy-api/main/proxies_geolocation/socks5.txt',
  'https://raw.githubusercontent.com/ikimono-afk/proxy-api/main/proxies_geolocation_anonymous/socks5.txt',
  'https://raw.githubusercontent.com/ProxyScraper/ProxyScraper/main/socks5.txt',
  'https://raw.githubusercontent.com/r00tee/Proxy-List/main/Socks5.txt',
  'https://raw.githubusercontent.com/jetkai/proxy-list/main/archive/txt/proxies-socks5.txt',
  'https://raw.githubusercontent.com/iplocate/free-proxy-list/main/protocols/socks5.txt',
  'https://raw.githubusercontent.com/officialputuid/KangProxy/main/socks5/socks5.txt',
  'https://raw.githubusercontent.com/karimi-mohammad/SOCKS5-Proxy-Checker/main/socks5.txt',
  'https://raw.githubusercontent.com/FosterG4/proxy-list/main/socks5.txt',
  'https://raw.githubusercontent.com/yosephplex/proxy-updater/main/proxies/socks5.txt',
  'https://raw.githubusercontent.com/readloud/clauneck/main/PROXY-List/socks5.txt',
  'https://raw.githubusercontent.com/ItzRazvyy/ProxyList/main/socks5.txt',
  'https://raw.githubusercontent.com/i-am-unbekannt/BLITZPROXY/main/out-files/socks5.txt',
  'https://raw.githubusercontent.com/caedencode/proxy-list/main/socks5.txt',
  'https://raw.githubusercontent.com/ProxyListt/PROXY-list/main/socks5.txt',
  'https://raw.githubusercontent.com/Daniel3356/Proxy_Full-list/main/socks5.txt',
  'https://raw.githubusercontent.com/proxygenerator1/ProxyGenerator/main/MostStable/socks5.txt',
  'https://raw.githubusercontent.com/proxygenerator1/ProxyGenerator/main/Stable/socks5.txt',
  // منابع تازه (بررسی‌شده و فعال — اکتبر ۲۰۲۶)
  'https://raw.githubusercontent.com/ProxyScrape/free-proxy-list/main/proxies/protocols/socks5/data.txt',
  'https://raw.githubusercontent.com/proxmint/free-proxy-list/main/proxies/socks5.txt',
  'https://raw.githubusercontent.com/Thordata/awesome-free-proxy-list/main/proxies/socks5.txt',
  'https://raw.githubusercontent.com/ClearProxy/checked-proxy-list/main/socks5/raw/all.txt',
  'https://raw.githubusercontent.com/VPSLabCloud/VPSLab-Free-Proxy-List/main/socks5_all.txt',
  'https://raw.githubusercontent.com/komutan234/Proxy-List-Free/main/proxies/socks5.txt',
  'https://raw.githubusercontent.com/ALIILAPRO/Proxy/main/socks5.txt',
  'https://raw.githubusercontent.com/iplocate/free-proxy-list/main/protocols/socks5.txt'
];

// لیست‌های عمومی HTTP/HTTPS
export const GLOBAL_HTTP_SOURCES = [
  'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt',
  'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies_anonymous/http.txt',
  'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies_geolocation/http.txt',
  'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies_geolocation_anonymous/http.txt',
  'https://raw.githubusercontent.com/rdavydov/proxy-list/main/proxies/http.txt',
  'https://raw.githubusercontent.com/rdavydov/proxy-list/main/proxies_anonymous/http.txt',
  'https://raw.githubusercontent.com/rdavydov/proxy-list/main/proxies_geolocation/http.txt',
  'https://raw.githubusercontent.com/rdavydov/proxy-list/main/proxies_geolocation_anonymous/http.txt',
  'https://raw.githubusercontent.com/zloi-user/hideip.me/main/http.txt',
  'https://raw.githubusercontent.com/zloi-user/hideip.me/main/https.txt',
  'https://raw.githubusercontent.com/vakhov/fresh-proxy-list/master/http.txt',
  'https://raw.githubusercontent.com/vakhov/fresh-proxy-list/master/https.txt',
  'https://raw.githubusercontent.com/Vadim287/free-proxy/main/proxies/http.txt',
  'https://raw.githubusercontent.com/Vadim287/free-proxy/main/proxies/https.txt',
  'https://raw.githubusercontent.com/MuRongPIG/Proxy-Master/main/http.txt',
  'https://raw.githubusercontent.com/Noctiro/getproxy/master/file/http.txt',
  'https://raw.githubusercontent.com/Noctiro/getproxy/master/file/https.txt',
  'https://raw.githubusercontent.com/Noctiro/getproxy/master/file/http_with_protocol.txt',
  'https://raw.githubusercontent.com/Noctiro/getproxy/master/file/https_with_protocol.txt',
  'https://raw.githubusercontent.com/roosterkid/openproxylist/main/HTTPS_RAW.txt',
  'https://raw.githubusercontent.com/roosterkid/openproxylist/main/HTTPS.txt',
  'https://raw.githubusercontent.com/sunny9577/proxy-scraper/master/generated/http_proxies.txt',
  'https://sunny9577.github.io/proxy-scraper/generated/http_proxies.txt',
  'https://raw.githubusercontent.com/trio666/proxy-checker/main/http.txt',
  'https://raw.githubusercontent.com/trio666/proxy-checker/main/https.txt',
  'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt',
  'https://raw.githubusercontent.com/proxifly/free-proxy-list/main/proxies/protocols/http/data.txt',
  'https://raw.githubusercontent.com/proxifly/free-proxy-list/main/proxies/protocols/https/data.txt',
  'https://raw.githubusercontent.com/ikimono-afk/proxy-api/main/proxies/http.txt',
  'https://raw.githubusercontent.com/ikimono-afk/proxy-api/main/proxies_anonymous/http.txt',
  'https://raw.githubusercontent.com/ikimono-afk/proxy-api/main/proxies_geolocation/http.txt',
  'https://raw.githubusercontent.com/ikimono-afk/proxy-api/main/proxies_geolocation_anonymous/http.txt',
  'https://raw.githubusercontent.com/ProxyScraper/ProxyScraper/main/http.txt',
  'https://raw.githubusercontent.com/r00tee/Proxy-List/main/Https.txt',
  'https://raw.githubusercontent.com/jetkai/proxy-list/main/archive/txt/proxies-http.txt',
  'https://raw.githubusercontent.com/jetkai/proxy-list/main/archive/txt/proxies-https.txt',
  'https://raw.githubusercontent.com/iplocate/free-proxy-list/main/protocols/http.txt',
  'https://raw.githubusercontent.com/iplocate/free-proxy-list/main/protocols/https.txt',
  'https://raw.githubusercontent.com/officialputuid/KangProxy/main/http/http.txt',
  'https://raw.githubusercontent.com/officialputuid/KangProxy/main/https/https.txt',
  'https://raw.githubusercontent.com/elliottophellia/yakumo/master/results/http/global/http_checked.txt',
  'https://raw.githubusercontent.com/Zaeem20/FREE_PROXIES_LIST/master/http.txt',
  'https://raw.githubusercontent.com/Zaeem20/FREE_PROXIES_LIST/master/https.txt',
  'https://raw.githubusercontent.com/Anonym0usWork1221/Free-Proxies/main/proxy_files/http_proxies.txt',
  'https://raw.githubusercontent.com/Anonym0usWork1221/Free-Proxies/main/proxy_files/https_proxies.txt',
  'https://raw.githubusercontent.com/dpangestuw/Free-Proxy/main/http_proxies.txt',
  'https://raw.githubusercontent.com/Tsprnay/Proxy-lists/master/proxies/http.txt',
  'https://raw.githubusercontent.com/Tsprnay/Proxy-lists/master/proxies/https.txt',
  'https://raw.githubusercontent.com/mzyui/proxy-list/main/http.txt',
  'https://raw.githubusercontent.com/ErcinDedeoglu/proxies/main/proxies/http.txt',
  'https://raw.githubusercontent.com/ErcinDedeoglu/proxies/main/proxies/https.txt',
  'https://raw.githubusercontent.com/ALIILAPRO/Proxy/main/http.txt',
  'https://raw.githubusercontent.com/Skillter/ProxyGather/master/proxies/working-proxies-http.txt',
  'https://raw.githubusercontent.com/SevenworksDev/proxy-list/main/proxies/http.txt',
  'https://raw.githubusercontent.com/SevenworksDev/proxy-list/main/proxies/https.txt',
  'https://raw.githubusercontent.com/Vann-Dev/proxy-list/main/proxies/http.txt',
  'https://raw.githubusercontent.com/Vann-Dev/proxy-list/main/proxies/https.txt',
  'https://raw.githubusercontent.com/TuanMinPay/live-proxy/master/http.txt',
  'https://raw.githubusercontent.com/vmheaven/VMHeaven-Free-Proxy-Updated/main/http.txt',
  'https://raw.githubusercontent.com/vmheaven/VMHeaven-Free-Proxy-Updated/main/https.txt',
  'https://raw.githubusercontent.com/yosephplex/proxy-updater/main/proxies/http.txt',
  'https://raw.githubusercontent.com/readloud/clauneck/main/PROXY-List/http.txt',
  'https://raw.githubusercontent.com/ItzRazvyy/ProxyList/main/http.txt',
  'https://raw.githubusercontent.com/i-am-unbekannt/BLITZPROXY/main/out-files/http.txt',
  'https://raw.githubusercontent.com/caedencode/proxy-list/main/http.txt',
  'https://raw.githubusercontent.com/ProxyListt/PROXY-list/main/http.txt',
  'https://raw.githubusercontent.com/Daniel3356/Proxy_Full-list/main/http.txt',
  'https://raw.githubusercontent.com/proxygenerator1/ProxyGenerator/main/MostStable/http.txt',
  'https://raw.githubusercontent.com/proxygenerator1/ProxyGenerator/main/Stable/http.txt',
  // منابع تازه (بررسی‌شده و فعال — اکتبر ۲۰۲۶)
  'https://raw.githubusercontent.com/ProxyScrape/free-proxy-list/main/proxies/protocols/http/data.txt',
  'https://raw.githubusercontent.com/proxmint/free-proxy-list/main/proxies/http.txt',
  'https://raw.githubusercontent.com/Thordata/awesome-free-proxy-list/main/proxies/http.txt',
  'https://raw.githubusercontent.com/ClearProxy/checked-proxy-list/main/http/raw/all.txt',
  'https://raw.githubusercontent.com/VPSLabCloud/VPSLab-Free-Proxy-List/main/http_all.txt',
  'https://raw.githubusercontent.com/komutan234/Proxy-List-Free/main/proxies/http.txt',
  'https://raw.githubusercontent.com/ALIILAPRO/Proxy/main/http.txt',
  'https://raw.githubusercontent.com/iplocate/free-proxy-list/main/protocols/http.txt'
];

// لیست‌های مسکونی (residential) — به‌عنوان استخر مکمل
export const RESIDENTIAL_SOURCES = [
  'https://raw.githubusercontent.com/shadowsock/proxy-lists/main/residential.txt',
  'https://raw.githubusercontent.com/proxifly/free-proxy-list/main/proxies/types/residential/data.txt',
  'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/types/residential.txt',
  'https://raw.githubusercontent.com/rdavydov/proxy-list/main/proxies_types/residential.txt',
  'https://raw.githubusercontent.com/MuRongPIG/Proxy-Master/main/residential.txt',
  'https://raw.githubusercontent.com/parser-free/proxy-list/main/residential/proxy.txt',
  'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/residential.txt'
];

// لیست‌های آی‌پی/دامنه ثابت کلادفلر (هر خط یک آدرس) — نمونه‌گیری زنده برای yx
// منبع Z-E-U-S شامل هزاران آی‌پی فرانت‌شده کلادفلر است که به‌عنوان آدرس نود پاسخ می‌دهند.
export const IP_CANDIDATE_SOURCES = [
  'https://raw.githubusercontent.com/panel-zeus/Z-E-U-S/main/ips.txt'
];

// رنج‌های IPv4/IPv6 کلادفلر برای تست و انتخاب آی‌پی ثابت
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
    'https://raw.githubusercontent.com/lord-alfred/ipranges/main/apple-proxy/ipv6.txt',
    'https://raw.githubusercontent.com/lord-alfred/ipranges/main/digitalocean/ipv6.txt',
    'https://raw.githubusercontent.com/lord-alfred/ipranges/main/linode/ipv6.txt',
    'https://raw.githubusercontent.com/lord-alfred/ipranges/main/vultr/ipv6.txt',
    'https://raw.githubusercontent.com/lord-alfred/ipranges/main/oracle/ipv6.txt',
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
// (انتخاب کشور بر اساس مسیریابی کلادفلر است؛ برچسب هر نود قابل تغییر از پنل است)
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
