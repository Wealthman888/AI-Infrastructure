"""
Section 1 scaling protocol as code: the +5-inboxes/week onboarding cadence,
warmup graduation dates, and per-inbox daily-cap ramp (5-10/day start, +5/week,
hard ceiling 30/day).

Two modes:
  plan    -- pure math, no real data needed. Prints the forward Week 1-8
             cohort calendar (cohort date -> warmup graduation -> projected
             capacity) starting from a given date. This is what Section 7
             step 1 asks for and can be generated right now.
  status  -- reads data/inbox_inventory.json (or, once INSTANTLY_API_KEY is
             set, live Instantly account data) and reports where each real
             inbox actually is in the cycle. Needs the real inventory filled
             in first -- currently placeholder.

Usage:
    python scripts/scaling_calendar.py plan --start 2026-07-01 --existing 15 --weeks 8
    python scripts/scaling_calendar.py status
"""
import argparse
import json
from datetime import date, timedelta
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
INVENTORY_PATH = REPO_ROOT / "data" / "inbox_inventory.json"

WARMUP_DAYS = 18          # midpoint of the 14-21 day rule
START_CAP = 10            # midpoint of the 5-10/day rule
RAMP_PER_WEEK = 5
CEILING = 30


def cap_on_date(graduation_date: date, as_of: date) -> int:
    """Daily send cap for one inbox, given how many weeks past graduation it is."""
    if as_of < graduation_date:
        return 0  # still warming, no cold sends
    weeks_live = (as_of - graduation_date).days // 7
    return min(CEILING, START_CAP + RAMP_PER_WEEK * weeks_live)


def plan(start: date, existing_inboxes: int, cohort_size: int, weeks: int):
    """existing_inboxes are assumed already graduated (pre-warmed) at week 0.
    Each subsequent week adds `cohort_size` new inboxes that need WARMUP_DAYS
    before their first cold send."""
    cohorts = [{"label": "Week 0 (existing)", "start": start, "count": existing_inboxes,
                "graduation": start}]  # already warm, live from day 1
    for w in range(1, weeks + 1):
        cohort_start = start + timedelta(weeks=w - 1)
        cohorts.append({
            "label": f"Week {w} cohort",
            "start": cohort_start,
            "count": cohort_size,
            "graduation": cohort_start + timedelta(days=WARMUP_DAYS),
        })

    print(f"{'Cohort':<20} {'Enters warmup':<15} {'Inboxes':<9} {'Graduates (live)':<18}")
    for c in cohorts:
        print(f"{c['label']:<20} {c['start'].isoformat():<15} {c['count']:<9} {c['graduation'].isoformat():<18}")

    print(f"\nProjected daily send capacity by week (starting {start.isoformat()}):")
    for w in range(0, weeks + 2):
        as_of = start + timedelta(weeks=w)
        # cap_on_date returns 0 pre-graduation, so this naturally excludes cohorts still warming
        total_capacity = sum(c["count"] * cap_on_date(c["graduation"], as_of) for c in cohorts)
        live_inboxes = sum(c["count"] for c in cohorts if as_of >= c["graduation"])
        print(f"  Week {w:2d} ({as_of.isoformat()}): {live_inboxes:3d} live inboxes, "
              f"~{total_capacity:4d} cold sends/day capacity (~{total_capacity * 30:,}/month)")


def status():
    with open(INVENTORY_PATH) as f:
        inventory = json.load(f)

    if inventory.get("_readme", "").startswith("PLACEHOLDER"):
        print("data/inbox_inventory.json is still placeholder data.")
        print("Fill in real domains/inboxes/dates (or wire dashboard/server.py to the live")
        print("Instantly /accounts endpoint) before this command means anything.\n")

    today = date.today()
    rows = []
    for domain in inventory.get("domains", []):
        for inbox in domain.get("inboxes", []):
            rows.append((domain["domain"], inbox))

    if not rows:
        print("No inboxes in inventory yet.")
        return

    print(f"{'Domain':<28} {'Inbox':<32} {'Status':<10} {'Cohort start':<14} {'Daily cap':<10}")
    for domain_name, inbox in rows:
        print(f"{domain_name:<28} {inbox.get('email', '?'):<32} "
              f"{inbox.get('status', 'TBD'):<10} {inbox.get('cohort_start_date', 'TBD'):<14} "
              f"{inbox.get('daily_cap', 'TBD')}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="GemLabs inbox scaling calendar")
    sub = parser.add_subparsers(dest="mode", required=True)

    plan_p = sub.add_parser("plan")
    plan_p.add_argument("--start", required=True, help="YYYY-MM-DD, cohort 0 / campaign launch date")
    plan_p.add_argument("--existing", type=int, default=15, help="Inboxes already warmed at week 0")
    plan_p.add_argument("--cohort-size", type=int, default=5, help="New inboxes onboarded per week")
    plan_p.add_argument("--weeks", type=int, default=8)

    sub.add_parser("status")

    args = parser.parse_args()
    if args.mode == "plan":
        plan(date.fromisoformat(args.start), args.existing, args.cohort_size, args.weeks)
    else:
        status()
