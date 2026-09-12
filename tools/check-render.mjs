#!/usr/bin/env node
/**
 * check-render.mjs — markdown / 公式渲染管线的冒烟测试（不需要浏览器）。
 *
 * 为什么要有这个：抽取-还原那套占位符逻辑是整站最容易悄悄坏掉的地方。
 * 坏掉的表现很安静——页面照常打开，只是公式变成一坨源码、或者表格被竖线切碎。
 * 这里在 Node 里跑真实的 marked + KaTeX，坏一步就红。
 *
 * 用法：node tools/check-render.mjs
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const failures = [];
const checks = [];

function check(name, ok, detail = '') {
  checks.push({ name, ok: Boolean(ok), detail });
  if (!ok) failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
}

/**
 * 在受控的 CJS 沙箱里跑 UMD 包。
 * 直接 require 不行：本包 package.json 是 "type": "module"，`.js` 会被当 ESM，
 * UMD 探测到 `module` 未定义就退回去挂全局变量，而 ESM 顶层没有 `this` → 崩。
 */
function loadUmd(relPath) {
  const code = readFileSync(join(ROOT, relPath), 'utf8');
  const mod = { exports: {} };
  const sandbox = { module: mod, exports: mod.exports, console, setTimeout, clearTimeout };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: relPath });
  return mod.exports;
}

let marked, katex, MD;
try {
  marked = loadUmd('site/vendor/marked.min.js');
  katex = loadUmd('site/vendor/katex/katex.min.js');
  MD = loadUmd('site/md.js');
} catch (e) {
  console.error('❌ 依赖加载失败：', e.message);
  process.exit(1);
}

check('marked 已加载', typeof marked?.parse === 'function');
check('KaTeX 已加载', typeof katex?.renderToString === 'function');
check('md.js 已加载', typeof MD?.renderMarkdown === 'function');

/* ── 1. 管线单元断言 ─────────────────────────────────────── */

{
  const md = [
    '# 标题',
    '',
    '行内公式 $x_1 + y^2$ 不应变成斜体。',
    '',
    '$$\\left|a\\right| \\le b$$',
    '',
    '| 列 | 值 |',
    '|---|---|',
    '| $\\frac{1}{2}$ | **粗** |',
    '',
    '```js',
    'const s = "$100"; // 代码里的 $ 不该被当公式',
    '```',
  ].join('\n');

  const { out, store, math } = MD.protect(md);
  // 1 个代码块 + 3 处公式（行内 x_1+y^2、行间 \left|a\right|、表格里的 \frac{1}{2}）
  check('protect 抽出了代码块与公式', store.length === 4, `store=${store.length}，应为 4`);
  check('protect 记录了公式元数据', math.length === 3, `math=${math.length}，应为 3`);
  check('代码块优先于公式抽取', store[0].includes('$100'), '代码块被公式规则污染了');
  check('表格内的公式也被正确抽出', math.some((m) => m.tex.includes('\\frac{1}{2}')));
  check('代码块内容被转义保留', store[0].includes('&quot;$100&quot;'), store[0].slice(0, 120));

  const probe = MD.protect('x $a*b$ y');
  check('占位符不含 markdown 敏感字符', probe.out === 'x %%GKS0%% y', `得到 ${JSON.stringify(probe.out)}`);

  const html = MD.renderMarkdown(md, marked);
  check('渲染后无占位符残留', !/%%GKS\d+%%/.test(html), html.match(/%%GKS\d+%%/)?.[0] || '');
  check('标题渲染成 h1', /<h1[^>]*>标题<\/h1>/.test(html));
  check('表格渲染成 table', /<table>/.test(html) && /<th[^>]*>列<\/th>/.test(html));
  check('行内公式原样保留给 KaTeX', html.includes('$x_1 + y^2$'));
  check('行间公式原样保留给 KaTeX', html.includes('$$\\left|a\\right| \\le b$$'));
  check('代码块渲染成 pre>code', /<pre><code class="language-js">/.test(html));
  check('下标未被当斜体', !/<em>1/.test(html));
}

/* ── 2. 每条真实技巧：公式必须能被 KaTeX 解析 ──────────────── */

const TECH = join(ROOT, 'tech');
const files = existsSync(TECH)
  ? readdirSync(TECH).filter(
      (f) => f.endsWith('.md') && !f.startsWith('_') && f.toUpperCase() !== 'README.MD'
    )
  : [];

check('tech/ 下至少有一条技巧', files.length > 0, `找到 ${files.length} 条`);

for (const file of files) {
  const md = readFileSync(join(TECH, file), 'utf8');
  const { math } = MD.protect(md);
  const html = MD.renderMarkdown(md, marked);

  check(`${file}：无占位符残留`, !/%%GKS\d+%%/.test(html));
  check(
    `${file}：六节齐全`,
    ['验证', '一句话概括', '方法详解', '最小例题', '备注'].every((s) => md.includes(`## ${s}`)),
    '缺小节'
  );
  check(
    `${file}：验证状态合法`,
    /\|\s*验证状态\s*\|\s*(未验证|模拟考验证|真题验证)\s*\|/.test(md),
    '没找到「未验证 / 模拟考验证 / 真题验证」之一'
  );

  for (const { tex, display } of math) {
    try {
      katex.renderToString(tex, { displayMode: display, throwOnError: true });
    } catch (e) {
      check(`${file}：公式可解析`, false, `\`${tex}\` → ${String(e.message).split('\n')[0]}`);
    }
  }
}

/* ── 3. 构建产物与索引一致性 ─────────────────────────────── */

for (const file of files) {
  check(`site/tech/${file} 已生成`, existsSync(join(ROOT, 'site/tech', file)), '先跑 npm run index');
}

const indexPath = join(ROOT, 'site/data/index.json');
if (!existsSync(indexPath)) {
  check('site/data/index.json 已生成', false, '先跑 npm run index');
} else {
  const data = JSON.parse(readFileSync(indexPath, 'utf8'));
  check('索引条数与 tech/ 文件数一致', data.count === files.length, `索引 ${data.count} / 文件 ${files.length}`);
  check(
    '每条索引都有状态与摘要',
    data.items.every((i) => i.status && i.summary && i.number && i.slug),
    '有字段为空'
  );
  check('站点引用的正文都收进了产物', data.items.every((i) => existsSync(join(ROOT, 'site', i.url))));
}

/* ── 报告 ───────────────────────────────────────────────── */

const passed = checks.length - failures.length;
console.log(`\n渲染与一致性检查：${passed}/${checks.length} 通过`);
if (failures.length) {
  console.error('\n❌ 失败项：');
  for (const f of failures) console.error(`   • ${f}`);
  process.exit(1);
}
console.log('✅ 全部通过\n');
