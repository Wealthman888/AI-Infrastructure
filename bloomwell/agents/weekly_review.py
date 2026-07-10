"""Skill C — bloomwell-weekly-review (the coach).

Cron: Mondays 6am user-local via n8n (see ../scripts/README.md).

Reads last 7 days of wearable_daily + food_log + habit_log + latest biomarkers,
compares to the prior 3-week baseline, and produces EXACTLY 1-2 behavior changes
(sleep timing, protein consistency, training frequency, hydration — behavior only,
never substances). Surfaces unacknowledged doctor_flags, writes weekly_briefs,
dispatches to the user's chosen channel.

Refuses to output if copy_validated=false — enforced both here and by the
`weekly_briefs_copy_validated_gate` DB trigger.

Entry point: run_weekly_review(profile_id)
"""

from __future__ import annotations

import json
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent / "validators"))

from common import MODEL_COACH, cached_system, get_anthropic, get_supabase
from copy_validator import validate_all

TREND_WINDOW_DAYS = 7      # RULE 4: never coach off less than 7 days
BASELINE_WEEKS = 3

SYSTEM_PROMPT = """\
You are Bloomwell's weekly review coach. Bloomwell is a wellness coordinator, NOT
a medical provider. Each Monday you review one user's last 7 days against their
prior 3-week baseline and produce their Monday Brief.

Output ONLY a JSON object:
{
  "summary": "<2-3 sentences of plain-English trend deltas vs baseline>",
  "recommendations": [
    {
      "kind": "behavior",
      "title": "<short imperative, e.g. 'Move your last meal earlier'>",
      "detail": "<2-3 sentences: the specific behavior change, tied to the
                 observed >=7-day pattern that motivates it>"
    }
  ]
}

HARD RULES:
- EXACTLY 1 or 2 recommendations. The product is focus, not a dashboard.
- Behavior ONLY: sleep timing, protein consistency, training frequency, hydration,
  meal timing, movement. NEVER a supplement, food-as-treatment, dosage, or protocol.
- Every recommendation must be grounded in a pattern spanning at least 7 days.
  Never key off a single day's reading.
- NEVER reference a flagged biomarker in a recommendation, and never suggest
  anything "for" a lab result. Doctor flags are surfaced separately, verbatim,
  by the system — not by you.
- NEVER use: diagnose/diagnosis, treat/treatment, cure, prescribe/prescription,
  dosage/dose, deficiency (as a claim), "you should take", "medical advice".
- Approved framings: "worth discussing with your doctor", "a pattern worth
  flagging", "question for your next appointment".
"""


def _fetch_window(sb, profile_id: str, start: date, end: date) -> dict:
    iso = lambda d: d.isoformat()
    wearable = sb.table("wearable_daily").select("*") \
        .eq("profile_id", profile_id).gte("day", iso(start)).lt("day", iso(end)) \
        .execute().data
    food = sb.table("food_log").select("logged_at,description,calories,protein_g,quality_score") \
        .eq("profile_id", profile_id).gte("logged_at", iso(start)).lt("logged_at", iso(end)) \
        .execute().data
    habits = sb.table("habit_log").select("logged_at,kind,detail") \
        .eq("profile_id", profile_id).gte("logged_at", iso(start)).lt("logged_at", iso(end)) \
        .execute().data
    return {"wearable_daily": wearable, "food_log": food, "habit_log": habits}


def run_weekly_review(profile_id: str, week_start: date | None = None) -> dict:
    sb = get_supabase()
    week_start = week_start or date.today() - timedelta(days=date.today().weekday())
    window_start = week_start - timedelta(days=TREND_WINDOW_DAYS)
    baseline_start = window_start - timedelta(weeks=BASELINE_WEEKS)

    current = _fetch_window(sb, profile_id, window_start, week_start)
    baseline = _fetch_window(sb, profile_id, baseline_start, window_start)

    # Unacknowledged doctor flags — surfaced verbatim in the brief, never mixed
    # into recommendations (RULE 2).
    flags = sb.table("doctor_flags") \
        .select("id,plain_english,question_for_doctor,biomarkers(name)") \
        .eq("profile_id", profile_id).is_("acknowledged_at", "null") \
        .execute().data

    client = get_anthropic()
    response = client.messages.create(
        model=MODEL_COACH,
        max_tokens=2048,
        system=cached_system(SYSTEM_PROMPT),
        messages=[{
            "role": "user",
            "content": json.dumps({
                "last_7_days": current,
                "prior_3_week_baseline": baseline,
                # Names only, so the coach knows which biomarkers are OFF LIMITS
                # for recommendations — the flag content itself is not its input.
                "flagged_biomarkers_do_not_address": [
                    f["biomarkers"]["name"] for f in flags if f.get("biomarkers")
                ],
            }, default=str),
        }],
    )
    raw = next((b.text for b in response.content if b.type == "text"), "{}")
    raw = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```")
    brief = json.loads(raw)

    recs = brief.get("recommendations", [])
    if not 1 <= len(recs) <= 2:  # RULE 3 (also a DB CHECK)
        raise ValueError(f"weekly review produced {len(recs)} recommendations; must be 1-2")

    # RULE 1: validate every outbound string BEFORE marking copy_validated.
    texts = [brief.get("summary", "")] + \
            [f"{r['title']} {r['detail']}" for r in recs]
    result = validate_all(texts, source="weekly_review", profile_id=profile_id)

    row = sb.table("weekly_briefs").insert({
        "profile_id": profile_id,
        "week_start": week_start.isoformat(),
        "trend_window_days": TREND_WINDOW_DAYS,
        "recommendations": recs,
        "doctor_flag_ids": [f["id"] for f in flags],
        "copy_validated": result.ok,
    }).execute().data[0]

    if not result.ok:
        # Refuse to output: brief is stored for audit but never delivered.
        # (The DB trigger independently blocks delivered_at while copy_validated=false.)
        raise ValueError(f"brief {row['id']} failed copy validation: {result.violations}")

    _dispatch(sb, profile_id, row, brief, flags)
    return {"brief_id": row["id"], "recommendations": len(recs), "doctor_flags": len(flags)}


def _dispatch(sb, profile_id: str, row: dict, brief: dict, flags: list[dict]) -> None:
    """Deliver the Monday Brief to the user's chosen channel."""
    profile = sb.table("profiles").select("brief_channel,sms_consent_at,telegram_chat_id") \
        .eq("id", profile_id).single().execute().data
    channel = profile["brief_channel"]

    # RULE 6: sms_consent_at NULL = no SMS ever. Fall back to in-app.
    if channel == "sms" and not profile.get("sms_consent_at"):
        channel = "app"

    message = _render(brief, flags)

    if channel == "telegram" and profile.get("telegram_chat_id"):
        _send_telegram(profile["telegram_chat_id"], message)
    elif channel == "email":
        pass  # TODO: email digest via n8n SMTP node (Phase 2)
    elif channel == "sms":
        pass  # TODO: A2P-registered SMS provider (Phase 3+, consent-gated)
    # 'app' needs no push: the brief row itself feeds the Monday Brief screen.

    sb.table("weekly_briefs").update(
        {"delivered_at": datetime.now(timezone.utc).isoformat()}
    ).eq("id", row["id"]).execute()


def _render(brief: dict, flags: list[dict]) -> str:
    lines = ["*Your Monday Brief*", "", brief.get("summary", ""), ""]
    for i, r in enumerate(brief.get("recommendations", []), 1):
        lines += [f"*{i}. {r['title']}*", r["detail"], ""]
    if flags:
        lines.append("*Worth discussing with your doctor:*")
        for f in flags:
            lines += ["", f["plain_english"],
                      f"_Ask:_ {f['question_for_doctor']}"]
    return "\n".join(lines)


def _send_telegram(chat_id: str, text: str) -> None:
    import os
    import urllib.parse
    import urllib.request
    token = os.environ["TELEGRAM_BOT_TOKEN"]
    data = urllib.parse.urlencode(
        {"chat_id": chat_id, "text": text, "parse_mode": "Markdown"}
    ).encode()
    urllib.request.urlopen(
        f"https://api.telegram.org/bot{token}/sendMessage", data=data, timeout=30
    )


def run_all_due(target_hour_local: int = 6) -> list[dict]:
    """n8n hourly entry point: run the review for every profile whose local time
    is Monday {target_hour_local}:00 this hour."""
    from zoneinfo import ZoneInfo
    sb = get_supabase()
    results = []
    for p in sb.table("profiles").select("id,timezone").execute().data:
        now_local = datetime.now(ZoneInfo(p.get("timezone") or "America/Los_Angeles"))
        if now_local.weekday() == 0 and now_local.hour == target_hour_local:
            try:
                results.append(run_weekly_review(p["id"]))
            except Exception as exc:
                results.append({"profile_id": p["id"], "error": str(exc)})
    return results


if __name__ == "__main__":
    if len(sys.argv) > 1:
        print(json.dumps(run_weekly_review(sys.argv[1]), indent=2))
    else:
        print(json.dumps(run_all_due(), indent=2))
