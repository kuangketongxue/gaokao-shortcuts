# gaokao-shortcuts 项目规则

> 这是本仓库的 `CLAUDE.md`。**改规矩先改这里，再改实践**，不要反过来。

## 一句话定位

高考选填题抢分技巧的公开共创知识库：markdown 即内容，GitHub 即仓库，`27thu.pages.dev` 即阅读门面。

## 核心原则

- **全科全适**：所有技巧都是通用方法，**不分科、不分题型、不分范围**。任何学科同等适用，全员共享。
- **验证至上**：每条技巧必须标注验证状态，状态决定可信度。
  - `未验证` —— 纸面推导，未在实战中试过 → **考前不要用**
  - `模拟考验证` —— 已在模拟考中验证适用 → **谨慎用**
  - `真题验证` —— 已在历年真题中验证适用 → **可以用**
- **验证场景要具体**：写清是哪次模考、哪年真题、哪道题（如 `2023 全国甲卷第 12 题`），便于复核。
- **正文克制**：核心逻辑简述 < 150 字，只讲方法怎么用，不写大段学科背景。
- **基础优先**：技巧是辅助，**不替代对底层核心概念的扎实理解**。这条是仓库的红线，README 与站点均须保留免责声明。

## 目录结构

```
tech/                        <- 全部技巧（扁平列表，靠标题 + 验证状态筛选）
  README.md                  <- 索引【自动生成，不要手改】
  _template.md               <- 新建技巧的模板
  NN-方法名.md               <- 一条技巧一个文件
site/                        <- Cloudflare Pages 部署目录（纯静态，无构建）
  index.html / style.css / app.js
  vendor/                    <- marked + KaTeX，本地内置，不依赖 CDN
  tech/                      <- 【构建产物】tech/*.md 的副本，不要提交
  data/index.json            <- 【构建产物】技巧索引，不要提交
tools/build-index.mjs        <- 唯一的构建脚本：扫 tech/ -> 索引 + 站点数据
tools/serve.mjs              <- 零依赖本地预览服务器
tools/privacy-scan.mjs       <- 唯一的隐私扫描器：密钥 / 个人信息 / 大文件
.github/workflows/deploy.yml <- CI：构建 + 部署到 Cloudflare Pages
.github/workflows/privacy-scan.yml <- CI：隐私扫描（HARD 即红）
CLAUDE.md / README.md / LICENSE / CHANGELOG.md
```

## 命名与序号约定

- 文件名：`tech/NN-方法名.md`，`NN` 为两位序号（`01`、`02`…）。
- 序号**接现有最大值 +1，不复用已删序号**——保证历史 PR / issue 里的编号永远指得向同一条技巧。
- 方法名用中文短语，不用标点，不含空格。

## 新增一条技巧的流程

```bash
cp tech/_template.md tech/03-你的方法名.md   # 1. 复制模板，改序号和名字
# 2. 填标题 / 验证 / 一句话概括 / 方法详解 / 最小例题 / 备注
npm run index                                # 3. 重建索引（自动刷新 tech/README.md）
npm run serve                                # 4. 本地预览 http://localhost:8788
```

然后提交 PR。标题简洁，验证状态必须真实——**不要没验过就标「真题验证」**，这是本仓库唯一的信誉来源。

## 自动生成的边界

- `tech/README.md`：由 `tools/build-index.mjs` 依据 `tech/*.md` 生成。**手改会被下一次构建覆盖**，要改索引就改脚本。
- `site/tech/`、`site/data/index.json`：构建产物，已在 `.gitignore` 中，不提交、不进 CI 缓存。
- 事实性的东西（有几条技巧、什么状态）一律从文件推导，不手写第二处真相。

## 部署约定

- **不在本地跑 wrangler**。中国网络下 `npx wrangler` 首次拉依赖 100MB+ 会挂死（实测 13 分钟无果）。
- 部署一律走 **GitHub Actions**：push `main` → `node tools/build-index.mjs` → `npx wrangler@latest pages deploy site --project-name=27thu`。
- Pages 项目名固定为 `27thu`，线上域名 `https://27thu.pages.dev`。
- CI 需要仓库 secret `CLOUDFLARE_API_TOKEN`。设置方式（token 只走 stdin，不进 argv）：
  `cat <tokenfile> | gh secret set CLOUDFLARE_API_TOKEN --repo kuangketongxue/gaokao-shortcuts`
- 首次部署前必须 `wrangler pages project create 27thu || true`——`pages deploy` **不会**自动建项目。

## 隐私扫描（CI 强制）

本仓库是**公开仓库**，隐私靠机制兜底，不靠自觉。`tools/privacy-scan.mjs` 是唯一的扫描器：本地 `npm run privacy`，CI 走 `privacy-scan.yml`（push `main` 与每个 PR 必跑）。

**两档判定**：

- `HARD` —— 直接红灯、阻断合并。覆盖：密钥形状（GitHub / Cloudflare / AWS / Google / Slack / `sk-` 前缀）、私钥块、硬编码口令、中国大陆手机号与身份证号、非 noreply 的邮箱地址、敏感文件名（`.env` / `*.pem` / `*.key` / `id_rsa*` / `*.enc` 等）、超过 1 MiB 的文件。
- `WARN` —— 只提示不阻断，由 reviewer 判断。目前只有一项：个人家目录绝对路径（`C:\Users\<name>`、`/home/<name>`、`/Users/<name>`）。

**扫描范围**：全部文本文件。排除 `site/vendor/**`（第三方 pinned 资源）、`site/tech/**` 与 `site/data/**`（构建产物）、`node_modules/`、`.git/`。

**脱敏是硬性的**：命中值只输出前 4 个字符。完整命中值禁止打进 CI 日志——否则扫描日志本身就变成新的泄漏点。

**例外必须就地声明并写理由**。在命中行或它的上一行写：

```
privacy-scan-allow: <规则名> — <理由>      # 规则名可用 * 通配
```

默认不加例外。加例外等于一次公开的自我豁免，理由要经得起别人看。

**`--history` 扫 git 全历史**（CI 用 `fetch-depth: 0`），只报告「工作区里已经不存在、但历史里还在」的命中。意思是：**删除提交掩盖不了泄漏，删了照样得轮换令牌**。

改规则先改本节，再改 `tools/privacy-scan.mjs`。

## 网络与操作约定

- **git push（github.com:443）在国内常连不上，api.github.com 稳定。** push 报 `Failed to connect` 就走 gh API 推文件，别死磕重试。
- 本机 SSH 已配 `github.com -> ssh.github.com:443`，`git push` 走 SSH 可用；https 不通时优先换 SSH 地址。
- 详情见维护者本地 `~/.claude/github-playbook.md`。
- **隐私红线**：技巧库是公开仓库，任何 token / 密钥 / 个人成绩数据一律不进本仓库。这条由 `tools/privacy-scan.mjs` + `privacy-scan.yml` 强制，详见上文「隐私扫描」一节。
