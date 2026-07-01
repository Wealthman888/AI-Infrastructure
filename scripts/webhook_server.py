"""
Receives Instantly.ai "reply received" webhooks, classifies the reply,
syncs it into the GHL 7-stage pipeline, fires the HeyGen personalized-video
force multiplier on positive replies, and routes the holding reply through
scripts/message_router.py (email only, 15-minute SLA).

Configure this URL as the reply webhook target in your Instantly campaign
settings. Instantly should be configured to include a shared secret header
(INSTANTLY_WEBHOOK_SECRET) so we can reject spoofed requests.

Run: python scripts/webhook_server.py
"""
import hmac
import logging
import os
import threading

from flask import Flask, jsonify, request

from datetime import datetime, timezone

from scripts.message_router import route as route_reply
from scripts.reply_classifier import classify
from tools.ghl_client import GHLClient
from tools.heygen_client import HeyGenClient
from tools.local_store import append_event

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("webhook_server")

app = Flask(__name__)


def _verify_secret(req) -> bool:
    expected = os.environ.get("INSTANTLY_WEBHOOK_SECRET")
    if not expected:
        log.warning("INSTANTLY_WEBHOOK_SECRET not set -- accepting all requests unverified. "
                     "Set it before going live.")
        return True
    provided = req.headers.get("X-Instantly-Secret", "")
    return hmac.compare_digest(provided, expected)


def _generate_heygen_video_async(first_name: str, company: str, findings: list[str], contact_id: str):
    def _run():
        try:
            client = HeyGenClient()
            video_url = client.generate_and_wait(first_name, company, findings)
            log.info(f"HeyGen video ready for {company}: {video_url}")
            # TODO: once the video is ready, push the URL back into GHL as a note /
            # custom field so whoever calls next has it, e.g.:
            # GHLClient().add_note(contact_id, f"HeyGen follow-up video: {video_url}")
        except Exception as e:  # noqa: BLE001
            log.error(f"HeyGen generation failed for {company}: {e}")

    threading.Thread(target=_run, daemon=True).start()


@app.route("/webhooks/instantly-reply", methods=["POST"])
def instantly_reply():
    if not _verify_secret(request):
        return jsonify({"error": "invalid secret"}), 401

    payload = request.get_json(force=True, silent=True) or {}
    email = payload.get("lead_email") or payload.get("email", "")
    first_name = payload.get("first_name", "")
    company = payload.get("company_name") or payload.get("company", "")
    reply_body = payload.get("reply_text") or payload.get("body", "")
    thread_id = payload.get("thread_id", "")
    from_account_email = payload.get("eaccount") or payload.get("campaign_account", "")
    findings = [f for f in [payload.get("specific_finding"), payload.get("specific_finding_2")] if f]
    monetary_value = payload.get("estimated_deal_value")  # optional, set upstream if known

    if not email:
        return jsonify({"error": "missing lead email"}), 400

    classification = classify(reply_body)
    log.info(f"Reply from {email} ({company}) classified as: {classification}")
    append_event("reply_log", {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "email": email, "company": company, "classification": classification,
    })

    ghl_result = {"skipped": True}
    try:
        ghl_result = GHLClient().sync_reply(
            email, first_name, company, classification, reply_body, monetary_value
        )
    except RuntimeError as e:
        log.warning(f"GHL sync skipped: {e}")

    router_result = {"skipped": True}
    try:
        router_result = route_reply(classification, reply_body, thread_id, from_account_email)
    except RuntimeError as e:
        log.warning(f"Message router skipped (Instantly reply not sent): {e}")

    if classification == "interested" and findings:
        contact_id = ghl_result.get("contact", {}).get("id", "") if isinstance(ghl_result, dict) else ""
        try:
            _generate_heygen_video_async(first_name, company, findings, contact_id)
        except RuntimeError as e:
            log.warning(f"HeyGen trigger skipped: {e}")

    return jsonify({
        "classification": classification,
        "ghl": ghl_result if isinstance(ghl_result, dict) and not ghl_result.get("skipped") else "skipped",
        "router": router_result,
    })


@app.route("/webhooks/ghl-closed", methods=["POST"])
def ghl_closed():
    """GHL should call this (configure as a pipeline-stage-change automation
    on the 'Closed' stage) so Panel 3 revenue attribution has real numbers.
    Expected payload: {contact_email, company, tier, deal_value}
    tier: one of "quick_win" ($397) / "starter" / "growth" / "pro" / "agency"
    """
    if not _verify_secret(request):
        return jsonify({"error": "invalid secret"}), 401

    payload = request.get_json(force=True, silent=True) or {}
    tier = payload.get("tier", "unknown")
    deal_value = payload.get("deal_value", 0)
    append_event("revenue_log", {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "email": payload.get("contact_email", ""),
        "company": payload.get("company", ""),
        "tier": tier,
        "deal_value": deal_value,
    })
    log.info(f"Logged close: {payload.get('company', '?')} -> {tier} (${deal_value})")
    return jsonify({"logged": True})


@app.route("/healthz", methods=["GET"])
def healthz():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    port = int(os.environ.get("WEBHOOK_SERVER_PORT", 8787))
    app.run(host="0.0.0.0", port=port)
