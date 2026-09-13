#!/usr/bin/env node
/*
 * privacy-scan.mjs - 公开仓库的隐私扫描器（零依赖，只用 Node 标准库）。
 *
 * 为什么要有这个：本仓库是公开仓库，而「别提交隐私数据」这句规矩写在 README 里
 * 是拦不住任何人的，包括将来的我自己。规矩要么有机器执行，要么等于没有。
 *
 * 两档判定（详见 CLAUDE.md 的隐私扫描一节）：
 *   HARD  密钥形状 / 私钥块 / 硬编码口令 / 手机号 / 身份证号 / 非 noreply 邮箱
 *         / 敏感文件名 / 超过 1 MiB 的文件  -> 阻断合并
 *   WARN  个人家目录绝对路径                -> 只提示（--strict 时一并阻断）
 *
 * 命中值一律脱敏（只留前 4 字符），扫描日志本身不能成为新的泄漏点。
 *
 * 用法：
 *   node tools/privacy-scan.mjs             扫工作区
 *   node tools/privacy-scan.mjs --history   追加扫 git 全历史（抓提交后又删掉的内容）
 *   node tools/privacy-scan.mjs --strict    WARN 也当失败
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const argv = process.argv.slice(2);
const OPT = {
  history: argv.includes('--history'),
  strict: argv.includes('--strict'),
  help: argv.includes('-h') || argv.includes('--help'),
};

if (OPT.help) {
  console.log('用法：node tools/privacy-scan.mjs [--history] [--strict]');
  console.log('  --history  追加扫 git 全历史（抓提交后又删除的内容）');
  console.log('  --strict    WARN 档也按失败处理');
  process.exit(0);
}

const SIZE_LIMIT = 1024 * 1024; // 1 MiB

// 扫描哪些路径：构建产物与第三方资源不扫
const SKIP_PREFIX = ['site/vendor/', 'site/tech/', 'site/data/', '.git/', 'node_modules/'];

// 敏感文件名（HARD）
const NAME_RULES = [
  { id: 'sensitive-file', re: /\.env$|\.env\./i },
  { id: 'sensitive-file', re: /\.(pem|key|p12|pfx|jks|keystore|ppk|enc|kdbx|sqlite|db)$/i },
  { id: 'sensitive-file', re: /(^|\/)(id_rsa|id_dsa|id_ecdsa|id_ed25519)(\.pub)?$/ },
  { id: 'sensitive-file', re: /(^|\/)(\.npmrc|\.netrc|\.pgpass|credentials|secrets?)$/i },
];

// 内容规则（HARD / WARN）
const RULES = [
  { id: 'github-token', tier: 'hard', what: 'GitHub 令牌', re: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/ },
  { id: 'github-pat', tier: 'hard', what: 'GitHub 细粒度令牌', re: /\bgithub_pat_[A-Za-z0-9_]{22,}\b/ },
  { id: 'private-key', tier: 'hard', what: '私钥文件内容', re: /-{5}BEGIN[^-]{0,40}PRIVATE KEY-{5}/ },
  { id: 'aws-access-key', tier: 'hard', what: 'AWS Access Key ID', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { id: 'google-api-key', tier: 'hard', what: 'Google API Key', re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { id: 'slack-token', tier: 'hard', what: 'Slack 令牌', re: /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/ },
  { id: 'cloudflare-credential', tier: 'hard', what: 'Cloudflare 凭证被赋值', re: /CLOUDFLARE_(?:API_TOKEN|ACCOUNT_ID|API_KEY)\s*[:=]\s*[\x22\x27]?[A-Za-z0-9_-]{20,}/ },
  { id: 'llm-api-key', tier: 'hard', what: 'LLM 服务密钥', re: /\bsk-[A-Za-z0-9]{20,}\b/ },
  { id: 'hardcoded-secret', tier: 'hard', what: '硬编码口令或密钥', re: /(?:api[_-]?key|secret|passwd|password|access[_-]?token|auth[_-]?token|bearer)[\x22\x27\s]{0,3}[:=][\t ]*[\x22\x27][^\x22\x27\s]{8,}[\x22\x27]/i },
  { id: 'cn-mobile', tier: 'hard', what: '中国大陆手机号', re: /(?<!\d)1[3-9]\d{9}(?!\d)/ },
  { id: 'cn-id-card', tier: 'hard', what: '中国大陆身份证号', re: /(?<!\d)\d{6}(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx](?!\d)/ },
  { id: 'personal-email', tier: 'hard', what: '非 noreply 邮箱地址', re: /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/ },
  { id: 'local-abs-path', tier: 'warn', what: '个人家目录绝对路径', re: new RegExp('(?:[A-Za-z]:[\\\\/]Users[\\\\/][A-Za-z0-9][A-Za-z0-9._-]*|/Users/[A-Za-z0-9][A-Za-z0-9._-]*|/home/[A-Za-z0-9][A-Za-z0-9._-]*)/') },
];

// 每条规则预编译一个 /g 正则，逐行扫描时复用
const RULES_G = RULES.map((r) => ({
  ...r,
  gre: new RegExp(r.re.source, r.re.flags.includes('g') ? r.re.flags : r.re.flags + 'g'),
}));

// 邮箱白名单：GitHub noreply、示例域名、localhost 一律放行
function emailAllowed(s) {
  const at = s.lastIndexOf('@');
  if (at < 0) return true;
  const local = s.slice(0, at);
  const domain = s.slice(at + 1).toLowerCase();
  if (/^(git|noreply|no-reply|bot)$/i.test(local)) return true;
  if (/(\.github\.com|example\.(com|org|net)|localhost|\.invalid|\.test)$/.test(domain)) return true;
  return false;
}

// 行内例外声明：privacy-scan-allow: <规则名> — <理由>
// 匹配本行与下一行；规则名可用 * 通配
function parseAllows(text) {
  const map = new Map();
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/privacy-scan-allow\s*:\s*(.+)$/);
    if (!m) continue;
    const ids = m[1].split(/—|--/)[0].split(/[,\s]+/).map((x) => x.trim()).filter(Boolean);
    if (!ids.length) continue;
    for (const ln of [i + 1, i + 2]) {
      if (!map.has(ln)) map.set(ln, new Set());
      ids.forEach((id) => map.get(ln).add(id));
    }
  }
  return map;
}

function mask(value) {
  const s = String(value).replace(/\s+/g, ' ').trim();
  if (s.length <= 4) return '*'.repeat(s.length || 1);
  return s.slice(0, 4) + '…';
}

function isBinary(buf) {
  const n = Math.min(buf.length, 8192);
  for (let i = 0; i < n; i++) if (buf[i] === 0) return true;
  return false;
}

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const abs = join(dir, e.name);
    const rel = relative(ROOT, abs).split(sep).join('/');
    if (SKIP_PREFIX.some((p) => rel === p.replace(/\/$/, '') || rel.startsWith(p))) continue;
    if (e.isDirectory()) yield* walk(abs);
    else if (e.isFile()) yield { abs, rel };
  }
}

const findings = []; // { tier, ruleId, rule, where, masked }

function scanLines(rel, lines, allowMap, bucket) {
  for (let i = 0; i < lines.length; i++) {
    const lineNo = i + 1;
    const allowed = allowMap ? allowMap.get(lineNo) : null;
    if (allowed && allowed.has('*')) continue;
    const line = lines[i];
    for (const rule of RULES_G) {
      rule.gre.lastIndex = 0;
      let m;
      while ((m = rule.gre.exec(line)) !== null) {
        if (rule.id === 'personal-email' && emailAllowed(m[0])) { if (rule.gre.lastIndex === m.index) rule.gre.lastIndex++; continue; }
        if (allowed && allowed.has(rule.id)) { if (rule.gre.lastIndex === m.index) rule.gre.lastIndex++; continue; }
        bucket.push({
          tier: rule.tier,
          ruleId: rule.id,
          what: rule.what,
          where: rel + ':' + lineNo,
          masked: mask(m[0]),
        });
      }
    }
  }
}

const files = [...walk(ROOT)];
let scanned = 0;
for (const { abs, rel } of files) {
  const base = rel.split('/').pop();
  const size = statSync(abs).size;
  if (size > SIZE_LIMIT && !rel.startsWith('site/vendor/')) {
    findings.push({ tier: 'hard', ruleId: 'oversized-file', what: '超过 1 MiB 的文件', where: rel + ' (' + (size / 1024 | 0) + ' KiB)', masked: '' });
    continue;
  }
  for (const nr of NAME_RULES) {
    if (nr.re.test(rel) || nr.re.test(base)) {
      findings.push({ tier: 'hard', ruleId: 'sensitive-file', what: '敏感文件名', where: rel, masked: '' });
      break;
    }
  }
  if (rel.startsWith('site/vendor/')) continue; // 第三方资源：只做大小/文件名检查
  const buf = readFileSync(abs);
  if (isBinary(buf)) continue;
  const text = buf.toString('utf8');
  scanned++;
  const allowMap = parseAllows(text);
  scanLines(rel, text.split('\n'), allowMap, findings);
}

// git 历史扫描：只报告「工作区已不存在、但历史里还在」的命中
const histSeen = new Set(findings.map((f) => f.ruleId + ' ' + f.masked));
const histFindings = [];
let histError = null;
if (OPT.history) {
  let patch;
  try {
    patch = execFileSync('git', ['-C', ROOT, 'log', '-p', '--no-color', '--no-merges', '--', '.', ':(exclude)site/vendor'], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (e) {
    histError = e.message || String(e);
  }
  if (histError) {
    console.error('警告：无法扫 git 历史（仅做工作区扫描）：' + histError);
  }
  let sha = '?';
  let file = '?';
  for (const raw of patch.split('\n')) {
    const cm = raw.match(/^commit ([0-9a-f]{40})/);
    if (cm) { sha = cm[1].slice(0, 7); file = '?'; continue; }
    const fm = raw.match(/^\+\+\+ b\/(.+)$/);
    if (fm) { file = fm[1]; continue; }
    if (!raw.startsWith('+') || raw.startsWith('+++')) continue;
    if (file.startsWith('site/vendor/')) continue;
    const content = raw.slice(1);
    for (const rule of RULES_G) {
      rule.gre.lastIndex = 0;
      let m;
      while ((m = rule.gre.exec(content)) !== null) {
        if (rule.id === 'personal-email' && emailAllowed(m[0])) { if (rule.gre.lastIndex === m.index) rule.gre.lastIndex++; continue; }
        const sig = rule.id + ' ' + mask(m[0]);
        if (histSeen.has(sig)) { if (rule.gre.lastIndex === m.index) rule.gre.lastIndex++; continue; }
        histFindings.push({ tier: rule.tier, ruleId: rule.id, what: rule.what, where: '历史 ' + sha + ' ' + file, masked: mask(m[0]) });
      }
    }
  }
}

function report(title, list) {
  const hard = list.filter((f) => f.tier === 'hard');
  const warn = list.filter((f) => f.tier === 'warn');
  const parts = [];
  if (hard.length) parts.push('HARD ' + hard.length + ' 项');
  if (warn.length) parts.push('WARN ' + warn.length + ' 项');
  if (!list.length) parts.push('无命中');
  console.log('\n' + title + '：' + parts.join('，'));
  for (const f of list) {
    console.log('   [' + f.tier.toUpperCase() + '] ' + f.where + '  ' + f.ruleId + '  ' + (f.masked || ''));
  }
}

report('工作区（扫了 ' + scanned + ' 个文本文件）', findings);
if (OPT.history) report('git 历史（仅存在于历史、工作区已删的命中）', histFindings);

const hardCount = findings.filter((f) => f.tier === 'hard').length + histFindings.filter((f) => f.tier === 'hard').length;
const warnCount = findings.filter((f) => f.tier === 'warn').length + histFindings.filter((f) => f.tier === 'warn').length;

const blocked = hardCount > 0 || (OPT.strict && warnCount > 0);
console.log('\n结果：' + (blocked ? '发现 ' + (hardCount + warnCount) + ' 项命中，阻断' : '通过'));
process.exit(blocked ? 1 : 0);
