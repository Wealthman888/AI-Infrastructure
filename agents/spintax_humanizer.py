"""
Spintax Humanizer Agent (Section 4).

Converts a base cold-email template into deep, Instantly-compatible spintax
so every prospect gets a structurally unique email -- no two recipients (and
no spam filter) see identical fingerprints.

Layer 1 -- Structural spintax: 4-6 opening variants, 3-5 variants per body
           sentence, 4-6 CTA variants, 3-4 sign-off variants.
Layer 2 -- Per-lead variables ({{first_name}}, {{company}}, {{city}},
           {{specific_finding}}, {{niche_pain}}, {{local_proof}}) are left as
           Instantly merge tags, not filled in here -- scripts/lead_pipeline.py
           fills those per-lead when the list is uploaded.
Layer 3 -- Humanization pass: contractions always, ban list enforced, 8th
           grade reading level, one casual fragment per email, occasional
           lowercase sentence starts.

Quality gate: every variant is scored 1-10 on human-ness ("would a busy
contractor believe another business owner typed this?"). Anything under 8
gets regenerated, up to MAX_QUALITY_ATTEMPTS times.

Usage:
    python agents/spintax_humanizer.py --base sequences/detailing/base_sequence.md \
        --day 1 --niche detailing --out sequences/detailing/spintax_day1.txt

Requires ANTHROPIC_API_KEY in .env.
"""
import argparse
import json
import os
import random
import re
import sys
from pathlib import Path

from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

# Project convention (CLAUDE.md): opus for complex multi-step reasoning agents.
# Override via SPINTAX_MODEL if the pinned id ages out.
MODEL = os.environ.get("SPINTAX_MODEL", "claude-opus-4-7")
MAX_QUALITY_ATTEMPTS = 3
MIN_HUMANNESS_SCORE = 8

BAN_LIST = [
    "i hope this email finds you well", "revolutionize", "streamline", "leverage",
    "synergy", "cutting-edge", "game-changer", "reaching out", "circle back",
    "bot", "ai agent", "chatbot",
]

SYSTEM_PROMPT = """You are the Spintax Humanizer for GemLabs, a cold-email deliverability \
engineer. You take one base cold email and rewrite it as deep spintax so Instantly sends a \
structurally unique message to every prospect.

HARD BRAND RULE: all client-facing copy says "digital receptionist" -- NEVER "bot", "AI \
agent", or "chatbot", in any variant, no exceptions.

BAN LIST (must not appear in any variant): {ban_list}

RULES:
- Preserve every {{{{merge_tag}}}} exactly as written (e.g. {{{{first_name}}}}, {{{{company}}}}, \
{{{{city}}}}, {{{{specific_finding}}}}, {{{{niche_pain}}}}, {{{{local_proof}}}}). Never spin the \
tag itself, only the surrounding words.
- Generate 4-6 variants of the opening line, 3-5 variants of every other sentence in the body, \
4-6 variants of the CTA, and 3-4 variants of the sign-off.
- Format as nested spintax: {{option one|option two|option three}}, placed naturally in the \
sentence, not as one giant block swap unless the whole sentence genuinely needs to change.
- Vary sentence length across variants. Include one deliberately casual fragment somewhere in \
the email (e.g. "Wild, right?" or "No pressure either way."). Some variants should start \
lowercase where it reads naturally.
- Contractions always: "you're", "it's", "I'd", "don't", never "you are", "it is", "I would".
- Nothing above an 8th-grade reading level. Short words, short sentences.
- Keep total word count close to the original (the base emails are already <=120 words, or \
<=60 for the breakup email -- don't let spintax bloat that).
- No links, no images, no HTML, no attachments unless the base email already had one.
- Every variant must pass this test: "Would a busy contractor believe another business owner \
typed this in 90 seconds?" If a variant sounds templated, corporate, or over-polished, rewrite it.

OUTPUT FORMAT: respond with ONLY a JSON object, no prose, matching this shape:
{{
  "spintax_email": "the full email as one spintax string, sentences separated by newlines",
  "combination_count": <int, product of all option counts>,
  "self_review_notes": "one sentence on anything you deliberately varied for humanness"
}}
"""

SCORE_PROMPT = """Score this cold email variant 1-10 on human-ness using this test: "Would a \
busy contractor believe another business owner typed this in 90 seconds?" A 10 sounds exactly \
like a real small business owner dashed it off between jobs. A 1 sounds like corporate \
marketing copy or an obvious mail-merge template.

Also flag (true/false) whether it contains any banned word/phrase from this list: {ban_list}
Also flag (true/false) whether it uses "bot", "AI agent", or "chatbot" anywhere (hard fail \
regardless of score).

Email variant:
---
{variant}
---

Respond with ONLY a JSON object: {{"score": <int 1-10>, "contains_banned_phrase": <bool>, \
"contains_bot_language": <bool>, "reason": "<one sentence>"}}
"""


def _client() -> Anthropic:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is not set. Add it to .env (see .env.example).")
    return Anthropic(api_key=api_key)


def _system_blocks() -> list[dict]:
    # Static block (rules + ban list) is cache_control'd per CLAUDE.md prompt-caching
    # convention -- this prompt is reused across every base email/niche in a run,
    # so subsequent calls in the same 5-minute window hit the cache.
    return [{
        "type": "text",
        "text": SYSTEM_PROMPT.format(ban_list=", ".join(BAN_LIST)),
        "cache_control": {"type": "ephemeral"},
    }]


def generate_spintax(base_email: str, niche: str, day: int, client: Anthropic | None = None) -> dict:
    client = client or _client()
    user_prompt = (
        f"Niche: {niche}\n"
        f"Sequence position: Day {day} of the 4-touch sequence (Days 1, 3, 7, 12)\n\n"
        f"Base email:\n---\n{base_email}\n---\n\n"
        f"Generate the deep spintax version now."
    )
    resp = client.messages.create(
        model=MODEL,
        max_tokens=4096,
        system=_system_blocks(),
        messages=[{"role": "user", "content": user_prompt}],
    )
    text = resp.content[0].text
    return _parse_json(text)


def score_variant(variant_text: str, client: Anthropic | None = None) -> dict:
    client = client or _client()
    resp = client.messages.create(
        model=MODEL,
        max_tokens=300,
        messages=[{
            "role": "user",
            "content": SCORE_PROMPT.format(ban_list=", ".join(BAN_LIST), variant=variant_text),
        }],
    )
    return _parse_json(resp.content[0].text)


def _parse_json(text: str) -> dict:
    text = text.strip()
    # Models sometimes wrap JSON in ```json fences despite instructions -- strip if present.
    text = re.sub(r"^```(json)?|```$", "", text.strip(), flags=re.MULTILINE).strip()
    return json.loads(text)


def count_combinations(spintax: str) -> int:
    """Product of option counts across every {a|b|c} group in the string."""
    groups = re.findall(r"\{([^{}]+)\}", spintax)
    total = 1
    for group in groups:
        total *= max(1, len(group.split("|")))
    return total


def sample_render(spintax: str, lead_vars: dict) -> str:
    """Render one random concrete combination -- used for eyeballing output
    quality and for the preview panel, not for the actual Instantly upload
    (Instantly does its own spintax resolution at send time)."""
    def pick(match: re.Match) -> str:
        options = match.group(1).split("|")
        return random.choice(options)

    rendered = re.sub(r"\{([^{}]+)\}", pick, spintax)
    for key, value in lead_vars.items():
        rendered = rendered.replace(f"{{{{{key}}}}}", str(value))
    return rendered


def quality_gate(spintax_email: str, client: Anthropic | None = None,
                  lead_vars_for_preview: dict | None = None) -> dict:
    """Renders a handful of sample combinations, scores each for human-ness
    and banned-language, and reports whether the batch clears the bar. Does
    NOT auto-regenerate the whole email (that's a full API round-trip via
    generate_spintax) -- it flags failures so the caller can retry."""
    client = client or _client()
    preview_vars = lead_vars_for_preview or {
        "first_name": "Mike", "company": "Mike's Detailing", "city": "Reno",
        "specific_finding": "there's no way to book online",
        "niche_pain": "missed call = lost job",
        "local_proof": "a Reno detailer started catching after-hours bookings within a week",
    }
    samples = [sample_render(spintax_email, preview_vars) for _ in range(5)]
    scores = [score_variant(s, client) for s in samples]

    hard_fails = [s for s in scores if s.get("contains_bot_language") or s.get("contains_banned_phrase")]
    low_scores = [s for s in scores if s.get("score", 0) < MIN_HUMANNESS_SCORE]

    return {
        "passed": not hard_fails and not low_scores,
        "avg_score": round(sum(s.get("score", 0) for s in scores) / len(scores), 1),
        "hard_fails": hard_fails,
        "low_scores": low_scores,
        "samples": list(zip(samples, scores)),
    }


def generate_with_quality_gate(base_email: str, niche: str, day: int) -> dict:
    client = _client()
    for attempt in range(1, MAX_QUALITY_ATTEMPTS + 1):
        result = generate_spintax(base_email, niche, day, client)
        gate = quality_gate(result["spintax_email"], client)
        result["quality_gate"] = gate
        result["attempt"] = attempt
        if gate["passed"]:
            return result
        print(f"  attempt {attempt}: avg human-ness {gate['avg_score']}/10, "
              f"{len(gate['hard_fails'])} hard fail(s) -- regenerating", file=sys.stderr)
    print(f"  WARNING: did not clear quality gate after {MAX_QUALITY_ATTEMPTS} attempts, "
          f"returning best effort for manual review", file=sys.stderr)
    return result


def main():
    parser = argparse.ArgumentParser(description="GemLabs Spintax Humanizer Agent")
    parser.add_argument("--base", required=True, help="Path to base email (plain text/markdown)")
    parser.add_argument("--niche", required=True)
    parser.add_argument("--day", type=int, required=True, choices=[1, 3, 7, 12])
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    base_email = Path(args.base).read_text()
    result = generate_with_quality_gate(base_email, args.niche, args.day)

    Path(args.out).write_text(result["spintax_email"])
    print(f"Wrote spintax to {args.out}")
    print(f"Combinations: {count_combinations(result['spintax_email'])}")
    print(f"Quality gate: {'PASSED' if result['quality_gate']['passed'] else 'NEEDS REVIEW'} "
          f"(avg human-ness {result['quality_gate']['avg_score']}/10)")


if __name__ == "__main__":
    main()
