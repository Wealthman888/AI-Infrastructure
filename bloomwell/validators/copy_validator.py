"""Bloomwell RULE 1 — the language firewall.

All user-facing generated copy passes through here before send. Two passes:

1. Regex pass (hard block): banned medical/prescriptive terms.
2. Claude Haiku classifier pass (judgment): implied diagnosis, supplement/dosage
   recommendations phrased around the banned words, personalized-prescriptive framing.

Violations are logged to the `copy_violations` table when a Supabase client is
available. Mirror of the Axiom banned-words validator.

Usage:
    from copy_validator import validate_copy
    result = validate_copy(text, source="weekly_review", profile_id=...)
    if not result.ok:
        ...block send, log, regenerate...

CLI:
    python copy_validator.py "Your LDL suggests you should take fish oil"
"""

from __future__ import annotations

import json
import os
import re
import sys
from dataclasses import dataclass, field

import anthropic

# High-frequency, cost-sensitive task -> Haiku (per CLAUDE.md).
CLASSIFIER_MODEL = "claude-haiku-4-5-20251001"

# ---------------------------------------------------------------------------
# Pass 1 — banned-words regex (hard block)
# ---------------------------------------------------------------------------

BANNED_PATTERNS: list[tuple[str, re.Pattern]] = [
    ("diagnose",        re.compile(r"\bdiagnos(?:e|es|ed|ing|is|tic)\b", re.I)),
    ("treat",           re.compile(r"\btreat(?:s|ed|ing|ment|ments)?\b", re.I)),
    ("cure",            re.compile(r"\bcure(?:s|d)?\b", re.I)),
    ("prescribe",       re.compile(r"\bprescri(?:be|bes|bed|bing|ption|ptions)\b", re.I)),
    ("dosage",          re.compile(r"\b(?:dosage|dose|doses|dosing)\b", re.I)),
    ("you should take", re.compile(r"\byou\s+should\s+take\b", re.I)),
    ("deficiency",      re.compile(r"\bdeficien(?:t|cy|cies)\b", re.I)),
    ("medical advice",  re.compile(r"\bmedical\s+advice\b", re.I)),
]

# Required substitutions — offered as fix suggestions when a violation is found.
REQUIRED_SUBSTITUTIONS = [
    "worth discussing with your doctor",
    "a pattern worth flagging",
    "question for your next appointment",
]

CLASSIFIER_SYSTEM = """\
You are the compliance classifier for Bloomwell, a wellness coordinator that is
NOT a medical provider. You review one piece of user-facing coaching copy and
decide whether it violates any of these rules:

1. It must never diagnose, or imply a diagnosis, from an individual's data.
2. It must never recommend a supplement, dosage, food-as-treatment, or protocol
   in response to an individual's biomarker data — even without banned words
   (e.g. "your vitamin D is low, more salmon could help" is a violation).
3. It must never present education content as personalized-prescriptive
   ("based on your labs, look into X procedure").
4. Out-of-range findings may only be framed as: what the marker generally
   relates to + a question to bring to a physician.

Allowed: behavior coaching (sleep timing, protein consistency, training
frequency, hydration), neutral trend observations, doctor-referral framing
such as "worth discussing with your doctor", "a pattern worth flagging",
"question for your next appointment".

Respond with ONLY a JSON object:
{"violation": true|false, "reason": "<one sentence, empty string if none>"}"""


@dataclass
class ValidationResult:
    ok: bool
    violations: list[dict] = field(default_factory=list)
    suggestions: list[str] = field(default_factory=list)


def _regex_pass(text: str) -> list[dict]:
    hits = []
    for rule, pattern in BANNED_PATTERNS:
        m = pattern.search(text)
        if m:
            hits.append({"rule": rule, "match": m.group(0), "pass": "regex"})
    return hits


def _classifier_pass(text: str, client: anthropic.Anthropic) -> list[dict]:
    """Haiku judgment pass for violations that regex can't catch."""
    response = client.messages.create(
        model=CLASSIFIER_MODEL,
        max_tokens=256,
        system=[{
            "type": "text",
            "text": CLASSIFIER_SYSTEM,
            # Prompt caching on the static system block (5-minute TTL) so the
            # weekly-review loop stays within one cache window.
            "cache_control": {"type": "ephemeral"},
        }],
        messages=[{"role": "user", "content": f"Copy to review:\n\n{text}"}],
    )
    raw = next((b.text for b in response.content if b.type == "text"), "{}")
    try:
        verdict = json.loads(raw.strip().removeprefix("```json").removesuffix("```"))
    except json.JSONDecodeError:
        # Fail closed: an unparseable verdict blocks the copy.
        return [{"rule": "classifier_unparseable", "match": raw[:200], "pass": "model"}]
    if verdict.get("violation"):
        return [{"rule": "classifier", "match": verdict.get("reason", ""), "pass": "model"}]
    return []


def _log_violation(source: str, profile_id: str | None, text: str, violations: list[dict]) -> None:
    """Best-effort audit log to Supabase copy_violations (service role, server-only)."""
    try:
        from supabase import create_client
        sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
        sb.table("copy_violations").insert({
            "source": source,
            "profile_id": profile_id,
            "offending_text": text,
            "violations": violations,
        }).execute()
    except Exception as exc:  # logging must never break the send path decision
        print(f"[copy_validator] could not log violation: {exc}", file=sys.stderr)


def validate_copy(
    text: str,
    *,
    source: str = "unknown",
    profile_id: str | None = None,
    use_model: bool = True,
    client: anthropic.Anthropic | None = None,
) -> ValidationResult:
    """Validate one outbound coaching string. Blocks banned terms, flags
    implied-prescriptive phrasing, logs violations, and suggests the required
    substitution phrasings."""
    violations = _regex_pass(text)

    # Only spend a model call if regex found nothing — regex hits already block.
    if not violations and use_model:
        violations = _classifier_pass(text, client or anthropic.Anthropic())

    if violations:
        _log_violation(source, profile_id, text, violations)
        return ValidationResult(ok=False, violations=violations,
                                suggestions=REQUIRED_SUBSTITUTIONS)
    return ValidationResult(ok=True)


def validate_all(texts: list[str], **kwargs) -> ValidationResult:
    """Validate a batch of strings; fails if any single one fails."""
    all_violations = []
    for t in texts:
        r = validate_copy(t, **kwargs)
        all_violations.extend(r.violations)
    if all_violations:
        return ValidationResult(ok=False, violations=all_violations,
                                suggestions=REQUIRED_SUBSTITUTIONS)
    return ValidationResult(ok=True)


if __name__ == "__main__":
    sample = sys.argv[1] if len(sys.argv) > 1 else "Your sleep trend is worth flagging."
    result = validate_copy(sample, source="cli", use_model=bool(os.getenv("ANTHROPIC_API_KEY")))
    print(json.dumps(result.__dict__, indent=2, default=str))
    sys.exit(0 if result.ok else 1)
