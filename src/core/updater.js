// ============================================================================
// miliconfig - کانال بروزرسانی نسخه‌ها
//
// مسئله: نسخه‌های نصب‌شده روی ورکرهای دیگران از بیرون قابل جایگزینی نیستند.
// راه‌حل‌ها به ترتیب اولویت:
//   ۱) اگر پروژه به گیت‌هاب وصل باشد (Cloudflare Workers Builds / Pages + Git)،
//      هر push به main خودکار مستقر می‌شود: همان بروزرسانی خودکار کامل.
//   ۲) از این نسخه به بعد، خود پنل می‌تواند با Cloudflare API نسخهٔ تازه را روی
//      همان اسکریپت آپلود کند (یک‌بار توکن لازم است، بعد از آن خودکار).
//   ۳) نسخه‌های قدیمی‌تر که این کد را ندارند فقط با یک‌بار استقرار مجدد به‌روز
//      می‌شوند؛ داده‌های مشترک (لیست‌ها) از راه منابع آنلاین تازه می‌مانند.
// ============================================================================

import { VERSION } from '../config/defaults.js';

export const UPDATE_MANIFEST_URL =
  'https://raw.githubusercontent.com/miladjahani/Miliconfigpro/main/version.json';
export const UPDATE_BUNDLE_URL =
  'https://raw.githubusercontent.com/miladjahani/Miliconfigpro/main/_worker.js';
export const UPDATE_REPO_URL = 'https://github.com/miladjahani/Miliconfigpro';

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

// آدرس فهرست نسخه و باندل را می‌توان با متغیر محیطی جایگزین کرد (فورک‌های خصوصی)
export function getManifestUrl(env = {}) {
  return String(env?.UPDATE_MANIFEST_URL || '').trim() || UPDATE_MANIFEST_URL;
}

export function getBundleUrl(env = {}) {
  return String(env?.UPDATE_BUNDLE_URL || '').trim() || UPDATE_BUNDLE_URL;
}

async function fetchManifest(force = false, env = {}) {
  if (!force && manifestCache.value && Date.now() - manifestCache.at < MANIFEST_CACHE_MS) {
    return manifestCache.value;
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(getManifestUrl(env), {
      headers: { 'User-Agent': 'miliconfig-updater', 'Cache-Control': 'no-cache' },
      signal: controller.signal
    });
    clearTimeout(timer);
    if (!response.ok) throw new Error(`manifest ${response.status}`);
    const manifest = await response.json();
    if (!manifest || !manifest.version) throw new Error('manifest نامعتبر');
    manifestCache = { at: Date.now(), value: manifest };
    return manifest;
  } catch (_e) {
    return null;
  }
}

// آیا امکان آپلود مستقیم از پنل هست؟ (فقط توکن لازم است، بقیه از env یا تنظیمات)
export function getUpdateTarget(cfg = {}, env = {}) {
  const token = String(env?.CF_API_TOKEN || env?.CLOUDFLARE_API_TOKEN || '').trim();
  const accountId = String(cfg.cfAccountId || env?.CF_ACCOUNT_ID || env?.CLOUDFLARE_ACCOUNT_ID || '').trim();
  const scriptName = String(cfg.cfScriptName || env?.CF_SCRIPT_NAME || '').trim();
  return {
    token,
    accountId,
    scriptName,
    ready: Boolean(token && accountId && scriptName),
    missing: [
      !token ? 'CF_API_TOKEN' : '',
      !accountId ? 'CF_ACCOUNT_ID (یا تنظیم cfAccountId)' : '',
      !scriptName ? 'CF_SCRIPT_NAME (یا تنظیم cfScriptName)' : ''
    ].filter(Boolean)
  };
}

export async function checkForUpdate(cfg = {}, env = {}, options = {}) {
  const manifest = await fetchManifest(options.force === true, env);
  const target = getUpdateTarget(cfg, env);
  if (!manifest) {
    return {
      success: false,
      current: currentVersionLabel(),
      updateAvailable: false,
      error: 'دریافت فهرست نسخه‌ها از گیت‌هاب ممکن نشد؛ اتصال شبکه یا دسترسی به raw.githubusercontent.com را بررسی کنید.',
      autoApplyAvailable: target.ready,
      missing: target.missing
    };
  }
  const current = currentVersionLabel();
  const latest = String(manifest.version || current);
  return {
    success: true,
    current,
    latest,
    build: manifest.build || '',
    publishedAt: manifest.publishedAt || '',
    notes: Array.isArray(manifest.notes) ? manifest.notes : [],
    repo: manifest.repo || UPDATE_REPO_URL,
    updateAvailable: compareVersions(latest, current) > 0,
    autoApplyAvailable: target.ready,
    missing: target.missing,
    scriptName: target.scriptName,
    accountIdTail: target.accountId ? target.accountId.slice(-6) : ''
  };
}

// آپلود بандل تازه روی همان اسکریپت Workers از طریق Cloudflare API
export async function applyUpdate(cfg = {}, env = {}, options = {}) {
  const target = getUpdateTarget(cfg, env);
  if (!target.ready) {
    return {
      success: false,
      error: 'برای بروزرسانی خودکار این کلیدها لازم است: ' + target.missing.join('، '),
      missing: target.missing
    };
  }
  const info = await checkForUpdate(cfg, env, { force: true });
  if (!info.success) return { success: false, error: info.error };
  if (!info.updateAvailable && !options.force) {
    return { success: true, alreadyLatest: true, message: `نسخهٔ نصب‌شده (${info.current}) به‌روز است.` };
  }

  const bundleUrl = (manifestCache.value && manifestCache.value.bundle) || getBundleUrl(env);
  let code = '';
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(bundleUrl, { signal: controller.signal });
    clearTimeout(timer);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    code = await response.text();
  } catch (err) {
    return { success: false, error: 'دریافت باندل تازه ناموفق بود: ' + (err?.message || String(err)) };
  }
  if (!code || code.length < 50000) {
    return { success: false, error: 'باندل دریافتی معتبر نیست (حجم غیرمنتظره).' };
  }

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(target.accountId)}/workers/scripts/${encodeURIComponent(target.scriptName)}`;
  const form = new FormData();
  form.append('metadata', JSON.stringify({
    main_module: '_worker.js',
    compatibility_date: '2024-09-23'
  }));
  form.append('_worker.js', new Blob([code], { type: 'application/javascript+module' }), '_worker.js');

  try {
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${target.token}` },
      body: form
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) {
      const detail = (data.errors && data.errors[0] && data.errors[0].message) || `HTTP ${response.status}`;
      return { success: false, error: 'آپلود به کلادفلر ناموفق بود: ' + detail };
    }
    return {
      success: true,
      updated: true,
      from: info.current,
      to: info.latest,
      bytes: code.length,
      message: `نسخهٔ ${info.latest} روی اسکریپت «${target.scriptName}» مستقر شد.`
    };
  } catch (err) {
    return { success: false, error: 'خطای شبکه در آپلود: ' + (err?.message || String(err)) };
  }
}

// در کرون: اگر بروزرسانی خودکار روشن و توکن موجود باشد، نسخهٔ تازه مستقر می‌شود
export async function autoUpdateIfEnabled(cfg = {}, env = {}) {
  if (String(cfg.autoUpdate || 'no') !== 'yes') return { skipped: 'disabled' };
  const target = getUpdateTarget(cfg, env);
  if (!target.ready) return { skipped: 'no-credentials', missing: target.missing };
  const info = await checkForUpdate(cfg, env);
  if (!info.success) return { skipped: 'manifest-unreachable' };
  if (!info.updateAvailable) return { skipped: 'up-to-date', current: info.current };
  return await applyUpdate(cfg, env);
}
