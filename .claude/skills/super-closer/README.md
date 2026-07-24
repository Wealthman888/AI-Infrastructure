# Super Closer — the six-book AI sales closer

A Claude Code / Claude skill that turns your AI into an omni-expert sales closer,
distilled from six of the greatest sales and persuasion books ever written:

- **Never Split the Difference** — Chris Voss (de-escalation, real objection)
- **$100M Offers** — Alex Hormozi (kill the price fight)
- **Influence** — Robert Cialdini (the 7 yes-triggers)
- **How to Win Friends & Influence People** — Dale Carnegie (warmth & tone)
- **Pitch Anything** — Oren Klaff (frame control, be the prize)
- **The 48 Laws of Power** — Robert Greene (positioning & restraint)

Paste in any prospect message — *"too expensive," "let me think about it," "we
already use X,"* a ghosting thread, a cold DM — and it writes the exact reply that
reopens and closes the deal, plus *why* each move works so you learn the system.

---

## Install

**Claude Code**

1. This skill lives at `.claude/skills/super-closer/` in this repo, so it's
   already available in any Claude Code session opened here. To use it in other
   projects, copy the whole `super-closer/` folder into your skills directory:
   - Personal (all your projects): `~/.claude/skills/super-closer/`
   - Project only: `.claude/skills/super-closer/` inside the repo
2. Restart Claude Code (or start a new session).
3. It auto-triggers when you ask for help with a prospect/objection. Or invoke it
   directly: `/super-closer`.

**Claude.ai / Claude Desktop (Skills)**

1. Zip the `super-closer/` folder.
2. Upload it in **Settings → Capabilities → Skills** (or your workspace's skill
   uploader).
3. Start a chat and paste a prospect message — the skill activates on its own.

---

## How to use it

Just talk to it like a person. Give it:
- the **prospect's message** (paste it verbatim),
- a line of **context** if useful (what you sell, your price, one real result you can
  cite),
- the **channel** (DM, email, comment).

It returns:
1. **The reply** — copy-paste ready, in your voice.
2. **Why it works** — the tactic + book behind each move.
3. **If they say X next** — your next move, pre-loaded.

**Example prompts**
- "A lead just said 'it's too expensive' on my $2k web package — help me reply."
- "This prospect went cold after I sent the quote. Write a follow-up that isn't
  needy."
- "They said 'we already use Wix, why switch?' — reply for a DM."

---

## One rule that makes it work

Every claim it writes must be **true** — real scarcity, real client results, real
guarantees you can honor. These tactics work *because* they're honest signals of
value. If you don't hand it a real proof point, it'll leave a
`[insert your result here]` slot rather than invent one. Fill it with something true.

---

## What's inside

```
super-closer/
├── SKILL.md                        the routing brain (loads first)
├── README.md                       this file
└── references/
    ├── voss-never-split.md         de-escalation, labels, calibrated questions
    ├── hormozi-100m-offers.md      value equation, offer stacking, guarantees
    ├── cialdini-influence.md       the 7 principles of persuasion
    ├── carnegie-win-friends.md     tone, warmth, making the idea theirs
    ├── klaff-pitch-anything.md     frame control, prizing, hot cognition
    ├── greene-48-laws.md           positioning, restraint, willingness to walk
    └── objection-playbook.md       worked examples for common objections
```
