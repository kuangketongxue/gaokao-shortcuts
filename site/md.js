/* 27thu · markdown 渲染管线
 *
 * 浏览器 + Node 双用（UMD-lite）：站点走 window.GKSMD，tools/check-render.mjs 走 require。
 *
 * 为什么要「先抽取再渲染」：
 * marked 只有一套语法，公式和代码块里的字符会被它当语法吃掉——
 *   下标 x_1        -> 被当成斜体
 *   \left|a\right|  -> 竖线把表格切碎
 *   代码块里的 /*    -> 被当成注释开头
 * 所以先把围栏代码块和 $...$ / $$...$$ 换成占位符，交给 marked 排版，再原样放回。
 * 占位符用 %%GKSn%%：% 不在 marked 的转义表里，能安全穿过。
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.GKSMD = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const escapeHtml = (s) =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const escapeAttr = (s) => escapeHtml(s).replace(/`/g, '&#96;');

  /**
   * @param {string} md
   * @returns {{out: string, store: string[], math: {tex: string, display: boolean}[]}}
   */
  function protect(md) {
    const store = [];
    const math = [];
    const push = (html) => {
      store.push(html);
      return `%%GKS${store.length - 1}%%`;
    };

    let out = md;

    // 1. 围栏代码块（必须最先，否则代码里的 $ 会被当公式）
    out = out.replace(/```([^\n`]*)\n([\s\S]*?)```/g, (_m, lang, code) =>
      push(
        `<pre><code class="language-${escapeAttr((lang || '').trim() || 'text')}">${escapeHtml(code)}</code></pre>`
      )
    );

    // 2. 行间公式 $$...$$
    out = out.replace(/\$\$([\s\S]+?)\$\$/g, (_m, tex) => {
      math.push({ tex: tex.trim(), display: true });
      return push(`<div class="math-display">$$${tex}$$</div>`);
    });

    // 3. 行内公式 $...$（不吃 $$，允许内部 \ 转义）
    out = out.replace(/(?<!\$)\$(?!\$)((?:[^$\\]|\\.)+?)\$(?!\$)/g, (_m, tex) => {
      math.push({ tex: tex.trim(), display: false });
      return push(`<span class="math-inline">$${tex}$</span>`);
    });

    return { out, store, math };
  }

  function restore(html, store) {
    return html.replace(/%%GKS(\d+)%%/g, (_m, i) => {
      const hit = store[Number(i)];
      return hit === undefined ? _m : hit;
    });
  }

  /**
   * markdown -> HTML。marked 缺失时降级成转义后的原文（宁可难看，不要白屏）。
   * @param {string} md
   * @param {{parse: Function, [k: string]: any}} [markedImpl] 便于测试注入
   */
  function renderMarkdown(md, markedImpl) {
    const m = markedImpl || (typeof globalThis !== 'undefined' ? globalThis.marked : undefined);
    const { out, store } = protect(md);
    const html =
      m && typeof m.parse === 'function'
        ? m.parse(out, { gfm: true, breaks: false })
        : '<pre><code>' + escapeHtml(md) + '</code></pre>';
    return restore(html, store);
  }

  /** 把容器里的 $...$ / \\(...\\) 交给 KaTeX 排版；没加载 KaTeX 就静默跳过。 */
  function typesetMath(node) {
    const render = typeof globalThis !== 'undefined' ? globalThis.renderMathInElement : undefined;
    if (typeof render !== 'function') return false;
    try {
      render(node, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true },
        ],
        throwOnError: false,
        ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option'],
      });
      return true;
    } catch (e) {
      console.warn('[27thu] 公式渲染跳过：', e);
      return false;
    }
  }

  return { protect, restore, renderMarkdown, typesetMath, escapeHtml, escapeAttr };
});
