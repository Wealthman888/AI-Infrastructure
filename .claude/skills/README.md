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
| ads | `/ads <subcommand>` | Paid-advertising audit suite orchestrator — routes to the 22 sub-skills below |
| ads audit | `/ads audit` | Full multi-platform audit via 6 parallel subagents, 0-100 health score |
| ads google | `/ads google` | Google Ads deep analysis (Search, PMax, AI Max, Display, YouTube, Demand Gen) |
| ads meta | `/ads meta` | Meta Ads deep analysis (FB, IG, Threads, Advantage+) |
| ads youtube | `/ads youtube` | YouTube Ads specific analysis |
| ads linkedin | `/ads linkedin` | LinkedIn Ads deep analysis (B2B, Lead Gen, ABM) |
| ads tiktok | `/ads tiktok` | TikTok Ads deep analysis (Creative, Shop, Smart+) |
| ads microsoft | `/ads microsoft` | Microsoft/Bing Ads deep analysis (Copilot, Import) |
| ads apple | `/ads apple` | Apple Search Ads deep analysis (AdAttributionKit, CPPs) |
| ads amazon | `/ads amazon` | Amazon Ads deep analysis (Sponsored Products/Brands/Display, ACOS/TACOS) |
| ads attribution | `/ads attribution` | Cross-platform attribution audit (AAK, GA4, Consent Mode V2, MMP) |
| ads tracking | `/ads tracking` | Server-side tracking pipeline audit (sGTM, CAPI Gateway) |
| ads creative | `/ads creative` | Cross-platform creative quality + fatigue audit |
| ads landing | `/ads landing` | Landing page quality assessment for ad campaigns |
| ads budget | `/ads budget` | Budget allocation and bidding strategy review |
| ads plan | `/ads plan <industry>` | Strategic ad plan from 12 industry templates |
| ads competitor | `/ads competitor` | Competitor ad intelligence (Meta Ad Library, Google Transparency Center) |
| ads math | `/ads math` | PPC financial calculator (CPA, ROAS, break-even, MER) |
| ads test | `/ads test` | A/B test design (hypothesis, significance, sample size) |
| ads report | `/ads report` | PDF audit report generation for client deliverables |
| ads dna | `/ads dna <url>` | Extract brand DNA from a website → `brand-profile.json` |
| ads create | `/ads create` | Campaign concepts + copy briefs → `campaign-brief.md` |
| ads generate | `/ads generate` | AI ad image generation from brief — requires `/banana setup` first (see below) |
| ads photoshoot | `/ads photoshoot` | Product photography in 5 styles — requires `/banana setup` first (see below) |
| banana | `/banana [generate\|edit\|chat\|inspire\|batch\|setup\|preset\|cost] <idea/path>` | AI image generation via Gemini Nano Banana — run `/banana setup` once with a free key from aistudio.google.com/apikey before first use |

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
