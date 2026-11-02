// ============================================================================
// miliconfig v3.2 - پریست‌های ساخت سریع کاربر
// ============================================================================

import { CONFIG_DEFAULTS, normalizeEffectiveConfig } from './defaults.js';

export const USER_PRESETS = {
  'iran-fast': {
    id: 'iran-fast',
    title: 'ایران — پرسرعت (پیشنهادی)',
    subtitle: 'همراه اول · ایرانسل · مخابرات',
    badges: ['فرگمنت 100-200 با فاصله 10-20', 'fingerprint chrome', 'بلاک تبلیغات'],
    recommended: true,
    nodeScope: 'all',
    subNodeCount: 0,
    dataLimitGb: 0,
    expireDays: 0,
    ipLimit: 50,
    startOnFirstUse: true,
    configOverrides: {
      ev: 'yes',
      et: 'no',
      ex: 'no',
      es: 'no', // شادوساکس پیش‌فرض خاموش (امکانات اضافهٔ کانال)
      fp: 'chrome',
      fragmentPreset: 'mci',
      fragmentLength: '100-200',
      fragmentInterval: '10-20',
      epd: 'yes',
      epi: 'yes',
      egi: 'yes',
      ena: 'yes',
      ipv4: 'yes',
      ipv6: 'yes',
      sb: 'yes',
      sbRegion: 'DE'
    }
  },
  'iran-heavy': {
    id: 'iran-heavy',
    title: 'ایران — مصرف سنگین (نامحدود)',
    subtitle: 'استریم · بازی · دانلود',
    badges: ['حجم نامحدود', 'فرگمنت 50-100', '۲ دستگاه همزمان'],
    recommended: false,
    nodeScope: 'all',
    subNodeCount: 0,
    dataLimitGb: 0,
    expireDays: 0,
    ipLimit: 2,
    startOnFirstUse: true,
    configOverrides: {
      ev: 'yes',
      et: 'yes',
      ex: 'no',
      es: 'no',
      fp: 'chrome',
      fragmentPreset: 'irancell',
      fragmentLength: '50-100',
      fragmentInterval: '5-10',
      epd: 'yes',
      epi: 'yes',
      egi: 'yes',
      sb: 'yes',
      sbRegion: 'NL'
    }
  },
  'international': {
    id: 'international',
    title: 'بین‌المللی — بدون فرگمنت',
    subtitle: 'اینترنت بدون محدودیت · سرعت حداکثری',
    badges: ['بدون فرگمنت', 'بدون محدودیت حجم', '۵ دستگاه همزمان'],
    recommended: false,
    nodeScope: 'all',
    subNodeCount: 0,
    dataLimitGb: 0,
    expireDays: 0,
    ipLimit: 5,
    startOnFirstUse: true,
    configOverrides: {
      ev: 'yes',
      et: 'no',
      ex: 'no',
      es: 'no',
      dkby: 'yes',
      alpn: 'h2,http/1.1'
    }
  },
  'multi-location': {
    id: 'multi-location',
    title: 'چند لوکیشن — فقط نودهای لبه و VIP',
    subtitle: 'لوکیشن‌های تفکیک‌شده آلمان، هلند، آمریکا و...',
    badges: ['فقط نودهای مولتی‌لوکیشن', 'نام‌گذاری number+miliconfig', 'فرگمنت فعال'],
    recommended: false,
    nodeScope: 'edge',
    subNodeCount: 0,
    dataLimitGb: 0,
    expireDays: 0,
    ipLimit: 50,
    startOnFirstUse: true,
    configOverrides: {
      ev: 'yes',
      es: 'no',
      epd: 'yes',
      epi: 'yes',
      egi: 'yes',
      ena: 'yes'
    }
  },
  'direct-only': {
    id: 'direct-only',
    title: 'فقط سرور اصلی (بدون CDN)',
    subtitle: 'وقتی مسیر CDN مشکل دارد یا تست خود سرور',
    badges: ['فقط نود سرور اصلی', 'بدون لوکیشن', 'بدون فرگمنت'],
    recommended: false,
    nodeScope: 'origin',
    subNodeCount: 0,
    dataLimitGb: 0,
    expireDays: 0,
    ipLimit: 50,
    startOnFirstUse: true,
    configOverrides: {
      ev: 'yes',
      ena: 'yes',
      epd: 'no',
      epi: 'no',
      egi: 'no',
      yxby: 'yes'
    }
  }
};

export function buildUserDefaultConfig(basePanelConfig = {}, presetId = 'iran-fast', customOverrides = {}) {
  const preset = USER_PRESETS[presetId] || USER_PRESETS['iran-fast'];
  return normalizeEffectiveConfig({
    ...CONFIG_DEFAULTS,
    ...(basePanelConfig || {}),
    ...(preset.configOverrides || {}),
    subNodeCount: 0, // تعداد کانفیگ دستی نیست؛ موتور cfnew خودش همهٔ آدرس‌ها را می‌سازد
    ...(customOverrides || {})
  });
}
