"""Regex-pass tests for copy_validator (no API key required: use_model=False)."""

from copy_validator import validate_copy

BLOCKED = [
    "We can diagnose your fatigue from this panel.",
    "This should treat the underlying issue.",
    "A daily dose of 2000 IU is recommended.",
    "You should take magnesium before bed.",
    "This looks like a vitamin D deficiency.",
    "Consider this medical advice for your cholesterol.",
    "Your doctor may prescribe something, but try this first.",
    "There's no cure, but this helps.",
]

ALLOWED = [
    "Your deep sleep dipped on late-dinner nights — a pattern worth flagging.",
    "Your LDL-C is above its reference range. That's worth discussing with your doctor.",
    "Question for your next appointment: could my HbA1c trend relate to my sleep?",
    "Try moving your last meal 2 hours earlier on training days this week.",
    "Protein consistency slipped below your 3-week baseline on 4 of 7 days.",
]


def test_blocked_phrases_fail():
    for text in BLOCKED:
        result = validate_copy(text, use_model=False)
        assert not result.ok, f"should have been blocked: {text!r}"
        assert result.suggestions, "blocked copy must carry substitution suggestions"


def test_allowed_phrases_pass_regex():
    for text in ALLOWED:
        result = validate_copy(text, use_model=False)
        assert result.ok, f"false positive on: {text!r} -> {result.violations}"


if __name__ == "__main__":
    test_blocked_phrases_fail()
    test_allowed_phrases_pass_regex()
    print("copy_validator regex tests passed")
