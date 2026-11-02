// ============================================================================
// miliconfig v3.2 - مرکز کنترل مدیریت پنل
// بدون ایموجی - تمام آیکون‌ها SVG اختصاصی - دکمه‌ها با event delegation
// ============================================================================

import {
  BRAND_NAME,
  BRAND_UPPER,
  CF_PORT_CHOICES,
  CONFIG_DEFAULTS,
  COUNTRY_PROXY_SOURCES,
  DNS_PRESETS,
  ECH_DOMAINS,
  FINGERPRINT_PRESETS,
  FRAGMENT_PRESETS,
  MAX_USERS_LIMIT,
  PATH_PATTERNS,
  TELEGRAM_SUPPORT,
  VERSION
} from '../config/defaults.js';
import { USER_PRESETS } from '../config/presets.js';
import { EDGE_VIP_COUNTRIES } from '../config/sources.js';
import { FAVICON_DATA_URI, SHIELD_LOGO_SVG, icon, stripEmoji } from './icons.js';

const SUPPORT_URL = `https://t.me/${String(TELEGRAM_SUPPORT).replace(/^@/, '')}`;

// دیکشنری دوزبانه پنل (فارسی / انگلیسی)
const PANEL_I18N = {
  fa: {
    'nav.dashboard': 'داشبورد', 'nav.users': 'کاربران', 'nav.settings': 'تنظیمات',
    'nav.scanner': 'اسکنر', 'nav.locations': 'چندلوکیشن',
    'top.support': 'پشتیبانی', 'top.multi': 'چندلوکیشن', 'top.theme': 'حالت روز', 'top.lang': 'English',
    'panel.dashboard': 'داشبورد', 'panel.dashboardSub': 'وضعیت زنده سیستم و مصرف',
    'panel.users': 'کاربران', 'panel.usersSub': 'مدیریت اشتراک و محدودیت',
    'panel.settings': 'تنظیمات', 'panel.settingsSub': 'هسته پروکسی، شبکه و پنل',
    'panel.scanner': 'اسکنر زنده', 'panel.scannerSub': 'دریافت زنده پروکسی و آی‌پی ثابت (IPv4/IPv6) به تفکیک کشور',
    'panel.locations': 'چندلوکیشن', 'panel.locationsSub': 'ساب‌لینک به تفکیک کشور',
    'btn.reload': 'بروزرسانی', 'btn.createUser': 'ایجاد کاربر', 'btn.newUser': 'کاربر جدید',
    'btn.save': 'ذخیره تنظیمات', 'btn.reset': 'بازنشانی پیش‌فرض', 'btn.copyMaster': 'کپی ساب‌لینک اصلی',
    'btn.scan': 'دریافت و تست', 'btn.password': 'تغییر رمز مدیر',
    'metric.users': 'کاربران فعال', 'metric.traffic': 'حجم مصرف‌شده',
    'metric.ips': 'آی‌پی‌های سالم', 'metric.protocols': 'پروتکل‌های فعال',
    'settings.protocols': 'پروتکل‌ها و قابلیت‌ها', 'settings.network': 'شبکه و ترنسپورت', 'settings.panel': 'پنل و امنیت',
    'scanner.country': 'کشور', 'scanner.kind': 'نوع', 'scanner.family': 'خانواده آی‌پی',
    'scanner.count': 'تعداد',    'scanner.addCfIps': 'افزودن آی‌پی‌های پیش‌فرض کلادفلر به آدرس‌های دستی',
    'scanner.addCfDomains': 'افزودن دامنه‌های پیش‌فرض کلادفلر به آدرس‌های دستی',
    'btn.editUser': 'ویرایش', 'card.nodesAuto': 'تعداد نود: خودکار',
    'modal.create': 'ایجاد کاربر جدید', 'modal.username': 'نام کاربری', 'modal.preset': 'پریست',
    'modal.limit': 'حجم مجاز (GB) — صفر برای نامحدود', 'modal.days': 'مدت اعتبار (روز) — صفر برای بدون انقضا',
    'modal.nodes': 'تعداد نود در ساب‌لینک', 'modal.createBtn': 'ساخت کاربر', 'modal.cancel': 'انصراف',
    'modal.advanced': 'تنظیمات منحصر به فرد این کاربر',
    'modal.password': 'تغییر رمز مدیر', 'modal.old': 'رمز فعلی', 'modal.new': 'رمز جدید',
    'modal.confirmNew': 'تکرار رمز جدید', 'modal.savePassword': 'ذخیره رمز',
    'field.echDomain': 'دامنه ECH', 'field.dns': 'DNS سفارشی (DoH)', 'field.fragPreset': 'پریست فرگمنت',
    'field.ports': 'پورت‌های نود', 'field.fp': 'اثر انگشت TLS', 'field.patt': 'الگوی مسیر',
    'field.rotation': 'چرخش آی‌پی', 'field.proxyIP': 'آدرس واسط سفارشی', 'field.locCount': 'تعداد نود چندلوکیشن',
    'field.outProxy': 'پروکسی خروجی', 'field.dnsHint': 'یک DNS از لیست انتخاب کنید یا مقدار دلخواه DoH بنویسید.',
    'field.adminPath': 'مسیر مدیریت تصادفی', 'field.customPath': 'مسیر سفارشی پنل',
    'field.homepage': 'صفحهٔ استتار', 'field.yx': 'آدرس‌های دستی', 'field.nodeCount': 'تعداد نود هر کاربر',
    'warn.title': 'هشدار تداخل تنظیمات:',
    'card.usage': 'مصرف', 'card.expiry': 'انقضا', 'card.unlimited': 'نامحدود',
    'card.noExpiry': 'بدون انقضا', 'card.nodes': 'نود', 'card.active': 'فعال',
    'card.inactive': 'غیرفعال', 'card.preset': 'پریست', 'card.subscription': 'اشتراک فعال',
    'btn.copySub': 'ساب', 'btn.status': 'وضعیت', 'btn.resetUser': 'ریست', 'btn.testNodes': 'تست اتصال',
    'btn.domainSub': 'دامنه‌ها',
    'btn.rotatePath': 'مسیر جدید', 'btn.addToYx': 'افزودن به آدرس‌های دستی', 'btn.connectS': 'اتصال به پروکسی خروجی',
    'scan.colCountry': 'کشور', 'scan.colAddr': 'آدرس / پورت', 'scan.colType': 'نوع / پروتکل',
    'scan.colPing': 'پینگ', 'scan.colStatus': 'وضعیت', 'scan.colAction': 'عملیات',
    'scan.online': 'آنلاین', 'scan.unverified': 'پیشنهادی', 'scan.ipStatic': 'آی‌پی ثابت',
    'scan.proxy': 'پروکسی', 'scan.domain': 'دامنه', 'scan.idle': 'برای شروع، دریافت و تست را بزنید.',
    'scan.testing': 'در حال تست...', 'scan.none': 'موردی یافت نشد.',
    'toast.copied': 'در حافظه کپی شد', 'toast.linkCopied': 'لینک کپی شد',
    'toast.masterCopied': 'ساب‌لینک اصلی کپی شد', 'toast.saveOk': 'تنظیمات ذخیره شد',
    'toast.saveErr': 'خطا در ذخیره تنظیمات', 'toast.network': 'خطای شبکه',
    'toast.testingNodes': 'در حال تست اتصال نودها...', 'toast.rotateConfirm': 'مسیر مدیریت عوض شود؟ مسیر قبلی دیگر کار نمی‌کند.'
  },
  en: {
    'nav.dashboard': 'Dashboard', 'nav.users': 'Users', 'nav.settings': 'Settings',
    'nav.scanner': 'Scanner', 'nav.locations': 'Locations',
    'top.support': 'Support', 'top.multi': 'Locations', 'top.theme': 'Light mode', 'top.lang': 'فارسی',
    'panel.dashboard': 'Dashboard', 'panel.dashboardSub': 'Live system status and usage',
    'panel.users': 'Users', 'panel.usersSub': 'Subscriptions and limits',
    'panel.settings': 'Settings', 'panel.settingsSub': 'Proxy core, network and panel',
    'panel.scanner': 'Live scanner', 'panel.scannerSub': 'Live proxies and static IPs (IPv4/IPv6) by country',
    'panel.locations': 'Locations', 'panel.locationsSub': 'Country-specific subscriptions',
    'btn.reload': 'Refresh', 'btn.createUser': 'Create user', 'btn.newUser': 'New user',
    'btn.save': 'Save settings', 'btn.reset': 'Reset defaults', 'btn.copyMaster': 'Copy master subscription',
    'btn.scan': 'Fetch & test', 'btn.password': 'Change admin password',
    'metric.users': 'Active users', 'metric.traffic': 'Traffic used',
    'metric.ips': 'Healthy IPs', 'metric.protocols': 'Active protocols',
    'settings.protocols': 'Protocols & features', 'settings.network': 'Network & transport', 'settings.panel': 'Panel & security',
    'scanner.country': 'Country', 'scanner.kind': 'Type', 'scanner.family': 'IP family',
    'scanner.count': 'Count',    'scanner.addCfIps': 'Add Cloudflare default IPs to manual addresses',
    'scanner.addCfDomains': 'Add Cloudflare default domains to manual addresses',
    'btn.editUser': 'Edit', 'card.nodesAuto': 'Nodes: automatic',
    'modal.create': 'Create new user', 'modal.username': 'Username', 'modal.preset': 'Preset',
    'modal.limit': 'Data limit (GB) — 0 for unlimited', 'modal.days': 'Validity (days) — 0 for never',
    'modal.nodes': 'Nodes in subscription', 'modal.createBtn': 'Create user', 'modal.cancel': 'Cancel',
    'modal.advanced': 'Unique settings for this user',
    'modal.password': 'Change admin password', 'modal.old': 'Current password', 'modal.new': 'New password',
    'modal.confirmNew': 'Confirm new password', 'modal.savePassword': 'Save password',
    'field.echDomain': 'ECH domain', 'field.dns': 'Custom DNS (DoH)', 'field.fragPreset': 'Fragment preset',
    'field.ports': 'Node ports', 'field.fp': 'TLS fingerprint', 'field.patt': 'Path pattern',
    'field.rotation': 'IP rotation', 'field.proxyIP': 'Custom proxy address', 'field.locCount': 'Location node count',
    'field.outProxy': 'Outbound proxy', 'field.dnsHint': 'Pick a DNS from the list or type a custom DoH value.',
    'field.adminPath': 'Random admin path', 'field.customPath': 'Custom panel path',
    'field.homepage': 'Camouflage page', 'field.yx': 'Manual addresses', 'field.nodeCount': 'Nodes per user',
    'warn.title': 'Settings conflict warning:',
    'card.usage': 'Usage', 'card.expiry': 'Expiry', 'card.unlimited': 'Unlimited',
    'card.noExpiry': 'No expiry', 'card.nodes': 'nodes', 'card.active': 'Active',
    'card.inactive': 'Disabled', 'card.preset': 'Preset', 'card.subscription': 'Active subscription',
    'btn.copySub': 'Sub', 'btn.status': 'Status', 'btn.resetUser': 'Reset', 'btn.testNodes': 'Test',
    'btn.domainSub': 'Domains',
    'btn.rotatePath': 'New path', 'btn.addToYx': 'Add to manual addresses', 'btn.connectS': 'Connect to egress proxy',
    'scan.colCountry': 'Country', 'scan.colAddr': 'Address / port', 'scan.colType': 'Type / protocol',
    'scan.colPing': 'Ping', 'scan.colStatus': 'Status', 'scan.colAction': 'Action',
    'scan.online': 'Online', 'scan.unverified': 'Suggested', 'scan.ipStatic': 'Static IP',
    'scan.proxy': 'Proxy', 'scan.domain': 'Domain', 'scan.idle': 'Press fetch & test to start.',
    'scan.testing': 'Testing...', 'scan.none': 'Nothing found.',
    'toast.copied': 'Copied', 'toast.linkCopied': 'Link copied',
    'toast.masterCopied': 'Master subscription copied', 'toast.saveOk': 'Settings saved',
    'toast.saveErr': 'Failed to save settings', 'toast.network': 'Network error',
    'toast.testingNodes': 'Testing node connectivity...', 'toast.rotateConfirm': 'Rotate the admin path? The old path will stop working.'
  }
};

function countryOptions() {
  return Object.entries(COUNTRY_PROXY_SOURCES)
    .map(([code, c]) => `<option value="${code}">${c.name} — ${code}</option>`)
    .join('');
}

export function renderAdminDashboardHtml(initialData = {}) {
  const config = initialData.config || CONFIG_DEFAULTS;
  const safeInitialJson = JSON.stringify({
    brand: BRAND_NAME,
    version: VERSION,
    defaults: CONFIG_DEFAULTS,
    presets: USER_PRESETS,
    config,
    users: initialData.users || [],
    diagnostics: initialData.diagnostics || {},
    adminPath: initialData.adminPath || '',
    // فقط نام کشورها به کلاینت می‌رود (آدرس منابع داخلی لازم نیست در صفحه باشد)
    countrySources: Object.keys(COUNTRY_PROXY_SOURCES).reduce(function(acc, code) {
      var item = COUNTRY_PROXY_SOURCES[code] || {};
      acc[code] = { name: item.name || code, flag: item.flag || '' };
      return acc;
    }, {}),
    vipCountries: EDGE_VIP_COUNTRIES,
    maxUsersLimit: MAX_USERS_LIMIT,
    telegramSupport: TELEGRAM_SUPPORT,
    dnsPresets: DNS_PRESETS,
    portChoices: CF_PORT_CHOICES,
    echDomains: ECH_DOMAINS,
    fragmentPresets: FRAGMENT_PRESETS,
    pathPatterns: PATH_PATTERNS,
    fingerprints: FINGERPRINT_PRESETS,
    officialIps: initialData.officialIps || [],
    officialIpv6: initialData.officialIpv6 || [],
    directDomains: initialData.directDomains || [],
    i18n: PANEL_I18N
  }).replace(/</g, '\\u003c');

  const clientIcons = JSON.stringify({
    copy: icon('copy'),
    trash: icon('trash'),
    refresh: icon('refresh'),
    plus: icon('plus'),
    link: icon('link'),
    external: icon('external'),
    bolt: icon('bolt'),
    globe: icon('globe'),
    radar: icon('radar'),
    gauge: icon('gauge'),
    check: icon('check'),
    clock: icon('clock'),
    power: icon('power'),
    layers: icon('layers'),
    download: icon('download'),
    signal: icon('signal'),
    settings: icon('settings'),
    edit: icon('settings'),
    sanctions: icon('sanctions'),
    warp: icon('warp'),
    dns: icon('dns'),
    pin: icon('pin'),
    api: icon('api'),
    pulse: icon('pulse'),
    telegram: icon('telegram'),
    back: icon('back'),
    stop: icon('stop'),
    sun: icon('sun'),
    moon: icon('moon')
  });

  const ssmethods = ['none'];
  const ipRotationOptions = [
    ['off', 'غیرفعال'],
    ['5m', 'هر ۵ دقیقه'],
    ['15m', 'هر ۱۵ دقیقه'],
    ['30m', 'هر ۳۰ دقیقه'],
    ['1h', 'هر ۱ ساعت'],
    ['24h', 'هر ۲۴ ساعت']
  ];

  const presetOptions = Object.entries(USER_PRESETS)
    .map(([id, p]) => `<option value="${id}">${p.title || id}</option>`)
    .join('');

  return stripEmoji(`<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${BRAND_UPPER} ${VERSION} — مرکز کنترل</title>
<link rel="icon" href="${FAVICON_DATA_URI}">
<script>
// ——— عیب‌یابی: هر خطای اجرایی را روی صفحه نشان بده (نه سکوت) ———
(function() {
  var shown = false;
  function banner(title, detail) {
    if (shown) return; shown = true;
    try {
      var box = document.createElement('div');
      box.setAttribute('dir', 'rtl');
      box.style.cssText = 'position:fixed;z-index:99999;left:0;right:0;top:0;padding:10px 14px;background:#3a0d0d;color:#ffd9d9;font:12px/1.8 system-ui,Tahoma,sans-serif;border-bottom:1px solid #a33;text-align:right';
      box.textContent = title + (detail ? ' | ' + detail : '');
      (document.body || document.documentElement).appendChild(box);
      window.__miliBootError = box.textContent;
    } catch (e) {}
  }
  window.__miliDiag = { ready: false, banner: banner };
  window.addEventListener('error', function(e) {
    banner('خطای اجرای پنل: ' + ((e && e.message) || 'نامشخص'), ((e && e.filename) || '') + ':' + ((e && e.lineno) || ''));
  });
  window.addEventListener('unhandledrejection', function(e) {
    var r = e && e.reason;
    banner('خطای غیرمنتظره: ' + ((r && r.message) || String(r || '')), '');
  });
  setTimeout(function() {
    if (!window.__miliDiag.ready && !shown) {
      banner('اسکریپت پنل اجرا نشد؛ صفحه را با Ctrl+F5 (پاک‌کردن کش) باز کنید.', 'در صورت تکرار این پیام را بفرستید.');
    }
  }, 4000);
})();
</script>
<style>
  :root {
    --bg: #05080a;
    --bg-soft: #070c0e;
    --panel: rgba(9, 15, 13, 0.92);
    --panel-2: rgba(12, 20, 16, 0.9);
    --line: rgba(181, 255, 77, 0.13);
    --line-strong: rgba(181, 255, 77, 0.34);
    --neon: #b5ff4d;
    --neon-soft: rgba(181, 255, 77, 0.1);
    --neon-glow: rgba(181, 255, 77, 0.28);
    --text: #e9f3e2;
    --muted: #85957f;
    --muted-2: #5d6b59;
    --danger: #ff6262;
    --warn: #ffce5c;
    --info: #63e6d4;
    --radius: 18px;
    --shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
    --mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
    --font: "Vazirmatn", "Segoe UI", Tahoma, system-ui, sans-serif;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: var(--font);
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    padding-bottom: 48px;
    -webkit-font-smoothing: antialiased;
  }
  body::before {
    content: "";
    position: fixed;
    inset: 0;
    z-index: -2;
    background:
      radial-gradient(900px 480px at 82% -8%, rgba(181, 255, 77, 0.11), transparent 65%),
      radial-gradient(700px 420px at 8% 4%, rgba(99, 230, 212, 0.06), transparent 60%),
      linear-gradient(180deg, #060a0b 0%, #040607 100%);
  }
  body::after {
    content: "";
    position: fixed;
    inset: 0;
    z-index: -1;
    background-image:
      linear-gradient(rgba(181, 255, 77, 0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(181, 255, 77, 0.035) 1px, transparent 1px);
    background-size: 46px 46px;
    mask-image: radial-gradient(circle at 50% 0%, #000 0%, transparent 78%);
    opacity: 0.55;
    pointer-events: none;
  }
  /* ---------- light theme (پنل، نه فقط صفحه ورود) ---------- */
  body.light-mode {
    --bg: #eef3f0;
    --bg-soft: #f7faf8;
    --panel: rgba(255, 255, 255, 0.94);
    --panel-2: rgba(248, 252, 249, 0.94);
    --line: rgba(6, 118, 71, 0.16);
    --line-strong: rgba(6, 118, 71, 0.38);
    --neon: #0b8a4b;
    --neon-soft: rgba(11, 138, 75, 0.1);
    --neon-glow: rgba(11, 138, 75, 0.22);
    --text: #0c1a12;
    --muted: #5a6d60;
    --muted-2: #7a8b7f;
    --shadow: 0 20px 50px rgba(15, 40, 25, 0.12);
  }
  body.light-mode::before {
    background:
      radial-gradient(900px 480px at 82% -8%, rgba(11, 138, 75, 0.1), transparent 65%),
      radial-gradient(700px 420px at 8% 4%, rgba(2, 132, 199, 0.08), transparent 60%),
      linear-gradient(180deg, #f7faf8 0%, #eaf0ec 100%);
  }
  body.light-mode::after {
    background-image:
      linear-gradient(rgba(11, 138, 75, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(11, 138, 75, 0.05) 1px, transparent 1px);
    opacity: 0.7;
  }
  body.light-mode .topbar { background: rgba(250, 253, 251, 0.9); }
  body.light-mode .window { background: linear-gradient(180deg, #ffffff, #f6faf7); }
  body.light-mode .metric,
  body.light-mode .card,
  body.light-mode .user-card,
  body.light-mode .loc-card { background: #ffffff; }

  body.light-mode .modal-card { background: #ffffff; }
  body.light-mode .toast-body { background: #ffffff; color: #0c1a12; }
  body.light-mode .field input,
  body.light-mode .field select,
  body.light-mode .field textarea { background: #ffffff; color: #0c1a12; border-color: var(--line); }
  body.light-mode .btn { background: #ffffff; color: #0c1a12; }
  body.light-mode .btn.primary { color: #06130b; }
  body.light-mode table.scan th { background: rgba(11, 138, 75, 0.06); }
  body.light-mode .icon-btn { background: #ffffff; color: #0c1a12; }
  body.light-mode .chip { background: #ffffff; }
  body.light-mode .scan-status { color: #5a6d60; }

  body.light-mode .switch i { background: #cfdcd4; }

  .mi { width: 20px; height: 20px; display: inline-block; vertical-align: middle; flex: none; }
  .mi-sm { width: 16px; height: 16px; }
  .mi-lg { width: 26px; height: 26px; }

  /* ---------- top bar ---------- */
  .topbar {
    position: sticky;
    top: 0;
    z-index: 40;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 22px;
    background: rgba(5, 8, 10, 0.82);
    backdrop-filter: blur(18px);
    border-bottom: 1px solid var(--line);
  }
  .brand { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .brand .mili-shield-svg { width: 38px; height: 38px; flex: none; }
  .brand-text { line-height: 1.15; }
  .brand-name { font-size: 1.02rem; font-weight: 800; letter-spacing: 0.4px; }
  .brand-name span { color: var(--neon); }
  .brand-ver {
    font-family: var(--mono);
    font-size: 0.68rem;
    color: var(--muted);
    letter-spacing: 0.6px;
  }
  .topbar-spacer { flex: 1; }
  /* هدر فقط لوگو + آیکون‌های افقی بدون متن فارسی */
  .topbar-actions { display: flex; align-items: center; gap: 7px; }
  .topbar-actions .icon-btn { width: 38px; height: 38px; padding: 0; border-radius: 11px; }
  .topbar-actions .icon-btn .mi { width: 19px; height: 19px; }
  .topbar-actions .icon-btn.tg { color: #7fd7ff; border-color: rgba(125, 211, 252, 0.3); background: rgba(56, 189, 248, 0.1); }
  .topbar-actions .icon-btn.tg:hover { color: #b9edff; border-color: rgba(125, 211, 252, 0.5); background: rgba(56, 189, 248, 0.18); }
  .topbar-actions .icon-btn.danger { color: var(--danger); }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 6px 11px;
    border-radius: 999px;
    border: 1px solid var(--line);
    background: rgba(255, 255, 255, 0.025);
    font-size: 0.76rem;
    color: var(--muted);
    white-space: nowrap;
  }
  .chip b { color: var(--text); font-weight: 700; }
  .chip .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--neon); box-shadow: 0 0 10px var(--neon-glow); }
  .chip.warn .dot { background: var(--warn); box-shadow: 0 0 10px rgba(255, 206, 92, 0.4); }
  .icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 8px 12px;
    border-radius: 11px;
    border: 1px solid var(--line);
    background: rgba(255, 255, 255, 0.03);
    color: var(--text);
    font-family: inherit;
    font-size: 0.78rem;
    cursor: pointer;
    transition: 0.16s;
  }
  .icon-btn:hover { border-color: var(--line-strong); background: var(--neon-soft); color: var(--neon); }
  .icon-btn.danger:hover { border-color: rgba(255, 98, 98, 0.5); background: rgba(255, 98, 98, 0.1); color: var(--danger); }

  /* ---------- main ---------- */
  .main { max-width: 1180px; margin: 0 auto; padding: 18px 20px 10px; }

  /* ---------- نوار تب‌ها (جدا از منو، به سبک نوار شناور قبلی) ---------- */
  .tabbar {
    position: sticky;
    top: 61px;
    z-index: 35;
    display: flex;
    justify-content: center;
    padding: 10px 0 12px;
    margin-bottom: 12px;
    background: linear-gradient(180deg, rgba(5, 8, 10, 0.96), rgba(5, 8, 10, 0.7));
    backdrop-filter: blur(14px);
  }
  .tabbar-pill {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 6px;
    width: min(100%, 560px);
    padding: 7px;
    border-radius: 20px;
    border: 1px solid var(--line);
    background: rgba(6, 10, 9, 0.9);
    backdrop-filter: blur(20px);
    box-shadow: 0 18px 50px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(0, 0, 0, 0.4) inset;
    scrollbar-width: none;
  }
  .tabbar-pill::-webkit-scrollbar { display: none; }
  /* همهٔ تب‌ها یک بافت و یک اندازه دارند؛ فقط رنگ و حاشیه وضعیت فعال را نشان می‌دهد */
  .tab {
    appearance: none;
    border: 1px solid transparent;
    background: transparent;
    color: var(--muted);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    width: 100%;
    min-width: 0;
    height: 58px;
    padding: 7px 6px;
    border-radius: 14px;
    font-family: inherit;
    font-size: 0.7rem;
    font-weight: 700;
    line-height: 1.1;
    white-space: nowrap;
    cursor: pointer;
    transition: 0.18s;
    position: relative;
    overflow: hidden;
  }
  .tab .mi { width: 20px; height: 20px; }
  .tab > span[data-i18n] { max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
  .tab:hover { color: var(--text); background: rgba(255, 255, 255, 0.05); border-color: var(--line); }
  .tab.is-active {
    color: var(--neon);
    background: var(--neon-soft);
    border-color: var(--line-strong);
    box-shadow: inset 0 0 0 1px rgba(181, 255, 77, 0.1);
  }
  .tab.is-active::after {
    content: "";
    position: absolute;
    bottom: 5px;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--neon);
    box-shadow: 0 0 8px var(--neon-glow);
  }
  .tab::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(100deg, transparent 30%, rgba(255, 255, 255, 0.16) 50%, transparent 70%);
    transform: translateX(-130%);
    opacity: 0;
  }
  .tab:hover::before { animation: mili-sheen 0.85s ease; }
  body.light-mode .tabbar { background: linear-gradient(180deg, rgba(238, 243, 240, 0.96), rgba(238, 243, 240, 0.7)); }
  body.light-mode .tabbar-pill { background: rgba(255, 255, 255, 0.95); }
  body.light-mode .tab { color: #4b5c50; }
  .panel { display: none; animation: rise 0.32s ease both; }
  .panel.is-active { display: block; }
  @keyframes rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }

  .window {
    min-width: 0;
    max-width: 100%;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: linear-gradient(180deg, rgba(12, 19, 16, 0.96), rgba(6, 10, 9, 0.94));
    box-shadow: var(--shadow);
    overflow: hidden;
    margin-bottom: 20px;
  }
  .window-head {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 13px 18px;
    border-bottom: 1px solid var(--line);
    background: linear-gradient(90deg, rgba(181, 255, 77, 0.06), transparent 55%);
  }
  .dots { display: inline-flex; gap: 6px; margin-inline-start: 2px; }
  .dots i { width: 8px; height: 8px; border-radius: 50%; display: block; background: #2b3a2c; }
  .dots i:nth-child(1) { background: #ff6b6b; }
  .dots i:nth-child(2) { background: #ffce5c; }
  .dots i:nth-child(3) { background: #b5ff4d; }
  .window-title { display: flex; align-items: center; gap: 9px; font-weight: 800; font-size: 0.95rem; }
  .window-title .mi { color: var(--neon); }
  .window-sub { color: var(--muted); font-size: 0.74rem; margin-inline-start: 4px; font-weight: 500; }
  .window-head .spacer { flex: 1; }
  .window-body { padding: 18px; min-width: 0; }

  /* ---------- metrics ---------- */
  /* داشبورد: کارت‌های مربعی دوتایی کنار هم */
  .metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  @media (min-width: 900px) { .metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
  .metric {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 6px;
    aspect-ratio: 1 / 1;
    min-width: 0;
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 13px;
    background:
      radial-gradient(140px 90px at 100% 0%, rgba(181, 255, 77, 0.09), transparent 70%),
      rgba(255, 255, 255, 0.018);
    overflow: hidden;
  }
  .metric::after {
    content: "";
    position: absolute;
    inset-inline-start: 0;
    top: 16px;
    bottom: 16px;
    width: 2px;
    background: linear-gradient(180deg, var(--neon), transparent);
    opacity: 0.6;
  }
  .metric-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .metric-label { color: var(--muted); font-size: 0.78rem; }
  .metric-icon { color: var(--neon); opacity: 0.9; }
  .metric-value { font-size: clamp(1.15rem, 5.2vw, 1.62rem); font-weight: 800; margin: 0; letter-spacing: 0.5px; line-height: 1.15; }
  .metric-value small { font-size: 0.74rem; color: var(--muted); font-weight: 600; margin-inline-start: 4px; }
  .metric-foot { font-size: 0.66rem; line-height: 1.55; color: var(--muted-2); }

  .split { display: grid; grid-template-columns: 1.35fr 1fr; gap: 16px; margin-top: 16px; }
  .card {
    border: 1px solid var(--line);
    border-radius: 15px;
    background: rgba(255, 255, 255, 0.016);
    padding: 16px;
  }
  .card h3 { margin: 0 0 12px; font-size: 0.86rem; color: var(--text); display: flex; align-items: center; gap: 8px; }
  .card h3 .mi { color: var(--neon); width: 17px; height: 17px; }
  .kv { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 9px 0; border-bottom: 1px dashed rgba(181, 255, 77, 0.09); font-size: 0.8rem; }
  .kv:last-child { border-bottom: 0; }
  .kv span { color: var(--muted); }
  .kv b { font-weight: 700; font-family: var(--mono); font-size: 0.78rem; }
  .tag {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 0.68rem; font-weight: 700; letter-spacing: 0.2px;
    padding: 3px 8px; border-radius: 7px;
    border: 1px solid var(--line);
    color: var(--muted);
    background: rgba(255, 255, 255, 0.02);
  }
  .tag.on { color: var(--neon); border-color: var(--line-strong); background: var(--neon-soft); }
  .tag.off { opacity: 0.55; }
  .tag.mono { font-family: var(--mono); }
  .tag .mi { width: 13px; height: 13px; }

  /* ---------- buttons ---------- */
  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 7px;
    padding: 10px 15px; border-radius: 11px;
    border: 1px solid var(--line);
    background: rgba(255, 255, 255, 0.025);
    color: var(--text);
    font-family: inherit; font-size: 0.8rem; font-weight: 700;
    cursor: pointer; transition: 0.16s;
  }
  .btn .mi { width: 16px; height: 16px; }
  .btn:hover { border-color: var(--line-strong); background: var(--neon-soft); }
  .btn.primary {
    background: linear-gradient(180deg, rgba(181, 255, 77, 0.95), rgba(139, 209, 42, 0.95));
    color: #0a1206; border-color: transparent;
    box-shadow: 0 8px 22px rgba(181, 255, 77, 0.18);
  }
  .btn.primary:hover { filter: brightness(1.06); background: linear-gradient(180deg, #c7ff72, #98dd33); }
  .btn.ghost { background: transparent; }
  .btn.danger { color: var(--danger); border-color: rgba(255, 98, 98, 0.28); }
  .btn.danger:hover { background: rgba(255, 98, 98, 0.1); }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn.sm { padding: 7px 10px; font-size: 0.72rem; border-radius: 9px; }
  .btn.sm .mi { width: 14px; height: 14px; }
  .toolbar { display: flex; flex-wrap: wrap; gap: 9px; align-items: center; }
  .toolbar .spacer { flex: 1; }

  /* ---------- users ---------- */
  .user-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(300px, 100%), 1fr)); gap: 14px; }
  .user-card {
    display: flex;
    flex-direction: column;
    min-width: 0;
    border: 1px solid var(--line);
    border-radius: 15px;
    padding: 15px;
    background: linear-gradient(180deg, rgba(181, 255, 77, 0.035), rgba(255, 255, 255, 0.012));
  }
  .user-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
  .user-name { font-weight: 800; font-size: 0.94rem; }
  .user-uuid { font-family: var(--mono); font-size: 0.66rem; color: var(--muted-2); direction: ltr; text-align: left; margin-top: 3px; overflow-wrap: anywhere; }
  .pill { font-size: 0.68rem; font-weight: 700; padding: 4px 9px; border-radius: 999px; border: 1px solid var(--line); }
  .pill.on { color: var(--neon); border-color: var(--line-strong); background: var(--neon-soft); }
  .pill.off { color: var(--danger); border-color: rgba(255, 98, 98, 0.3); background: rgba(255, 98, 98, 0.08); }
  .usage { display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem; color: var(--muted); margin-top: 4px; }
  .bar { height: 6px; border-radius: 99px; background: rgba(255, 255, 255, 0.07); overflow: hidden; margin: 7px 0 2px; }
  .bar > i { display: block; height: 100%; border-radius: 99px; background: linear-gradient(90deg, #86c62c, #b5ff4d); }
  .user-tags { display: flex; flex-wrap: wrap; gap: 5px; margin: 10px 0; }
  .user-actions { display: flex; flex-wrap: wrap; gap: 6px; min-width: 0; }
  .user-actions .btn { min-width: 0; justify-content: center; }
  .user-more { margin-top: 8px; border-top: 1px dashed var(--line); padding-top: 8px; }
  .user-more > summary {
    list-style: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 7px 10px;
    margin-top: 2px;
    border: 1px solid var(--line);
    border-radius: 9px;
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--muted);
    transition: 0.16s;
  }
  .user-more > summary::-webkit-details-marker { display: none; }
  .user-more > summary::after { content: "+"; font-size: 0.9rem; color: var(--neon); line-height: 1; }
  .user-more[open] > summary::after { content: "−"; }
  .user-more > summary:hover { color: var(--text); border-color: var(--line-strong); background: var(--neon-soft); }
  .user-more > .user-actions { margin-top: 8px; }
  .empty { text-align: center; color: var(--muted); padding: 34px 12px; font-size: 0.84rem; }

  /* ---------- forms ---------- */
  .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; }
  .field { display: flex; flex-direction: column; gap: 6px; }
  .field label { font-size: 0.76rem; color: var(--muted); }
  .field input[type="text"], .field input[type="number"], .field input[type="password"], .field select {
    width: 100%;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid var(--line);
    background: rgba(0, 0, 0, 0.35);
    color: var(--text);
    font-family: inherit;
    font-size: 0.82rem;
    outline: none;
    transition: 0.15s;
  }
  .field input:focus, .field select:focus { border-color: var(--line-strong); box-shadow: 0 0 0 3px rgba(181, 255, 77, 0.08); }
  .field .hint { font-size: 0.68rem; color: var(--muted-2); }
  .switch-row {
    display: flex; align-items: center; justify-content: space-between; gap: 10px;
    padding: 10px 12px; border: 1px solid var(--line); border-radius: 11px;
    background: rgba(255, 255, 255, 0.015);
  }
  .switch-row .switch-meta { display: flex; align-items: center; gap: 9px; min-width: 0; }
  .switch-row .switch-meta .mi { color: var(--neon); width: 17px; height: 17px; }
  .switch-row .switch-meta b { font-size: 0.78rem; font-weight: 700; display: block; }
  .switch-row .switch-meta span { font-size: 0.68rem; color: var(--muted-2); display: block; }
  .switch { position: relative; width: 42px; height: 24px; flex: none; }
  .switch input { position: absolute; opacity: 0; inset: 0; width: 100%; height: 100%; margin: 0; cursor: pointer; }
  .switch i {
    position: absolute; inset: 0; border-radius: 999px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid var(--line);
    transition: 0.18s;
  }
  .switch i::after {
    content: ""; position: absolute; top: 3px; inset-inline-start: 3px;
    width: 16px; height: 16px; border-radius: 50%;
    background: #6b7a67; transition: 0.18s;
  }
  .switch input:checked + i { background: rgba(181, 255, 77, 0.26); border-color: var(--line-strong); }
  .switch input:checked + i::after { background: var(--neon); inset-inline-start: 21px; box-shadow: 0 0 10px var(--neon-glow); }
  .group-title { font-size: 0.8rem; font-weight: 800; color: var(--text); margin: 4px 0 12px; display: flex; align-items: center; gap: 8px; }
  .group-title .mi { color: var(--neon); width: 17px; height: 17px; }

  /* ---------- scanner ---------- */
  .scan-controls { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(180px, 100%), 1fr)); gap: 10px; align-items: end; }
  .scan-controls .btn { min-height: 40px; justify-content: center; }
  .table-wrap { max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; margin-top: 14px; border: 1px solid var(--line); border-radius: 12px; }
  table.scan { width: 100%; border-collapse: collapse; font-size: 0.78rem; min-width: 620px; }
  table.scan th {
    text-align: right; padding: 10px 12px; color: var(--muted);
    font-weight: 600; font-size: 0.72rem;
    background: rgba(255, 255, 255, 0.02);
    border-bottom: 1px solid var(--line);
  }
  table.scan td { padding: 10px 12px; border-bottom: 1px solid rgba(181, 255, 77, 0.07); }
  table.scan tr:last-child td { border-bottom: 0; }
  table.scan tr:hover td { background: rgba(181, 255, 77, 0.03); }
  .mono { font-family: var(--mono); direction: ltr; text-align: left; }
  .lat-fast { color: var(--neon); }
  .lat-med { color: var(--warn); }
  .lat-slow { color: var(--danger); }
  .scan-status { font-size: 0.78rem; color: var(--muted); margin-top: 10px; min-height: 18px; }
  .scan-status.err { color: var(--danger); }
  .warn-box {
    margin-top: 14px; padding: 11px 13px; border-radius: 11px;
    border: 1px solid rgba(255, 206, 92, 0.45);
    background: rgba(255, 206, 92, 0.08);
    color: var(--warn); font-size: 0.78rem; line-height: 1.95;
  }
  .warn-box b { display: block; margin-bottom: 4px; }
  .warn-box ul { margin: 0; padding-inline-start: 18px; }
  .code-badge {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 34px; padding: 3px 6px; border-radius: 7px;
    border: 1px solid var(--line-strong);
    background: var(--neon-soft);
    color: var(--neon); font-family: var(--mono); font-size: 0.68rem; font-weight: 700;
  }

  /* ---------- locations ---------- */
  .loc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(245px, 100%), 1fr)); gap: 12px; }
  .loc-card {
    display: flex; align-items: center; justify-content: space-between; gap: 10px;
    border: 1px solid var(--line); border-radius: 12px; padding: 11px 12px;
    background: rgba(255, 255, 255, 0.015);
  }
  .loc-name { font-size: 0.8rem; font-weight: 700; }
  .loc-meta { font-size: 0.68rem; color: var(--muted-2); margin-top: 2px; }
  /* همان حرکت منوی کشویی روی کارت‌های لوکیشن: موج لمس، بالا آمدن و ورود پله‌ای */
  .loc-grid .loc-card { animation: rise .4s cubic-bezier(.22, .8, .3, 1) both; }
  .loc-grid .loc-card:nth-child(1) { animation-delay: 0s; }
  .loc-grid .loc-card:nth-child(2) { animation-delay: .04s; }
  .loc-grid .loc-card:nth-child(3) { animation-delay: .08s; }
  .loc-grid .loc-card:nth-child(4) { animation-delay: .12s; }
  .loc-grid .loc-card:nth-child(5) { animation-delay: .16s; }
  .loc-grid .loc-card:nth-child(6) { animation-delay: .2s; }
  .loc-grid .loc-card:nth-child(7) { animation-delay: .24s; }
  .loc-grid .loc-card:nth-child(n+8) { animation-delay: .28s; }
  .loc-card.is-press { transform: translateY(0) scale(.992); }
  .loc-card.is-press .mi { animation: mili-tap .44s cubic-bezier(.2, .8, .3, 1); }
  .loc-card .btn .mi { transition: transform .2s ease; }
  .loc-card [data-act="copy"] .mi { color: #a6e86b; }
  .loc-card [data-act="country-proxy"] .mi { color: #62c8f7; }
  .loc-card [data-act="country-ip"] .mi { color: #b79cff; }
  body.light-mode .loc-card [data-act="copy"] .mi { color: #2f8f2f; }
  body.light-mode .loc-card [data-act="country-proxy"] .mi { color: #1789c2; }
  body.light-mode .loc-card [data-act="country-ip"] .mi { color: #6b4fd6; }
  /* اندپوینت اختصاصی WARP: آدرس بلند در عرض کارت می‌شکند و از کادر بیرون نمی‌زند */
  .ep-card { grid-column: 1 / -1; flex-direction: column; align-items: stretch; gap: 10px; }
  .ep-url {
    display: block;
    width: 100%;
    text-decoration: none;
    direction: ltr;
    text-align: left;
    font-family: var(--mono);
    font-size: 0.72rem;
    line-height: 1.7;
    color: var(--neon);
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 8px 10px;
    overflow-wrap: anywhere;
    word-break: break-all;
  }
  .ep-url:hover { border-color: var(--line-strong); background: rgba(0, 0, 0, 0.5); }
  body.light-mode .ep-url { color: #0b8a4b; background: #f4f8f5; }
  body.light-mode .ep-url:hover { background: #eaf4ee; }


  /* ---------- modal / toast ---------- */
  .modal { position: fixed; inset: 0; z-index: 90; display: none; align-items: center; justify-content: center; padding: 18px; background: rgba(2, 5, 4, 0.72); backdrop-filter: blur(6px); }
  .modal.is-open { display: flex; }
  .modal-card { width: min(460px, 100%); border-radius: var(--radius); border: 1px solid var(--line-strong); background: #070d0b; box-shadow: var(--shadow); overflow: hidden; }
  .modal-card.wide { width: min(860px, 100%); }
  .user-form-modal { display: flex; flex-direction: column; max-height: min(90vh, 880px); }
  .user-form-modal .modal-body { flex: 1 1 auto; min-height: 0; max-height: none; }
  .modal-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--line); }
  .modal-head b { font-size: 0.9rem; display: flex; align-items: center; gap: 8px; }
  .modal-head .mi { color: var(--neon); }
  .modal-body { padding: 16px; display: flex; flex-direction: column; gap: 12px; max-height: 74vh; overflow-y: auto; }
  .form-tabs { display: flex; gap: 6px; overflow-x: auto; padding: 11px 14px; background: rgba(255, 255, 255, 0.02); border-bottom: 1px solid var(--line); scrollbar-width: none; scroll-snap-type: x proximity; }
  .form-tabs::-webkit-scrollbar { height: 0; }
  .ftab { flex: 0 0 auto; display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--line); background: transparent; color: inherit; opacity: 0.7; border-radius: 999px; padding: 7px 13px; font: inherit; font-size: 0.78rem; font-weight: 700; cursor: pointer; white-space: nowrap; transition: 0.18s ease; scroll-snap-align: center; }
  .ftab:hover { opacity: 1; border-color: var(--line-strong); }
  .ftab .ftab-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; opacity: 0.5; }
  .ftab.is-active { opacity: 1; color: var(--neon); border-color: rgba(181, 255, 77, 0.45); background: rgba(181, 255, 77, 0.1); }
  .ftab.is-active .ftab-dot { opacity: 1; box-shadow: 0 0 8px var(--neon); }
  body.light-mode .form-tabs { background: #f6faf8; }
  .uf-pane { display: none; }
  .uf-pane.is-active { display: block; animation: rise 0.22s ease both; }
  .uf-section { display: flex; align-items: center; gap: 10px; margin: 18px 0 10px; }
  .uf-section:first-child { margin-top: 0; }
  .uf-section span { font-size: 0.72rem; font-weight: 800; letter-spacing: 0.02em; color: var(--neon); opacity: 0.85; white-space: nowrap; }
  .uf-section i { flex: 1; height: 1px; background: var(--line); }
  .uf-pane .field textarea { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--line); background: rgba(0, 0, 0, 0.35); color: var(--text); font-family: inherit; font-size: 0.82rem; line-height: 2; outline: none; resize: vertical; transition: 0.15s; }
  .uf-pane .field textarea:focus { border-color: var(--line-strong); box-shadow: 0 0 0 3px rgba(181, 255, 77, 0.08); }
  body.light-mode .uf-pane .field textarea { background: #ffffff; color: #0c1a12; }
  .field-hint { display: block; margin-top: 4px; font-size: 0.72rem; line-height: 1.7; opacity: 0.6; }
  .field-hint code { font-size: 0.7rem; padding: 1px 5px; border-radius: 5px; background: rgba(181, 255, 77, 0.1); color: var(--neon); direction: ltr; display: inline-block; }
  .adv-box { border: 1px solid var(--line); border-radius: 12px; padding: 10px 12px; background: rgba(255, 255, 255, 0.015); }
  .adv-box summary { cursor: pointer; font-size: 0.8rem; font-weight: 700; color: var(--neon); }
  body.light-mode .adv-box { background: #f8faf9; }
  .modal-foot { padding: 0 16px 16px; display: flex; gap: 8px; justify-content: flex-start; flex-wrap: wrap; }
  .user-form-modal .modal-foot { padding: 12px 16px; border-top: 1px solid var(--line); background: rgba(255, 255, 255, 0.02); }
  @media (max-width: 640px) {
    .modal { padding: 0; }
    .modal-card { border-radius: 0; border-inline: 0; }
    .user-form-modal { width: 100%; height: 100%; max-height: none; }
    .user-form-modal .modal-head { padding: 11px 13px; }
    .user-form-modal .form-tabs { padding: 9px 12px; }
    .user-form-modal .modal-body { padding: 14px 12px 6px; }
    .user-form-modal .modal-foot { padding: 10px 12px calc(12px + env(safe-area-inset-bottom)); }
    .user-form-modal .modal-foot .btn { flex: 1; justify-content: center; }
    .user-form-modal .form-grid { grid-template-columns: 1fr; gap: 12px; }
    .ftab { font-size: 0.75rem; padding: 7px 11px; }
  }
  .toast {
    position: fixed; z-index: 120; inset-inline: 0; bottom: 96px;
    display: flex; justify-content: center; pointer-events: none;
  }
  .toast-body {
    transform: translateY(14px); opacity: 0;
    transition: 0.25s; max-width: 90vw;
    padding: 10px 16px; border-radius: 12px;
    border: 1px solid var(--line-strong);
    background: rgba(8, 14, 11, 0.96);
    color: var(--text); font-size: 0.8rem; font-weight: 600;
    box-shadow: 0 14px 40px rgba(0, 0, 0, 0.6);
  }
  .toast-body.show { transform: none; opacity: 1; }
  .toast-body.err { border-color: rgba(255, 98, 98, 0.5); color: #ffb3b3; }
  .toast-body.ok { color: var(--neon); }

  @media (max-width: 820px) {
    .main { padding: 16px 12px 6px; }
    .topbar { padding: 10px 13px; gap: 9px; }
    .brand-ver { font-size: 0.62rem; }
    .split { grid-template-columns: 1fr; }
    .scan-controls { grid-template-columns: 1fr; }
    .window-body { padding: 14px; }
    .window-sub { display: none; }
  }
  @media (max-width: 460px) {
    .main { padding: 12px 9px 6px; }
    .topbar { padding: 9px 10px; gap: 7px; }
    .brand .mili-shield-svg { width: 32px; height: 32px; }
    .brand-name { font-size: 0.92rem; }
    .window-body { padding: 11px; }
    .user-grid, .loc-grid, .scan-grid { gap: 10px; }
    .user-card { padding: 12px; }
    .user-actions .btn.sm { flex: 1 1 calc(50% - 4px); }
    .scan-tile { padding: 11px 12px; }
    .scan-head .btn { margin-inline-start: 0; width: 100%; }
  }

  /* ---------- mobile drawer (کشوی منو) ---------- */
  .menu-btn { display: none; }
  .nav-drawer {
    display: none;
    position: fixed;
    inset-inline: 0;
    top: 0;
    z-index: 80;
    max-height: 88vh;
    overflow-y: auto;
    background: #060b09;
    border-bottom: 1px solid var(--line-strong);
    border-radius: 0 0 20px 20px;
    box-shadow: 0 26px 60px rgba(0, 0, 0, 0.66);
    transform: translateY(-102%);
    opacity: 0;
    visibility: hidden;
    transition: transform 0.26s ease, opacity 0.2s ease, visibility 0.26s;
    padding-bottom: 12px;
  }
  body.light-mode .nav-drawer { background: #ffffff; }
  .nav-drawer.is-open { transform: none; opacity: 1; visibility: visible; }
  .drawer-backdrop {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 70;
    background: rgba(2, 5, 4, 0.6);
    backdrop-filter: blur(3px);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
  }
  .drawer-backdrop.is-open { opacity: 1; pointer-events: auto; }
  .drawer-head {
    position: sticky;
    top: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px;
    background: inherit;
    border-bottom: 1px solid var(--line);
  }
  .drawer-head .mili-shield-svg { width: 30px; height: 30px; }
  .drawer-title { font-size: 0.92rem; font-weight: 800; }
  .drawer-close { margin-inline-start: auto; }
  /* منوی موبایل: فقط آیکون‌های رنگی، بدون کادر و مستطیل بیرونی */
  .drawer-icons { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px 8px; padding: 8px 14px 16px; }
  .drawer-item {
    appearance: none;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-width: 0;
    padding: 14px 0;
    border: 0;
    border-radius: 14px;
    background: transparent;
    color: var(--muted);
    cursor: pointer;
    transition: transform .18s cubic-bezier(.2, .8, .3, 1), background .18s ease;
  }
  .drawer-item .mi { width: 27px; height: 27px; }
  .drawer-item:hover, .drawer-item:focus-visible { background: rgba(255, 255, 255, 0.05); transform: translateY(-2px); }
  body.light-mode .drawer-item:hover { background: rgba(12, 26, 18, 0.05); }
  /* هر لوگو رنگ خودش را دارد */
  .drawer-item.d-checkup .mi { color: #a6e86b; }
  .drawer-item.d-telegram .mi { color: #62c8f7; }
  .drawer-item.d-key .mi { color: #ffce5c; }
  .drawer-item.d-sun .mi { color: #ffb454; }
  .drawer-item.d-lang .mi { color: #b79cff; }
  .drawer-item.d-logout .mi { color: #ff6b6b; }
  body.light-mode .drawer-item.d-checkup .mi { color: #2f8f2f; }
  body.light-mode .drawer-item.d-telegram .mi { color: #1789c2; }
  body.light-mode .drawer-item.d-key .mi { color: #b97800; }
  body.light-mode .drawer-item.d-sun .mi { color: #d97706; }
  body.light-mode .drawer-item.d-lang .mi { color: #6b4fd6; }
  body.light-mode .drawer-item.d-logout .mi { color: #d32f2f; }
  .drawer-head .icon-btn { border-color: transparent; background: transparent; }
  .drawer-head .icon-btn:hover { border-color: var(--line-strong); background: rgba(255, 255, 255, 0.06); }

  /* ---------- لایهٔ حرکت، بافت و بازخورد لمسی ---------- */
  @keyframes mili-drift {
    0% { transform: translate3d(-6%, -3%, 0) scale(1.04); opacity: .75; }
    50% { transform: translate3d(5%, 3%, 0) scale(1.12); opacity: 1; }
    100% { transform: translate3d(-6%, -3%, 0) scale(1.04); opacity: .75; }
  }
  @keyframes mili-sheen {
    0% { transform: translateX(-130%) skewX(-16deg); opacity: 0; }
    35% { opacity: .9; }
    100% { transform: translateX(230%) skewX(-16deg); opacity: 0; }
  }
  @keyframes mili-ripple {
    from { opacity: .45; transform: scale(0); }
    to { opacity: 0; transform: scale(2.4); }
  }
  @keyframes mili-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-3px); }
  }
  @keyframes mili-trace {
    to { stroke-dashoffset: -240; }
  }

  body { -webkit-tap-highlight-color: transparent; }
  .btn, .icon-btn, .tab, .ftab, .chip, .drawer-item, .switch { touch-action: manipulation; }
  .mi { transition: transform .24s cubic-bezier(.2, .8, .3, 1); }
  .btn:hover .mi, .tab:hover .mi, .drawer-item:hover .mi, .ftab:hover .mi { transform: scale(1.1) rotate(-4deg); }

  .window { position: relative; }
  .window::after {
    content: "";
    position: absolute;
    inset-inline: -10%;
    top: -55%;
    height: 300px;
    pointer-events: none;
    background: radial-gradient(50% 58% at 50% 50%, rgba(181, 255, 77, 0.1), transparent 70%);
    animation: mili-drift 24s ease-in-out infinite;
  }
  .window-head { position: relative; z-index: 1; }

  .metric, .card, .user-card, .loc-card {
    transition: transform .3s cubic-bezier(.2, .8, .3, 1), box-shadow .3s ease, border-color .3s ease;
    will-change: transform;
  }
  .metric:hover, .card:hover, .user-card:hover, .loc-card:hover {
    transform: translateY(-4px);
    border-color: var(--line-strong);
    box-shadow: 0 22px 46px rgba(0, 0, 0, 0.45);
  }
  body.light-mode .metric:hover,
  body.light-mode .card:hover,
  body.light-mode .user-card:hover,
  body.light-mode .loc-card:hover { box-shadow: 0 22px 42px rgba(15, 40, 25, 0.16); }

  .btn { position: relative; overflow: hidden; }
  .btn::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(100deg, transparent 22%, rgba(255, 255, 255, 0.34) 50%, transparent 78%);
    transform: translateX(-130%);
    opacity: 0;
  }
  .btn:hover::after { animation: mili-sheen .85s ease; }
  .btn:hover { transform: translateY(-1px); }
  .btn:active, .btn.is-press { transform: translateY(0) scale(.975); }
  .icon-btn:active, .icon-btn.is-press { transform: scale(.94); }
  /* بدون position روی خود دکمه، موج لمس به گوشهٔ صفحه می‌پرد */
  .ftab, .icon-btn, .drawer-item, .scan-tile, .loc-card { position: relative; overflow: hidden; }
  .ripple {
    position: absolute;
    width: 130px;
    height: 130px;
    margin: -65px 0 0 -65px;
    border-radius: 50%;
    pointer-events: none;
    background: radial-gradient(circle, rgba(181, 255, 77, 0.55), transparent 70%);
    animation: mili-ripple .62s ease-out forwards;
  }
  body.light-mode .ripple { background: radial-gradient(circle, rgba(11, 138, 75, 0.35), transparent 70%); }

  .tab.is-active .mi { animation: mili-float 3.6s ease-in-out infinite; }

  /* همهٔ آیکون‌ها هنگام کلیک تکان می‌خورند */
  @keyframes mili-tap {
    0% { transform: scale(1); }
    32% { transform: scale(.8) rotate(-7deg); }
    64% { transform: scale(1.14) rotate(4deg); }
    100% { transform: scale(1); }
  }
  .btn.is-press .mi,
  .icon-btn.is-press .mi,
  .tab.is-press .mi,
  .ftab.is-press .mi,
  .drawer-item.is-press .mi,
  .loc-card.is-press .mi { animation: mili-tap .44s cubic-bezier(.2, .8, .3, 1); }
  .brand .mili-shield-svg { animation: mili-float 6s ease-in-out infinite; }

  table.scan tbody tr { transition: background .2s ease, box-shadow .2s ease; }
  table.scan tbody tr:hover { background: rgba(181, 255, 77, 0.05); box-shadow: inset 2px 0 0 var(--neon); }
  body.light-mode table.scan tbody tr:hover { background: rgba(11, 138, 75, 0.06); }

  .panel.is-active > .window { animation: rise .42s cubic-bezier(.22, .8, .3, 1) both; }
  .panel.is-active > .window:nth-child(2) { animation-delay: .05s; }

  /* اسکنر: منوی اسکن + صفحهٔ اختصاصی هر اسکن */
  /* هر اسکن یک کارت مربعی با کلید روشن/خاموش است؛ کارت خودش کلیک نمی‌شود */
  .scan-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); grid-auto-rows: minmax(0, 1fr); gap: 8px; }
  .scan-tile {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 6px;
    min-width: 0;
    min-height: 0;
    padding: 10px;
    border: 1px solid var(--line);
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.015);
    color: var(--text);
    font-family: inherit;
    transition: border-color .24s ease, background .24s ease, box-shadow .24s ease;
  }
  .scan-tile-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .scan-tile .mi { color: var(--neon); width: 22px; height: 22px; }
  .scan-tile .scan-tile-text { min-width: 0; }
  .scan-tile b { display: block; font-size: 0.72rem; font-weight: 800; line-height: 1.45; }
  .scan-tile span { display: block; font-size: 0.62rem; color: var(--muted-2); margin-top: 2px; line-height: 1.55; }
  @media (max-width: 430px) { .scan-tile-text > span { display: none; } }
  @media (max-height: 720px) { .scan-tile-text > span { display: none; } }
  .scan-tile:hover { border-color: var(--line-strong); }
  .scan-tile.is-on { border-color: var(--line-strong); background: var(--neon-soft); box-shadow: inset 0 0 0 1px rgba(181, 255, 77, 0.1); }
  .scan-view { display: none; }
  .scan-view.is-active { display: block; animation: rise .28s ease both; }
  .scan-head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
  .scan-head .scan-title { font-size: 0.9rem; font-weight: 800; display: flex; align-items: center; gap: 8px; }
  .scan-head .scan-title .mi { color: var(--neon); }
  .scan-head .scan-desc { font-size: 0.72rem; color: var(--muted-2); }
  .scan-head .btn { margin-inline-start: auto; }
  .scan-note { font-size: 0.74rem; line-height: 1.95; color: var(--muted-2); margin: 0 0 12px; }

  /* اسکنر: همه‌چیز داخل یک صفحه می‌ماند؛ فقط جدول نتایج اسکرول می‌شود */
  .panel[data-panel="scanner"].is-active {
    display: flex;
    flex-direction: column;
    height: calc(100dvh - 206px);
    min-height: 360px;
  }
  .panel[data-panel="scanner"] > .window { display: flex; flex-direction: column; flex: 1; min-height: 0; margin-bottom: 0; }
  .panel[data-panel="scanner"] .window-body { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }
  #scanHome { display: flex; flex-direction: column; flex: 1; min-height: 0; }
  /* wrapper نماها فقط وقتی نما فعال است ارتفاع می‌گیرد تا در حالت خانه فضای شبکه را نخورد */
  #scanViews { display: flex; flex-direction: column; flex: 0 1 auto; min-height: 0; }
  #scanHome .scan-grid { flex: 1; min-height: 0; }
  #scanHome .scan-note, #scanBar, .scan-view .scan-head { flex: none; }
  #scanHome .toolbar { flex: none; margin: 10px 0 0 !important; flex-wrap: wrap; }
  .scan-view.is-active { display: flex; flex-direction: column; flex: 1; min-height: 0; }
  .scan-view .scan-note {
    flex: none;
    margin-bottom: 8px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .scan-view .table-wrap { flex: 1; min-height: 0; overflow: auto; }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: .001ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: .001ms !important;
    }
  }

  /* قواعد موبایل آخرین بلوک استایل هستند تا بر قواعد پایهٔ بالا اولویت داشته باشند */
  @media (max-width: 820px) {
    .topbar-actions .icon-btn.opt { display: none; }
    .topbar-actions .icon-btn { width: 34px; height: 34px; }
    .topbar-actions { gap: 6px; }
    .menu-btn { display: inline-flex; }
    .nav-drawer { display: block; }
    .drawer-backdrop { display: block; }
    .toast { bottom: 24px; }
    .tabbar { top: 55px; padding: 8px 0 10px; }
    .tabbar-pill { width: 100%; padding: 6px; gap: 5px; }
    .tab { height: 54px; padding: 6px 3px; font-size: 0.63rem; }
    .tab .mi { width: 18px; height: 18px; }
  }
</style>
</head>
<body>
  <header class="topbar">
    <button class="icon-btn menu-btn" type="button" data-act="toggle-drawer" aria-controls="navDrawer" aria-expanded="false" title="منو">${icon('menu')}</button>
    <div class="brand">
      ${SHIELD_LOGO_SVG}
      <div class="brand-text">
        <div class="brand-name">${BRAND_NAME}<span>OS</span></div>
        <div class="brand-ver">${BRAND_UPPER} ${VERSION}</div>
      </div>
    </div>
    <div class="topbar-spacer"></div>
    <div class="topbar-actions">
      <a class="icon-btn tg" href="${SUPPORT_URL}" target="_blank" rel="noopener" title="${TELEGRAM_SUPPORT}" aria-label="Telegram" data-act="open-support">${icon('telegram')}</a>
      <button class="icon-btn opt" type="button" data-act="toggle-theme" id="themeBtn" title="حالت روز / شب" aria-label="themes">${icon('sun')}</button>
      <button class="icon-btn opt" type="button" data-act="toggle-lang" id="langBtn" title="تغییر زبان" aria-label="language">${icon('globe')}</button>
      <button class="icon-btn opt" type="button" data-act="open-multi" title="سابلینک چندلوکیشن" aria-label="locations">${icon('pin')}</button>
      <button class="icon-btn opt" type="button" data-act="open-password" title="تغییر رمز مدیر" aria-label="password">${icon('key')}</button>
      <button class="icon-btn danger" type="button" data-act="logout" title="خروج" aria-label="logout">${icon('logout')}</button>
    </div>
  </header>

  <!-- کشوی منوی موبایل: لیست کامل و مرتب؛ با دکمهٔ بالا باز/بسته می‌شود -->
  <div class="drawer-backdrop" id="drawerBackdrop" data-act="close-drawer"></div>
  <nav class="nav-drawer" id="navDrawer" aria-label="منوی اصلی" aria-hidden="true">
    <div class="drawer-head">
      ${SHIELD_LOGO_SVG}
      <div>
        <div class="drawer-title">${BRAND_NAME}OS</div>
        <div class="brand-ver">${BRAND_UPPER} v${VERSION.replace(/^v/i, '')}</div>
      </div>
      <button class="icon-btn drawer-close" type="button" data-act="close-drawer" title="بستن">${icon('close')}</button>
    </div>
    <div class="drawer-icons">
      <button class="drawer-item d-checkup" type="button" data-act="check-update" aria-label="بررسی بروزرسانی" title="بررسی بروزرسانی">${icon('refresh')}</button>
      <a class="drawer-item d-telegram" href="${SUPPORT_URL}" target="_blank" rel="noopener" aria-label="${TELEGRAM_SUPPORT}" title="${TELEGRAM_SUPPORT}">${icon('telegram')}</a>
      <button class="drawer-item d-key" type="button" data-act="open-password" aria-label="تغییر رمز مدیر" title="تغییر رمز مدیر">${icon('key')}</button>
      <button class="drawer-item d-sun" type="button" data-act="toggle-theme" aria-label="حالت روز / شب" title="حالت روز / شب">${icon('sun')}</button>
      <button class="drawer-item d-lang" type="button" data-act="toggle-lang" aria-label="تغییر زبان" title="تغییر زبان">${icon('globe')}</button>
      <button class="drawer-item d-logout" type="button" data-act="logout" aria-label="خروج" title="خروج">${icon('logout')}</button>
    </div>
  </nav>

  <main class="main">

  <!-- نوار تب‌ها: از منو جدا است و همهٔ صفحه‌ها را با یک کلیک عوض می‌کند -->
  <div class="tabbar" id="tabbar">
    <nav class="tabbar-pill" aria-label="تب‌های پنل">
      <button class="tab is-active" type="button" data-tab="dashboard">${icon('dashboard')}<span data-i18n="nav.dashboard">داشبورد</span></button>
      <button class="tab" type="button" data-tab="users">${icon('users')}<span data-i18n="nav.users">کاربران</span></button>
      <button class="tab" type="button" data-tab="scanner">${icon('radar')}<span data-i18n="nav.scanner">اسکنر</span></button>
      <button class="tab" type="button" data-tab="locations">${icon('globe')}<span data-i18n="nav.locations">چندلوکیشن</span></button>
    </nav>
  </div>

    <section class="panel is-active" data-panel="dashboard">
      <div class="window">
        <div class="window-head">
          <span class="dots"><i></i><i></i><i></i></span>
          <div class="window-title">${icon('dashboard')} <span data-i18n="panel.dashboard">داشبورد</span> <span class="window-sub" data-i18n="panel.dashboardSub">وضعیت زنده سیستم و مصرف</span></div>
          <div class="spacer"></div>
          <button class="btn sm ghost" type="button" data-act="reload-users">${icon('refresh')} <span data-i18n="btn.reload">بروزرسانی</span></button>
        </div>
        <div class="window-body">
          <div class="metrics">
            <div class="metric">
              <div class="metric-top"><span class="metric-label" data-i18n="metric.users">کاربران فعال</span><span class="metric-icon">${icon('users')}</span></div>
              <div class="metric-value" id="mUsers">0 <small>/ ${MAX_USERS_LIMIT}</small></div>
              <div class="metric-foot" id="mUsersFoot">ظرفیت آزاد</div>
            </div>
            <div class="metric">
              <div class="metric-top"><span class="metric-label" data-i18n="metric.traffic">حجم مصرف‌شده</span><span class="metric-icon">${icon('activity')}</span></div>
              <div class="metric-value" id="mTraffic">0.00 <small>GB</small></div>
              <div class="metric-foot">مجموع مصرف کاربران روی D1</div>
            </div>
            <div class="metric">
              <div class="metric-top"><span class="metric-label" data-i18n="metric.ips">آی‌پی‌های سالم</span><span class="metric-icon">${icon('server')}</span></div>
              <div class="metric-value" id="mIps">0 <small>نود</small></div>
              <div class="metric-foot">نودهای ترجیحی · IPv4 / IPv6 / دامنه</div>
            </div>
            <div class="metric">
              <div class="metric-top"><span class="metric-label" data-i18n="metric.protocols">پروتکل‌های فعال</span><span class="metric-icon">${icon('layers')}</span></div>
              <div class="metric-value" id="mProto" style="font-size: 1.25rem;">—</div>
              <div class="metric-foot">بر پایه تنظیمات ذخیره‌شده</div>
            </div>
          </div>

          <div class="split">
            <div class="card">
              <h3>${icon('terminal')} وضعیت هسته</h3>
              <div class="kv"><span>موتور پروکسی</span><b>VLESS / Trojan / xHTTP</b></div>
              <div class="kv"><span>ذخیره‌سازی</span><b id="kvStorage">—</b></div>
              <div class="kv"><span>بایندینگ دیتابیس</span><b id="kvBinding">—</b></div>
              <div class="kv"><span>مسیر مدیریت</span><b id="kvPath" class="mono">—</b></div>
              <div class="kv"><span>سقف کاربران</span><b>${MAX_USERS_LIMIT}</b></div>
            </div>
            <div class="card">
              <h3>${icon('bolt')} اقدام‌های سریع</h3>
              <div class="toolbar" style="flex-direction: column; align-items: stretch;">
                <button class="btn primary" type="button" data-act="open-create">${icon('plus')} <span data-i18n="btn.newUser">کاربر جدید</span></button>
                <button class="btn" type="button" data-act="go-scan">${icon('radar')} <span data-i18n="nav.scanner">اسکنر</span></button>
                <button class="btn" type="button" data-act="copy-master">${icon('copy')} <span data-i18n="btn.copyMaster">کپی سابلینک اصلی</span></button>
                <button class="btn ghost" type="button" data-act="open-password">${icon('key')} <span data-i18n="btn.password">تغییر رمز مدیر</span></button>
                <button class="btn ghost" type="button" data-act="copy-admin-path">${icon('copy')} کپی مسیر مدیریت</button>
                <button class="btn ghost" type="button" data-act="rotate-path">${icon('refresh')} مسیر مدیریت جدید</button>
              </div>
            </div>
          </div>

          <!-- نسخه و بروزرسانی: این بخش نسخهٔ نصب‌شده را با گیت‌هاب مقایسه می‌کند -->
          <div class="card" id="updateCard" style="margin-top:16px;">
            <h3>${icon('refresh')} نسخه و بروزرسانی</h3>
            <div class="kv"><span>نسخهٔ نصب‌شده</span><b class="mono">v${VERSION.replace(/^v/i, '')}</b></div>
            <div class="kv"><span>آخرین نسخهٔ گیت‌هاب</span><b class="mono" id="updLatest">—</b></div>
            <div class="kv"><span>وضعیت</span><b id="updState">بررسی نشده</b></div>
            <div class="kv"><span>نصب خودکار</span><b id="updAuto">—</b></div>
            <div class="kv"><span>اسکریپت هدف</span><b class="mono" id="updScript">—</b></div>
            <div class="toolbar" style="margin-top:10px;flex-wrap:wrap;">
              <button class="btn sm" type="button" data-act="check-update">${icon('refresh')} بررسی بروزرسانی</button>
              <button class="btn sm" type="button" data-act="download-update">${icon('download')} دانلود فایل نسخهٔ تازه</button>
              <button class="btn sm" type="button" data-act="copy-update-cmd">${icon('copy')} کپی دستور استقرار</button>
              <button class="btn sm primary" type="button" data-act="apply-update">${icon('bolt')} نصب خودکار</button>
              <button class="btn sm ghost" type="button" data-act="diagnose-update">${icon('terminal')} تشخیص نصب خودکار</button>
              <button class="btn sm ghost" type="button" data-act="disable-autoupdate">${icon('close')} خاموش کردن</button>
            </div>
            <div class="adv-box" id="updDiagBox" style="display:none;margin-top:10px;">
              <div class="loc-meta" id="updDiagBody" style="line-height:2;"></div>
            </div>
            <div class="loc-meta" style="margin-top:8px;line-height:1.9;">
              بروزرسانی هیچ ورودی از حساب کلادفلر نمی‌خواهد. اگر این ورکر به گیت‌هاب وصل باشد، نسخهٔ تازه خودکار مستقر می‌شود؛ وگرنه فایل تازه را دانلود کنید یا دستور آمادهٔ استقرار را اجرا کنید.
              نصب خودکار از داخل پنل فقط وقتی فعال می‌شود که متغیر محرمانهٔ <b class="mono">CF_API_TOKEN</b> در تنظیمات خود ورکر تعریف شده باشد.
            </div>
            <ul id="updNotes" class="loc-meta" style="margin:8px 0 0;padding-inline-start:18px;display:none;"></ul>
          </div>
        </div>
      </div>
    </section>

    <section class="panel" data-panel="users">
      <div class="window">
        <div class="window-head">
          <span class="dots"><i></i><i></i><i></i></span>
          <div class="window-title">${icon('users')} <span data-i18n="panel.users">کاربران</span> <span class="window-sub" data-i18n="panel.usersSub">مدیریت اشتراک و محدودیت</span></div>
          <div class="spacer"></div>
          <button class="btn sm ghost" type="button" data-act="reload-users">${icon('refresh')} <span data-i18n="btn.reload">بروزرسانی</span></button>
          <button class="btn sm primary" type="button" data-act="open-create">${icon('plus')} <span data-i18n="btn.createUser">ایجاد کاربر</span></button>
        </div>
        <div class="window-body">
          <div class="user-grid" id="usersGrid"></div>
          <div class="empty" id="usersEmpty" style="display:none;">هنوز کاربری ساخته نشده است.</div>
        </div>
      </div>
    </section>

    <section class="panel" data-panel="scanner">
      <div class="window">
        <div class="window-head">
          <span class="dots"><i></i><i></i><i></i></span>
          <div class="window-title">${icon('radar')} <span id="scanPanelTitle" data-i18n="panel.scanner">اسکنر زنده</span> <span class="window-sub" data-i18n="panel.scannerSub">همهٔ اسکن‌ها داخل پنل اجرا می‌شوند</span></div>
          <div class="spacer"></div>
          <button class="btn sm ghost" type="button" id="scanBackBtn" data-act="scan-back" style="display:none;">${icon('back')} بازگشت به اسکن‌ها</button>
        </div>
        <div class="window-body">
          <!-- خانهٔ اسکنر: هر اسکن یک کارت مربعی با کلید روشن/خاموش است -->
          <div id="scanHome">
            <p class="scan-note">کلید هر اسکن را روشن کنید؛ همان اسکن داخل پنل اجرا می‌شود و خاموش کردن کلید آن را می‌بندد.</p>
            <div class="scan-grid">
              <div class="scan-tile" data-mode="ipv4">
                <div class="scan-tile-top">${icon('server')}<label class="switch"><input type="checkbox" data-scan="ipv4" aria-label="آی‌پی ثابت IPv4"><i></i></label></div>
                <span class="scan-tile-text"><b>آی‌پی ثابت IPv4</b><span>آدرس‌های سالم IPv4 به تفکیک کشور</span></span>
              </div>
              <div class="scan-tile" data-mode="ipv6">
                <div class="scan-tile-top">${icon('signal')}<label class="switch"><input type="checkbox" data-scan="ipv6" aria-label="آی‌پی ثابت IPv6"><i></i></label></div>
                <span class="scan-tile-text"><b>آی‌پی ثابت IPv6</b><span>آدرس‌های نسخهٔ ۶ برای شبکه‌های همراه</span></span>
              </div>
              <div class="scan-tile" data-mode="domain">
                <div class="scan-tile-top">${icon('globe')}<label class="switch"><input type="checkbox" data-scan="domain" aria-label="دامنه‌های جایگزین"><i></i></label></div>
                <span class="scan-tile-text"><b>دامنه‌های جایگزین</b><span>دامنه‌های لبهٔ کلادفلر به جای آی‌پی خام</span></span>
              </div>
              <div class="scan-tile" data-mode="proxyip">
                <div class="scan-tile-top">${icon('api')}<label class="switch"><input type="checkbox" data-scan="proxyip" aria-label="آدرس واسط"><i></i></label></div>
                <span class="scan-tile-text"><b>آدرس واسط</b><span>ProxyIP آماده برای خروج از ایران</span></span>
              </div>
              <div class="scan-tile" data-mode="proxy">
                <div class="scan-tile-top">${icon('link')}<label class="switch"><input type="checkbox" data-scan="proxy" aria-label="پروکسی کشوری"><i></i></label></div>
                <span class="scan-tile-text"><b>پروکسی کشوری</b><span>SOCKS5 و HTTP به تفکیک کشور</span></span>
              </div>
              <div class="scan-tile" data-mode="manual">
                <div class="scan-tile-top">${icon('terminal')}<label class="switch"><input type="checkbox" data-scan="manual" aria-label="تست آدرس دستی"><i></i></label></div>
                <span class="scan-tile-text"><b>تست آدرس دستی</b><span>فهرست خودتان را وارد کنید و همان‌جا تست کنید</span></span>
              </div>
            </div>
            <div class="toolbar" style="margin-top: 12px;">
              <button class="btn sm" type="button" data-act="add-cf-ips">${icon('plus')} <span data-i18n="scanner.addCfIps">آی‌پی‌های کلادفلر → آدرس‌های دستی</span></button>
              <button class="btn sm" type="button" data-act="add-cf-domains">${icon('globe')} <span data-i18n="scanner.addCfDomains">دامنه‌های کلادفلر → آدرس‌های دستی</span></button>
            </div>
          </div>
          <!-- مقصد نتیجه: در همهٔ صفحه‌های اسکن مشترک است -->
          <div id="scanBar" style="display:none;">
            <div class="scan-controls" style="margin-bottom: 4px;">
              <div class="field">
                <label>افزودن نتیجه به کاربر</label>
                <select id="scanUser"><option value="">تنظیمات پیش‌فرض پنل</option></select>
              </div>
              <div class="field">
                <label>مقصد نتیجه</label>
                <select id="scanTarget">
                  <option value="yx" selected>آدرس‌های دستی</option>
                  <option value="p">آدرس واسط (ProxyIP)</option>
                  <option value="s">پروکسی خروجی</option>
                </select>
              </div>
            </div>
          </div>
          <div id="scanViews"></div>
        </div>
      </div>
    </section>

    <section class="panel" data-panel="locations">
      <div class="window">
        <div class="window-head">
          <span class="dots"><i></i><i></i><i></i></span>
          <div class="window-title">${icon('pin')} <span data-i18n="panel.locations">چندلوکیشن</span> <span class="window-sub" data-i18n="panel.locationsSub">سابلینک به تفکیک کشور</span></div>
          <div class="spacer"></div>
          <button class="btn sm ghost" type="button" data-act="copy-master">${icon('copy')} همه لوکیشن‌ها</button>
        </div>
        <div class="window-body">
          <p class="loc-meta" style="margin: 0 0 12px;">برای هر منطقه، آدرس‌های همان کشور از منابع عمومی خوانده و تست می‌شوند. با «آی‌پی تصادفی» چند آدرس سالم همان منطقه داخل تنظیمات کاربر انتخابی نوشته می‌شود.</p>
          <div class="scan-controls" style="margin-bottom:12px;">
            <div class="field">
              <label>منطقه</label>
              <select id="locRegion">${countryOptions()}</select>
            </div>
            <div class="field">
              <label>کاربر هدف</label>
              <select id="locUser"><option value="">تنظیمات پیش‌فرض پنل</option></select>
            </div>
            <button class="btn primary" type="button" data-act="loc-random-ip">${icon('bolt')} افزودن آی‌پی تصادفی</button>
            <button class="btn" type="button" data-act="loc-random-ipv6">${icon('signal')} آی‌پی تصادفی IPv6</button>
            <button class="btn ghost" type="button" data-act="loc-copy-region">${icon('copy')} کپی ساب همین منطقه</button>
          </div>
          <div class="scan-status" id="locStatus"></div>
          <div class="loc-grid" id="locGrid"></div>
        </div>
      </div>
    </section>
  </main>


  <!-- فرم ساخت/ویرایش کاربر: همهٔ گزینه‌های موتور به‌صورت داینامیک از
       USER_FORM_SCHEMA ساخته می‌شوند تا هیچ متغیری جا نیفتد. -->
  <div class="modal" id="createModal">
    <div class="modal-card wide user-form-modal">
      <div class="modal-head"><b id="userFormTitle">${icon('plus')} ایجاد کاربر جدید</b><button class="icon-btn" type="button" data-act="close-modal" data-modal="createModal">${icon('close')}</button></div>
      <div class="form-tabs" id="userFormTabs" role="tablist"></div>
      <div class="modal-body" id="userFormBody"></div>
      <div class="modal-foot">
        <button class="btn primary" type="button" data-act="save-user" id="userFormSubmit">${icon('check')} <span data-i18n="modal.createBtn">ساخت کاربر</span></button>
        <button class="btn ghost" type="button" data-act="close-modal" data-modal="createModal"><span data-i18n="modal.cancel">انصراف</span></button>
      </div>
    </div>
  </div>

  <div class="modal" id="passwordModal">
    <div class="modal-card">
      <div class="modal-head"><b>${icon('key')} تغییر رمز مدیر</b><button class="icon-btn" type="button" data-act="close-modal" data-modal="passwordModal">${icon('close')}</button></div>
      <div class="modal-body">
        <div class="field"><label>رمز فعلی</label><input type="password" id="pwdOld" autocomplete="current-password"></div>
        <div class="field"><label>رمز جدید</label><input type="password" id="pwdNew" autocomplete="new-password"></div>
        <div class="field"><label>تکرار رمز جدید</label><input type="password" id="pwdNew2" autocomplete="new-password"></div>
      </div>
      <div class="modal-foot">
        <button class="btn primary" type="button" data-act="save-password">${icon('check')} ذخیره رمز</button>
        <button class="btn ghost" type="button" data-act="close-modal" data-modal="passwordModal">انصراف</button>
      </div>
    </div>
  </div>

  <!-- لیست‌های آماده: همهٔ ورودی‌های متنی فرم ساخت کاربر و تنظیمات پیشنهاد آماده دارند -->
  <datalist id="dlPorts">
    <option value="443,2053,2087,8443"></option>
    <option value="443"></option>
    <option value="8443"></option>
    <option value="2053,2087,2096"></option>
    <option value="443,8443"></option>
    <option value="2053"></option>
    <option value="2087"></option>
    <option value="2096"></option>
  </datalist>
  <datalist id="dlHttpPorts">
    <option value="80,8080"></option>
    <option value="80"></option>
    <option value="8080"></option>
    <option value="8080,8880"></option>
    <option value="2052,2082"></option>
  </datalist>
  <datalist id="dlNodeCount">
    <option value="30"></option><option value="50"></option><option value="80"></option>
    <option value="100"></option><option value="120"></option><option value="150"></option>
    <option value="200"></option>
  </datalist>
  <datalist id="dlDataLimit">
    <option value="0"></option><option value="10"></option><option value="30"></option>
    <option value="50"></option><option value="100"></option><option value="200"></option>
  </datalist>
  <datalist id="dlExpireDays">
    <option value="0"></option><option value="7"></option><option value="15"></option>
    <option value="30"></option><option value="60"></option><option value="90"></option>
    <option value="180"></option>
  </datalist>
  <datalist id="dlFragmentLen">
    <option value="100-200"></option><option value="50-100"></option><option value="10-20"></option>
    <option value="5-10"></option><option value="200-400"></option>
  </datalist>
  <datalist id="dlFragmentInt">
    <option value="10-20"></option><option value="5-10"></option><option value="20-40"></option>
    <option value="1-3"></option>
  </datalist>
  <datalist id="dlFragmentPackets">
    <option value="tlshello"></option><option value="1-3"></option><option value="1-5"></option>
  </datalist>
  <datalist id="dlProxy">
    <option value="socks5://host:1080"></option>
    <option value="socks5://user:pass@host:1080"></option>
    <option value="http://host:8080"></option>
    <option value="https://host:443"></option>
  </datalist>
  <datalist id="dlProxyIp">
    <option value="example.com:443"></option><option value="1.2.3.4:443"></option>
    <option value="[2606:4700::1]:443"></option>
  </datalist>
  <datalist id="dlYx">
    <option value="1.2.3.4:443#Node"></option>
    <option value="[2606:4700::1]:443#IPv6"></option>
    <option value="example.com:443#Domain"></option>
    <option value="1.2.3.4:443#A,5.6.7.8:443#B"></option>
  </datalist>
  <datalist id="dlCountries">
    <option value="DE"></option><option value="FR"></option><option value="NL"></option>
    <option value="US"></option><option value="GB"></option><option value="TR"></option>
    <option value="JP"></option><option value="KR"></option><option value="SG"></option>
    <option value="FI"></option><option value="SE"></option><option value="AE"></option>
  </datalist>
  <datalist id="dlWarpEndpoint">
    <option value="162.159.192.1:2408#DE"></option>
    <option value="188.114.97.1:500#TR"></option>
    <option value="[2606:4700:d0::a29f:c001]:2408#US"></option>
    <option value="162.159.192.1:2408#DE,188.114.97.1:500#TR"></option>
  </datalist>
  <datalist id="dlDNS">
    <option value="https://223.5.5.5/dns-query"></option>
    <option value="https://1.1.1.1/dns-query"></option>
    <option value="https://8.8.8.8/dns-query"></option>
    <option value="https://dns.google/dns-query"></option>
    <option value="https://cloudflare-dns.com/dns-query"></option>
  </datalist>
  <datalist id="dlHomepage">
    <option value="https://www.cloudflare.com"></option>
    <option value="https://www.google.com"></option>
    <option value="https://example.com"></option>
  </datalist>
  <datalist id="dlAdminPath">
    <option value="admin"></option><option value="panel"></option><option value="manage"></option>
  </datalist>
  <datalist id="dlTp">
    <option value=""></option><option value="mili-pass"></option><option value="change-me"></option>
  </datalist>

  <div class="toast"><div class="toast-body" id="toastBody"></div></div>

<script>
  var INITIAL_DATA = ${safeInitialJson};
  var ICO = ${clientIcons};
  var MAX_USERS = INITIAL_DATA.maxUsersLimit || 3;
  var ADMIN_PATH = String(INITIAL_DATA.adminPath || '').replace(/^\\/+|\\/+$/g, '');
  var API_BASE = ADMIN_PATH ? '/' + ADMIN_PATH : '';
  var state = {
    config: INITIAL_DATA.config || {},
    users: INITIAL_DATA.users || [],
    diagnostics: INITIAL_DATA.diagnostics || {}
  };
  var scanResults = [];

  function $(id) { return document.getElementById(id); }
  function origin() { return window.location.origin; }
  // دسترسی امن به حافظهٔ مرورگر (در حالت‌های مسدود/خصوصی خطا ندهد)
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  // اگر مرورگر پنجرهٔ تأیید را مسدود کند، به‌جای «هیچ اتفاقی نیفتادن» ادامه بده
  function ask(msg) {
    try { var r = window.confirm(msg); if (typeof r === 'boolean') return r; } catch (e) {}
    return true;
  }
  function userKey(u) { return (u && (u.uuid || u.id)) || ''; }

  function showToast(text, kind) {
    var t = $('toastBody');
    t.textContent = text;
    t.className = 'toast-body show ' + (kind || '');
    clearTimeout(t._timer);
    t._timer = setTimeout(function() { t.className = 'toast-body ' + (kind || ''); }, 2800);
  }

  function copyText(text, okMsg) {
    var done = function() { showToast(okMsg || 'در حافظه کپی شد', 'ok'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function() { legacyCopy(text, done); });
    } else {
      legacyCopy(text, done);
    }
  }
  function legacyCopy(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { showToast('کپی ناموفق بود', 'err'); }
    document.body.removeChild(ta);
  }

  function api(path, options) {
    var opts = options || {};
    opts.headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    return fetch(API_BASE + path, opts).then(function(res) {
      return res.json().catch(function() { return { success: false, message: 'پاسخ نامعتبر از سرور' }; })
        .then(function(data) { data._status = res.status; return data; });
    });
  }

  function fmtGb(bytes) { return (Number(bytes || 0) / 1073741824).toFixed(2); }
  function fmtDate(ms) {
    if (!ms) return t('card.noExpiry');
    try { return new Date(ms).toLocaleDateString('fa-IR'); } catch (e) { return '—'; }
  }

  function activeProtocols() {
    var c = state.config || {};
    var list = [];
    list.push('VLESS');
    if (c.es === 'yes') list.push('SS');
    if (c.et === 'yes') list.push('Trojan');
    if (c.ex === 'yes') list.push('xHTTP');
    if (c.ech === 'yes') list.push('ECH');
    return list;
  }

  function showPanel(name) {
    document.querySelectorAll('.panel').forEach(function(p) {
      p.classList.toggle('is-active', p.getAttribute('data-panel') === name);
    });
    document.querySelectorAll('.tab[data-tab]').forEach(function(b) {
      b.classList.toggle('is-active', b.getAttribute('data-tab') === name);
    });
    document.querySelectorAll('.drawer-item[data-tab]').forEach(function(b) {
      b.classList.toggle('is-active', b.getAttribute('data-tab') === name);
    });
    toggleDrawer(false);
    if (history.replaceState) history.replaceState(null, '', '#' + name);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // کشوی منوی موبایل: باز/بسته شدن با انیمیشن به سمت پایین
  function toggleDrawer(open) {
    var drawer = $('navDrawer');
    var backdrop = $('drawerBackdrop');
    if (!drawer) return;
    var next = open === undefined ? !drawer.classList.contains('is-open') : !!open;
    drawer.classList.toggle('is-open', next);
    drawer.setAttribute('aria-hidden', next ? 'false' : 'true');
    if (backdrop) backdrop.classList.toggle('is-open', next);
    var btn = document.querySelector('[data-act="toggle-drawer"]');
    if (btn) btn.setAttribute('aria-expanded', next ? 'true' : 'false');
    document.body.style.overflow = next ? 'hidden' : '';
  }

  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') toggleDrawer(false);
  });
  window.addEventListener('resize', function() {
    if (window.innerWidth > 820) toggleDrawer(false);
  });

  function renderMetrics() {
    var users = state.users || [];
    var totalBytes = users.reduce(function(a, u) { return a + Number(u.usedBytes || 0); }, 0);
    $('mUsers').innerHTML = users.length + ' <small>/ ' + MAX_USERS + '</small>';
    $('mUsersFoot').textContent = users.length >= MAX_USERS ? 'سقف کاربران تکمیل است' : (MAX_USERS - users.length) + ' ظرفیت آزاد';
    $('mTraffic').innerHTML = fmtGb(totalBytes) + ' <small>GB</small>';
    $('mIps').innerHTML = (state.diagnostics.healthyCfIps || 0) + ' <small>نود</small>';
    $('mProto').textContent = activeProtocols().join(' + ');

    var storage = state.diagnostics.storageMode || (state.diagnostics.d1Enabled ? 'D1' : 'Memory');
    $('kvStorage').textContent = storage;
    $('kvBinding').textContent = state.diagnostics.d1BindingName || '—';
    $('kvPath').textContent = ADMIN_PATH ? '/' + ADMIN_PATH.slice(0, 6) + '…' + ADMIN_PATH.slice(-4) : '—';
  }

  function renderUsers() {
    var grid = $('usersGrid');
    var users = state.users || [];
    grid.innerHTML = '';
    $('usersEmpty').style.display = users.length ? 'none' : 'block';
    users.forEach(function(u, idx) {
      var used = Number(u.usedBytes || 0);
      var limitGb = Number(u.dataLimitGb || 0);
      var pct = limitGb > 0 ? Math.min(100, Math.round((used / (limitGb * 1073741824)) * 100)) : 0;
      var base = origin() + '/sub/' + userKey(u);
      var statusUrl = origin() + '/status/' + userKey(u);
      var card = document.createElement('div');
      card.className = 'user-card';
      var nodeCount = Number(u.subNodeCount || 0);
      var key = userKey(u);
      card.innerHTML = [
        '<div class="user-head">',
          '<div><div class="user-name">' + (u.username || ('کاربر ' + (idx + 1))) + '</div>',
          '<div class="user-uuid">/' + 'sub/' + key + '</div></div>',
          '<span class="pill ' + (u.enabled ? 'on' : 'off') + '">' + (u.enabled ? t('card.active') : t('card.inactive')) + '</span>',
        '</div>',
        '<div class="usage"><span>' + t('card.usage') + ' ' + fmtGb(used) + ' GB</span><span>' + (limitGb > 0 ? limitGb + ' GB' : t('card.unlimited')) + '</span></div>',
        '<div class="bar"><i style="width:' + Math.max(pct, 2) + '%"></i></div>',
        '<div class="usage"><span>' + t('card.expiry') + ' ' + fmtDate(u.expireAt) + '</span><span>' + (nodeCount ? nodeCount + ' نود' : t('card.nodesAuto')) + '</span></div>',
        '<div class="user-tags">' + activeProtocols().map(function(p) { return '<span class="tag on">' + p + '</span>'; }).join('') +
          (u.config && u.config.sb === 'yes' ? '<span class="tag on" title="خروجی از آدرس واسط بیرون از ایران">' + ICO.sanctions + ' تحریم‌شکن</span>' : '') +
          (u.config && u.config.awgv ? '<span class="tag" title="نسخهٔ امنزیا در نودهای WARP">' + ICO.warp + ' امنزیا ' + u.config.awgv + '</span>' : '') +
        '</div>',
        '<div class="user-actions" style="margin-top:auto;">',
          '<button class="btn sm primary" type="button" data-act="copy" data-url="' + base + '">' + ICO.copy + ' ' + t('btn.copySub') + '</button>',
          '<a class="btn sm" href="' + statusUrl + '" target="_blank" rel="noopener">' + ICO.external + ' ' + t('btn.status') + '</a>',
          '<button class="btn sm" type="button" data-act="edit-user" data-id="' + u.id + '">' + ICO.settings + ' ' + t('btn.editUser') + '</button>',
        '</div>',
        '<details class="user-more">',
          '<summary>لینک‌ها و ابزارها</summary>',
          '<div class="user-actions">',
            '<button class="btn sm" type="button" data-act="copy" data-url="' + base + '?target=clash">' + ICO.layers + ' Clash</button>',
            '<button class="btn sm" type="button" data-act="copy" data-url="' + base + '?target=singbox">' + ICO.bolt + ' Singbox</button>',
            '<button class="btn sm" type="button" data-act="copy" data-url="' + base + '?set=domain">' + ICO.globe + ' ' + t('btn.domainSub') + '</button>',
            '<button class="btn sm" type="button" data-act="copy" data-url="' + base + '?set=ipv6">' + ICO.signal + ' IPv6 همراه اول</button>',
            '<button class="btn sm ghost" type="button" data-act="test-nodes" data-user="' + key + '">' + ICO.radar + ' ' + t('btn.testNodes') + '</button>',
            '<button class="btn sm ghost" type="button" data-act="reset-user" data-id="' + u.id + '">' + ICO.refresh + ' ' + t('btn.resetUser') + '</button>',
            '<button class="btn sm danger" type="button" data-act="delete-user" data-id="' + u.id + '">' + ICO.trash + ' ' + 'حذف</button>',
          '</div>',
        '</details>'
      ].join('');
      grid.appendChild(card);
    });
    // انتخاب کاربر هدف برای نوشتن نتیجهٔ اسکن (yx / s)
    var targetSel = $('scanUser');
    if (targetSel) {
      var current = targetSel.value;
      targetSel.innerHTML = '<option value="">تنظیمات پیش‌فرض پنل</option>' + users.map(function(u) {
        return '<option value="' + u.id + '">' + (u.username || u.id) + '</option>';
      }).join('');
      targetSel.value = current && users.some(function(u) { return u.id === current; }) ? current : '';
    }
    renderMetrics();
  }

  function renderLocations() {
    var grid = $('locGrid');
    if (!grid) return;
    var base = origin() + '/sub/' + (userKey(state.users[0]) || ADMIN_PATH);
    var countries = INITIAL_DATA.countrySources || {};
    var token = userKey(state.users[0]) || '';
    var ep = origin() + '/warp/' + encodeURIComponent(token);
    var html = '<div class="loc-card"><div><div class="loc-name">همه لوکیشن‌ها</div><div class="loc-meta">MULTI</div></div>' +
      '<button class="btn sm" type="button" data-act="copy" data-url="' + base + '?country=MULTI">' + ICO.copy + ' کپی</button></div>' +
      // وارپ و اپن‌وی‌پی آماده، بدون اسکنر و بدون تنظیم
      '<div class="loc-card"><div><div class="loc-name">WARP / WARP PRO</div><div class="loc-meta">AmneziaWG + WireGuard · Clash · sing-box · IPv4+IPv6</div></div>' +
      '<div class="toolbar">' +
      '<a class="btn sm" href="' + origin() + '/warp/' + encodeURIComponent(token) + '?format=zip" download>' + ICO.download + ' ZIP همهٔ فرمت‌ها</a>' +
      '<a class="btn sm ghost" href="' + origin() + '/warp/' + encodeURIComponent(token) + '?format=conf" download>WARP.conf</a>' +
      '<a class="btn sm ghost" href="' + origin() + '/warp/' + encodeURIComponent(token) + '?format=links" download>links.txt</a>' +
      '</div></div>' +
      // اندپوینت مخصوص WARP: یک آدرس با همهٔ فرمت‌ها
      '<div class="loc-card ep-card"><div><div class="loc-name">اندپوینت اختصاصی WARP</div><div class="loc-meta">Clash/Mihomo · Hiddify/sing-box · WireGuard · Shadowrocket — هر کاربر توکن خودش را دارد</div></div>' +
      '<a class="ep-url" href="' + ep + '?format=clash" target="_blank" rel="noopener">' + ep + '?format=clash</a>' +
      '<div class="toolbar">' +
      '<button class="btn sm primary" type="button" data-act="copy" data-url="' + ep + '?format=clash">' + ICO.copy + ' Clash</button>' +
      '<button class="btn sm ghost" type="button" data-act="copy" data-url="' + ep + '?format=singbox">' + ICO.copy + ' sing-box</button>' +
      '<button class="btn sm ghost" type="button" data-act="copy" data-url="' + ep + '?format=conf">' + ICO.copy + ' WireGuard</button>' +
      '<button class="btn sm ghost" type="button" data-act="copy" data-url="' + ep + '?format=base64">' + ICO.copy + ' base64</button>' +
      '<a class="btn sm ghost" href="' + ep + '?format=zip">' + ICO.download + ' ZIP</a>' +
      '</div></div>' +
      '<div class="loc-card"><div><div class="loc-name">OpenVPN</div><div class="loc-meta">.ovpn · 3 پروفایل تنظیم · ZIP</div></div>' +
      '<div class="toolbar">' +
      '<a class="btn sm" href="' + base + '?target=ovpn&format=zip" download>' + ICO.download + ' ZIP</a>' +
      '<a class="btn sm ghost" href="' + base + '?target=ovpn" download>.ovpn</a>' +
      '</div></div>';
    var vipList = INITIAL_DATA.vipCountries || [];
    Object.keys(countries).forEach(function(code) {
      var vip = vipList.indexOf(code) > -1;
      html += '<div class="loc-card"><div><div class="loc-name">' + countries[code].name + (vip ? ' <span class="tag on">VIP</span>' : '') + '</div><div class="loc-meta">' + code + ' · ' + (vip ? 'منابع ویژه + منابع عادی' : 'منابع منطقه‌ای') + '</div></div>' +
        '<div class="toolbar">' +
        '<button class="btn sm" type="button" data-act="copy" data-url="' + base + '?country=' + code + '">' + ICO.copy + ' کپی</button>' +
        '<button class="btn sm ghost" type="button" data-act="country-proxy" data-code="' + code + '">' + ICO.link + ' پروکسی → s</button>' +
        '<button class="btn sm ghost" type="button" data-act="country-ip" data-code="' + code + '">' + ICO.globe + ' آی‌پی → yx</button>' +
        '</div></div>';
    });
    grid.innerHTML = html;
    var locUser = $('locUser');
    if (locUser) {
      var current = locUser.value;
      locUser.innerHTML = '<option value="">تنظیمات پیش‌فرض پنل</option>' + (state.users || []).map(function(u) {
        return '<option value="' + u.id + '">' + (u.username || u.id) + '</option>';
      }).join('');
      locUser.value = current && (state.users || []).some(function(u) { return u.id === current; }) ? current : '';
    }
  }

  // افزودن تصادفی آی‌پی سالم همان منطقه به نودهای ترجیحی (yx) کاربر انتخابی
  function locRandomIp(ipv6) {
    var code = $('locRegion') ? $('locRegion').value : 'DE';
    var status = $('locStatus');
    var userId = $('locUser') ? $('locUser').value : '';
    if (status) { status.className = 'scan-status'; status.textContent = 'در حال خواندن منابع آدرس و تست اتصال برای ' + code + '...'; }
    var send = function(payload) {
      return fetch(origin() + '/api/scanner/fetch-and-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function(res) { return res.json(); });
    };
    send({ mode: ipv6 ? 'ipv6' : 'ipv4', country: code, limit: 8 })
      .then(function(data) {
        if (!data.success || !data.proxies || !data.proxies.length) {
          if (status) { status.className = 'scan-status err'; status.textContent = data.message || 'آی‌پی سالمی پیدا نشد.'; }
          return null;
        }
        var items = data.proxies.map(function(p) { return { ip: p.ip, port: p.port, name: p.ip }; });
        return fetch(origin() + '/api/scanner/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Mili-Admin': '1' },
          body: JSON.stringify({ target: 'yx', items: items, userId: userId })
        }).then(function(res) { return res.json(); }).then(function(applied) {
          if (status) {
            status.className = applied.success ? 'scan-status' : 'scan-status err';
            status.textContent = applied.message || (applied.success ? 'آی‌پی‌ها اضافه شدند' : 'افزودن آی‌پی ناموفق بود');
          }
          if (applied.success) reloadUsers();
          return applied;
        });
      })
      .catch(function() {
        if (status) { status.className = 'scan-status err'; status.textContent = 'خطای شبکه در افزودن آی‌پی تصادفی.'; }
      });
  }

  function locCopyRegion() {
    var code = $('locRegion') ? $('locRegion').value : 'DE';
    var user = (state.users || []).filter(function(u) { return u.id === ($('locUser') ? $('locUser').value : ''); })[0] || state.users[0];
    var token = userKey(user) || ADMIN_PATH;
    copyText(origin() + '/sub/' + token + '?country=' + code, 'ساب منطقهٔ ' + code + ' کپی شد');
  }

  function fillSettings() {
    var c = state.config || {};
    document.querySelectorAll('.switch input[data-key]').forEach(function(input) {
      input.checked = c[input.getAttribute('data-key')] === 'yes';
    });
    document.querySelectorAll('input[data-key], select[data-key]').forEach(function(input) {
      if (input.type === 'checkbox') return;
      var key = input.getAttribute('data-key');
      var val = c[key];
      if (key === 'ipRotation') {
        var map = { 0: 'off', '0': 'off', 5: '5m', 15: '15m', 30: '30m', 60: '1h', 1440: '24h' };
        val = (typeof val === 'string' && isNaN(Number(val))) ? val : (map[val] || 'off');
      }
      if (val === undefined || val === null) val = '';
      input.value = String(val);
    });
    var pathView = $('adminPathView');
    if (pathView) pathView.value = ADMIN_PATH ? '/' + ADMIN_PATH : '—';
    var dnsSel = $('dnsPreset');
    if (dnsSel) {
      var presets = INITIAL_DATA.dnsPresets || [];
      var match = presets.filter(function(d) { return d.value === c.customDNS; })[0];
      dnsSel.value = match ? c.customDNS : (c.customDNS ? 'custom' : (presets[0] ? presets[0].value : 'custom'));
    }
  }

  var LANG = lsGet('mili_lang') === 'en' ? 'en' : 'fa';
  function t(key) {
    var dict = (INITIAL_DATA.i18n || {})[LANG] || (INITIAL_DATA.i18n || {}).fa || {};
    return dict[key] || key;
  }
  function updateThemeLabel() {
    var btn = $('themeBtn');
    if (!btn) return;
    var light = document.body.classList.contains('light-mode');
    var text = LANG === 'en' ? (light ? 'Dark mode' : 'Light mode') : (light ? 'حالت شب' : 'حالت روز');
    btn.setAttribute('title', text);
    btn.setAttribute('aria-label', text);
    btn.innerHTML = light ? ICO.moon : ICO.sun;
  }
  function applyLanguage() {
    document.documentElement.lang = LANG;
    document.documentElement.dir = LANG === 'en' ? 'ltr' : 'rtl';
    document.querySelectorAll('[data-i18n]').forEach(function(el) {
      var key = el.getAttribute('data-i18n');
      var text = t(key);
      if (text) el.textContent = text;
    });
    updateThemeLabel();
  }
  function toggleTheme() {
    var light = document.body.classList.toggle('light-mode');
    lsSet('mili_theme', light ? 'light' : 'dark');
    updateThemeLabel();
  }
  function toggleLang() {
    LANG = LANG === 'fa' ? 'en' : 'fa';
    lsSet('mili_lang', LANG);
    applyLanguage();
    renderUsers();
    renderLocations();
    if (typeof scanResults !== 'undefined' && scanResults.length) renderScanRows(scanResults);
  }

  // هشدار هوشمند تداخل تنظیمات
  function detectConflicts(c) {
    var out = [];
    if (c.es === 'yes' && c.frag === 'yes') out.push('Shadowsocks از فرگمنت پشتیبانی نمی‌کند؛ نودهای SS بدون fragment ساخته می‌شوند (مجاز است).');
    if (c.ech === 'yes' && !/^https:\\/\\//i.test(String(c.customDNS || ''))) out.push('ECH به یک DNS از نوع DoH (https://) نیاز دارد.');
    if (c.ech === 'yes' && c.dkby === 'no') out.push('با فعال بودن ECH، پورت‌های HTTP خودکار حذف می‌شوند.');
    if (c.frag === 'yes' && (!c.fragmentPreset || c.fragmentPreset === 'off')) out.push('فرگمنت روشن است اما پریست روی «غیرفعال» است؛ پارامتری ساخته نمی‌شود.');
    if (c.epi === 'no' && c.epd === 'no' && !String(c.yx || '').trim()) out.push('همه منابع آدرس خاموش‌اند؛ سابلینک فقط از هاست ورکر ساخته می‌شود.');
    if (c.ev === 'no' && c.et === 'no' && c.ex === 'no' && c.es === 'no') out.push('هیچ پروتکلی روشن نیست؛ هسته به‌ناچار VLESS را فعال می‌کند.');
    if (String(c.s || '').trim() && !/^(socks5?|https?):\\/\\//i.test(String(c.s).trim())) out.push('آدرس پروکسی خروجی باید با socks5:// یا http:// شروع شود.');
    if (c.yxURL && c.egi === 'no') out.push('منبع آنلاین آدرس وارد شده اما گزینهٔ «منبع آنلاین آدرس» خاموش است.');
    var ports = String(c.ports || '').split(/[,\\s]+/).filter(Boolean).map(Number).filter(function(p) { return p >= 1 && p <= 65535; });
    if (!ports.length) out.push('لیست پورت‌های نود خالی/نامعتبر است؛ از 443 استفاده می‌شود.');
    if (c.ipRotation && c.ipRotation !== 'off' && !String(c.yx || '').trim()) out.push('چرخش آی‌پی فعال است اما فهرست آدرس‌های دستی خالی است.');
    if (c.warpPro === 'yes' && !String(c.warpLicense || '').trim()) out.push('WARP پلاس روشن است اما لایسنس آن وارد نشده؛ نود با برچسب «بدون لایسنس» ساخته می‌شود.');
    return out;
  }
  // ------------------------------------------------------------------
  // فرم ساخت/ویرایش کاربر — همهٔ گزینه‌های موتور
  // ------------------------------------------------------------------
  var USER_FORM_SCHEMA = [
    {
      id: 'protocols',
      title: 'پروتکل‌ها',
      fields: [
        { key: 'ev', section: 'پروتکل‌های فعال', label: 'VLESS', hint: 'پروتکل اصلی؛ بهتر است روشن بماند', type: 'switch', def: 'yes' },
        { key: 'et', section: 'پروتکل‌های فعال', label: 'Trojan', type: 'switch', def: 'no' },
        { key: 'ex', section: 'پروتکل‌های فعال', label: 'xHTTP', type: 'switch', def: 'no' },
        { key: 'es', section: 'پروتکل‌های فعال', label: 'Shadowsocks', type: 'switch', def: 'no' },
        { key: 'tp', section: 'تنظیمات پروتکل', label: 'رمز Trojan', type: 'text', def: '', list: 'dlTp', ph: 'خالی = شناسهٔ خودکار کاربر' },
        { key: 'sspass', section: 'تنظیمات پروتکل', label: 'رمز Shadowsocks', type: 'text', def: '', ph: 'خالی = شناسهٔ خودکار کاربر' },
        { key: 'jk', section: 'تنظیمات پروتکل', label: 'زنجیرهٔ خانگی', type: 'switch', def: 'no' },
        { key: 'dkby', section: 'تنظیمات پروتکل', label: 'حذف پورت‌های HTTP', type: 'switch', def: 'no' }
      ]
    },
    {
      id: 'transport',
      title: 'امنیت و انتقال',
      fields: [
        { key: 'ech', section: 'امنیت', label: 'رمزنگاری ECH', type: 'switch', def: 'no' },
        { key: 'doh', section: 'امنیت', label: 'DNS رمزنگاری‌شده (DoH)', hint: 'در کانفیگ کلاینت، پرس‌وجوهای DNS از مسیر DoH انجام می‌شود', type: 'switch', def: 'yes' },
        { key: 'customECHDomain', section: 'امنیت', label: 'دامنهٔ ECH', type: 'select', def: 'cloudflare-ech.com', options: 'echDomains', raw: true },
        { key: 'customDNS', section: 'امنیت', label: 'سرور DNS رمزنگاری‌شده', type: 'select', def: 'https://223.5.5.5/dns-query', options: 'dnsPresets', raw: true },
        { key: 'alpn', section: 'امنیت', label: 'پروتکل‌های لایهٔ انتقال (ALPN)', type: 'select', def: '', options: [['', 'خودکار'], ['h2,http/1.1', 'h2 + http/1.1'], ['h3,h2,http/1.1', 'h3 + h2 + http/1.1']] },
        { key: 'fp', section: 'امنیت', label: 'اثر انگشت TLS', type: 'select', def: 'chrome', options: 'fingerprints' },
        { key: 'patt', section: 'انتقال و فرگمنت', label: 'مسیر WebSocket', type: 'select', def: '/?ed=2048', options: 'pathPatterns' },
        { key: 'ports', section: 'انتقال و فرگمنت', label: 'پورت‌های امن (TLS)', type: 'text', def: '443', list: 'dlPorts', ph: '443' },
        { key: 'httpPorts', section: 'انتقال و فرگمنت', label: 'پورت‌های HTTP', type: 'text', def: '80', list: 'dlHttpPorts', ph: '80 — خالی برای حذف' },
        { key: 'tcp', section: 'انتقال و فرگمنت', label: 'TCP سریع', hint: 'tcp-concurrent و tcp-fast-open در کانفیگ کلاینت', type: 'switch', def: 'yes' },
        { key: 'udp', section: 'انتقال و فرگمنت', label: 'عبور UDP', hint: 'نودها UDP را عبور می‌دهند (بازی و تماس)', type: 'switch', def: 'yes' },
        { key: 'frag', section: 'انتقال و فرگمنت', label: 'فرگمنت TLS', type: 'switch', def: 'yes' },
        { key: 'fragmentPreset', section: 'انتقال و فرگمنت', label: 'پریست فرگمنت', type: 'select', def: 'mci', options: 'fragmentPresets' },
        { key: 'fragmentLength', section: 'انتقال و فرگمنت', label: 'طول فرگمنت', type: 'text', def: '100-200', list: 'dlFragmentLen' },
        { key: 'fragmentInterval', section: 'انتقال و فرگمنت', label: 'فاصلهٔ فرگمنت', type: 'text', def: '10-20', list: 'dlFragmentInt' },
        { key: 'fragmentPackets', section: 'انتقال و فرگمنت', label: 'نوع بسته‌های فرگمنت', type: 'text', def: 'tlshello', list: 'dlFragmentPackets' }
      ]
    },
    {
      id: 'addresses',
      title: 'آدرس‌ها و منطقه',
      fields: [
        { key: 'ena', section: 'منابع آدرس', label: 'نود روی آدرس خود پنل', hint: 'آدرس پنل به‌عنوان یکی از نودها (مثل حالت پیش‌فرض کلادفلر)', type: 'switch', def: 'yes' },
        { key: 'epi', section: 'منابع آدرس', label: 'آی‌پی‌های ثابت کلادفلر', type: 'switch', def: 'yes' },
        { key: 'epd', section: 'منابع آدرس', label: 'دامنه‌های جایگزین', type: 'switch', def: 'yes' },
        { key: 'egi', section: 'منابع آدرس', label: 'منبع آنلاین آدرس', type: 'switch', def: 'yes' },
        { key: 'ipv4', section: 'منابع آدرس', label: 'آدرس‌های IPv4', type: 'switch', def: 'yes' },
        { key: 'ipv6', section: 'منابع آدرس', label: 'آدرس‌های IPv6', type: 'switch', def: 'yes' },
        { key: 'ispMobile', section: 'گروه‌های اپراتور', label: 'گروه اپراتور همراه اول', type: 'switch', def: 'yes' },
        { key: 'ispUnicom', section: 'گروه‌های اپراتور', label: 'گروه اپراتور ایرانسل', type: 'switch', def: 'yes' },
        { key: 'ispTelecom', section: 'گروه‌های اپراتور', label: 'گروه اپراتور مخابرات', type: 'switch', def: 'yes' },
        { key: 'region', section: 'منطقه و آدرس‌های دلخواه', label: 'منطقه', type: 'select', def: 'auto', options: 'regions' },
        { key: 'wk', section: 'منطقه و آدرس‌های دلخواه', label: 'منطقهٔ ورکر', type: 'text', def: '', ph: 'DE / NL / US…' },
        { key: 'locationNodeCount', section: 'منطقه و آدرس‌های دلخواه', label: 'تعداد نود هر لوکیشن', type: 'number', def: 6, min: 1, max: 40 },
        { key: 'yx', section: 'آدرس‌های دستی', label: 'آدرس‌های دستی', type: 'textarea', rows: 5, wide: true, def: '', ph: ['104.16.0.1:443#آلمان', '104.17.0.1:2053', '1.2.3.4', '[2606:4700::1]:443#آمریکا'].join(String.fromCharCode(10)), hint: 'هر آدرس در یک خط؛ هر قالبی که بخواهید قابل قبول است: <code>آی‌پی</code> · <code>آی‌پی:پورت</code> · <code>آی‌پی:پورت#نام</code> · <code>[آی‌پی نسخهٔ ۶]:پورت#نام</code> · <code>دامنه:پورت</code> — جدا کردن با کاما هم کار می‌کند.' },
        { key: 'yxURL', section: 'آدرس‌های دستی', label: 'منبع آنلاین آدرس‌ها', type: 'text', wide: true, def: '', list: 'dlYxUrl', ph: 'https://... (چند نشانی را با کاما جدا کنید)' },
        { key: 'sb', section: 'مسیر خروج', label: 'تحریم‌شکن (خروجی از آدرس واسط)', hint: 'همهٔ نودها از یک آدرس بیرون از ایران خارج می‌شوند تا سرویس‌های مسدود برای آی‌پی ایران باز شوند', type: 'switch', def: 'yes' },
        { key: 'sbRegion', section: 'مسیر خروج', label: 'منطقهٔ تحریم‌شکن', type: 'select', def: 'DE', options: 'regions' },
        { key: 'p', section: 'مسیر خروج', label: 'آدرس واسط (ProxyIP)', type: 'text', def: '', list: 'dlProxyIp', ph: 'ProxyIP.DE.example.com:443' },
        { key: 's', section: 'مسیر خروج', label: 'پروکسی خروجی', type: 'text', def: '', list: 'dlProxy', ph: 'socks5://host:1080' }
      ]
    },
    {
      id: 'advanced',
      title: 'پیشرفته و پنل',
      fields: [
        { key: 'ae', section: 'دسترسی و مسیر', label: 'اجازهٔ دسترسی به API', type: 'switch', def: 'no' },
        { key: 'rm', section: 'دسترسی و مسیر', label: 'حالت مسیر', type: 'text', def: '', ph: 'خالی = پیش‌فرض' },
        { key: 'qj', section: 'دسترسی و مسیر', label: 'قفل آی‌پی', type: 'text', def: '', ph: 'خالی = غیرفعال' },
        { key: 'yxby', section: 'دسترسی و مسیر', label: 'نادیده‌گرفتن آدرس‌های دستی', type: 'switch', def: 'no' },
        { key: 'ipRotation', label: 'چرخش آی‌پی', type: 'select', def: 'off', options: [['off', 'غیرفعال'], ['5m', '۵ دقیقه'], ['15m', '۱۵ دقیقه'], ['30m', '۳۰ دقیقه'], ['1h', '۱ ساعت'], ['24h', '۲۴ ساعت']] },
        { key: 'd', section: 'دسترسی و مسیر', label: 'مسیر اختصاصی کاربر', type: 'text', def: '', list: 'dlAdminPath' },
        { key: 'homepage', section: 'دسترسی و مسیر', label: 'صفحهٔ استتار', type: 'text', def: '', list: 'dlHomepage' },
        { key: 'scu', section: 'دسترسی و مسیر', label: 'سرویس تبدیل اشتراک', type: 'text', def: '', list: 'dlScu' },
        { key: 'pd', section: 'دامنهٔ پنل', label: 'نود با دامنهٔ پنل', type: 'switch', def: 'no' },
        { key: 'pdCount', section: 'دامنهٔ پنل', label: 'تعداد نود دامنهٔ پنل', type: 'number', def: 2, min: 0, max: 20 }
      ]
    },
    {
      id: 'extras',
      title: 'افزونه‌ها',
      fields: [
        { key: 'warp', section: 'WARP', label: 'WARP', type: 'switch', def: 'no' },
        { key: 'awgv', section: 'WARP', label: 'نسخهٔ امنزیا (AmneziaWG)', hint: 'نسخهٔ ۳ = بسته‌های امضایی I1..I3 و تنظیمات زمانی', type: 'select', def: '3', options: [['3', 'نسخهٔ ۳ (پیشنهادی)'], ['2', 'نسخهٔ ۲'], ['1', 'نسخهٔ ۱ — فقط بسته‌های Junk']] },
        { key: 'warpPro', section: 'WARP', label: 'WARP پلاس', type: 'switch', def: 'no' },
        { key: 'warpMl', section: 'WARP', label: 'WARP چندلوکیشن', type: 'switch', def: 'no' },
        { key: 'warpCount', section: 'WARP', label: 'تعداد WARP', type: 'number', def: 8, min: 1, max: 30 },
        { key: 'warpLicense', section: 'WARP', label: 'لایسنس WARP پلاس', type: 'text', def: '' },
        { key: 'warpEndpoint', section: 'WARP', label: 'نقاط پایانی WARP', type: 'text', def: '', list: 'dlWarpEndpoint' },
        { key: 'ovpn', section: 'OpenVPN', label: 'OpenVPN', type: 'switch', def: 'no' },
        { key: 'ovpnCount', section: 'OpenVPN', label: 'تعداد OpenVPN', type: 'number', def: 4, min: 0, max: 24 },
        { key: 'ovpnCountries', section: 'OpenVPN', label: 'کشورهای OpenVPN', type: 'text', def: '', list: 'dlCountries' },
        { key: 'ovpnSource', section: 'OpenVPN', label: 'منبع OpenVPN', type: 'text', def: '' }
      ]
    }
  ];

  var formState = { editingId: null, tab: 'basic' };
  var NL = String.fromCharCode(10);
  var SEP_RE = new RegExp('[,' + String.fromCharCode(10, 13) + ';،]+');

  function optionHtml(field, current) {
    var list = field.options;
    var pairs = [];
    if (typeof list === 'string') {
      if (list === 'echDomains') pairs = (INITIAL_DATA.echDomains || []).map(function(d) { return [d, d]; });
      else if (list === 'dnsPresets') pairs = (INITIAL_DATA.dnsPresets || []).map(function(d) { return [d.value, d.name]; });
      else if (list === 'fingerprints') pairs = (INITIAL_DATA.fingerprints || []).map(function(f) { return [f.id, f.name]; });
      else if (list === 'pathPatterns') pairs = (INITIAL_DATA.pathPatterns || []).map(function(p) { return [p.id, p.name]; });
      else if (list === 'fragmentPresets') pairs = Object.keys(INITIAL_DATA.fragmentPresets || {}).map(function(id) { return [id, INITIAL_DATA.fragmentPresets[id].name || id]; });
      else if (list === 'regions') {
        pairs = [['auto', 'خودکار (بدون محدودیت منطقه)'], ['CF', 'مستقیم کلادفلر (CF)']];
        var srcs = INITIAL_DATA.countrySources || {};
        Object.keys(srcs).sort().forEach(function(code) { pairs.push([code, srcs[code].name + ' — ' + code]); });
      }
    } else if (Array.isArray(list)) {
      pairs = list;
    }
    if (current !== undefined && current !== null && current !== '' && !pairs.some(function(p) { return String(p[0]) === String(current); })) {
      pairs = pairs.concat([[current, current]]);
    }
    return pairs.map(function(p) {
      return '<option value="' + String(p[0]).replace(/"/g, '&quot;') + '"' + (String(p[0]) === String(current) ? ' selected' : '') + '>' + p[1] + '</option>';
    }).join('');
  }

  function isPortNo(value) {
    var s = String(value || '').trim();
    if (!s || s.length > 5) return false;
    for (var i = 0; i < s.length; i++) { if (s.charCodeAt(i) < 48 || s.charCodeAt(i) > 57) return false; }
    return true;
  }

  // آدرس‌های دستی: هر خط (یا کاما) یک آدرس با قالب‌های آزاد قابل قبول است
  function normalizeManualList(text) {
    var seen = {}, out = [];
    String(text || '').split(SEP_RE).forEach(function(line) {
      var item = String(line || '').trim();
      var scheme = item.indexOf('://');
      if (scheme > -1) item = item.slice(scheme + 3);
      var slash = item.indexOf('/');
      if (slash > -1) item = item.slice(0, slash);
      item = item.trim();
      if (!item) return;
      var name = '';
      var hash = item.indexOf('#');
      if (hash > -1) {
        name = item.slice(hash + 1).trim();
        item = item.slice(0, hash).trim();
      }
      var host = item, port = 443;
      if (item.charAt(0) === '[') {
        var close = item.indexOf(']');
        if (close > 0) {
          host = item.slice(1, close);
          var tail = item.slice(close + 1).replace(/^:/, '');
          if (isPortNo(tail)) port = parseInt(tail, 10);
        }
      } else if ((item.match(/:/g) || []).length === 1) {
        var parts = item.split(':');
        if (isPortNo(parts[1])) { host = parts[0]; port = parseInt(parts[1], 10); }
      }
      host = String(host || '').trim();
      if (!host || host.split(' ').length > 1) return;
      if (!(port > 0 && port <= 65535)) port = 443;
      var key = host + ':' + port;
      if (seen[key]) return;
      seen[key] = 1;
      var label = (name || (host + ':' + port)).replace(/,/g, ' ');
      out.push((host.indexOf(':') > -1 ? '[' + host + ']' : host) + ':' + port + '#' + label);
    });
    return out.join(',');
  }

  function manualListToLines(text) {
    return String(text || '').split(',').map(function(s) { return s.trim(); }).filter(Boolean).join(NL);
  }

  function fieldHtml(field, value) {
    var id = 'uf_' + field.key;
    var val = value === undefined || value === null ? field.def : value;
    var hint = field.hint ? '<span class="field-hint">' + field.hint + '</span>' : '';
    var wideClass = field.wide ? ' style="grid-column: 1 / -1;"' : '';
    if (field.type === 'textarea') {
      var rows = field.rows || 4;
      return '<div class="field"' + wideClass + '><label>' + field.label + '</label>' +
        '<textarea id="' + id + '" data-uf="' + field.key + '" rows="' + rows + '" spellcheck="false" dir="ltr" placeholder="' +
        String(field.ph || '').split(NL).join('&#10;').replace(/"/g, '&quot;') + '">' +
        manualListToLines(val).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</textarea>' + hint + '</div>';
    }
    if (field.type === 'switch') {
      var on = String(val) === 'yes';
      return '<div class="switch-row"><div class="switch-meta"><div><b>' + field.label + '</b>' + hint + '</div></div>' +
        '<label class="switch"><input type="checkbox" id="' + id + '" data-uf="' + field.key + '" data-type="switch"' + (on ? ' checked' : '') + '><i></i></label></div>';
    }
    if (field.type === 'select') {
      return '<div class="field"><label>' + field.label + '</label>' +
        '<select id="' + id + '" data-uf="' + field.key + '">' + optionHtml(field, val) + '</select>' + hint + '</div>';
    }
    var attrs = 'type="' + (field.type === 'number' ? 'number' : 'text') + '" id="' + id + '" data-uf="' + field.key + '"';
    if (field.type === 'number') attrs += ' min="' + (field.min === undefined ? 0 : field.min) + '" max="' + (field.max === undefined ? 999 : field.max) + '" step="1"';
    if (field.list) attrs += ' list="' + field.list + '"';
    if (field.ph) attrs += ' placeholder="' + field.ph.replace(/"/g, '&quot;') + '"';
    return '<div class="field"><label>' + field.label + '</label>' +
      '<input ' + attrs + ' value="' + String(val === undefined ? '' : val).replace(/"/g, '&quot;') + '">' + hint + '</div>';
  }

  function formPaneHtml(group, cfg) {
    var html = '', lastSection = null, open = false;
    group.fields.forEach(function(field) {
      if (field.section && field.section !== lastSection) {
        if (open) html += '</div>';
        html += '<div class="uf-section"><span>' + field.section + '</span><i></i></div><div class="form-grid">';
        open = true;
        lastSection = field.section;
      } else if (!open) {
        html += '<div class="form-grid">';
        open = true;
      }
      html += fieldHtml(field, cfg[field.key]);
    });
    if (open) html += '</div>';
    return html;
  }

  function switchUserFormTab(id) {
    var modal = $('createModal');
    if (!modal) return;
    formState.tab = id;
    modal.querySelectorAll('[data-uf-tab]').forEach(function(b) {
      var on = b.getAttribute('data-uf-tab') === id;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      if (on && b.scrollIntoView) b.scrollIntoView({ block: 'nearest', inline: 'center' });
    });
    modal.querySelectorAll('[data-uf-pane]').forEach(function(p) {
      p.classList.toggle('is-active', p.getAttribute('data-uf-pane') === id);
    });
    var body = $('userFormBody');
    if (body) body.scrollTop = 0;
  }

  function renderUserForm(user, presetId) {
    var body = $('userFormBody');
    if (!body) return;
    // برای کاربر جدید، مقادیر از تنظیمات کلی پنل و برای ویرایش از خود کاربر
    var base = user ? (INITIAL_DATA.defaults || {}) : Object.assign({}, INITIAL_DATA.defaults || {}, state.config || {});
    var cfg = Object.assign({}, base, (user && user.config) || {});
    var preset = (INITIAL_DATA.presets || {})[presetId || (user && user.preset) || 'iran-fast'];
    if (preset && preset.configOverrides) cfg = Object.assign({}, cfg, preset.configOverrides);
    var activeTab = formState.tab || 'basic';
    var basicHtml = '<div class="uf-section"><span>مشخصات کاربر</span><i></i></div>' +
      '<div class="form-grid">' +
      '<div class="field"><label>نام کاربری</label><input type="text" id="uf_username" value="' + String((user && user.username) || '').replace(/"/g, '&quot;') + '" placeholder="مثلاً ali"></div>' +
      '<div class="field"><label>پریست آماده</label><select id="uf_preset">' + Object.keys(INITIAL_DATA.presets || {}).map(function(k) {
        var p = INITIAL_DATA.presets[k];
        return '<option value="' + k + '"' + (k === (presetId || (user && user.preset)) ? ' selected' : '') + '>' + p.title + '</option>';
      }).join('') + '</select></div>' +
      '<div class="field"><label>یادداشت</label><input type="text" id="uf_note" value="' + String((user && user.note) || '').replace(/"/g, '&quot;') + '"></div>' +
      '<div class="field"><label>شناسهٔ کاربر (UUID)</label><input type="text" id="uf_uuid" class="mono" value="' + String((user && user.uuid) || '') + '" placeholder="خالی = ساخت خودکار"></div>' +
      '</div>' +
      '<div class="uf-section"><span>سهمیه و محدودیت</span><i></i></div>' +
      '<div class="form-grid">' +
      '<div class="field"><label>حجم مجاز (گیگابایت) — ۰ = نامحدود</label><input type="number" id="uf_dataLimitGb" min="0" step="1" list="dlDataLimit" value="' + Number((user && user.dataLimitGb) || 0) + '"></div>' +
      '<div class="field"><label>مدت اعتبار (روز) — ۰ = بدون انقضا</label><input type="number" id="uf_expireDays" min="0" step="1" list="dlExpireDays" value="' + Number((user && user.expireDays) || 0) + '"></div>' +
      '<div class="field"><label>سقف دستگاه متصل</label><input type="number" id="uf_ipLimit" min="1" max="200" step="1" value="' + Number((user && user.ipLimit) || 50) + '"></div>' +
      '</div>' +
      '<div class="field" style="margin-top:10px;"><span class="field-hint">تعداد کانفیگ را خود پنل تعیین می‌کند؛ هر آدرس فعال از تب «آدرس‌ها و منطقه» به یک نود تبدیل می‌شود و نیازی به انتخاب دستی تعداد نیست.</span></div>';

    var tabButton = function(id, label) {
      var on = activeTab === id;
      return '<button type="button" role="tab" aria-selected="' + (on ? 'true' : 'false') + '" class="ftab' + (on ? ' is-active' : '') + '" data-uf-tab="' + id + '"><i class="ftab-dot"></i>' + label + '</button>';
    };
    var tabsHtml = tabButton('basic', 'اطلاعات کاربر');
    USER_FORM_SCHEMA.forEach(function(group) { tabsHtml += tabButton(group.id, group.title); });
    var tabsBar = $('userFormTabs');
    if (tabsBar) tabsBar.innerHTML = tabsHtml;

    var html = '<div class="uf-pane' + (activeTab === 'basic' ? ' is-active' : '') + '" data-uf-pane="basic">' + basicHtml + '</div>';
    USER_FORM_SCHEMA.forEach(function(group) {
      html += '<div class="uf-pane' + (activeTab === group.id ? ' is-active' : '') + '" data-uf-pane="' + group.id + '">' + formPaneHtml(group, cfg) + '</div>';
    });
    body.innerHTML = html;
    formState.tab = activeTab;
    formState.editingId = user ? user.id : null;
    if ($('userFormTitle')) $('userFormTitle').innerHTML = (user ? ICO.refresh + ' ویرایش کاربر «' + (user.username || '') + '»' : ICO.plus + ' ایجاد کاربر جدید');
    if ($('userFormSubmit')) $('userFormSubmit').innerHTML = user ? ICO.check + ' ذخیرهٔ تغییرات' : ICO.check + ' ساخت کاربر';
  }

  function collectUserForm() {
    var body = $('userFormBody');
    var config = {};
    if (body) {
      body.querySelectorAll('[data-uf]').forEach(function(el) {
        var key = el.getAttribute('data-uf');
        if (el.getAttribute('data-type') === 'switch') { config[key] = el.checked ? 'yes' : 'no'; return; }
        if (el.type === 'number') {
          var num = parseInt(el.value, 10);
          config[key] = Number.isFinite(num) ? num : 0;
          return;
        }
        if (key === 'yx') { config[key] = normalizeManualList(el.value); return; }
        config[key] = String(el.value || '').trim();
      });
    }
    var val = function(id, fallback) { return $(id) ? String($(id).value || '').trim() : fallback; };
    return {
      username: val('uf_username', ''),
      preset: val('uf_preset', 'iran-fast'),
      uuid: val('uf_uuid', ''),
      note: val('uf_note', ''),
      dataLimitGb: Number(val('uf_dataLimitGb', '0')) || 0,
      expireDays: Number(val('uf_expireDays', '0')) || 0,
      ipLimit: Number(val('uf_ipLimit', '50')) || 50,
      config: config
    };
  }

  function openUserForm(user) {
    formState.tab = 'basic';
    renderUserForm(user || null, null);
    openModal('createModal');
  }

  function saveUser() {
    var body = collectUserForm();
    if (body.username.length < 2) { showToast('نام کاربری باید حداقل ۲ کاراکتر باشد', 'err'); return; }
    // هشدارهای تداخل تنظیمات (فقط نمایش؛ جلوی ذخیره را نمی‌گیرد)
    var conflicts = detectConflicts(body.config);
    if (conflicts.length) showToast('هشدار: ' + conflicts[0], 'err');
    var isEdit = Boolean(formState.editingId);
    var payload = body;
    if (isEdit) payload.id = formState.editingId;
    var btn = $('userFormSubmit');
    if (btn) btn.disabled = true;
    api('/api/users', { method: isEdit ? 'PUT' : 'POST', body: JSON.stringify(payload) })
      .then(function(data) {
        if (data.success) {
          if (isEdit) {
            state.users = state.users.map(function(u) { return u.id === data.user.id ? data.user : u; });
          } else {
            state.users.unshift(data.user);
          }
          renderUsers(); renderLocations();
          closeModal('createModal');
          showToast(data.message || (isEdit ? 'کاربر ویرایش شد' : 'کاربر ساخته شد'), 'ok');
        } else {
          showToast(data.message || 'خطا در ذخیرهٔ کاربر', 'err');
        }
      })
      .catch(function() { showToast('خطای شبکه در ذخیرهٔ کاربر', 'err'); })
      .finally(function() { if (btn) btn.disabled = false; });
  }

  function editUser(id) {
    var user = (state.users || []).filter(function(u) { return u.id === id; })[0];
    if (!user) { showToast('کاربر یافت نشد', 'err'); return; }
    // همیشه تازه‌ترین نسخه را از سرور بگیر تا همهٔ متغیرها (config) کامل باشد
    api('/api/users?t=' + Date.now())
      .then(function(data) {
        if (data.success) {
          state.users = data.users || state.users;
          user = state.users.filter(function(u) { return u.id === id; })[0] || user;
        }
        openUserForm(user);
      })
      .catch(function() { openUserForm(user); });
  }

  function applyPresetToForm() {
    var presetId = $('uf_preset') ? $('uf_preset').value : 'iran-fast';
    renderUserForm(formState.editingId ? (state.users || []).filter(function(u) { return u.id === formState.editingId; })[0] : null, presetId);
  }

  // ---------- نسخه و بروزرسانی ----------
  function renderUpdateInfo(info, silent) {
    var latest = $('updLatest');
    var stateEl = $('updState');
    var notesEl = $('updNotes');
    var drawerVersion = $('drawerVersion');
    if (latest) latest.textContent = info && info.latest ? 'v' + info.latest : '—';
    if (drawerVersion && info && info.current) drawerVersion.textContent = 'v' + info.current;
    if ($('updAuto')) {
      var autoReady = Boolean(info && (info.autoApplyAvailable || info.tokenSource === 'env'));
      $('updAuto').textContent = autoReady ? 'در دسترس (کلید خود ورکر)' : 'دانلود فایل / دستور استقرار';
      $('updAuto').style.color = autoReady ? 'var(--neon)' : 'var(--warn)';
    }
    if ($('updScript')) $('updScript').textContent = (info && info.scriptName) || 'تشخیص خودکار';
    if (!stateEl) return;
    if (!info || info.success === false) {
      stateEl.textContent = 'بررسی ناموفق';
      if (!silent) showToast((info && info.error) || 'بررسی بروزرسانی ناموفق بود', 'err');
      return;
    }
    if (info.updateAvailable) {
      stateEl.textContent = 'نسخهٔ تازه موجود است';
      stateEl.style.color = 'var(--warn)';
      if (!silent) showToast('نسخهٔ ' + info.latest + ' آماده است', 'ok');
    } else {
      stateEl.textContent = 'به‌روز است';
      stateEl.style.color = 'var(--neon)';
      if (!silent) showToast('نسخهٔ نصب‌شده به‌روز است', 'ok');
    }
    if (notesEl) {
      var notes = info.notes || [];
      notesEl.innerHTML = notes.map(function(n) { return '<li>' + n + '</li>'; }).join('');
      notesEl.style.display = notes.length ? 'block' : 'none';
    }
  }

  function checkUpdate(silent) {
    api('/api/update?t=' + Date.now())
      .then(function(info) { renderUpdateInfo(info, silent); })
      .catch(function() { if (!silent) showToast('خطای شبکه در بررسی بروزرسانی', 'err'); });
  }

  // بروزرسانی بدون هیچ ورودی حسابی: فایل نسخهٔ تازه به‌صورت دانلود ذخیره می‌شود
  // (قبلاً فایل خام _worker.js در تب جدید باز می‌شد و کاربر یک صفحهٔ کد می‌دید)
  function downloadUpdateBundle() {
    var link = document.createElement('a');
    link.href = origin() + '/api/update-bundle';
    link.setAttribute('download', 'miliconfig-worker.js');
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('فایل نسخهٔ تازه دانلود شد', 'ok');
  }

  // گزارش گام‌به‌گام وضعیت نصب خودکار (فقط خواندنی؛ چیزی را تغییر نمی‌دهد)
  function updateDiagRow(label, value, state) {
    var color = state === false ? 'var(--danger)' : state === true ? 'var(--neon)' : 'var(--text)';
    return '<div><b style="color:' + color + '">' + label + ':</b> ' + (value || '—') + '</div>';
  }

  function showUpdateBox(title, lines) {
    var box = $('updDiagBox');
    var body = $('updDiagBody');
    if (!box || !body) return;
    var html = title ? '<b>' + title + '</b>' : '';
    if (lines && lines.length) {
      html += '<div style="margin-top:' + (title ? '6px' : '0') + '">' + lines.join('<br>') + '</div>';
    }
    body.innerHTML = html;
    box.style.display = 'block';
  }

  function renderUpdateDiagnose(d) {
    if (!d || d.success === false) {
      showUpdateBox('تشخیص ناموفق بود', [(d && (d.error || d.message)) || 'پاسخ نامعتبر از سرور']);
      return;
    }
    var lines = [];
    lines.push(updateDiagRow('کلید CF_API_TOKEN', d.tokenPresent ? 'تعریف شده روی ورکر' : 'تعریف نشده', d.tokenPresent));
    if (d.tokenPresent) {
      lines.push(updateDiagRow('اعتبار کلید', d.tokenValid ? ('معتبر' + (d.tokenStatus ? ' (' + d.tokenStatus + ')' : '')) : ('نامعتبر — ' + (d.tokenError || 'دلیل نامشخص')), d.tokenValid));
    }
    if (d.accountId) {
      lines.push(updateDiagRow('Account ID', '…' + d.accountTail + (d.accountDetected ? ' (خودکار شناسایی شد)' : ''), true));
    } else if (d.accountError) {
      lines.push(updateDiagRow('Account ID', d.accountError, false));
    }
    lines.push(updateDiagRow('اسکریپت هدف', d.scriptName || 'تشخیص داده نشد', Boolean(d.scriptName)));
    if (d.scriptSource) lines.push(updateDiagRow('منبع نام اسکریپت', d.scriptSource));
    if (d.bindingCount) {
      lines.push(updateDiagRow('بایندینگ‌های فعلی', d.bindingCount + ' مورد (' + (d.bindings || []).map(function(b) { return b.type; }).join(', ') + ')'));
    } else if (d.bindingsError) {
      lines.push(updateDiagRow('بایندینگ‌های فعلی', d.bindingsError, false));
    }
    if (d.compatibilityDate) {
      lines.push(updateDiagRow('تاریخ سازگاری', d.compatibilityDate + ((d.compatibilityFlags || []).length ? ' · ' + d.compatibilityFlags.join(', ') : '')));
    }
    lines.push(updateDiagRow('نسخه', d.current + ' → ' + (d.latest || 'نامشخص'), d.updateAvailable ? null : true));
    var steps = d.steps || [];
    if (steps.length) {
      lines.push('<div style="margin-top:6px">' + steps.map(function(s) { return '• ' + s; }).join('<br>') + '</div>');
    }
    showUpdateBox('نتیجهٔ تشخیص نصب خودکار', lines);
  }

  function diagnoseUpdate() {
    showToast('در حال بررسی پیش‌نیازهای نصب خودکار...', 'ok');
    api('/api/update?diagnose=1&t=' + Date.now())
      .then(renderUpdateDiagnose)
      .catch(function() { showToast('خطای شبکه در تشخیص نصب خودکار', 'err'); });
  }

  function copyUpdateCommand() {
    api('/api/update?t=' + Date.now())
      .then(function(info) {
        var cmd = info && info.command
          ? info.command
          : 'curl -fsSL ' + (info && info.downloadUrl ? info.downloadUrl : '') + ' -o _worker.js && npx wrangler deploy _worker.js';
        copyText(cmd, 'دستور استقرار کپی شد');
      })
      .catch(function() { showToast('خطای شبکه در دریافت دستور', 'err'); });
  }

  function enableAutoUpdate() {
    var btn = document.querySelector('[data-act="enable-autoupdate"]');
    if (btn) btn.disabled = true;
    api('/api/auto-update-setup', { method: 'POST', body: JSON.stringify({ action: 'enable' }) })
      .then(function(data) {
        if (data.success) {
          showToast(data.message || 'بروزرسانی خودکار فعال شد', 'ok');
          checkUpdate(true);
        } else {
          showToast(data.message || data.error || 'نصب خودکار در دسترس نیست', 'err');
        }
      })
      .catch(function() { showToast('خطای شبکه در فعال‌سازی', 'err'); })
      .finally(function() { if (btn) btn.disabled = false; });
  }

  function disableAutoUpdate() {
    if (!ask('بروزرسانی خودکار خاموش شود؟')) return;
    api('/api/auto-update-setup', { method: 'POST', body: JSON.stringify({ action: 'disable' }) })
      .then(function(data) {
        showToast(data.success ? 'بروزرسانی خودکار خاموش شد' : 'خطا', data.success ? 'ok' : 'err');
        checkUpdate(true);
      })
      .catch(function() { showToast('خطای شبکه', 'err'); });
  }

  function applyUpdateNow() {
    if (!ask('نسخهٔ تازهٔ گیت‌هاب روی همین ورکر مستقر شود؟')) return;
    var btn = document.querySelector('[data-act="apply-update"]');
    if (btn) btn.disabled = true;
    showToast('در حال دریافت و استقرار نسخهٔ تازه...', 'ok');
    api('/api/update', { method: 'POST', body: JSON.stringify({ action: 'apply' }) })
      .then(function(data) {
        if (data.success) {
          showToast(data.message || 'نسخهٔ تازه مستقر شد', 'ok');
          setTimeout(function() { location.reload(); }, 2500);
        } else if (data.needsManualDeploy) {
          // بدون کلید ورکر: فایل به‌صورت دانلود ذخیره می‌شود (نه باز شدن فایل خام)
          downloadUpdateBundle();
          showUpdateBox(data.error || 'نصب خودکار در دسترس نیست', data.steps || []);
          showToast('فایل نسخهٔ تازه ذخیره شد؛ راهنمای استقرار زیر کارت است', 'err');
        } else {
          showToast(data.error || data.message || 'بروزرسانی ناموفق بود', 'err');
          if (data.error) showUpdateBox('خطای نصب خودکار', [data.error]);
          if (data.diagnose) setTimeout(diagnoseUpdate, 600);
        }
      })
      .catch(function() { showToast('خطای شبکه در بروزرسانی', 'err'); })
      .finally(function() { if (btn) btn.disabled = false; });
  }

  function deleteUser(id) {
    if (!ask('این کاربر حذف شود؟')) return;
    api('/api/users?id=' + encodeURIComponent(id), { method: 'DELETE' })
      .then(function(data) {
        if (data.success) {
          state.users = state.users.filter(function(u) { return u.id !== id; });
          renderUsers(); renderLocations();
          showToast('کاربر حذف شد', 'ok');
        } else {
          showToast(data.message || 'خطا در حذف کاربر', 'err');
        }
      })
      .catch(function() { showToast('خطای شبکه در حذف کاربر', 'err'); });
  }

  function resetUser(id) {
    if (!ask('مصرف این کاربر صفر شود؟')) return;
    api('/api/users', { method: 'PUT', body: JSON.stringify({ id: id, action: 'reset' }) })
      .then(function(data) {
        if (data.success) {
          state.users = state.users.map(function(u) { return u.id === id ? data.user : u; });
          renderUsers();
          showToast(data.message || 'مصرف صفر شد', 'ok');
        } else {
          showToast(data.message || 'خطا در ریست مصرف', 'err');
        }
      })
      .catch(function() { showToast('خطای شبکه در ریست مصرف', 'err'); });
  }

  function reloadUsers() {
    api('/api/users?t=' + Date.now())
      .then(function(data) {
        if (data.success) {
          state.users = data.users || [];
          renderUsers(); renderLocations();
          showToast('لیست کاربران بروزرسانی شد', 'ok');
        }
      })
      .catch(function() { showToast('خطا در دریافت کاربران', 'err'); });
  }

  // منوی اسکن: هر مورد یک صفحهٔ مستقل دارد و همه چیز داخل پنل اجرا می‌شود
  var SCAN_META = {
    ipv4: {
      title: 'آی‌پی ثابت IPv4', icon: 'server', target: 'yx', country: true, family: false, manual: false,
      desc: 'آدرس‌های سالم IPv4 به تفکیک کشور',
      note: 'منابع آدرس به‌صورت زنده خوانده می‌شوند و هر آدرس با تست اتصال بررسی می‌شود. نتیجه را با دکمهٔ هر ردیف به آدرس‌های دستی، آدرس واسط یا پروکسی خروجی همان کاربر اضافه کنید.'
    },
    ipv6: {
      title: 'آی‌پی ثابت IPv6', icon: 'signal', target: 'yx', country: true, family: false, manual: false, defaultCountry: 'IR',
      desc: 'آدرس‌های نسخهٔ ۶ برای شبکه‌های همراه',
      note: 'آدرس‌های IPv6 از رنج‌های زندهٔ کلادفلر انتخاب می‌شوند. خروجی ورکر IPv6 ندارد، پس این آدرس‌ها بدون تست TCP به‌عنوان پیشنهاد داده می‌شوند و باید در کلاینت امتحان شوند.'
    },
    domain: {
      title: 'دامنه‌های جایگزین', icon: 'globe', target: 'yx', country: true, family: false, manual: false,
      desc: 'دامنهٔ لبهٔ کلادفلر به جای آی‌پی خام',
      note: 'برای شبکه‌هایی که آی‌پی خام را می‌بندند؛ دامنه‌ها به‌جای آی‌پی در تنظیمات آدرس‌های دستی می‌نشینند.'
    },
    proxyip: {
      title: 'آدرس واسط (ProxyIP)', icon: 'api', target: 'p', country: true, family: false, manual: false,
      desc: 'آدرس واسط آماده برای خروج از ایران',
      note: 'یک آدرس واسط سالم انتخاب می‌شود تا نودها از بیرون ایران خارج شوند. با «تنظیم روی این کاربر» فقط همان کاربر تغییر می‌کند.'
    },
    proxy: {
      title: 'پروکسی کشوری', icon: 'link', target: 's', country: true, family: true, manual: false,
      desc: 'SOCKS5 و HTTP به تفکیک کشور',
      note: 'پروکسی‌های زندهٔ همان کشور خوانده و تست می‌شوند؛ سریع‌ترین را می‌توانید به‌عنوان پروکسی خروجی ثبت کنید.'
    },
    manual: {
      title: 'تست آدرس دستی', icon: 'terminal', target: 'yx', country: false, family: false, manual: true,
      desc: 'فهرست خودتان را داخل پنل تست کنید',
      note: 'هر خط یک آدرس یا host:port بنویسید (حداکثر ۲۴ مورد). تست از همین پنل انجام می‌شود و نتیجه همان‌جا می‌آید.'
    }
  };
  var currentScan = '';

  function scanCountryOptions(selected) {
    var countries = INITIAL_DATA.countrySources || {};
    return Object.keys(countries).map(function(code) {
      return '<option value="' + code + '"' + (code === selected ? ' selected' : '') + '>' + countries[code].name + ' — ' + code + '</option>';
    }).join('');
  }

  function scanLimitOptions(selected) {
    return [5, 10, 15, 20].map(function(n) {
      var fa = { 5: '۵', 10: '۱۰', 15: '۱۵', 20: '۲۰' }[n];
      return '<option value="' + n + '"' + (n === selected ? ' selected' : '') + '>' + fa + ' مورد</option>';
    }).join('');
  }

  function scanViewHtml(id) {
    var m = SCAN_META[id];
    var controls = '';
    if (m.manual) {
      controls = '<div class="field" style="grid-column: 1 / -1;"><label>آدرس‌ها؛ هر خط یک مورد (host یا host:port)</label>' +
        '<textarea id="sc_manual_hosts" rows="4" placeholder="104.16.0.1" style="width:100%;padding:10px 12px;border-radius:10px;border:1px solid var(--line);background:rgba(0,0,0,.35);color:var(--text);font-family:var(--mono);font-size:.8rem;direction:ltr;text-align:left;outline:none;resize:vertical;"></textarea></div>';
    } else {
      if (m.country) controls += '<div class="field"><label>کشور</label><select id="sc_' + id + '_country">' + scanCountryOptions(m.defaultCountry || 'DE') + '</select></div>';
      if (m.family) controls += '<div class="field"><label>خانواده آی‌پی</label><select id="sc_' + id + '_family"><option value="any" selected>IPv4 + IPv6</option><option value="ipv4">فقط IPv4</option><option value="ipv6">فقط IPv6</option></select></div>';
      controls += '<div class="field"><label>تعداد نتیجه</label><select id="sc_' + id + '_limit">' + scanLimitOptions(10) + '</select></div>';
    }
    controls += '<button class="btn primary" type="button" data-act="scan-run" data-mode="' + id + '">' + ICO.bolt + ' ' + (m.manual ? 'تست آدرس‌ها' : 'شروع اسکن') + '</button>';
    return '<div class="scan-view" id="scanView_' + id + '">' +
      '<div class="scan-head"><span class="scan-title">' + ICO[m.icon] + ' ' + m.title + '</span><span class="scan-desc">' + m.desc + '</span></div>' +
      '<p class="scan-note">' + m.note + '</p>' +
      '<div class="scan-controls">' + controls + '</div>' +
      '<div class="scan-status" id="scStatus_' + id + '"></div>' +
      '<div class="table-wrap"><table class="scan"><thead><tr><th>کشور</th><th>آدرس / پورت</th><th>نوع / پروتکل</th><th>پینگ</th><th>وضعیت</th><th>عملیات</th></tr></thead><tbody id="scBody_' + id + '"><tr><td colspan="6" class="empty">هنوز اسکنی اجرا نشده است.</td></tr></tbody></table></div>' +
      '</div>';
  }

  function buildScanViews() {
    var host = $('scanViews');
    if (!host) return;
    host.innerHTML = Object.keys(SCAN_META).map(scanViewHtml).join('');
    closeScanView();
  }

  function openScanView(id) {
    if (!SCAN_META[id]) return;
    currentScan = id;
    showPanel('scanner');
    if ($('scanHome')) $('scanHome').style.display = 'none';
    if ($('scanBar')) $('scanBar').style.display = 'block';
    if ($('scanBackBtn')) $('scanBackBtn').style.display = 'inline-flex';
    if ($('scanPanelTitle')) $('scanPanelTitle').textContent = SCAN_META[id].title;
    syncScanSwitches(id);
    document.querySelectorAll('.scan-view').forEach(function(view) {
      view.classList.toggle('is-active', view.id === 'scanView_' + id);
    });
    if ($('scanTarget')) $('scanTarget').value = SCAN_META[id].target;
  }

  function closeScanView() {
    currentScan = '';
    if ($('scanHome')) $('scanHome').style.display = '';
    if ($('scanBar')) $('scanBar').style.display = 'none';
    if ($('scanBackBtn')) $('scanBackBtn').style.display = 'none';
    if ($('scanPanelTitle')) $('scanPanelTitle').textContent = t('panel.scanner');
    syncScanSwitches('');
    document.querySelectorAll('.scan-view').forEach(function(view) { view.classList.remove('is-active'); });
  }

  // کلیدهای روشن/خاموش اسکنر: فقط یکی روشن می‌ماند و با کارت هم‌زمان هماهنگ است
  function syncScanSwitches(id) {
    document.querySelectorAll('input[data-scan]').forEach(function(input) {
      input.checked = input.getAttribute('data-scan') === id;
    });
    document.querySelectorAll('.scan-tile').forEach(function(tile) {
      tile.classList.toggle('is-on', tile.getAttribute('data-mode') === id);
    });
  }

  function toggleScanMode(id, on) {
    if (!on) { closeScanView(); return; }
    openScanView(id);
    if (id !== 'manual') runScanMode(id);
  }

  function renderScanRows(items, mode) {
    mode = mode || currentScan;
    var body = $('scBody_' + mode);
    if (!body) return;
    if (!items.length) {
      body.innerHTML = '<tr><td colspan="6" class="empty">' + t('scan.none') + '</td></tr>';
      return;
    }
    body.innerHTML = items.map(function(p) {
      var latClass = p.latencyMs < 150 ? 'lat-fast' : (p.latencyMs < 400 ? 'lat-med' : 'lat-slow');
      var isProxyIp = p.kind === 'proxyip';
      var isIp = p.kind === 'ip' || isProxyIp;
      var ipLabel = p.family === 'ipv6' ? 'IPv6' : (p.family === 'domain' ? t('scan.domain') : 'IPv4');
      var typeLabel = isProxyIp ? 'آدرس واسط · ' + p.protocol : (isIp ? (t('scan.ipStatic') + ' · ' + ipLabel) : (t('scan.proxy') + ' · ' + p.protocol));
      var targetLabel = { yx: 'آدرس‌های دستی', p: 'آدرس واسط', s: 'پروکسی خروجی' }[scanTargetValue()];
      var action = isIp
        ? '<button class="btn sm" type="button" data-act="add-ip" data-ip="' + p.ip + '" data-port="' + p.port + '">' + ICO.plus + ' به ' + targetLabel + '</button>'
        : '<button class="btn sm" type="button" data-act="use-proxy" data-proxy="' + String(p.proxy || '').replace(/"/g, '&quot;') + '">' + ICO.link + ' ' + t('btn.connectS') + '</button>';
      return '<tr>' +
        '<td><span class="code-badge">' + (p.code || '—') + '</span> ' + (p.country || '—') + '</td>' +
        '<td class="mono">' + (String(p.ip).includes(':') ? '[' + p.ip + ']' : p.ip) + ':' + p.port + '</td>' +
        '<td><span class="tag on">' + typeLabel + '</span></td>' +
        '<td class="mono ' + latClass + '">' + p.latencyMs + ' ms</td>' +
        '<td><span class="tag ' + (p.verified === false ? '' : 'on') + '">' + (p.verified === false ? t('scan.unverified') : t('scan.online')) + '</span></td>' +
        '<td>' + action + '</td>' +
      '</tr>';
    }).join('');
  }

  function scanRequest(payload) {
    return fetch(origin() + '/api/scanner/fetch-and-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function(res) { return res.json(); });
  }

  function scanTargetValue() {
    var el = $('scanTarget');
    var v = el ? el.value : 'yx';
    return v === 'p' || v === 's' ? v : 'yx';
  }

  function applyScanItems(target, items) {
    target = target || scanTargetValue();
    var userId = $('scanUser') ? $('scanUser').value : '';
    return fetch(origin() + '/api/scanner/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Mili-Admin': '1' },
      body: JSON.stringify({ target: target, items: items, userId: userId })
    })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        showToast(data.message || (data.success ? 'اعمال شد' : 'خطا در اعمال'), data.success ? 'ok' : 'err');
        if (data.success) {
          if (userId) api('/api/users?t=' + Date.now()).then(function(list) {
            if (list.success) { state.users = list.users || []; renderUsers(); renderLocations(); }
          }).catch(function() {});
          return api('/api/config').then(function(cfg) {
            if (cfg && typeof cfg === 'object' && !cfg.error) {
              state.config = Object.assign({}, state.config, cfg);
              fillSettings();
            }
            return data;
          });
        }
        return data;
      })
      .catch(function() { showToast('خطای شبکه در اعمال نتیجه اسکن', 'err'); });
  }

  function runScanMode(id) {
    if (id === 'manual') return runManualScan();
    var meta = SCAN_META[id];
    if (!meta) return Promise.resolve([]);
    var status = $('scStatus_' + id);
    var body = $('scBody_' + id);
    var countryEl = $('sc_' + id + '_country');
    var limitEl = $('sc_' + id + '_limit');
    var familyEl = $('sc_' + id + '_family');
    var payload = { country: countryEl ? countryEl.value : 'DE', limit: limitEl ? limitEl.value : '10' };
    if (id === 'proxy') {
      payload.kind = 'proxy';
      payload.family = familyEl ? familyEl.value : 'any';
    } else {
      payload.mode = id;
    }
    if (body) body.innerHTML = '<tr><td colspan="6" class="empty">در حال تست...</td></tr>';
    if (status) {
      status.className = 'scan-status';
      status.textContent = id === 'proxy'
        ? 'در حال خواندن پروکسی‌های کشوری و تست اتصال...'
        : 'در حال خواندن منابع آدرس و تست اتصال...';
    }
    return scanRequest(payload)
      .then(function(data) {
        var diag = '';
        if (data.diagnostics && data.diagnostics.length) {
          var healthy = data.diagnostics.filter(function(d) { return d.reachable && d.entries > 0; }).length;
          diag = ' · منابع سالم: ' + healthy + ' از ' + data.diagnostics.length;
        }
        if (data.elapsedMs) diag += ' · ' + Math.round(data.elapsedMs / 1000) + 's';
        if (data.success && data.proxies && data.proxies.length) {
          scanResults = data.proxies;
          renderScanRows(data.proxies, id);
          if (status) status.textContent = (data.message || (data.proxies.length + ' مورد آنلاین از ' + data.testedCount + ' تست')) + diag;
          return data.proxies;
        }
        if (body) body.innerHTML = '<tr><td colspan="6" class="empty">موردی یافت نشد.</td></tr>';
        if (status) {
          status.className = 'scan-status err';
          status.textContent = (data.message || 'دریافت لیست یا تست ناموفق بود.') + diag;
        }
        return [];
      })
      .catch(function() {
        if (body) body.innerHTML = '<tr><td colspan="6" class="empty">خطا.</td></tr>';
        if (status) { status.className = 'scan-status err'; status.textContent = 'خطای شبکه در اجرای اسکنر.'; }
        return [];
      });
  }

  // آدرس‌های دستی: خط‌به‌خط داخل همین پنل تست می‌شوند
  function parseManualHosts(raw) {
    var lines = String(raw || '').split(',').join(String.fromCharCode(10)).split(String.fromCharCode(10));
    var out = [];
    lines.forEach(function(line) {
      var text = String(line || '').trim();
      if (!text) return;
      var scheme = text.indexOf('://');
      if (scheme > -1) text = text.slice(scheme + 3);
      var host = text;
      var port = 443;
      var colon = text.lastIndexOf(':');
      if (colon > 0) {
        var maybe = parseInt(text.slice(colon + 1), 10);
        if (maybe > 0 && maybe < 65536) { host = text.slice(0, colon); port = maybe; }
      }
      if (host.charAt(0) === '[' && host.charAt(host.length - 1) === ']') host = host.slice(1, -1);
      if (!host) return;
      out.push({ host: host, port: port });
    });
    return out.slice(0, 24);
  }

  function runManualScan() {
    var status = $('scStatus_manual');
    var body = $('scBody_manual');
    var hosts = parseManualHosts($('sc_manual_hosts') ? $('sc_manual_hosts').value : '');
    if (!hosts.length) {
      if (status) { status.className = 'scan-status err'; status.textContent = 'آدرسی وارد نشده است؛ هر خط یک آدرس یا host:port بنویسید.'; }
      return Promise.resolve([]);
    }
    if (body) body.innerHTML = '<tr><td colspan="6" class="empty">در حال تست...</td></tr>';
    var queue = hosts.slice();
    var results = [];
    var done = 0;
    if (status) { status.className = 'scan-status'; status.textContent = 'تست ' + hosts.length + ' آدرس داخل پنل...'; }
    var probeOne = function(item) {
      return fetch(origin() + '/api/scanner/probe?host=' + encodeURIComponent(item.host) + '&port=' + item.port)
        .then(function(res) { return res.json(); })
        .then(function(data) {
          var ipv6 = item.host.indexOf(':') > -1;
          results.push({
            code: '—', country: 'دستی', ip: item.host, port: item.port, kind: 'ip',
            family: ipv6 ? 'ipv6' : 'ipv4', protocol: ipv6 ? 'IPv6' : 'IPv4',
            latencyMs: Number(data && data.latencyMs) || 0, verified: !!(data && data.success)
          });
        })
        .catch(function() {
          results.push({ code: '—', country: 'دستی', ip: item.host, port: item.port, kind: 'ip', family: 'ipv4', protocol: 'IPv4', latencyMs: 0, verified: false });
        })
        .then(function() {
          done++;
          if (status) status.textContent = 'تست ' + done + ' از ' + hosts.length + ' آدرس...';
        });
    };
    var worker = function() {
      if (!queue.length) return Promise.resolve();
      var item = queue.shift();
      return probeOne(item).then(worker);
    };
    var runners = [];
    for (var i = 0; i < 6; i++) runners.push(worker());
    return Promise.all(runners).then(function() {
      results.sort(function(a, b) { return (b.verified ? 1 : 0) - (a.verified ? 1 : 0); });
      var online = results.filter(function(r) { return r.verified; });
      renderScanRows(results, 'manual');
      scanResults = results;
      if (status) {
        status.className = online.length ? 'scan-status' : 'scan-status err';
        status.textContent = online.length
          ? online.length + ' از ' + results.length + ' آدرس پاسخ داد؛ با دکمهٔ ردیف به تنظیمات کاربر اضافه کنید.'
          : 'هیچ آدرسی پاسخ نداد؛ آدرس‌ها یا پورت را بررسی کنید.';
      }
      return results;
    });
  }

  function syncConditionalFields() {
    document.querySelectorAll('[data-show-when]').forEach(function(el) {
      var key = el.getAttribute('data-show-when');
      var input = document.querySelector('.switch input[data-key="' + key + '"]');
      el.style.display = (!input || input.checked) ? '' : 'none';
    });
  }

  function rotatePath() {
    if (!ask(t('toast.rotateConfirm'))) return;
    fetch(origin() + '/api/admin/rotate-path', { method: 'POST' })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.success && data.redirect) {
          window.location.href = data.redirect;
        } else {
          showToast(data.message || t('toast.network'), 'err');
        }
      })
      .catch(function() { showToast(t('toast.network'), 'err'); });
  }

  function testUserNodes(token) {
    if (!token) return;
    showToast(t('toast.testingNodes'), 'ok');
    fetch(origin() + '/sub/' + token + '?target=raw&limit=6')
      .then(function(res) { return res.text(); })
      .then(function(text) {
        var nodes = [];
        var seen = {};
        String(text || '').split(/\\r?\\n/).forEach(function(line) {
          var match = line.match(/@\\[?([0-9a-fA-F:.]+)\\]?:(\\d+)/);
          if (!match) return;
          var host = match[1];
          var port = parseInt(match[2], 10) || 443;
          var key = host + ':' + port;
          if (seen[key] || host === '127.0.0.1') return;
          seen[key] = true;
          nodes.push({ host: host, port: port });
        });
        if (!nodes.length) { showToast(t('scan.none'), 'err'); return; }
        return fetch(origin() + '/api/scanner/test-nodes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nodes: nodes.slice(0, 8) })
        }).then(function(res) { return res.json(); }).then(function(data) {
          showToast(data.message || t('toast.network'), data.success ? 'ok' : 'err');
        });
      })
      .catch(function() { showToast(t('toast.network'), 'err'); });
  }

  function addCfDefaults(kind) {
    var items = kind === 'ips'
      ? (INITIAL_DATA.officialIps || []).concat(INITIAL_DATA.officialIpv6 || []).map(function(ip) { return { ip: ip, port: 443, name: ip }; })
      : (INITIAL_DATA.directDomains || []).map(function(domain) { return { ip: domain, port: 443, name: domain }; });
    if (!items.length) { showToast('لیست پیش‌فرض خالی است', 'err'); return; }
    applyScanItems('yx', items).then(function(data) {
      if (data && data.success) {
        showToast((kind === 'ips' ? 'آی‌پی‌های پیش‌فرض کلادفلر' : 'دامنه‌های پیش‌فرض کلادفلر') + ' به آدرس‌های دستی اضافه شدند', 'ok');
      }
    });
  }

  function addNode(ip, port) {
    var host = String(ip || '').trim();
    var p = Number(port) || 443;
    if (scanTargetValue() === 'p') return applyScanItems('p', [{ ip: host, port: p }]);
    return applyScanItems('yx', [{ ip: host, port: p, name: host }]);
  }

  function useProxy(proxyUrl) {
    if (!proxyUrl) { showToast('آدرس پروکسی نامعتبر است', 'err'); return; }
    return applyScanItems('s', [{ proxy: proxyUrl }]);
  }

  function countryProxy(code) {
    openScanView('proxy');
    if ($('sc_proxy_country')) $('sc_proxy_country').value = code;
    if ($('scanTarget')) $('scanTarget').value = 's';
    return runScanMode('proxy').then(function(items) {
      if (!items || !items.length || !items[0].proxy) return;
      var status = $('scStatus_proxy');
      if (status) status.textContent = 'سریع‌ترین پروکسی ' + code + ' (' + items[0].latencyMs + ' ms) به‌عنوان پروکسی خروجی ثبت شد.';
      return useProxy(items[0].proxy);
    });
  }

  function countryIp(code) {
    openScanView('ipv4');
    if ($('sc_ipv4_country')) $('sc_ipv4_country').value = code;
    if ($('scanTarget')) $('scanTarget').value = 'yx';
    return runScanMode('ipv4').then(function(items) {
      if (!items || !items.length) return;
      var status = $('scStatus_ipv4');
      return applyScanItems('yx', items.slice(0, 3).map(function(p) { return { ip: p.ip, port: p.port, name: p.ip }; }))
        .then(function() { if (status) status.textContent = 'آدرس‌های ثابت به «آدرس‌های دستی» اضافه شدند (گزینهٔ آی‌پی‌های ثابت کلادفلر را روشن نگه دارید).'; });
    });
  }

  function savePassword() {
    var oldPwd = ($('pwdOld').value || '').trim();
    var newPwd = ($('pwdNew').value || '').trim();
    var newPwd2 = ($('pwdNew2').value || '').trim();
    if (newPwd.length < 4) { showToast('رمز جدید باید حداقل ۴ کاراکتر باشد', 'err'); return; }
    if (newPwd !== newPwd2) { showToast('تکرار رمز جدید یکسان نیست', 'err'); return; }
    fetch(origin() + '/api/admin/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPassword: oldPwd, newPassword: newPwd })
    })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.success) {
          closeModal('passwordModal');
          $('pwdOld').value = ''; $('pwdNew').value = ''; $('pwdNew2').value = '';
          showToast('رمز مدیر تغییر کرد', 'ok');
        } else {
          showToast(data.message || 'خطا در تغییر رمز', 'err');
        }
      })
      .catch(function() { showToast('خطای شبکه در تغییر رمز', 'err'); });
  }

  function logout() {
    fetch(origin() + '/api/admin/logout', { method: 'POST' }).catch(function() {}).finally(function() {
      window.location.href = '/';
    });
  }

  function openModal(id) { var m = $(id); if (m) m.classList.add('is-open'); }
  function closeModal(id) { var m = $(id); if (m) m.classList.remove('is-open'); }

  function masterSub() { return origin() + '/sub/' + (ADMIN_PATH || ''); }

  document.addEventListener('click', function(event) {
    var tab = event.target.closest('[data-tab]');
    if (tab) {
      var tabName = tab.getAttribute('data-tab');
      // رفتن به تب اسکنر دوباره منوی اسکن‌ها را نشان می‌دهد
      if (tabName === 'scanner') closeScanView();
      showPanel(tabName);
      return;
    }

    var formTab = event.target.closest('[data-uf-tab]');
    if (formTab) { switchUserFormTab(formTab.getAttribute('data-uf-tab')); return; }

    var el = event.target.closest('[data-act]');
    if (!el) return;
    var act = el.getAttribute('data-act');

    if (act === 'copy') { copyText(el.getAttribute('data-url') || '', 'لینک کپی شد'); }
    else if (act === 'copy-master') { copyText(masterSub(), 'سابلینک اصلی کپی شد'); }
    else if (act === 'open-create') { openUserForm(null); }
    else if (act === 'edit-user') { editUser(el.getAttribute('data-id')); }
    else if (act === 'save-user' || act === 'create-user') { saveUser(); }
    else if (act === 'toggle-drawer') { toggleDrawer(); }
    else if (act === 'close-drawer') { toggleDrawer(false); }
    else if (act === 'check-update') { showPanel('dashboard'); checkUpdate(); }
    else if (act === 'apply-update') { applyUpdateNow(); }
    else if (act === 'diagnose-update') { diagnoseUpdate(); }
    else if (act === 'download-update') { downloadUpdateBundle(); }
    else if (act === 'copy-update-cmd') { copyUpdateCommand(); }
    else if (act === 'enable-autoupdate') { enableAutoUpdate(); }
    else if (act === 'disable-autoupdate') { disableAutoUpdate(); }
    else if (act === 'open-password') { openModal('passwordModal'); }
    else if (act === 'open-multi') { showPanel('locations'); }
    else if (act === 'close-modal') { closeModal(el.getAttribute('data-modal')); }
    else if (act === 'delete-user') { deleteUser(el.getAttribute('data-id')); }
    else if (act === 'reset-user') { resetUser(el.getAttribute('data-id')); }
    else if (act === 'reload-users') { reloadUsers(); }
    else if (act === 'save-password') { savePassword(); }
    else if (act === 'logout') { logout(); }
    else if (act === 'go-scan') { showPanel('scanner'); closeScanView(); }
    else if (act === 'add-node' || act === 'add-ip') { addNode(el.getAttribute('data-ip'), el.getAttribute('data-port')); }
    else if (act === 'use-proxy') { useProxy(el.getAttribute('data-proxy')); }
    else if (act === 'country-proxy') { countryProxy(el.getAttribute('data-code')); }
    else if (act === 'loc-random-ip') { locRandomIp(false); }
    else if (act === 'loc-random-ipv6') { locRandomIp(true); }
    else if (act === 'loc-copy-region') { locCopyRegion(); }
    else if (act === 'country-ip') { countryIp(el.getAttribute('data-code')); }
    else if (act === 'toggle-theme') { toggleTheme(); }
    else if (act === 'toggle-lang') { toggleLang(); }
    else if (act === 'add-cf-ips') { addCfDefaults('ips'); }
    else if (act === 'add-cf-domains') { addCfDefaults('domains'); }
    else if (act === 'copy-admin-path') { copyText('/' + ADMIN_PATH, 'مسیر مدیریت کپی شد'); }
    else if (act === 'rotate-path') { rotatePath(); }
    else if (act === 'test-nodes') { testUserNodes(el.getAttribute('data-user')); }
    else if (act === 'scan-back') { closeScanView(); }
    else if (act === 'scan-run') { runScanMode(el.getAttribute('data-mode')); }
  });

  // بازخورد لمسی: موج نور از نقطهٔ لمس/کلیک روی دکمه‌ها و تب‌ها
  document.addEventListener('pointerdown', function(event) {
    var host = event.target.closest('.btn, .icon-btn, .ftab, .tab, .drawer-item, .loc-card');
    if (!host || host.disabled) return;
    var rect = host.getBoundingClientRect();
    var wave = document.createElement('span');
    wave.className = 'ripple';
    wave.style.left = (event.clientX - rect.left) + 'px';
    wave.style.top = (event.clientY - rect.top) + 'px';
    host.appendChild(wave);
    host.classList.add('is-press');
    setTimeout(function() {
      if (wave.parentNode) wave.parentNode.removeChild(wave);
      host.classList.remove('is-press');
    }, 620);
  }, { passive: true });

  document.addEventListener('click', function(event) {
    if (event.target.classList && event.target.classList.contains('modal')) {
      event.target.classList.remove('is-open');
    }
  });

  document.addEventListener('change', function(event) {
    var target = event.target;
    if (!target) return;
    if (target.matches && target.matches('.switch input[data-key]')) {
      var key = target.getAttribute('data-key');
      if (key === 'frag' || key === 'ech') syncConditionalFields();
    }
    if (target.matches && target.matches('input[data-scan]')) {
      toggleScanMode(target.getAttribute('data-scan'), target.checked);
    }
    if (target.id === 'uf_preset') applyPresetToForm();
    if (target.id === 'dnsPreset') {
      var dnsInput = document.querySelector('input[data-key="customDNS"]');
      if (dnsInput && target.value !== 'custom') dnsInput.value = target.value;
    }
  });


  if (lsGet('mili_theme') === 'light') document.body.classList.add('light-mode');
  applyLanguage();
  buildScanViews();
  renderUsers();
  renderLocations();
  fillSettings();
  syncConditionalFields();
  renderMetrics();

  // بررسی بی‌صدای نسخه در پس‌زمینه (خروجی ۱۰ دقیقه کش می‌شود)
  setTimeout(function() { checkUpdate(true); }, 1200);

  var hash = (window.location.hash || '').replace('#', '');
  if (hash && document.querySelector('[data-panel="' + hash + '"]')) showPanel(hash);
  if (window.__miliDiag) window.__miliDiag.ready = true;
</script>
</body>
</html>`);
}
