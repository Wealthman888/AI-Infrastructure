---
name: "council"
description: "Convene the operator council — CEO, CFO, CMO, CTO, COO, and General Counsel operator agents facilitated by the Chief of Staff — on a business decision. Runs isolated parallel deliberation, adversarial critique, and synthesis into a decision memo logged in council/decisions/. Use when the user invokes /council, asks to 'convene the council', 'ask the team', 'run this by the operators', or wants multi-perspective executive input on a strategic, financial, marketing, technical, operational, or legal question."
license: MIT
metadata:
  version: 1.0.0
  category: orchestration
  domain: operator-council
  depends-on: board-meeting, agent-protocol, chief-of-staff
---

# Operator Council

Convene this repo's operator agents on a decision. Repo-local adaptation of the
`board-meeting` 6-phase protocol: subagents run the seats, the Chief of Staff
synthesizes, and decisions are logged **inside this repository** (not `~/.claude/`).

## Invoke

`/council [question]` — e.g. `/council Should we raise prices 20% for GemLabs in Q4?`

If no question is given, ask for one. One question per sitting.

## The Operators (seats)

Each seat is an installed subagent in `.claude/agents/` backed by a skill in `.claude/skills/`:

| Seat | Agent | Skill | Lens |
|------|-------|-------|------|
| CEO | `cs-ceo-advisor` | `ceo-advisor` | Strategy, vision, stakeholders |
| CFO | `cs-cfo-advisor` | `cfo-advisor` | Runway, unit economics, the math |
| CMO | `cs-cmo-advisor` | `cmo-advisor` | Positioning, growth model, channels |
| CTO | `cs-cto-advisor` | `cto-advisor` | Architecture, tech debt, eng capacity |
| COO | `cs-coo-advisor` | `coo-advisor` | Process, execution, operational load |
| GC | `cs-general-counsel-advisor` | `general-counsel-advisor` | Contracts, IP, regulatory exposure |
| Chair | `cs-chief-of-staff` | `chief-of-staff` | Routing, synthesis, decision logging |

## Protocol

Follow the 6-phase `board-meeting` protocol (`.claude/skills/board-meeting/SKILL.md`)
with these repo-local overrides:

1. **Context (Phase 1):** Load `council/company-context.md` and the approved-decision
   index `council/decisions/approved/decisions.md` from the repo root — **not**
   `~/.claude/`. Then select 3–5 relevant seats for the topic using the board-meeting
   routing table (all six operators only for existential decisions). Present the agenda
   and roster; wait for confirmation only if the session is interactive.
2. **Independent contributions (Phase 2):** Launch each selected operator **in
   parallel as an isolated subagent** via the Agent tool (general-purpose type).
   Each prompt must contain: the question, the company context, the instruction to
   read its skill directory (e.g. `.claude/skills/cfo-advisor/`) before answering,
   and the contribution format from the board-meeting skill (max 5 tagged points,
   recommendation, confidence, "what would change my mind"). Never show one
   operator another operator's output in this phase.
3. **Critic (Phase 3):** After all contributions return, run one adversarial pass:
   suspicious consensus, shared unvalidated assumptions, missing voices, unmentioned
   risks, role bleed.
4. **Synthesis (Phase 4):** As Chief of Staff, produce the Board Meeting Output
   format from `agent-protocol`: Decision Required, one-line per-seat perspectives,
   Where They Agree / Disagree, Critic's View, Recommended Decision with owners and
   deadlines, Your Call.
5. **Founder review (Phase 5):** Present the synthesis and stop for the user's
   ✅ approve / ✏️ modify / ❌ reject. User corrections override operator positions.
6. **Logging (Phase 6):** On approval, write the full transcript to
   `council/decisions/raw/YYYY-MM-DD-<slug>.md` and the approved record to
   `council/decisions/approved/YYYY-MM-DD-<slug>.md`, and append one line to
   `council/decisions/approved/decisions.md`. Future sittings load approved records
   only — never raw transcripts.

## Rules

- **Isolation is the point.** Parallel subagents with no cross-pollination in
  Phase 2; groupthink invalidates the sitting.
- **Repo-local memory.** All context and decision files live under `council/` in
  this repository so they are versioned and travel with the repo. Never write
  council state to `~/.claude/`.
- **Cap the room.** 3–5 seats per sitting unless the user asks for the full bench.
- **Force a recommendation.** Every seat must land on a position, even at Low
  confidence. "It depends" is not a contribution.
- **GC disclaimer.** Legal seat output surfaces questions for licensed counsel;
  it is not legal advice.
