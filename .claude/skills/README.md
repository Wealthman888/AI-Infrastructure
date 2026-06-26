# Skills Index

Quick reference for every skill installed in this repo and how to call it. See `SKILLS-CATALOG.md` (repo root) for discovery notes, source links, and install/wiring details.

## Slash-command skills

| Skill | Call it with | What it does |
|---|---|---|
| career-ops | `/career-ops [mode]` — bare for menu, or `scan`/`pdf`/`latex`/`cover`/`oferta`/`ofertas`/`apply`/`batch`/`tracker`/`pipeline`/`contacto`/`training`/`project`/`interview-prep`/`interview`/`patterns`/`followup`/`update`/`deep`/`eu-swe`, or paste a JD/URL directly | AI job-search command center: evaluate offers, generate CVs, scan portals, track applications |
| last30days | `/last30days <topic>` | Cross-platform research (Reddit, X, YouTube, TikTok, HN, Polymarket, GitHub, web) on what people are saying about a topic right now |
| market | `/market <subcommand> <url/topic>` | Marketing suite orchestrator — routes to the 14 sub-skills below |
| market audit | `/market audit <url>` | Full marketing audit via 5 parallel subagents → `MARKETING-AUDIT.md` |
| market quick | `/market quick <url>` | 60-second marketing snapshot to terminal |
| market copy | `/market copy <url>` | Copy analysis + optimized rewrites → `COPY-SUGGESTIONS.md` |
| market emails | `/market emails <topic/url>` | Email sequence generator → `EMAIL-SEQUENCES.md` |
| market social | `/market social <topic/url>` | 30-day social content calendar → `SOCIAL-CALENDAR.md` |
| market ads | `/market ads <url>` | Ad creative + copy across platforms → `AD-CAMPAIGNS.md` |
| market funnel | `/market funnel <url>` | Sales funnel analysis/optimization → `FUNNEL-ANALYSIS.md` |
| market competitors | `/market competitors <url>` | Competitive intelligence → `COMPETITOR-REPORT.md` |
| market landing | `/market landing <url>` | Landing page CRO teardown → `LANDING-CRO.md` |
| market launch | `/market launch <product>` | Week-by-week launch playbook → `LAUNCH-PLAYBOOK.md` |
| market proposal | `/market proposal <client>` | Client-ready marketing services proposal → `CLIENT-PROPOSAL.md` |
| market report | `/market report <url>` | Compiled marketing report (Markdown) → `MARKETING-REPORT.md` |
| market report-pdf | `/market report-pdf <url>` | Compiled marketing report (PDF) → `MARKETING-REPORT.pdf` |
| market seo | `/market seo <url>` | SEO content audit → `SEO-AUDIT.md` |
| market brand | `/market brand <url>` | Brand voice analysis + guidelines → `BRAND-VOICE.md` |

## Auto-triggered skills (no slash command — describe what you want)

| Skill | Triggers on | What it does |
|---|---|---|
| agent-reach | "research X", "look up X", or pasting a URL (Twitter/X, GitHub, Reddit, YouTube, Bilibili, LinkedIn, news, blogs) | Internet access from a single CLI, no API fees |
| markitdown | "convert this PDF/DOCX/XLSX/PPTX to markdown" | Converts documents to clean Markdown (Microsoft's `markitdown`) |
| media-gen | "generate an image/video of...", "upscale this clip" | Image/video generation + upscaling via Fal.ai |
| 3d-web-experience | Three.js / React Three Fiber / WebGL / 3D web work | Expert guidance for building 3D web experiences |

## Not currently active

| Skill | Status |
|---|---|
| sales-coaching.skill | Packaged `.skill` zip archive — not unpacked into a `SKILL.md` directory, so it won't show up as invocable until extracted |

## Global Claude Code skills (not installed here, ship with Claude Code itself)

`/init`, `/run`, `/review`, `/code-review`, `/simplify`, `/loop`, `/security-review`, `claude-api` (auto-triggered Anthropic API reference), `update-config`, `keybindings-help`, `fewer-permission-prompts`, `verify`, `session-start-hook`.
