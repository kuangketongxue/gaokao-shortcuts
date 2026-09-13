<div align="center">
  <h1>高考提分技巧速查</h1>
  <p><strong>通用方法 · 特殊技巧 · 二级结论 · 秒杀套路 —— 每条自带验证状态</strong></p>
</div>

<p align="center">
  <a href="https://github.com/kuangketongxue/gaokao-shortcuts/releases"><img src="https://img.shields.io/github/v/release/kuangketongxue/gaokao-shortcuts?label=release&color=blue" alt="release"></a>
  <a href="https://github.com/kuangketongxue/gaokao-shortcuts/stargazers"><img src="https://img.shields.io/github/stars/kuangketongxue/gaokao-shortcuts?style=flat&logo=github&color=yellow" alt="stars"></a>
  <a href="https://github.com/kuangketongxue/gaokao-shortcuts/forks"><img src="https://img.shields.io/github/forks/kuangketongxue/gaokao-shortcuts?style=flat&logo=github" alt="forks"></a>
  <a href="https://github.com/kuangketongxue/gaokao-shortcuts/issues"><img src="https://img.shields.io/github/issues/kuangketongxue/gaokao-shortcuts?style=flat&logo=github" alt="issues"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/kuangketongxue/gaokao-shortcuts?color=green" alt="license"></a>
  <a href="CHANGELOG.md"><img src="https://img.shields.io/badge/changelog-Keep%20a%20Changelog-orange" alt="changelog"></a>
  <a href="https://27thu.pages.dev"><img src="https://img.shields.io/badge/site-27thu.pages.dev-2f5bd7" alt="website"></a>
</p>

<br/>

<p align="center">
  🌐 <b>简体中文</b> · <a href="README_en.md">English</a> ·
  <a href="https://27thu.pages.dev">在线速查</a> ·
  <a href="tech/README.md">技巧索引</a> ·
  <a href="#contributing">贡献一条</a>
</p>

<br/>

<a id="about"></a>

## 关于

做题的时候你大概遇到过这两种时刻：

**一种是选填题算太久。** 明明有更快的路，但想不起来、或者不敢用，只能老老实实把式子推到底，一道题吃掉八分钟。

**另一种是大题卡住了。** 思路断在中间，最后只能写个「由题意得」然后空着，白丢步骤分。

这个仓库只解决这两件事：把**抢时间的方法**和**蹭步骤分的套路**攒成一份能查的手册。它不是知识点讲义，也不打算替代课本——它是你上场前扫一眼的那张牌。

**为什么每条都要标验证状态**：技巧是有风险的。同一个方法，老师讲、教辅写、你自己推，可信度完全不同。一个没验过的技巧在考场上翻车，比不会做更亏——因为你已经为它算了一半的时间。所以每条技巧都强制标注它到底在哪被验证过：

| 标记 | 验证状态 | 含义 | 能不能用 |
|---|---|---|---|
| 🟢 | `真题验证` | 在历年真题中验证过适用 | **可以用** |
| 🟡 | `模拟考验证` | 在模拟考中验证过适用 | 谨慎用 |
| ⚪ | `未验证` | 仅纸面推导，未实战 | **考前不要用** |

| 状态 | 说明 |
|---|---|
| 当前版本 | v1.0.0（见 [Releases](https://github.com/kuangketongxue/gaokao-shortcuts/releases)） |
| 在线站点 | https://27thu.pages.dev |
| 主题标签 | `gaokao` · `highschool` · `study-notes` · `learning-resources` |
| 开源协议 | CC BY-NC-SA 4.0（非商业使用） |

> ### ⚠️ 免责声明
>
> 本仓库收录的「特殊技巧」「二级结论」「秒杀套路」，用途是**选填题抢时间**或**大题卡壳时骗分**。
>
> 🔴 **基础不牢，地动山摇 —— 切勿用奇技淫巧替代对底层核心概念的扎实理解。**
>
> 请先在平时模拟考中验证适用性，再用于高考。

<p align="right">(<a href="#about">回到顶部</a>)</p>

<a id="getting-started"></a>

## 快速开始

### 只想知道有哪些技巧

打开 **[27thu.pages.dev](https://27thu.pages.dev)**，支持搜索和按验证状态筛选。或者直接看 [`tech/README.md`](tech/README.md) 索引（自动生成，永远和文件同步）。

### 想贡献一条技巧

```bash
git clone git@github.com:kuangketongxue/gaokao-shortcuts.git
cd gaokao-shortcuts
cp tech/_template.md tech/03-你的方法名.md   # 序号接现有最大值 +1
npm run index                                # 重建索引
npm run serve                                # 本地预览 http://localhost:8788
```

零依赖——不需要 `npm install`，用的都是 Node 内置模块。

<p align="right">(<a href="#getting-started">回到顶部</a>)</p>

<a id="usage"></a>

## 一条技巧长什么样

每条技巧就是一个 `.md` 文件，六个字段缺一不可：

```markdown
# 03-方法名

## 验证
| 字段 | 值 |
|---|---|
| 验证状态 | 未验证 / 模拟考验证 / 真题验证 |
| 验证场景 | 2023 全国甲卷第 12 题 / 2026-05 市一模第 8 题 |

## 一句话概括      （什么时候用、核心思路，≤30 字）
## 方法详解        （技巧本身，公式用 $...$ / $$...$$）
## 最小例题        （一个能体现它的例题 + 简明解答）
## 备注            （限制条件、易错点、何时不能用）
```

**两条硬规矩**：

1. **不分科**——技巧要么是全科通用的方法，要么不收。这个仓库不做「数学专题」「英语模板」。
2. **验证状态必须真实**——没验过就写 `未验证`。这是本仓库唯一的信誉来源，标错一次整份手册就废了。

<p align="right">(<a href="#usage">回到顶部</a>)</p>

<a id="structure"></a>

## 目录结构

```
tech/                        ← 全部技巧（一条一个 .md），唯一的内容真相
  README.md                  ← 索引【自动生成，手改会被覆盖】
  _template.md               ← 新建技巧从这里复制
site/                        ← 静态站点，部署到 Cloudflare Pages
tools/build-index.mjs        ← 唯一构建步骤：扫 tech/ → 索引 + 站点数据
tools/serve.mjs              ← 零依赖本地预览服务器
tools/privacy-scan.mjs       ← 隐私扫描：密钥 / 个人信息 / 大文件
.github/workflows/deploy.yml ← push main 即自动部署
.github/workflows/privacy-scan.yml ← push main 与 PR 自动做隐私扫描
CLAUDE.md                    ← 项目规则（改规矩先改这里）
```

`tech/README.md` 和站点数据都是从 `tech/*.md` **推导**出来的，不存在「文档和实际对不上」的情况。CI 会在索引漂移时直接红灯。

仓库是公开的，所以「不泄漏隐私」也做成了机制而不是口号：每次 push 和每个 PR 都会跑 `tools/privacy-scan.mjs`，密钥、私钥、手机号、身份证号、非 noreply 邮箱、敏感文件名一律阻断合并（本地可用 `npm run privacy` 先自查）。详细规则见 [`CLAUDE.md`](CLAUDE.md) 的「隐私扫描」一节。

<p align="right">(<a href="#structure">回到顶部</a>)</p>

<a id="roadmap"></a>

## 路线图

- [x] 技巧库骨架 + 模板 + 首条示例
- [x] 自动生成的索引与索引漂移校验
- [x] 在线速查站（搜索 / 状态筛选 / 公式渲染）
- [ ] 攒够 10 条真题验证过的技巧
- [ ] 按「使用时机」分类视图（开考 5 分钟 / 卡壳时 / 检查阶段）
- [ ] 每条技巧附一致性与反例说明

已发布内容见 [CHANGELOG.md](CHANGELOG.md)。

<p align="right">(<a href="#roadmap">回到顶部</a>)</p>

<a id="contributing"></a>

## 参与贡献

**最需要的贡献不是代码，是技巧。** 你在模考或真题里用过、真的省下时间的招，就是最有价值的 PR。

1. Fork 本仓库
2. 建分支 (`git checkout -b add/你的技巧名`)
3. 从 `tech/_template.md` 复制新建，跑 `npm run index`
4. 提交 (`git commit -m 'add: 你的技巧名'`)
5. 发起 Pull Request

**别做的事**：不要手改 `tech/README.md`（会覆盖）；不要标着 `真题验证` 却没真验过；不要提交任何个人成绩、准考证号等隐私数据——这条有 CI 兜着，`privacy-scan` 会直接拦下来。

### 贡献者

<a href="https://github.com/kuangketongxue/gaokao-shortcuts/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=kuangketongxue/gaokao-shortcuts" alt="contributors" />
</a>

<p align="right">(<a href="#contributing">回到顶部</a>)</p>

<a id="license"></a>

## 开源协议

本仓库内容采用 **[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)**：

| 条款 | 含义 |
|---|---|
| **BY** 署名 | 需注明原作者与来源 |
| **NC** 非商业 | 不得用于商业目的 |
| **SA** 相同方式共享 | 演绎作品须以相同协议发布 |

详见 [`LICENSE`](LICENSE)。

<p align="right">(<a href="#license">回到顶部</a>)</p>

<a id="acknowledgments"></a>

## 致谢

- 站点渲染：[marked](https://github.com/markedjs/marked)（MIT）+ [KaTeX](https://katex.org/)（MIT），均已本地内置，不依赖 CDN
- 部署：[Cloudflare Pages](https://pages.cloudflare.com/)
- 每一条验证过的技巧，都来自用过它的人

<div align="center">
  <b>如果这份手册帮你省下过几分钟，欢迎点个 ⭐。</b>
</div>

<a id="star-history"></a>

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=kuangketongxue/gaokao-shortcuts&type=Date)](https://star-history.com/#kuangketongxue/gaokao-shortcuts&Date)
