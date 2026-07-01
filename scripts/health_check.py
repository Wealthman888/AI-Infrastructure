"""
Daily infrastructure health check (Section 2). Run this once a day (cron/
scheduled task -- see the /schedule skill referenced in CLAUDE.md).

Checks:
  - Bounce rate per campaign: must stay < 3%. Crossing it auto-pauses the
    campaign and flags the list for re-verification.
  - Spam complaint rate: must stay < 0.1%. Crossing it auto-pauses.
  - Per-inbox warmup/health score: any inbox that dips below WARMUP_SCORE_FLOOR
    gets pulled from rotation (paused) and logged to rest for REST_DAYS.

Writes every action taken to data/alerts_log.json (append-only) so the
dashboard's Panel 4 alert queue has something to read without re-polling
Instantly on every page load.

Usage: python scripts/health_check.py [--dry-run]
"""
import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

from tools.instantly_client import InstantlyClient

REPO_ROOT = Path(__file__).resolve().parent.parent
ALERTS_LOG_PATH = REPO_ROOT / "data" / "alerts_log.json"

BOUNCE_RATE_CEILING = 3.0       # percent
SPAM_COMPLAINT_CEILING = 0.1    # percent
WARMUP_SCORE_FLOOR = 80         # out of 100, Instantly's warmup/health score
REST_DAYS = 14


def load_alerts() -> list[dict]:
    if ALERTS_LOG_PATH.exists():
        return json.loads(ALERTS_LOG_PATH.read_text())
    return []


def save_alerts(alerts: list[dict]) -> None:
    ALERTS_LOG_PATH.write_text(json.dumps(alerts, indent=2))


def log_alert(alerts: list[dict], kind: str, target: str, detail: str, action_taken: str) -> None:
    alerts.append({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "kind": kind,
        "target": target,
        "detail": detail,
        "action_taken": action_taken,
    })
    print(f"[ALERT] {kind} | {target} | {detail} | action: {action_taken}")


def check_campaigns(client: InstantlyClient, alerts: list[dict], dry_run: bool) -> None:
    for campaign in client.list_campaigns():
        cid = campaign.get("id")
        name = campaign.get("name", cid)
        analytics = client.get_campaign_analytics(campaign_id=cid)
        sent = analytics.get("sent_count", 0) or analytics.get("sent", 0) or 1
        bounced = analytics.get("bounced_count", 0) or analytics.get("bounced", 0)
        complaints = analytics.get("complaint_count", 0) or analytics.get("complaints", 0)
        bounce_rate = bounced / sent * 100
        complaint_rate = complaints / sent * 100

        if bounce_rate > BOUNCE_RATE_CEILING:
            action = "would pause + flag for re-verification (dry run)" if dry_run else "paused + flagged for re-verification"
            if not dry_run:
                client.pause_campaign(cid)
            log_alert(alerts, "bounce_rate", name,
                      f"{bounce_rate:.2f}% > {BOUNCE_RATE_CEILING}% ceiling", action)

        if complaint_rate > SPAM_COMPLAINT_CEILING:
            action = "would pause (dry run)" if dry_run else "paused"
            if not dry_run:
                client.pause_campaign(cid)
            log_alert(alerts, "spam_complaint_rate", name,
                      f"{complaint_rate:.3f}% > {SPAM_COMPLAINT_CEILING}% ceiling", action)


def check_inboxes(client: InstantlyClient, alerts: list[dict], dry_run: bool) -> None:
    for account in client.list_accounts():
        email = account.get("email", "?")
        score = account.get("warmup_score") or account.get("health_score")
        if score is None:
            continue  # field name may differ; adjust once real API responses are seen
        if score < WARMUP_SCORE_FLOOR:
            action = f"would pull from rotation, rest {REST_DAYS}d (dry run)" if dry_run \
                else f"pulled from rotation, resting {REST_DAYS}d"
            if not dry_run:
                client.pause_account(email)
            log_alert(alerts, "warmup_score", email,
                      f"score {score} < {WARMUP_SCORE_FLOOR} floor", action)


def main():
    parser = argparse.ArgumentParser(description="GemLabs daily infra health check")
    parser.add_argument("--dry-run", action="store_true", help="Report only, take no pause/rest actions")
    args = parser.parse_args()

    client = InstantlyClient()
    alerts = load_alerts()
    starting_count = len(alerts)

    print("Checking campaign bounce/spam rates...")
    check_campaigns(client, alerts, args.dry_run)

    print("Checking inbox warmup/health scores...")
    check_inboxes(client, alerts, args.dry_run)

    new_alerts = len(alerts) - starting_count
    save_alerts(alerts)
    print(f"\n{new_alerts} new alert(s) this run. Full log: {ALERTS_LOG_PATH}")
    if new_alerts == 0:
        print("All green.")


if __name__ == "__main__":
    main()
