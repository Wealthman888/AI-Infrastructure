# AI Skills & Tools Catalog

A running list of notable open-source AI tools/skills worth evaluating for this infrastructure, sourced from Syntaix AI's tool roundups. Entries are filed into categories the way the **Container** app organizes a knowledge base (Resources / Ideas / Learnings), so the list stays scannable as it grows.

## Resources — Research & Internet Agents

### #1 — Last30Days-Skill (+12.4k stars) — **wired up: `.claude/skills/last30days`**
AI agent skill that researches any topic across Reddit, X (Twitter), YouTube, Hacker News, Polymarket, and the web, then synthesizes a grounded summary.
- Cross-platform research in one pass — no manual digging across six sources
- Output is a single grounded summary, not raw search results
- Real source: `mvanhorn/last30days-skill`, installed via the official `skills` CLI (`npx skills add mvanhorn/last30days-skill`) — fully self-contained, works as installed
- Use case: drop into an agent's skill set as a research partner

### #6 — Agent-Reach (+5.2k stars) — **wired up: `.claude/skills/agent-reach`**
Gives an AI agent internet access from a single CLI — Twitter/X, GitHub, Reddit, YouTube, Bilibili, news, and blogs.
- No API fees, no rate limits, free forever
- Real source: `Panniantong/agent-reach` (the likely original; several near-identical forks exist — installed from this one specifically), installed via `npx skills add Panniantong/agent-reach` — fully self-contained, works as installed
- Use case: pair with Last30Days-Skill when an agent needs raw source access instead of a pre-synthesized summary

## Resources — Paid Advertising Audit

### #11 — Claude-Ads (+6.5k stars) — **wired up: `.claude/skills/ads` + 22 sub-skills**
Multi-platform paid advertising audit & optimization skill: 250+ checks across Google, Meta, YouTube, LinkedIn, TikTok, Microsoft, Apple, and Amazon Ads, with weighted scoring, parallel subagents, 12 industry templates, AI creative generation, PPC math, A/B test design, and PDF report generation.
- Real source: `AgriciDaniel/claude-ads` (not a fork; 6.5k stars, 964 forks, MIT license, actively maintained). Note: the repo's own `plugin.json`/`marketplace.json`/`install.sh` point to `AI-Marketing-Hub/claude-ads`, which returns 404 on both the GitHub web UI and API — that org/repo doesn't currently exist publicly. Installed directly from the verified-working `AgriciDaniel/claude-ads` source instead (via `codeload.github.com` tarball, mirroring the career-ops workaround), bypassing the broken documented install path.
- Installed per the layout the repo's own `install.sh` specifies, scoped to this project instead of `~/.claude`: top-level router + 25 reference files at `.claude/skills/ads/`, each of the 22 `skills/ads-*` directories copied to its own `.claude/skills/ads-*/`, the 10 subagent definitions (6 audit + 4 creative) copied to `.claude/agents/`, and the Python helper scripts + `requirements.txt` copied to `.claude/skills/ads/scripts/`.
- `pip install -r .claude/skills/ads/requirements.txt` installs `requests`, `playwright`, `urllib3`, `Pillow`, `reportlab`, `matplotlib`. Same Playwright/Chromium revision mismatch as career-ops (pinned revision unavailable behind the sandboxed proxy) hit `analyze_landing.py` and `capture_screenshot.py`; patched both to accept `executable_path=os.environ.get("CLAUDE_ADS_CHROMIUM_PATH")`, pointed at the environment's pre-cached Chromium via `.claude/hooks/session-start.sh`. Verified with a direct `chromium.launch()` test — succeeds.
- `.claude/hooks/session-start.sh` now also runs the `ads` requirements install and exports `CLAUDE_ADS_CHROMIUM_PATH` every session, so it's ready with zero manual setup (mirrors the career-ops pattern).
- `/ads generate` and `/ads photoshoot` (AI ad image generation) additionally require the `banana` skill below — installed.
- Use case: drop an ad account export, pasted metrics, or a business description to run a multi-platform paid-advertising audit; `/ads audit` for the full parallel-subagent sweep, `/ads plan <industry>` for a strategic plan with industry-specific templates.

### #12 — Banana Claude (+767 stars) — **wired up: `.claude/skills/banana`**
AI image generation "Creative Director" powered by Google's Gemini Nano Banana models — interprets intent, selects domain expertise, constructs optimized prompts, and orchestrates Gemini for image generation/editing. This is the dependency `/ads generate` and `/ads photoshoot` need.
- Real source: `AgriciDaniel/banana-claude` (same author as claude-ads; not a fork, 767 stars, 153 forks, MIT license, verified via GitHub API). Installed directly from the verified GitHub source via `codeload.github.com` tarball, same as claude-ads.
- Installed per the repo's own `install.sh` layout, scoped to this project: `skills/banana/` (SKILL.md, `references/`, `scripts/`) copied to `.claude/skills/banana/`, and `agents/brief-constructor.md` copied to `.claude/agents/`.
- Pure Python stdlib — no pip dependencies, no Playwright/Chromium issue (the scripts hit Google's `generativelanguage.googleapis.com` REST API directly as a fallback when the MCP path isn't configured).
- **Not auto-configured — requires action from you**: the primary path runs through a third-party MCP server (`@ycse/nanobanana-mcp` via `npx`), wired in by `scripts/setup_mcp.py`, which writes your Google AI API key in plaintext into the *global* `~/.claude/settings.json` (not project-scoped) and registers an MCP server that auto-launches via `npx` on every Claude Code session. Because this needs a credential only you can provide and changes global (not project) config, it was deliberately left for you to run yourself: get a free key at https://aistudio.google.com/apikey, then run `/banana setup` in Claude Code.
- Use case: `/banana generate "<idea>"` for one-off images, `/banana batch` for variations, `/banana preset` for brand-consistent presets — or let `/ads generate` / `/ads photoshoot` drive it once `/banana setup` has been run.

## Resources — Knowledge Management

### #9 — Container (+4.3k stars)
"Second brain" tool that captures and auto-organizes content (links, docs, notes, images, videos) and lets you chat with your own saved data.
- Auto-organize + smart natural-language search + idea-linking across saved content
- 100% private, end-to-end; collaborate via shared containers
- Use case: this is the organizing pattern this catalog itself follows (capture → auto-categorize → searchable)

### #7 — Open-Notebook (+4.8k stars)
Open-source, self-hostable Jupyter alternative. Connects directly to PostgreSQL, MySQL, MongoDB, S3/MinIO, Snowflake, BigQuery, CSV/Parquet.
- Fully open source, lightweight, private by default
- Jupyter-compatible (`.ipynb` files work as-is)
- Use case: candidate for ad-hoc data exploration against the data sources this infra already touches

## Ideas — Productivity Copilots

### #10 — PM-Skills (+3.9k stars)
Open-source copilot covering the full product manager workflow: idea-to-plan, PRD writing, user research, market analysis, requirements, prioritization, roadmap building, stakeholder comms, experiment design, interview prep.
- Ships built-in frameworks: RICE, AARRR, JTBD, SWOT, S.W.A.N, KANO
- Use case: useful if this repo starts generating PRDs/roadmaps for agent features

### #8 — Career-Ops (+4.7k stars) — **wired up: `.claude/skills/career-ops`**
End-to-end automated job-search agent: finds jobs across 1000+ sources, tailors resumes per role, auto-applies, tracks progress, sends AI-written follow-ups, and preps interview Q&A.
- Free and open source, zero manual hassle once configured
- Real source: `santifer/career-ops` — a full Node.js app (Playwright automation, PDF/LaTeX generation, tracker dashboard), not a thin portable skill, so the official `skills` CLI only pulled the router `SKILL.md` and left it non-functional. Fixed by fully cloning the upstream repo (via `codeload.github.com` tarball, since the git proxy only permits this repo) into `.claude/skills/career-ops/` so `modes/*.md`, `data/`, and the root-level `.mjs` scripts (`generate-pdf.mjs`, `scan.mjs`, `check-liveness.mjs`, etc.) all exist as the siblings the router expects, then copying the nested `.agents/skills/career-ops/SKILL.md` up to the top level so Claude Code's skill loader finds it
- `npm install` installs `@google/generative-ai`, `dotenv`, `js-yaml`, `playwright`. The pinned Playwright Chromium revision can't download in this sandboxed environment (proxy blocks `cdn.playwright.dev`), so `check-liveness.mjs`, `doctor.mjs`, `generate-pdf.mjs`, `liveness-browser.mjs`, `scan-ats-full.mjs`, and `scan.mjs` were patched to fall back to `executablePath: process.env.CAREER_OPS_CHROMIUM_PATH`, pointed at the environment's pre-cached Chromium (`/opt/pw-browsers/chromium`) via `.claude/hooks/session-start.sh`. Verified working with `node doctor.mjs` (`✓ Playwright chromium installed`). Note: this patch lives in upstream "system layer" files, so re-running `node update-system.mjs apply` will overwrite it — reapply if that happens.
- `node_modules/` is gitignored; `.claude/hooks/session-start.sh` now runs `npm install` for career-ops every session so it's ready with zero manual setup
- First use still requires onboarding (CV, profile, target roles — see the skill's own onboarding flow) before evaluations/scans will run
- Use case: drop a job posting URL or paste a JD to run the full evaluation pipeline; `tracker`/`oferta`/`deep`/`pdf` etc. work without Playwright, `scan`/`apply`/`pdf` rely on the patched Chromium path above

## Learnings — Developer Utilities

### #5 — MarkItDown (+7.3k stars) — **wired up: `.claude/skills/markitdown`**
Microsoft's open-source tool for converting files (PDF, Word, Excel, PowerPoint, plain text, and more) to clean, structured Markdown.
- `pip install markitdown` — CLI or Python library
- Markdown output is AI/RAG-friendly and removes formatting noise
- Auto-installed every session via `.claude/hooks/session-start.sh`; just ask Claude to convert a file, no setup
- Use case: good fit for any `tools/` wrapper that needs to feed documents into an agent's context

---

**Categorization key** (mirrors Container's knowledge-base folders):
- **Resources** — tools an agent or pipeline could use directly
- **Ideas** — copilots/workflows worth prototyping
- **Learnings** — utilities worth knowing about for future tool wrappers

When a tool from this list gets adopted, move its write-up into `tools/` (per `CLAUDE.md`'s directory layout) and link back to this entry instead of duplicating the description.
