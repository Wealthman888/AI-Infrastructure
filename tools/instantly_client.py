"""
Thin wrapper around the Instantly.ai API v2 (https://developer.instantly.ai).

Every method returns parsed JSON (dict/list) or raises requests.HTTPError.
No business logic lives here -- that belongs in scripts/ and dashboard/server.py.
Reads INSTANTLY_API_KEY / INSTANTLY_BASE_URL from the environment (.env).
"""
import os
import requests
from dotenv import load_dotenv

load_dotenv()


class InstantlyClient:
    def __init__(self, api_key: str | None = None, base_url: str | None = None):
        self.api_key = api_key or os.environ.get("INSTANTLY_API_KEY")
        self.base_url = (base_url or os.environ.get(
            "INSTANTLY_BASE_URL", "https://api.instantly.ai/api/v2"
        )).rstrip("/")
        if not self.api_key:
            raise RuntimeError(
                "INSTANTLY_API_KEY is not set. Add it to .env (see .env.example)."
            )
        self._session = requests.Session()
        self._session.headers.update({
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        })

    def _get(self, path: str, params: dict | None = None) -> dict:
        r = self._session.get(f"{self.base_url}{path}", params=params, timeout=30)
        r.raise_for_status()
        return r.json()

    def _post(self, path: str, payload: dict | None = None) -> dict:
        r = self._session.post(f"{self.base_url}{path}", json=payload or {}, timeout=30)
        r.raise_for_status()
        return r.json()

    def _patch(self, path: str, payload: dict | None = None) -> dict:
        r = self._session.patch(f"{self.base_url}{path}", json=payload or {}, timeout=30)
        r.raise_for_status()
        return r.json()

    # ---- Accounts / inboxes -------------------------------------------------

    def list_accounts(self, limit: int = 100) -> list[dict]:
        """All sending inboxes with warmup status, health score, daily cap."""
        items, starting_after = [], None
        while True:
            params = {"limit": limit}
            if starting_after:
                params["starting_after"] = starting_after
            page = self._get("/accounts", params=params)
            batch = page.get("items", page if isinstance(page, list) else [])
            items.extend(batch)
            starting_after = page.get("next_starting_after") if isinstance(page, dict) else None
            if not starting_after or not batch:
                break
        return items

    def get_account(self, email: str) -> dict:
        return self._get(f"/accounts/{email}")

    def pause_account(self, email: str) -> dict:
        return self._post(f"/accounts/{email}/pause")

    def resume_account(self, email: str) -> dict:
        return self._post(f"/accounts/{email}/resume")

    def set_daily_limit(self, email: str, daily_limit: int) -> dict:
        return self._patch(f"/accounts/{email}", {"daily_limit": daily_limit})

    def set_warmup(self, email: str, enabled: bool, limit: int = 20) -> dict:
        return self._post(f"/accounts/{email}/warmup", {
            "warmup": {"enabled": enabled, "limit": limit},
        })

    # ---- Campaigns ------------------------------------------------------------

    def list_campaigns(self, limit: int = 100) -> list[dict]:
        page = self._get("/campaigns", params={"limit": limit})
        return page.get("items", page if isinstance(page, list) else [])

    def get_campaign(self, campaign_id: str) -> dict:
        return self._get(f"/campaigns/{campaign_id}")

    def get_campaign_analytics(self, campaign_id: str | None = None,
                                start_date: str | None = None,
                                end_date: str | None = None) -> dict:
        params = {}
        if campaign_id:
            params["campaign_id"] = campaign_id
        if start_date:
            params["start_date"] = start_date
        if end_date:
            params["end_date"] = end_date
        return self._get("/campaigns/analytics", params=params)

    def get_campaign_analytics_overview(self) -> dict:
        return self._get("/campaigns/analytics/overview")

    def pause_campaign(self, campaign_id: str) -> dict:
        return self._post(f"/campaigns/{campaign_id}/pause")

    def resume_campaign(self, campaign_id: str) -> dict:
        return self._post(f"/campaigns/{campaign_id}/resume")

    def add_leads_to_campaign(self, campaign_id: str, leads: list[dict]) -> dict:
        """leads: [{email, first_name, company_name, custom_variables: {...}}, ...]"""
        return self._post("/leads/list", {
            "campaign_id": campaign_id,
            "leads": leads,
        })

    # ---- Email verification ----------------------------------------------

    def verify_email(self, email: str) -> dict:
        return self._post("/email-verification", {"email": email})

    # ---- Unibox / replies ----------------------------------------------------

    def list_unibox_emails(self, campaign_id: str | None = None, limit: int = 50) -> list[dict]:
        params = {"limit": limit}
        if campaign_id:
            params["campaign_id"] = campaign_id
        page = self._get("/emails", params=params)
        return page.get("items", page if isinstance(page, list) else [])

    def reply_to_thread(self, thread_id: str, from_account_email: str, body_text: str) -> dict:
        """Sends a plain-text reply in an existing Unibox thread from the same
        inbox that originally sent the cold email. Email channel only --
        see scripts/message_router.py for the TCPA rule this enforces."""
        return self._post("/emails/reply", {
            "thread_id": thread_id,
            "eaccount": from_account_email,
            "body": {"text": body_text},
        })

    # ---- Health rollups used by dashboard/server.py --------------------------

    def infra_health(self) -> dict:
        """Aggregate bounce rate / spam rate / inbox status counts across all accounts."""
        accounts = self.list_accounts()
        live, warming, rested = [], [], []
        for a in accounts:
            status = (a.get("status") or "").lower()
            if status in ("paused", "resting", "rested"):
                rested.append(a)
            elif a.get("warmup_status") == "active" and not a.get("stopped"):
                warming.append(a)
            else:
                live.append(a)
        bounces = sum(a.get("bounced_count", 0) for a in accounts)
        sent = sum(a.get("sent_count", 0) for a in accounts) or 1
        complaints = sum(a.get("complaint_count", 0) for a in accounts)
        return {
            "total_inboxes": len(accounts),
            "live": len(live),
            "warming": len(warming),
            "rested": len(rested),
            "bounce_rate": round(bounces / sent * 100, 3),
            "spam_complaint_rate": round(complaints / sent * 100, 3),
            "accounts": accounts,
        }
