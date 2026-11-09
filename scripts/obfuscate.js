// ============================================================================
// miliconfig v3.9 - موتور مبهم‌سازی پیشرفته (Advanced Worker-Safe AST Obfuscator)
// طراحی‌شده اختصاصی برای Cloudflare Workers & Pages بدون بروز خطای Error 1101
// و حذف ۱۰۰٪ امضاهای متنی پروکسی از کد باندل نهایی جهت جلوگیری از بن/محدودیت حساب کلادفلر
// (مبهم‌سازی مبتنی بر AST Acorn + Terser + جدول رشته‌های رمزنگاری‌شده XOR/Base64 با کش O(1))
// ============================================================================

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

function loadTerser() {
  const candidates = [
    'terser',
    '/usr/share/nodejs/terser/dist/bundle.min.cjs',
    '/usr/share/nodejs/terser'
  ];
  for (const c of candidates) {
    try {
      return require(c);
    } catch (_e) {}
  }
  return null;
}

function loadAcorn() {
  const candidates = ['acorn', '/usr/share/nodejs/acorn'];
  for (const c of candidates) {
    try {
      return require(c);
    } catch (_e) {}
  }
  return null;
}

function loadJsObfuscator() {
  try {
    return require('javascript-obfuscator');
  } catch (_e) {
    return null;
  }
}

function xorEncodeToBase64(str, key) {
  const bytes = Buffer.from(str, 'utf8');
  const out = Buffer.allocUnsafe(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    out[i] = bytes[i] ^ ((key + i * 31) & 0xff);
  }
  return out.toString('base64');
}

// الگوی کلیدواژه‌های حساس که اسکنرهای کلادفلر برای شناسایی اسکریپت‌های پروکسی بررسی می‌کنند
const SENSITIVE_KEYWORDS_RE =
  /vless|trojan|shadowsocks|wireguard|amnezia|masque|v2ray|clash|mihomo|sing-?box|hiddify|nekobox|shadowrocket|quantumult|CMLiussss|cloudflareclient|proxyip|ss:\/\/|vmess|xhttp|chacha20|aes-128-gcm|aes-256-gcm/gi;

// پیمایش AST برای استخراج امن تمام رشته‌های جاوااسکریپت + پاک‌سازی کامل TemplateLiteralها از کلیدواژه‌های حساس
function astEncryptStrings(code, xorKey = 0x5a) {
  const acorn = loadAcorn();
  if (!acorn) return { code, vault: [] };

  let ast;
  try {
    ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
  } catch (_e) {
    return { code, vault: [] };
  }

  const vault = [];
  const vaultMap = new Map();
  const replacements = [];

  function registerString(str) {
    if (vaultMap.has(str)) return vaultMap.get(str);
    const idx = vault.length;
    vault.push(xorEncodeToBase64(str, xorKey));
    vaultMap.set(str, idx);
    return idx;
  }

  function walk(node, parent) {
    if (!node || typeof node !== 'object') return;

    if (
      node.type === 'Literal' &&
      typeof node.value === 'string' &&
      node.value.length >= 2 &&
      node.value.length <= 25000
    ) {
      const isPropKey =
        parent &&
        (parent.type === 'Property' || parent.type === 'MethodDefinition') &&
        parent.key === node &&
        !parent.computed;
      const isImportOrExport =
        parent &&
        (parent.type === 'ImportDeclaration' ||
          parent.type === 'ExportNamedDeclaration' ||
          parent.type === 'ExportAllDeclaration');

      if (!isImportOrExport) {
        SENSITIVE_KEYWORDS_RE.lastIndex = 0;
        const hasSensitive = SENSITIVE_KEYWORDS_RE.test(node.value);
        if (!isPropKey && (node.value.length >= 3 || hasSensitive)) {
          const idx = registerString(node.value);
          replacements.push({
            start: node.start,
            end: node.end,
            replacement: `_0xMiliDec(${idx})`
          });
        } else if (
      node.type === 'Literal' &&
      node.regex &&
      typeof node.regex.pattern === 'string'
    ) {
      SENSITIVE_KEYWORDS_RE.lastIndex = 0;
      if (SENSITIVE_KEYWORDS_RE.test(node.regex.pattern)) {
        const pIdx = registerString(node.regex.pattern);
        const fIdx = registerString(node.regex.flags || '');
        replacements.push({
          start: node.start,
          end: node.end,
          replacement: `new RegExp(_0xMiliDec(${pIdx}), _0xMiliDec(${fIdx}))`
        });
      }
    } else if (isPropKey && hasSensitive && parent.type === 'Property' && parent.kind === 'init') {
          const idx = registerString(node.value);
          replacements.push({
            start: node.start,
            end: node.end,
            replacement: `[_0xMiliDec(${idx})]`
          });
        }
      }
    } else if (
      node.type === 'TemplateElement' &&
      parent &&
      parent.type === 'TemplateLiteral' &&
      typeof node.value?.raw === 'string'
    ) {
      const rawText = node.value.raw;
      SENSITIVE_KEYWORDS_RE.lastIndex = 0;
      if (SENSITIVE_KEYWORDS_RE.test(rawText)) {
        SENSITIVE_KEYWORDS_RE.lastIndex = 0;
        const replacedRaw = rawText.replace(SENSITIVE_KEYWORDS_RE, match => {
          const idx = registerString(match);
          return `\${_0xMiliDec(${idx})}`;
        });
        if (replacedRaw !== rawText) {
          replacements.push({
            start: node.start,
            end: node.end,
            replacement: replacedRaw
          });
        }
      }
    }

    for (const key of Object.keys(node)) {
      if (key === 'start' || key === 'end' || key === 'loc' || key === 'range') continue;
      const child = node[key];
      if (Array.isArray(child)) {
        for (const item of child) {
          if (item && typeof item.type === 'string') walk(item, node);
        }
      } else if (child && typeof child.type === 'string') {
        walk(child, node);
      }
    }
  }

  walk(ast, null);

  if (replacements.length === 0) {
    return { code, vault: [] };
  }

  replacements.sort((a, b) => b.start - a.start);
  let outCode = code;
  for (const r of replacements) {
    outCode = outCode.slice(0, r.start) + r.replacement + outCode.slice(r.end);
  }

  return { code: outCode, vault };
}

export async function obfuscateWorkerBundle(rawEsmCode) {
  const lines = rawEsmCode.split('\n');
  const importLines = [];
  const bodyLines = [];

  for (const line of lines) {
    if (/^\s*import\s+.*from\s+['"]cloudflare:sockets['"]\s*;?\s*$/.test(line)) {
      importLines.push(line.trim());
    } else {
      bodyLines.push(line);
    }
  }

  const headerImport =
    importLines.length > 0
      ? importLines[0]
      : `import { connect as cfConnect } from 'cloudflare:sockets';`;

  let bodyCode = bodyLines.join('\n');
  bodyCode = bodyCode.replace(/export\s+default\s+\{/, 'const __MILI_WORKER_EXPORT__ = {');

  // بازنویسی نام پراپرتی‌های حساس روی آبجکت‌های داخلی تا پس از Minify هیچ کلید حساسی باقی نماند
  const SENSITIVE_PROP_RENAMES = [
    [/\bshadowsocks\b/g, '_mili_ss_p'],
    [/\bwireguard\b/g, '_mili_wg_p'],
    [/\bvless\b/g, '_mili_vl_p'],
    [/\btrojan\b/g, '_mili_tr_p']
  ];

  const xorKey = 0x5a;
  const { code: astEncryptedCode, vault } = astEncryptStrings(bodyCode, xorKey);

  let postAstCode = astEncryptedCode;
  for (const [re, rep] of SENSITIVE_PROP_RENAMES) {
    postAstCode = postAstCode.replace(re, rep);
  }

  const vaultRuntime =
    vault.length > 0
      ? `const _0xMiliVault = ${JSON.stringify(vault)};
const _0xMiliCache = Object.create(null);
function _0xMiliDec(_0xIdx) {
  if (_0xMiliCache[_0xIdx] !== undefined) return _0xMiliCache[_0xIdx];
  const _0xRaw = atob(_0xMiliVault[_0xIdx]);
  const _0xBytes = new Uint8Array(_0xRaw.length);
  for (let _0xI = 0; _0xI < _0xRaw.length; _0xI++) {
    _0xBytes[_0xI] = _0xRaw.charCodeAt(_0xI) ^ ((${xorKey} + (_0xI * 31)) & 0xff);
  }
  const _0xStr = new TextDecoder().decode(_0xBytes);
  _0xMiliCache[_0xIdx] = _0xStr;
  return _0xStr;
}\n`
      : '';

  // قرار دادن export default داخل کد ورودی Terser تا از حذف درختی (Tree-Shaking) جلوگیری شود
  const combined = `${vaultRuntime}${postAstCode}\nexport default __MILI_WORKER_EXPORT__;\n`;
  const terser = loadTerser();

  if (terser && typeof terser.minify === 'function') {
    const minified = await terser.minify(combined, {
      ecma: 2022,
      module: true,
      compress: {
        passes: 2,
        dead_code: true,
        drop_debugger: true,
        conditionals: true,
        evaluate: false,
        booleans: true,
        loops: true,
        unused: true
      },
      mangle: {
        toplevel: true,
        reserved: ['__MILI_WORKER_EXPORT__', 'cfConnect', 'fetch', 'WebSocketPair']
      },
      format: {
        comments: false,
        ascii_only: false
      }
    });
    if (minified && minified.code) {
      return `${headerImport}\n${minified.code}\n`;
    }
  }

  return `${headerImport}\n${combined}`;
}
