# AI Skills & Tools Catalog

A running list of notable open-source AI tools/skills worth evaluating for this infrastructure, sourced from Syntaix AI's tool roundups. Entries are filed into categories the way the **Container** app organizes a knowledge base (Resources / Ideas / Learnings), so the list stays scannable as it grows.

## Resources — Research & Internet Agents

### #1 — Last30Days-Skill (+12.4k stars)
AI agent skill that researches any topic across Reddit, X (Twitter), YouTube, Hacker News, Polymarket, and the web, then synthesizes a grounded summary.
- Cross-platform research in one pass — no manual digging across six sources
- Output is a single grounded summary, not raw search results
- Use case: drop into an agent's skill set as a research partner

### #6 — Agent-Reach (+5.2k stars)
Gives an AI agent internet access from a single CLI — Twitter/X, GitHub, Reddit, YouTube, Bilibili, news, and blogs.
- No API fees, no rate limits, free forever
- Use case: pair with Last30Days-Skill when an agent needs raw source access instead of a pre-synthesized summary

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

### #8 — Career-Ops (+4.7k stars)
End-to-end automated job-search agent: finds jobs across 1000+ sources, tailors resumes per role, auto-applies, tracks progress, sends AI-written follow-ups, and preps interview Q&A.
- Free and open source, zero manual hassle once configured
- Use case: less relevant to this infra's purpose (agent/automation backend), kept for reference only

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
