// ============================================================================
// miliconfig - کانال بروزرسانی نسخه‌ها
//
// مسئله: ورکرهای نصب‌شده روی حساب‌های دیگران از بیرون قابل جایگزینی نیستند.
// راه‌حل‌ها به ترتیب اولویت:
//   ۱) اتصال به گیت‌هاب (Workers Builds / Pages + Git): هر push به main خودکار
//      مستقر می‌شود و هیچ اطلاعاتی از حساب لازم نیست.
//   ۲) اگر ورکر یک کلید محرمانهٔ CF_API_TOKEN داشته باشد (که در داشبورد کلادفلر
//      و نه در پنل تنظیم می‌شود)، خودِ ورکر نسخهٔ تازه را مستقر می‌کند:
//      اعتبارسنجی با /user/tokens/verify، تشخیص Account ID از /accounts،
//     تشخیص نام اسکریپت از WORKER_NAME/دامنه، حفظ بایندینگ‌های فعلی
//      (D1/KV/متن ساده) و آپلود باندل با نام ماژول تصادفی.
//   ۳) در غیر این صورت پنل فقط نسخهٔ تازه را می‌شمارد و فایل/دستور بروزرسانی
//      می‌دهد؛ هیچ ورودی حساب کلودفلر از کاربر خواسته نمی‌شود.
// ============================================================================

import { VERSION } from '../config/defaults.js';

const UPDATE_REPO = 'miladjahani/Miliconfigpro';
const UPDATE_BRANCH = 'main';
export const UPDATE_MANIFEST_PATH = 'version.json';
export const UPDATE_BUNDLE_PATH = '_worker.js';
export const UPDATE_REPO_URL = 'https://github.com/' + UPDATE_REPO;

// چند آینه: اگر raw.githubusercontent فیلتر یا کش‌شده باشد، jsDelivr و githack هم امتحان می‌شوند
function mirrorUrls(path, options = {}) {
  const clean = String(path || '').replace(/^\/+/, '');
  const bust = options.bust ? `?cb=${Date.now()}` : '';
  return [
    `https://raw.githubusercontent.com/${UPDATE_REPO}/${UPDATE_BRANCH}/${clean}${bust}`,
    `https://cdn.jsdelivr.net/gh/${UPDATE_REPO}@${UPDATE_BRANCH}/${clean}${bust}`,
    `https://raw.githack.com/${UPDATE_REPO}/${UPDATE_BRANCH}/${clean}${bust}`
  ];
}

const MANIFEST_CACHE_MS = 10 * 60 * 1000;
let manifestCache = { at: 0, value: null };

// مقایسهٔ نسخه‌ها به‌صورت عددی: 3.10.0 > 3.9.9
export function compareVersions(a = '', b = '') {
  const norm = value => String(value || '')
    .replace(/^v/i, '')
    .split(/[.+-]/)
    .map(part => parseInt(part, 10))
    .map(n => (Number.isFinite(n) ? n : 0));
  const left = norm(a);
  const right = norm(b);
  const len = Math.max(left.length, right.length);
  for (let i = 0; i < len; i++) {
    const l = left[i] || 0;
    const r = right[i] || 0;
    if (l > r) return 1;
    if (l < r) return -1;
  }
  return 0;
}

export function currentVersionLabel() {
  return String(VERSION || '').replace(/^v/i, '');
}

// دریافت متن از اولین آینهٔ سالم (دو دور تلاش)
async function fetchTextWithFallback(paths, options = {}) {
  const timeout = options.timeout || 9000;
  const rounds = options.rounds || 2;
  for (let attempt = 0; attempt < rounds; attempt++) {
    for (const url of paths) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'miliconfig-updater',
            'Cache-Control': 'no-cache',
            ...(options.headers || {})
          },
          signal: controller.signal
        });
        clearTimeout(timer);
        if (!response.ok) continue;
        const text = await response.text();
        if (text && text.trim()) return { text, url };
      } catch (_e) {}
    }
    if (attempt < rounds - 1) await new Promise(r => setTimeout(r, 600));
  }
  return null;
}

// مانیفست از همهٔ آینه‌ها همزمان خوانده و «بالاترین نسخه» انتخاب می‌شود؛
// چون CDN گیت‌هاب گاهی چند دقیقه نسخهٔ قدیمی را نگه می‌دارد و اگر فقط اولین
// پاسخ سالم را بگیریم، نسخهٔ تازه دیده نمی‌شود.
async function fetchManifest(force = false, env = {}) {
  if (!force && manifestCache.value && Date.now() - manifestCache.at < MANIFEST_CACHE_MS) {
    return manifestCache.value;
  }
  const custom = String(env?.UPDATE_MANIFEST_URL || '').trim();
  const urls = custom
    ? [custom, ...mirrorUrls(UPDATE_MANIFEST_PATH, { bust: true })]
    : mirrorUrls(UPDATE_MANIFEST_PATH, { bust: true });
  const results = await Promise.all(urls.map(async url => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4500);
      const response = await fetch(url, {
        headers: { 'User-Agent': 'miliconfig-updater', 'Cache-Control': 'no-cache' },
        signal: controller.signal
      });
      clearTimeout(timer);
      if (!response.ok) return null;
      const data = await response.json();
      return data && data.version ? data : null;
    } catch (_e) {
      return null;
    }
  }));
  const valid = results.filter(Boolean);
  if (!valid.length) return null;
  const best = valid.reduce((top, item) => (compareVersions(item.version, top.version) > 0 ? item : top));
  manifestCache = { at: Date.now(), value: best };
  return best;
}

// ---------------------------------------------------------------------------
// توکن و هدف استقرار
// ---------------------------------------------------------------------------

export function getUpdateTarget(cfg = {}, env = {}, options = {}) {
  const token = String(options.token || env?.CF_API_TOKEN || env?.CLOUDFLARE_API_TOKEN || '').trim();
  const accountId = String(cfg.cfAccountId || options.accountId || env?.CF_ACCOUNT_ID || env?.CLOUDFLARE_ACCOUNT_ID || '').trim();
  const scriptName = String(
    cfg.cfScriptName || options.scriptName || env?.CF_SCRIPT_NAME || env?.WORKER_NAME || ''
  ).trim();
  return {
    token,
    accountId,
    scriptName,
    ready: Boolean(token),
    missing: [
      !token ? 'CF_API_TOKEN' : '',
      !scriptName ? 'نام اسکریپت (خودکار از دامنه تشخیص داده می‌شود)' : ''
    ].filter(Boolean)
  };
}

// اعتبارسنجی توکن با endpoint رسمی کلادفلر
export async function verifyUpdateToken(token = '') {
  const value = String(token || '').trim();
  if (!value) return { valid: false, error: 'توکن خالی است' };
  try {
    const response = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
      headers: { Authorization: 'Bearer ' + value, 'User-Agent': 'miliconfig-updater' }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      return { valid: false, error: 'توکن معتبر نیست یا دسترسی لازم را ندارد' };
    }
    return { valid: true, status: data.result?.status || 'active' };
  } catch (err) {
    return { valid: false, error: 'خطای شبکه در بررسی توکن: ' + (err?.message || String(err)) };
  }
}

// اگر Account ID تنظیم نشده باشد، از روی توکن پیدا می‌شود
export async function resolveAccountId(token = '', current = '') {
  if (current) return { accountId: current, detected: false };
  try {
    const response = await fetch('https://api.cloudflare.com/client/v4/accounts', {
      headers: { Authorization: 'Bearer ' + token, 'User-Agent': 'miliconfig-updater' }
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.success && Array.isArray(data.result) && data.result.length) {
      return { accountId: data.result[0].id, detected: true };
    }
    return { accountId: '', detected: false, error: 'حسابی با این توکن پیدا نشد' };
  } catch (err) {
    return { accountId: '', detected: false, error: err?.message || String(err) };
  }
}

// نام اسکریپت از دامنهٔ درخواست: <script>.<subdomain>.workers.dev
export function inferScriptName(hostname = '') {
  const host = String(hostname || '').trim().toLowerCase();
  if (!host) return '';
  if (host.endsWith('.workers.dev')) return host.split('.')[0];
  return '';
}

// ---------------------------------------------------------------------------
// بررسی نسخه
// ---------------------------------------------------------------------------

export async function checkForUpdate(cfg = {}, env = {}, options = {}) {
  const manifest = await fetchManifest(options.force === true, env);
  const token = String(options.token || env?.CF_API_TOKEN || '').trim();
  const scriptName = String(cfg.cfScriptName || options.scriptName || env?.CF_SCRIPT_NAME || env?.WORKER_NAME || '').trim();
  const accountId = String(cfg.cfAccountId || env?.CF_ACCOUNT_ID || '').trim();
  const base = {
    current: currentVersionLabel(),
    hasToken: Boolean(token),
    autoUpdate: String(cfg.autoUpdate || 'no') === 'yes',
    scriptName,
    accountIdTail: accountId ? accountId.slice(-6) : ''
  };
  if (!manifest) {
    return {
      ...base,
      success: false,
      updateAvailable: false,
      error: 'دریافت فهرست نسخه‌ها از گیت‌هاب ممکن نشد؛ دسترسی به گیت‌هاب/آینه‌ها را بررسی کنید.',
      autoApplyAvailable: Boolean(token),
      missing: [token ? '' : 'CF_API_TOKEN', scriptName ? '' : 'نام اسکریپت'].filter(Boolean)
    };
  }
  const latest = String(manifest.version || base.current);
  return {
    ...base,
    success: true,
    latest,
    build: manifest.build || '',
    publishedAt: manifest.publishedAt || '',
    notes: Array.isArray(manifest.notes) ? manifest.notes : [],
    repo: manifest.repo || UPDATE_REPO_URL,
    updateAvailable: compareVersions(latest, base.current) > 0,
    autoApplyAvailable: Boolean(token),
    missing: [token ? '' : 'CF_API_TOKEN', scriptName ? '' : 'نام اسکریپت'].filter(Boolean)
  };
}

// ---------------------------------------------------------------------------
// استقرار نسخهٔ تازه (با حفظ بایندینگ‌ها)
// ---------------------------------------------------------------------------

const KEEP_BINDING_TYPES = ['d1', 'kv_namespace', 'plain_text', 'r2_bucket', 'queue', 'service', 'analytics_engine', 'durable_object_namespace'];

function normalizeBinding(binding = {}) {
  if (!binding || !binding.type || !binding.name) return null;
  if (!KEEP_BINDING_TYPES.includes(binding.type)) return null;
  const out = { type: binding.type, name: binding.name };
  if (binding.type === 'd1') out.id = binding.database_id || binding.id || '';
  else if (binding.type === 'kv_namespace') out.namespace_id = binding.namespace_id || binding.id || '';
  else if (binding.type === 'plain_text') out.text = binding.text || '';
  else if (binding.type === 'r2_bucket') out.bucket_name = binding.bucket_name || binding.name;
  else if (binding.type === 'service') out.service = binding.service || '';
  else if (binding.type === 'queue') out.queue_name = binding.queue_name || '';
  else if (binding.type === 'durable_object_namespace') {
    out.class_name = binding.class_name || '';
    out.script_name = binding.script_name || '';
  }
  if (binding.type === 'd1' && !out.id) return null;
  if (binding.type === 'kv_namespace' && !out.namespace_id) return null;
  return out;
}

async function fetchExistingBindings(accountId, scriptName, token) {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/workers/scripts/${encodeURIComponent(scriptName)}/bindings`,
      { headers: { Authorization: 'Bearer ' + token, 'User-Agent': 'miliconfig-updater' } }
    );
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      return { ok: false, error: 'دسترسی به تنظیمات ورکر ممکن نشد (کد ' + response.status + ')' };
    }
    return { ok: true, bindings: Array.isArray(data.result) ? data.result : [] };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
}

// دریافت باندل تازه (برای دانلود مستقیم فایل نسخهٔ جدید از پنل)
export async function fetchLatestBundle(env = {}) {
  const customBundle = String(env?.UPDATE_BUNDLE_URL || '').trim();
  const bundle = await fetchTextWithFallback(
    customBundle ? [customBundle, ...mirrorUrls(UPDATE_BUNDLE_PATH, { bust: true })] : mirrorUrls(UPDATE_BUNDLE_PATH, { bust: true }),
    { timeout: 20000 }
  );
  if (!bundle || !bundle.text || bundle.text.length < 50000) return null;
  return bundle;
}

export async function applyUpdate(cfg = {}, env = {}, options = {}) {
  const token = String(options.token || env?.CF_API_TOKEN || '').trim();
  const hostScriptName = String(options.hostScriptName || '').trim();
  const scriptName = String(
    cfg.cfScriptName || env.CF_SCRIPT_NAME || env.WORKER_NAME || inferScriptName(hostScriptName) || ''
  ).trim();

  if (!token) {
    // هیچ ورودی حساب کلودفلر از کاربر خواسته نمی‌شود؛ نسخهٔ تازه به‌صورت
    // فایل قابل دانلود و دستور آمادهٔ استقرار برگردانده می‌شود.
    const info = await checkForUpdate(cfg, env, { force: true });
    const latest = info?.latest || '';
    const target = inferScriptName(hostScriptName) || 'نام-ورکر-شما';
    return {
      success: false,
      needsManualDeploy: true,
      latest,
      downloadUrl: mirrorUrls(UPDATE_BUNDLE_PATH, { bust: true })[0],
      command: `curl -fsSL ${mirrorUrls(UPDATE_BUNDLE_PATH, { bust: true })[0]} -o _worker.js && npx wrangler deploy _worker.js --name ${target}`,
      error: latest
        ? `نسخهٔ ${latest} آماده است؛ نصب خودکار بدون کلید ورکر انجام نمی‌شود. فایل نسخهٔ تازه را دانلود کنید یا دستور آماده را اجرا کنید.`
        : 'نصب خودکار روی این استقرار ممکن نیست؛ فایل نسخهٔ تازه را دانلود کنید یا دستور آماده را اجرا کنید.',
      missing: []
    };
  }
  if (!scriptName) {
    return {
      success: false,
      error: 'نام اسکریپت Workers مشخص نیست؛ متغیر WORKER_NAME را روی ورکر تنظیم کنید.',
      missing: ['CF_SCRIPT_NAME']
    };
  }

  const info = await checkForUpdate(cfg, env, { force: true, token, scriptName });
  if (!info.success && !options.force) return { success: false, error: info.error };
  if (info.success && !info.updateAvailable && !options.force) {
    return { success: true, alreadyLatest: true, message: `نسخهٔ نصب‌شده (${info.current}) به‌روز است.` };
  }

  const account = await resolveAccountId(token, String(cfg.cfAccountId || env.CF_ACCOUNT_ID || '').trim());
  if (!account.accountId) {
    return { success: false, error: 'Account ID پیدا نشد: ' + (account.error || 'توکن را بررسی کنید') };
  }

  const customBundle = String(env?.UPDATE_BUNDLE_URL || '').trim();
  const bundle = await fetchTextWithFallback(
    customBundle ? [customBundle, ...mirrorUrls(UPDATE_BUNDLE_PATH, { bust: true })] : mirrorUrls(UPDATE_BUNDLE_PATH, { bust: true }),
    { timeout: 20000 }
  );
  if (!bundle) return { success: false, error: 'دریافت باندل تازه از گیت‌هاب و آینه‌ها ناموفق بود.' };
  if (bundle.text.length < 50000) {
    return { success: false, error: 'باندل دریافتی معتبر نیست (حجم غیرمنتظره).' };
  }

  // بایندینگ‌های فعلی حفظ می‌شوند تا D1 و متغیرها بعد از آپدیت از بین نروند
  const current = await fetchExistingBindings(account.accountId, scriptName, token);
  if (!current.ok) {
    return { success: false, error: 'قبل از آپدیت باید دسترسی خواندن تنظیمات ورکر وجود داشته باشد: ' + current.error };
  }
  const bindings = [];
  for (const raw of current.bindings) {
    if (['CF_API_TOKEN', 'CF_ACCOUNT_ID'].includes(raw?.name)) continue;
    if (raw?.type === 'secret_text') continue;
    const normalized = normalizeBinding(raw);
    if (normalized) bindings.push(normalized);
  }
  bindings.push({ type: 'secret_text', name: 'CF_API_TOKEN', text: token });
  bindings.push({ type: 'secret_text', name: 'CF_ACCOUNT_ID', text: account.accountId });

  const moduleName = `worker_${Math.random().toString(36).slice(2, 10)}.js`;
  const metadata = {
    main_module: moduleName,
    compatibility_date: '2024-09-23',
    bindings
  };
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }), 'metadata.json');
  form.append(moduleName, new Blob([bundle.text], { type: 'application/javascript+module' }), moduleName);

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account.accountId)}/workers/scripts/${encodeURIComponent(scriptName)}`,
      {
        method: 'PUT',
        headers: { Authorization: 'Bearer ' + token, 'User-Agent': 'miliconfig-updater' },
        body: form
      }
    );
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) {
      const detail = (data.errors && data.errors[0] && data.errors[0].message) || `HTTP ${response.status}`;
      return { success: false, error: 'آپلود به کلادفلر ناموفق بود: ' + detail };
    }
    return {
      success: true,
      updated: true,
      from: info.current,
      to: info.latest || currentVersionLabel(),
      bytes: bundle.text.length,
      scriptName,
      accountDetected: account.detected,
      mirrors: bundle.url,
      message: `نسخهٔ ${info.latest || 'تازه'} روی اسکریپت «${scriptName}» مستقر شد${account.detected ? ' (Account ID خودکار شناسایی شد)' : ''}.`
    };
  } catch (err) {
    return { success: false, error: 'خطای شبکه در آپلود: ' + (err?.message || String(err)) };
  }
}

// در کرون: اگر بروزرسانی خودکار روشن و توکن موجود باشد، نسخهٔ تازه مستقر می‌شود
export async function autoUpdateIfEnabled(cfg = {}, env = {}, options = {}) {
  if (String(cfg.autoUpdate || 'no') !== 'yes') return { skipped: 'disabled' };
  const token = String(options.token || env?.CF_API_TOKEN || '').trim();
  if (!token) return { skipped: 'no-token' };
  const info = await checkForUpdate(cfg, env, { token });
  if (!info.success) return { skipped: 'manifest-unreachable' };
  if (!info.updateAvailable) return { skipped: 'up-to-date', current: info.current };
  return await applyUpdate(cfg, env, { token, hostScriptName: options.hostScriptName });
}
