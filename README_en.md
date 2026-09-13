<div align="center">
  <h1>Gaokao Exam Shortcuts</h1>
  <p><strong>Universal methods · special techniques · secondary results · speed tricks — every entry carries a verification status</strong></p>
</div>

<p align="center">
  <a href="https://github.com/kuangketongxue/gaokao-shortcuts/releases"><img src="https://img.shields.io/github/v/release/kuangketongxue/gaokao-shortcuts?label=release&color=blue" alt="release"></a>
  <a href="https://github.com/kuangketongxue/gaokao-shortcuts/stargazers"><img src="https://img.shields.io/github/stars/kuangketongxue/gaokao-shortcuts?style=flat&logo=github&color=yellow" alt="stars"></a>
  <a href="https://github.com/kuangketongxue/gaokao-shortcuts/forks"><img src="https://img.shields.io/github/forks/kuangketongxue/gaokao-shortcuts?style=flat&logo=github" alt="forks"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/kuangketongxue/gaokao-shortcuts?color=green" alt="license"></a>
  <a href="https://27thu.pages.dev"><img src="https://img.shields.io/badge/site-27thu.pages.dev-2f5bd7" alt="website"></a>
</p>

<br/>

<p align="center">
  🌐 <a href="README.md">简体中文</a> · <b>English</b> ·
  <a href="https://27thu.pages.dev">Live site</a> ·
  <a href="tech/README.md">Index</a>
</p>

<br/>

## What this is

A community-maintained handbook of **exam-taking shortcuts** for the Chinese Gaokao: fast methods for multiple-choice and fill-in-the-blank questions, plus ways to salvage partial credit when you get stuck on a longer problem.

It is **not** a textbook or a substitute for understanding the underlying concepts. It is the card you glance at before walking into the exam hall.

**Every entry declares how far it has been verified.** A shortcut that was never tested can cost you more than not knowing it at all — you've already spent half the time budget on it before it fails.

| Mark | Status | Meaning | Safe to use? |
|---|---|---|---|
| 🟢 | `真题验证` | Verified against past exam papers | **Yes** |
| 🟡 | `模拟考验证` | Verified under mock-exam conditions | Use with care |
| ⚪ | `未验证` | Derived on paper, never tested | **No** |

> ### ⚠️ Disclaimer
>
> Shortcuts here exist to **save time on objective questions** or **salvage partial credit** — nothing more.
>
> 🔴 **Weak fundamentals collapse everything. Do not let clever tricks replace a solid grasp of core concepts.**
>
> Always validate a technique under mock-exam conditions before relying on it.

| | |
|---|---|
| Version | v1.0.0 ([Releases](https://github.com/kuangketongxue/gaokao-shortcuts/releases)) |
| Live site | https://27thu.pages.dev |
| Topics | `gaokao` · `highschool` · `study-notes` · `learning-resources` |
| License | CC BY-NC-SA 4.0 (non-commercial) |

## Quick start

```bash
git clone git@github.com:kuangketongxue/gaokao-shortcuts.git
cd gaokao-shortcuts
cp tech/_template.md tech/03-your-method.md   # next number after the current max
npm run index                                  # rebuild the index
npm run serve                                  # preview at http://localhost:8788
```

Zero dependencies — everything runs on Node's standard library, no `npm install` needed.

## Anatomy of an entry

One technique = one `.md` file under `tech/`, with six required sections: `验证` (verification), `一句话概括` (one-line summary), `方法详解` (the method), `最小例题` (minimal worked example), `备注` (caveats).

Two hard rules:

1. **Subject-agnostic.** A technique is either universally applicable or it doesn't belong here.
2. **Verification status must be honest.** Never mark `真题验证` without actually verifying it. This is the repo's only source of credibility.

## Project layout

```
tech/                        ← all techniques (.md), the single source of truth
  README.md                  ← index [auto-generated — manual edits are overwritten]
site/                        ← static site deployed to Cloudflare Pages
tools/build-index.mjs        ← the only build step: tech/ → index + site data
tools/serve.mjs              ← zero-dependency local preview server
tools/privacy-scan.mjs       ← privacy scan: secrets / personal data / large files
.github/workflows/deploy.yml ← deploys on every push to main
.github/workflows/privacy-scan.yml ← privacy scan on every push and PR
CLAUDE.md                    ← project rules (Chinese)
```

The index and the site data are **derived** from `tech/*.md`, so docs can never drift from reality — CI fails the build when the committed index is stale.

This is a public repo, so "don't leak anything" is enforced by a mechanism, not by good intentions. Every push and every PR runs `tools/privacy-scan.mjs`: tokens, private keys, phone numbers, national ID numbers, non-noreply email addresses and sensitive filenames all block the merge. Run `npm run privacy` to check locally before pushing. Full rules live in the 「隐私扫描」section of [`CLAUDE.md`](CLAUDE.md).

## Contributing

**The contribution we need most is not code — it's techniques.** Something you actually used in a mock exam or a past paper and that genuinely saved you time is the most valuable PR.

1. Fork this repo
2. `git checkout -b add/your-technique`
3. Copy `tech/_template.md`, fill it in, run `npm run index`
4. Commit and open a Pull Request

**Please don't**: hand-edit `tech/README.md` (it gets overwritten), claim `真题验证` without verifying, or commit any personal data — CI's `privacy-scan` will block it anyway.

## License

Content is released under **[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)** — attribution required, non-commercial only, derivatives under the same license. See [`LICENSE`](LICENSE).

## Acknowledgments

- Rendering: [marked](https://github.com/markedjs/marked) (MIT) + [KaTeX](https://katex.org/) (MIT), vendored locally — no CDN dependency
- Hosting: [Cloudflare Pages](https://pages.cloudflare.com/)

<div align="center">
  <b>If this handbook ever saved you a few minutes, a ⭐ is appreciated.</b>
</div>
