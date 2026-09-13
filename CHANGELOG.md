# Changelog

本项目的所有重要变更都记录在这里。
格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### 新增

- `tools/privacy-scan.mjs`：零依赖隐私扫描器。两档判定——`HARD`（密钥形状、私钥块、硬编码口令、中国大陆手机号与身份证号、非 noreply 邮箱、敏感文件名、超过 1 MiB 的文件）直接阻断 CI；`WARN`（个人家目录绝对路径）只提示不阻断。命中值强制脱敏（只留前 4 字符），支持行内 `privacy-scan-allow:` 例外声明，`--history` 可扫 git 全历史、专抓「提交后又删掉」的内容
- `.github/workflows/privacy-scan.yml`：push `main` 与所有 PR 自动扫描（`fetch-depth: 0` 以覆盖完整历史）
- `npm run privacy` 脚本，并纳入 `npm run verify`
- `CLAUDE.md` 新增「隐私扫描」章节：两档判定、扫描范围、脱敏要求、例外策略、改规则的先后顺序

### 变更

- 双语 README 补充隐私扫描说明与目录结构条目

## [1.0.0] - 2026-09-12

### 新增

- `tech/` 技巧库骨架：`_template.md` 模板 + 首条示例技巧 `01-特殊值代入法.md`
- 三档验证状态体系（⚪ 未验证 / 🟡 模拟考验证 / 🟢 真题验证），每档标明能否用于高考
- `tools/build-index.mjs`：从 `tech/*.md` 唯一推导 `tech/README.md` 索引、站点数据与 markdown 副本，`--check` 可做 CI 校验
- `tools/serve.mjs`：零依赖本地预览服务器（`npm run serve`）
- `site/` 静态站点：列表 + 搜索 + 状态筛选 + 客户端 markdown 渲染（marked）+ 公式渲染（KaTeX），全部本地内置，不依赖 CDN
- `CLAUDE.md` 项目规则：定位、核心原则、目录约定、新增技巧流程、部署约定
- GitHub Actions 自动部署到 Cloudflare Pages（项目 `27thu`）
- 双语 README：`README.md`（中文主）+ `README_en.md`
- `LICENSE`：CC BY-NC-SA 4.0

[1.0.0]: https://github.com/kuangketongxue/gaokao-shortcuts/releases/tag/v1.0.0
