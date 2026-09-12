#!/usr/bin/env node
/**
 * build-index.mjs — 从 tech/*.md 推导出索引与站点数据（唯一构建步骤）。
 *
 * 为什么不让索引手写：手写的索引一定会烂。技巧文件才是唯一真相，
 * 这个脚本把「有几条技巧、各自什么状态」从文件里算出来，写进三处下游：
 *
 *   tech/README.md        人看的索引（自动生成，手改会被覆盖）
 *   site/tech/*.md        tech/ 的副本，供站点运行时 fetch
 *   site/data/index.json  站点读取的索引数据
 *
 * 用法：
 *   node tools/build-index.mjs            正常构建
 *   node tools/build-index.mjs --check    只校验不落盘（CI 可用）
 */

import { readFileSync, readdirSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TECH_DIR = join(ROOT, 'tech');
const SITE_DIR = join(ROOT, 'site');
const SITE_TECH = join(SITE_DIR, 'tech');
const SITE_DATA = join(SITE_DIR, 'data');

const CHECK_ONLY = process.argv.includes('--check');

const STATUS = {
  未验证: { key: 'unverified', label: '未验证', dot: '⚪', advice: '纸面推导，未实战 —— 考前不要用' },
  模拟考验证: { key: 'mock', label: '模拟考验证', dot: '🟡', advice: '模拟考验证过适用 —— 谨慎用' },
  真题验证: { key: 'real', label: '真题验证', dot: '🟢', advice: '历年真题验证过 —— 可以用' },
};

/** 把各种写法收敛到三档，认不出来就算未验证（宁可低估可信度）。 */
function normalizeStatus(raw) {
  const s = (raw || '').trim();
  if (s.includes('真题')) return STATUS.真题验证;
  if (s.includes('模拟')) return STATUS.模拟考验证;
  return STATUS.未验证;
}

/** 按 `## 标题` 切片，返回 { 小节名: 正文 }。 */
function splitSections(md) {
  const out = {};
  let cur = null;
  for (const line of md.split(/\r?\n/)) {
    const h = line.match(/^##\s+(.+?)\s*$/);
    if (h) {
      cur = h[1];
      out[cur] = [];
      continue;
    }
    if (cur) out[cur].push(line);
  }
  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.join('\n')]));
}

/** 从「| 字段 | 值 |」形式的表格里取值。 */
function tableField(block, field) {
  for (const line of (block || '').split(/\r?\n/)) {
    const cells = line.split('|').map((c) => c.trim());
    if (cells.length >= 4 && cells[1] === field) return cells[2];
  }
  return '';
}

/** 取小节里第一段有内容的文字。 */
function firstParagraph(block) {
  for (const line of (block || '').split(/\r?\n/)) {
    const t = line.trim();
    if (t && !t.startsWith('>') && !t.startsWith('#') && !t.startsWith('|')) {
      return t.replace(/^[（(]\s*/, '').replace(/\s*[）)]$/, '');
    }
  }
  return '';
}

function parseTechnique(file) {
  const md = readFileSync(join(TECH_DIR, file), 'utf8');
  const stem = file.replace(/\.md$/, '');

  const titleLine = (md.match(/^#\s+(.+?)\s*$/m) || [])[1] || stem;
  const m = titleLine.match(/^(\d+)\s*[-—·.]\s*(.+)$/);
  const num = m ? Number(m[1]) : 999;
  const name = m ? m[2].trim() : titleLine.trim();

  const sections = splitSections(md);
  const verify = normalizeStatus(tableField(sections['验证'], '验证状态'));
  const scene = (tableField(sections['验证'], '验证场景') || '待验证').trim();
  const summary = firstParagraph(sections['一句话概括']) || '（未填写一句话概括）';

  return {
    file,
    slug: stem,
    num,
    number: String(num).padStart(2, '0'),
    name,
    title: titleLine,
    status: verify.key,
    statusLabel: verify.label,
    statusDot: verify.dot,
    statusAdvice: verify.advice,
    verifiedIn: scene,
    summary,
    url: `tech/${file}`,
  };
}

function collect() {
  if (!existsSync(TECH_DIR)) throw new Error(`缺少 tech/ 目录：${TECH_DIR}`);
  const files = readdirSync(TECH_DIR)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_') && f.toUpperCase() !== 'README.MD')
    .sort();
  return files.map(parseTechnique).sort((a, b) => a.num - b.num || a.name.localeCompare(b.name, 'zh'));
}

function renderIndex(items) {
  const count = (k) => items.filter((i) => i.status === k).length;
  const rows = items.length
    ? items
        .map(
          (i) =>
            `| ${i.statusDot} | [${i.number} ${i.name}](./${i.file}) | ${i.statusLabel} | ${i.verifiedIn} |`
        )
        .join('\n')
    : '| — | （暂无技巧，从 `_template.md` 复制开始） | — | — |';

  return `# 技巧索引

> ⚙️ **本文件由 \`tools/build-index.mjs\` 自动生成，手改会被覆盖。** 要增删技巧请改 \`tech/\` 下的文件，然后跑 \`npm run index\`。
>
> 方法通用，全科全适，不分科。靠「验证状态」筛选可信度。

## 索引（共 ${items.length} 条）

| 状态 | 技巧 | 验证状态 | 验证场景 |
|---|---|---|---|
${rows}

## 验证状态说明

| 档位 | 含义 | 能否用于高考 |
|---|---|---|
| ⚪ 未验证 | 仅纸面推导，未实战 | 考前不用 |
| 🟡 模拟考验证 | 在模拟考中验证过适用 | 谨慎 |
| 🟢 真题验证 | 在历年真题中验证过 | 可用 |

## 统计

- 🟢 真题验证：${count('real')} 条
- 🟡 模拟考验证：${count('mock')} 条
- ⚪ 未验证：${count('unverified')} 条

---

> ⚠️ 技巧只是辅助，**不替代对底层核心概念的扎实理解**（见 [README](../README.md#️-免责声明)）。
`;
}

function main() {
  const items = collect();
  const indexPath = join(TECH_DIR, 'README.md');
  const indexMd = renderIndex(items);
  const indexJson = JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      count: items.length,
      items: items.map(({ file, slug, number, name, title, status, statusLabel, statusDot, statusAdvice, verifiedIn, summary, url }) => ({
        file, slug, number, name, title, status, statusLabel, statusDot, statusAdvice, verifiedIn, summary, url,
      })),
    },
    null,
    2
  );

  if (CHECK_ONLY) {
    const stale = !existsSync(indexPath) || readFileSync(indexPath, 'utf8') !== indexMd;
    if (stale) {
      console.error('❌ tech/README.md 与 tech/*.md 不一致，跑 `npm run index` 重新生成');
      process.exit(1);
    }
    console.log(`✅ 索引与 ${items.length} 条技巧一致`);
    return;
  }

  writeFileSync(indexPath, indexMd, 'utf8');

  // 站点侧：清掉上次的副本再铺新的，避免删掉的技巧残留在线上
  rmSync(SITE_TECH, { recursive: true, force: true });
  mkdirSync(SITE_TECH, { recursive: true });
  mkdirSync(SITE_DATA, { recursive: true });
  for (const it of items) {
    writeFileSync(join(SITE_TECH, it.file), readFileSync(join(TECH_DIR, it.file)));
  }
  writeFileSync(join(SITE_DATA, 'index.json'), indexJson, 'utf8');

  const real = items.filter((i) => i.status === 'real').length;
  const mock = items.filter((i) => i.status === 'mock').length;
  console.log(`✅ 构建完成：${items.length} 条技巧（🟢 ${real} / 🟡 ${mock} / ⚪ ${items.length - real - mock}）`);
  console.log(`   tech/README.md · site/data/index.json · site/tech/*.md`);
}

main();
