"""
Lead intake pipeline: raw CSV -> deduped, scored, verified, niche-routed,
Instantly-ready CSVs (one per niche campaign, matching sequences/<niche>/).

Steps:
  1. Dedupe on email (fallback: company+phone)
  2. Score via scripts/website_audit.py (signal_score, specific_finding)
  3. Drop anything under the 60/100 ICP threshold
  4. Verify email deliverability via Instantly's verifier (skips silently if
     INSTANTLY_API_KEY isn't set -- verification is a hard requirement before
     any live send, but you can score/route without it during dry runs)
  5. Attach niche_pain / local_proof from data/niche_angles.json
  6. Split into sequences/<niche>/leads_ready.csv

Input CSV columns required: email,first_name,company,website,city,state,phone,niche
("niche" must match a key in data/niche_angles.json)

Usage:
    python scripts/lead_pipeline.py --in raw_leads.csv --skip-verify   # dry run, no Instantly calls
    python scripts/lead_pipeline.py --in raw_leads.csv                 # full pipeline, needs INSTANTLY_API_KEY
"""
import argparse
import csv
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scripts.website_audit import audit_site  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parent.parent
NICHE_ANGLES_PATH = REPO_ROOT / "data" / "niche_angles.json"


def load_niche_angles() -> dict:
    with open(NICHE_ANGLES_PATH) as f:
        return json.load(f)


def dedupe(rows: list[dict]) -> list[dict]:
    seen = set()
    out = []
    for row in rows:
        key = (row.get("email", "").strip().lower()
               or f"{row.get('company', '').strip().lower()}|{row.get('phone', '').strip()}")
        if key in seen or not key:
            continue
        seen.add(key)
        out.append(row)
    return out


def verify_emails(rows: list[dict]) -> list[dict]:
    try:
        from tools.instantly_client import InstantlyClient
        client = InstantlyClient()
    except RuntimeError:
        print("  [skip] INSTANTLY_API_KEY not set -- skipping email verification. "
              "Do NOT send live without verifying first (list hygiene rule).")
        for row in rows:
            row["email_verification"] = "skipped"
        return rows

    verified = []
    for row in rows:
        email = row.get("email", "").strip()
        if not email:
            continue
        try:
            result = client.verify_email(email)
            status = result.get("status", "unknown")
        except Exception as e:  # noqa: BLE001
            status = f"error:{e}"
        row["email_verification"] = status
        if status in ("valid", "skipped"):
            verified.append(row)
        else:
            print(f"  [drop] {email} -> {status} (risky/catch-all/invalid, not sent in first 60 days)")
    return verified


def score_and_filter(rows: list[dict]) -> list[dict]:
    qualified = []
    for row in rows:
        result = audit_site(row.get("company", ""), row.get("website", ""))
        row["signal_score"] = result.signal_score
        row["specific_finding"] = result.specific_findings[0] if result.specific_findings else ""
        row["specific_finding_2"] = result.specific_findings[1] if len(result.specific_findings) > 1 else ""
        row["flagged_issues"] = ";".join(result.flags)
        if result.qualifies:
            qualified.append(row)
        else:
            print(f"  [drop] {row.get('company', '?')} -> score {result.signal_score}/100, below 60 threshold")
    return qualified


def attach_niche_angle(rows: list[dict], angles: dict) -> list[dict]:
    out = []
    for row in rows:
        niche = row.get("niche", "").strip().lower().replace(" ", "_")
        angle = angles.get(niche)
        if not angle:
            print(f"  [drop] {row.get('company', '?')} -> unknown niche '{row.get('niche')}', "
                  f"not in data/niche_angles.json")
            continue
        row["niche"] = niche
        row["niche_pain"] = angle["niche_pain"]
        row["local_proof"] = angle["local_proof"]
        # Email 3 ("Cost of Nothing"): 2 missed touches/week * avg job value * 4.33 weeks/month
        row["monthly_leak"] = f"${round(angle['avg_job_value'] * 2 * 4.33):,}"
        out.append(row)
    return out


def write_per_niche(rows: list[dict]) -> None:
    by_niche: dict[str, list[dict]] = {}
    for row in rows:
        by_niche.setdefault(row["niche"], []).append(row)

    columns = ["email", "first_name", "company", "city", "state", "phone",
               "niche", "specific_finding", "specific_finding_2", "niche_pain",
               "local_proof", "monthly_leak", "signal_score", "email_verification"]

    for niche, niche_rows in by_niche.items():
        out_dir = REPO_ROOT / "sequences" / niche
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / "leads_ready.csv"
        with open(out_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=columns, extrasaction="ignore")
            writer.writeheader()
            writer.writerows(niche_rows)
        print(f"  {niche}: {len(niche_rows)} leads -> {out_path}")


def main():
    parser = argparse.ArgumentParser(description="GemLabs lead intake pipeline")
    parser.add_argument("--in", dest="in_path", required=True, help="Raw lead CSV")
    parser.add_argument("--skip-verify", action="store_true",
                         help="Skip Instantly email verification (dry run only)")
    args = parser.parse_args()

    with open(args.in_path, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    print(f"Loaded {len(rows)} raw leads")

    rows = dedupe(rows)
    print(f"{len(rows)} after dedupe")

    print("Scoring against public site signals (60/100 threshold)...")
    rows = score_and_filter(rows)
    print(f"{len(rows)} qualify")

    if not args.skip_verify:
        print("Verifying deliverability via Instantly...")
        rows = verify_emails(rows)
        print(f"{len(rows)} pass verification")
    else:
        for row in rows:
            row["email_verification"] = "skipped (--skip-verify)"

    angles = load_niche_angles()
    rows = attach_niche_angle(rows, angles)
    print(f"{len(rows)} matched to a known niche angle")

    write_per_niche(rows)
    print(f"\nDone. {len(rows)} leads ready across {len({r['niche'] for r in rows})} niche campaign(s).")


if __name__ == "__main__":
    main()
