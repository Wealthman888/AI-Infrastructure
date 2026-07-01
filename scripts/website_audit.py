"""
Mini audit scanner -- produces the free Stage-1 teaser (3-5 flagged issues,
no call needed) and feeds the `signal_score` used to gate leads into a
sequence (ICP rule: 60+/100 before a lead enters any campaign).

This is a fast public-data pass, NOT the full 200-point audit (that's
delivered live on the Stage-2 call). It only checks what's visible from the
website + (optionally) Google Places, so it's cheap to run over a whole list.

Usage:
    python scripts/website_audit.py --url https://example.com --company "Example Detailing" --state NV
    python scripts/website_audit.py --csv leads.csv --out leads_scored.csv

CSV mode expects columns: company,website,city,state,phone,niche
Adds columns: signal_score,flagged_issues,specific_finding,qualifies
"""
import argparse
import csv
import re
import sys
import time
from dataclasses import dataclass, field

import requests

TIMEOUT = 10
UA = "Mozilla/5.0 (compatible; GemLabsAuditBot/1.0; +https://gemlabsagency.com)"

# Findings are written as they'll be dropped into {{specific_finding}} in Email 1 --
# lowercase-first, no trailing period, so they slot into a sentence naturally.
FINDING_LIBRARY = {
    "no_booking": "there's no way to book online -- everything routes through a phone call",
    "no_https": "the site isn't running on https, which browsers flag as \"not secure\"",
    "no_mobile_viewport": "the site isn't set up for mobile, and most of your traffic is on a phone",
    "no_contact_form": "there's no contact form, just a phone number, so after-hours leads have no way to reach you",
    "no_chat_or_after_hours": "there's nothing catching leads after you close for the day",
    "slow_site": "the site took over 4 seconds to load, which is long enough that people bounce",
    "no_reviews_widget": "reviews aren't showing anywhere on the site, even though that's what people check first",
    "thin_site": "the site is basically a single page with no service detail",
    "no_site": "there's no live website at all -- just a listing",
}

# Maps each finding to the GemLabs system that fixes it (used on the call, not in email).
FINDING_TO_SYSTEM = {
    "no_booking": "24/7 digital receptionist + booking system",
    "no_https": "web presence rebuild",
    "no_mobile_viewport": "mobile-first web presence rebuild",
    "no_contact_form": "digital receptionist (lead capture)",
    "no_chat_or_after_hours": "digital receptionist (after-hours capture)",
    "slow_site": "web presence rebuild",
    "no_reviews_widget": "reviews/reputation system",
    "thin_site": "web presence rebuild",
    "no_site": "web presence build + digital receptionist",
}

WEIGHTS = {
    "no_site": 30,
    "no_booking": 20,
    "no_chat_or_after_hours": 15,
    "no_contact_form": 12,
    "no_https": 8,
    "no_mobile_viewport": 8,
    "slow_site": 4,
    "no_reviews_widget": 2,
    "thin_site": 1,
}

BOOKING_SIGNALS = re.compile(
    r"calendly|acuity|square\s?appointments|schedul(e|ing)|book\s?(now|online|appointment)|setmore|booksy",
    re.I,
)
CHAT_SIGNALS = re.compile(r"intercom|drift|tawk\.to|livechat|crisp\.chat|zendesk\s?chat|tidio", re.I)
REVIEW_SIGNALS = re.compile(r"google.*review|yelp|trustpilot|birdeye|podium|reviews?\.io", re.I)


@dataclass
class AuditResult:
    company: str
    website: str
    reachable: bool = False
    flags: list = field(default_factory=list)
    signal_score: int = 0
    qualifies: bool = False
    specific_findings: list = field(default_factory=list)

    def to_row(self) -> dict:
        return {
            "company": self.company,
            "website": self.website,
            "signal_score": self.signal_score,
            "qualifies": self.qualifies,
            "flagged_issues": ";".join(self.flags),
            "specific_finding": self.specific_findings[0] if self.specific_findings else "",
            "specific_finding_2": self.specific_findings[1] if len(self.specific_findings) > 1 else "",
        }


def audit_site(company: str, website: str) -> AuditResult:
    result = AuditResult(company=company, website=website)

    if not website:
        result.flags.append("no_site")
        result.specific_findings.append(FINDING_LIBRARY["no_site"])
        result.signal_score = _score(result.flags)
        result.qualifies = result.signal_score >= 60
        return result

    url = website if website.startswith("http") else f"https://{website}"
    start = time.time()
    try:
        resp = requests.get(url, timeout=TIMEOUT, headers={"User-Agent": UA}, allow_redirects=True)
        elapsed = time.time() - start
        result.reachable = True
    except requests.RequestException:
        result.flags.append("no_site")
        result.specific_findings.append(FINDING_LIBRARY["no_site"])
        result.signal_score = _score(result.flags)
        result.qualifies = result.signal_score >= 60
        return result

    html = resp.text or ""
    final_url = resp.url

    if not final_url.startswith("https://"):
        result.flags.append("no_https")
    if "viewport" not in html.lower():
        result.flags.append("no_mobile_viewport")
    if not BOOKING_SIGNALS.search(html):
        result.flags.append("no_booking")
    if "<form" not in html.lower():
        result.flags.append("no_contact_form")
    if not CHAT_SIGNALS.search(html):
        result.flags.append("no_chat_or_after_hours")
    if elapsed > 4:
        result.flags.append("slow_site")
    if not REVIEW_SIGNALS.search(html):
        result.flags.append("no_reviews_widget")
    if len(html) < 3000:
        result.flags.append("thin_site")

    for flag in result.flags:
        if flag in FINDING_LIBRARY:
            result.specific_findings.append(FINDING_LIBRARY[flag])

    result.signal_score = _score(result.flags)
    result.qualifies = result.signal_score >= 60
    return result


def _score(flags: list[str]) -> int:
    """100 minus weighted penalties for each flagged issue, floored at 0.
    A pristine site (no flags) scores 100 -- but note pristine sites are
    exactly the ones that DON'T need us, so in practice the ICP sweet spot
    is 60-85 (visible pain, but not a completely absent business)."""
    penalty = sum(WEIGHTS.get(f, 0) for f in flags)
    return max(0, 100 - penalty)


def audit_csv(in_path: str, out_path: str) -> None:
    with open(in_path, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    fieldnames = list(rows[0].keys()) if rows else []
    for extra in ["signal_score", "qualifies", "flagged_issues", "specific_finding", "specific_finding_2"]:
        if extra not in fieldnames:
            fieldnames.append(extra)

    scored = []
    for row in rows:
        result = audit_site(row.get("company", ""), row.get("website", ""))
        row.update(result.to_row())
        scored.append(row)
        print(f"  {row.get('company', '?'):35s} score={result.signal_score:3d}  qualifies={result.qualifies}")

    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(scored)

    qualified = sum(1 for r in scored if r["qualifies"])
    print(f"\n{qualified}/{len(scored)} leads scored 60+/100 and qualify for a sequence.")
    print(f"Wrote {out_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="GemLabs mini audit scanner")
    parser.add_argument("--url", help="Single website to scan")
    parser.add_argument("--company", default="", help="Company name for single-URL mode")
    parser.add_argument("--csv", help="CSV of leads to batch-score (columns: company,website,...)")
    parser.add_argument("--out", help="Output CSV path (batch mode)")
    args = parser.parse_args()

    if args.csv:
        if not args.out:
            print("--out is required with --csv", file=sys.stderr)
            sys.exit(1)
        audit_csv(args.csv, args.out)
    elif args.url:
        result = audit_site(args.company or args.url, args.url)
        print(f"Signal score: {result.signal_score}/100  qualifies: {result.qualifies}")
        print("Flags:", ", ".join(result.flags) or "none")
        for finding in result.specific_findings:
            print(" -", finding)
    else:
        parser.print_help()
