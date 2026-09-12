#!/usr/bin/env node
/**
 * serve.mjs — 零依赖本地预览服务器。
 *
 * 为什么不用 npx serve / http-server：中国网络下拉 npm 包会卡，而预览这件事
 * 用 node 内置模块 50 行就够了（见 CLAUDE.md「部署约定」同一条理由）。
 *
 * 用法：node tools/serve.mjs [端口]   默认 http://localhost:8788
 * 先跑 `npm run index` 生成 site/data 与 site/tech，否则页面是空的。
 */

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'site');
const PORT = Number(process.argv[2]) || 8788;
const HOST = '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

const server = createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, `http://${HOST}`).pathname);
    let target = join(ROOT, normalize(urlPath).replace(/^(\.\.[/\\])+/, ''));
    if (!target.startsWith(ROOT)) {
      res.writeHead(403).end('forbidden');
      return;
    }
    const info = await stat(target).catch(() => null);
    if (info?.isDirectory()) target = join(target, 'index.html');

    const body = await readFile(target);
    res.writeHead(200, {
      'Content-Type': MIME[extname(target).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404 not found');
  }
});

server.listen(PORT, HOST, () => {
  console.log(`本地预览：http://${HOST}:${PORT}`);
  console.log('（首次请先跑 `npm run index`，否则索引是空的）');
});
