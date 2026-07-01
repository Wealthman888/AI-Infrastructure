"""
Outreach Command Dashboard backend (Section 5). Polls the Instantly API on a
schedule, caches the result in memory, and serves it to the static frontend
(index.html/app.js) as JSON. Keeps the Instantly API key server-side only --
the frontend never talks to Instantly directly.

Falls back to generated demo data when INSTANTLY_API_KEY isn't set, so the
dashboard is fully clickable before you've wired up real credentials.

Run: python dashboard/server.py
Then open http://localhost:8080 (or $DASHBOARD_PORT).
"""
import os
import random
import sys
import threading
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

from flask import Flask, jsonify, send_from_directory

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))

from tools.local_store import read_events  # noqa: E402

try:
    from tools.instantly_client import InstantlyClient
    _client = InstantlyClient()
    DEMO_MODE = False
except RuntimeError:
    _client = None
    DEMO_MODE = True

app = Flask(__name__, static_folder=str(Path(__file__).parent), static_url_path="")

POLL_INTERVAL = int(os.environ.get("DASHBOARD_POLL_INTERVAL_SECONDS", 300))

_cache = {"health": None, "funnel": None, "last_polled": None}
_cache_lock = threading.Lock()

TIERS = {
    "quick_win": 397, "starter": 497, "growth": 997, "pro": 1997, "agency": 2997,
}

BENCHMARKS = {
    "open_rate": {"baseline": (40, 60), "gemlabs": (47, 62)},
    "reply_rate": {"baseline": (3, 8), "gemlabs": (15, 30)},
}

NICHE_CAMPAIGNS = ["detailing", "cleaning", "handyman"]


# ---- Demo data (used until INSTANTLY_API_KEY is set) --------------------------

def _demo_health() -> dict:
    return {
        "demo_mode": True,
        "total_inboxes": 15, "live": 15, "warming": 5, "rested": 0,
        "bounce_rate": round(random.uniform(0.5, 2.2), 2),
        "spam_complaint_rate": round(random.uniform(0.01, 0.06), 3),
        "domains": [
            {"domain": f"demo-domain-{i}.com", "health_score": random.randint(82, 99)}
            for i in range(1, 6)
        ],
    }


def _demo_funnel() -> dict:
    campaigns = []
    for niche in NICHE_CAMPAIGNS:
        sent = random.randint(400, 1200)
        opened = int(sent * random.uniform(0.45, 0.60))
        replied = int(opened * random.uniform(0.15, 0.28))
        positive = int(replied * random.uniform(0.4, 0.6))
        booked = int(positive * random.uniform(0.3, 0.5))
        delivered = int(booked * random.uniform(0.7, 0.9))
        closed = int(delivered * random.uniform(0.2, 0.4))
        campaigns.append({
            "campaign": niche, "sent": sent, "opened": opened, "replied": replied,
            "positive_reply": positive, "call_booked": booked, "audit_delivered": delivered,
            "closed": closed,
            "open_rate": round(opened / sent * 100, 1),
            "reply_rate": round(replied / sent * 100, 1),
        })
    return {"demo_mode": True, "campaigns": campaigns, "benchmarks": BENCHMARKS}


# ---- Live data (Instantly-backed) ----------------------------------------

def _live_health() -> dict:
    return {"demo_mode": False, **_client.infra_health()}


def _live_funnel() -> dict:
    campaigns_out = []
    for c in _client.list_campaigns():
        cid = c.get("id")
        analytics = _client.get_campaign_analytics(campaign_id=cid)
        sent = analytics.get("sent_count", 0) or 1
        opened = analytics.get("open_count", 0)
        replied = analytics.get("reply_count", 0)
        campaigns_out.append({
            "campaign": c.get("name", cid),
            "sent": sent, "opened": opened, "replied": replied,
            "open_rate": round(opened / sent * 100, 1),
            "reply_rate": round(replied / sent * 100, 1),
        })
    return {"demo_mode": False, "campaigns": campaigns_out, "benchmarks": BENCHMARKS}


# ---- Poller ----------------------------------------------------------------

def _poll_loop():
    while True:
        try:
            health = _demo_health() if DEMO_MODE else _live_health()
            funnel = _demo_funnel() if DEMO_MODE else _live_funnel()
            with _cache_lock:
                _cache["health"] = health
                _cache["funnel"] = funnel
                _cache["last_polled"] = datetime.now(timezone.utc).isoformat()
        except Exception as e:  # noqa: BLE001
            print(f"[poller] error: {e}", file=sys.stderr)
        time.sleep(POLL_INTERVAL)


# ---- Routes -----------------------------------------------------------------

@app.route("/api/health")
def api_health():
    with _cache_lock:
        return jsonify(_cache["health"] or _demo_health())


@app.route("/api/funnel")
def api_funnel():
    with _cache_lock:
        return jsonify(_cache["funnel"] or _demo_funnel())


@app.route("/api/reply-sentiment")
def api_reply_sentiment():
    events = read_events("reply_log")
    counts = {"interested": 0, "question": 0, "not_now": 0, "negative": 0, "unsubscribe": 0}
    for e in events:
        c = e.get("classification")
        if c in counts:
            counts[c] += 1
    if not events and DEMO_MODE:
        counts = {"interested": 38, "question": 22, "not_now": 19, "negative": 6, "unsubscribe": 3}
    return jsonify(counts)


@app.route("/api/revenue")
def api_revenue():
    events = read_events("revenue_log")
    if not events and DEMO_MODE:
        events = [
            {"tier": "starter", "deal_value": 497}, {"tier": "growth", "deal_value": 997},
            {"tier": "growth", "deal_value": 997}, {"tier": "quick_win", "deal_value": 397},
            {"tier": "pro", "deal_value": 1997},
        ]
    closes_by_tier = {}
    total_mrr = 0
    for e in events:
        tier = e.get("tier", "unknown")
        closes_by_tier[tier] = closes_by_tier.get(tier, 0) + 1
        total_mrr += e.get("deal_value", 0)

    with _cache_lock:
        funnel = _cache["funnel"] or _demo_funnel()
    calls_booked = sum(c.get("call_booked", 0) for c in funnel.get("campaigns", []))
    total_closes = len(events)
    close_rate = round(total_closes / calls_booked * 100, 1) if calls_booked else 0

    return jsonify({
        "demo_mode": DEMO_MODE and not events,
        "closes_by_tier": closes_by_tier,
        "total_closes": total_closes,
        "calls_booked": calls_booked,
        "close_rate_pct": close_rate,
        "revenue_this_period": total_mrr,
        "growth_client_breakeven_target": 3,
        "growth_clients_closed": closes_by_tier.get("growth", 0),
    })


@app.route("/api/scaling")
def api_scaling():
    import json
    inventory_path = REPO_ROOT / "data" / "inbox_inventory.json"
    alerts_path = REPO_ROOT / "data" / "alerts_log.json"
    inventory = json.loads(inventory_path.read_text()) if inventory_path.exists() else {}
    alerts = json.loads(alerts_path.read_text()) if alerts_path.exists() else []
    return jsonify({
        "demo_mode": inventory.get("_readme", "").startswith("PLACEHOLDER"),
        "cohorts": inventory.get("cohorts", []),
        "recent_alerts": alerts[-20:],
    })


@app.route("/api/meta")
def api_meta():
    with _cache_lock:
        return jsonify({"demo_mode": DEMO_MODE, "last_polled": _cache["last_polled"],
                         "poll_interval_seconds": POLL_INTERVAL})


@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")


if __name__ == "__main__":
    threading.Thread(target=_poll_loop, daemon=True).start()
    if DEMO_MODE:
        print("INSTANTLY_API_KEY not set -- dashboard running in DEMO MODE with generated data.")
    port = int(os.environ.get("DASHBOARD_PORT", 8080))
    app.run(host="0.0.0.0", port=port)
