"""
Reply-handling SLA router (Section 6): every positive reply gets a holding
reply within 15 minutes during business hours, automated if a human isn't
fast enough. Speed-to-lead is the single highest-leverage close variable.

TCPA RULE, ENFORCED HERE, NOT JUST DOCUMENTED: this router is email-only.
There is no SMS send path in this file. Do not add one without a signed A2P
10DLC consent record for the specific lead -- that consent doesn't exist for
cold-outbound leads, so SMS is out of scope for this channel entirely.

Called by scripts/webhook_server.py right after a reply is classified.
"""
import os
from datetime import datetime, time as dtime
from zoneinfo import ZoneInfo

from scripts.reply_classifier import match_objection
from tools.instantly_client import InstantlyClient

BUSINESS_TZ = ZoneInfo(os.environ.get("BUSINESS_TZ", "America/Los_Angeles"))
BUSINESS_HOURS = (dtime(8, 0), dtime(18, 0))

HOLDING_REPLY_TEMPLATES = {
    "interested": (
        "Hey, thanks for the reply! Give me just a few minutes and I'll get you the full "
        "breakdown / grab a time on the calendar."
    ),
    "question": (
        "Good question, let me pull that together properly so I give you a real answer "
        "instead of a rushed one. Back to you shortly."
    ),
}


def is_business_hours(now: datetime | None = None) -> bool:
    now = now or datetime.now(BUSINESS_TZ)
    if now.weekday() >= 5:
        return False
    return BUSINESS_HOURS[0] <= now.time() <= BUSINESS_HOURS[1]


def route(classification: str, reply_body: str, thread_id: str,
          from_account_email: str, client: InstantlyClient | None = None) -> dict:
    """Email-only routing. Returns what action was taken so the caller
    (scripts/webhook_server.py) can log it and update the dashboard funnel."""
    client = client or InstantlyClient()
    actions = {"classification": classification, "holding_reply_sent": False,
               "suggested_objection_response": None}

    if classification in ("interested", "question"):
        if is_business_hours():
            body = HOLDING_REPLY_TEMPLATES.get(classification, HOLDING_REPLY_TEMPLATES["question"])
            client.reply_to_thread(thread_id, from_account_email, body)
            actions["holding_reply_sent"] = True
        objection = match_objection(reply_body)
        if objection:
            actions["suggested_objection_response"] = objection["response"]
            actions["matched_objection"] = objection["name"]

    elif classification == "not_now":
        actions["nurture"] = "closed_lost_60_day_requeue"  # Section 6 quarterly re-audit hook

    elif classification in ("negative", "unsubscribe"):
        actions["suppress"] = True

    return actions
