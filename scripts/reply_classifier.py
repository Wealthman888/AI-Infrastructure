"""
Classifies inbound reply text into one of the five buckets tracked on the
dashboard funnel panel: Interested / Question / Not Now / Negative /
Unsubscribe. Also matches known objections against data/objection_library.json
so a suggested response is ready before the 15-minute reply SLA clock runs out.

Keyword pass first (fast, free, deterministic). Falls back to Claude only for
replies the keyword pass can't confidently place, if ANTHROPIC_API_KEY is set
-- keeps cost near zero since most replies are short and clear-cut.
"""
import json
import os
import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
OBJECTION_LIBRARY_PATH = REPO_ROOT / "data" / "objection_library.json"

UNSUBSCRIBE_PATTERNS = re.compile(
    r"\bunsubscribe\b|\bremove me\b|\btake me off\b|\bstop emailing\b|\bdo not contact\b", re.I
)
NEGATIVE_PATTERNS = re.compile(
    r"\bnot interested\b|\bf[*u]ck off\b|\bspam\b|\bharass\b|\bscam\b|\breport\b|\blawyer\b|\bcease\b",
    re.I,
)
INTERESTED_PATTERNS = re.compile(
    r"\btell me more\b|\bsounds? good\b|\byes\b|\bsure\b|\binterested\b|\blet'?s talk\b|"
    r"\bschedul\w*\b|\bbook\w*\b|\bcall\b|\bsend it\b|\bsend over\b|\bwhat'?s the cost\b|"
    r"\bhow much\b|\bwhat would\b",
    re.I,
)
QUESTION_PATTERNS = re.compile(r"\?")
NOT_NOW_PATTERNS = re.compile(
    r"\bnot right now\b|\bmaybe later\b|\bcheck back\b|\bfollow up\b|\bin a few months\b|"
    r"\bbusy\b|\bnext quarter\b|\btoo busy\b",
    re.I,
)


def classify_keyword(text: str) -> str | None:
    if UNSUBSCRIBE_PATTERNS.search(text):
        return "unsubscribe"
    if NEGATIVE_PATTERNS.search(text):
        return "negative"
    if NOT_NOW_PATTERNS.search(text) and not INTERESTED_PATTERNS.search(text):
        return "not_now"
    if INTERESTED_PATTERNS.search(text):
        return "interested"
    if QUESTION_PATTERNS.search(text):
        return "question"
    return None


def classify_with_claude(text: str) -> str:
    from anthropic import Anthropic
    client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    resp = client.messages.create(
        model=os.environ.get("SPINTAX_MODEL", "claude-opus-4-7"),
        max_tokens=20,
        messages=[{
            "role": "user",
            "content": (
                "Classify this cold-email reply into exactly one label: interested, question, "
                "not_now, negative, unsubscribe. Reply with only the label.\n\n"
                f"Reply:\n---\n{text}\n---"
            ),
        }],
    )
    label = resp.content[0].text.strip().lower()
    return label if label in {"interested", "question", "not_now", "negative", "unsubscribe"} else "question"


def classify(text: str) -> str:
    label = classify_keyword(text)
    if label:
        return label
    if os.environ.get("ANTHROPIC_API_KEY"):
        return classify_with_claude(text)
    return "question"  # safest default: gets a human look, never silently dropped


def load_objection_library() -> dict:
    with open(OBJECTION_LIBRARY_PATH) as f:
        return json.load(f)


def match_objection(text: str) -> dict | None:
    library = load_objection_library()
    text_lower = text.lower()
    for entry in library["objections"]:
        if any(trigger in text_lower for trigger in entry["triggers"]):
            return entry
    return None


if __name__ == "__main__":
    import sys
    sample = sys.argv[1] if len(sys.argv) > 1 else "yeah what would this cost roughly?"
    label = classify(sample)
    objection = match_objection(sample)
    print(f"classification: {label}")
    if objection:
        print(f"objection match: {objection['name']}")
        print(f"suggested response: {objection['response']}")
