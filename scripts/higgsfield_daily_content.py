"""
Higgsfield daily content automation.

Generates a batch of AI videos from a content calendar and saves the
results to a JSON log. Designed to run as a daily cron job.

Cron setup (runs every day at 9 AM):
    0 9 * * * cd /path/to/AI-Infrastructure && python scripts/higgsfield_daily_content.py

Outputs:
    scripts/higgsfield_content_log.json   — append-only log of all generations
    scripts/higgsfield_latest_batch.json  — results from the most recent run
"""

import json
import os
import sys
from datetime import datetime

import anthropic

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from tools.higgsfield import generate_and_wait

# ---------------------------------------------------------------------------
# CONTENT CALENDAR — Edit these prompts to match your brand / campaign
# ---------------------------------------------------------------------------
CONTENT_PROMPTS = [
    {
        "label": "morning_motivation",
        "prompt": (
            "Cinematic slow-motion sunrise over a mountain range, golden hour light, "
            "lens flare, motivational atmosphere, epic scale, 4K quality"
        ),
    },
    {
        "label": "product_showcase",
        "prompt": (
            "Sleek product reveal on a minimalist white surface, dramatic studio lighting, "
            "slow 360-degree rotation, shallow depth of field, premium brand feel"
        ),
    },
    {
        "label": "brand_story",
        "prompt": (
            "Time-lapse of a busy modern city transforming from dusk to dawn, "
            "neon reflections on wet streets, energetic and aspirational mood"
        ),
    },
]

LOG_PATH = os.path.join(os.path.dirname(__file__), "higgsfield_content_log.json")
LATEST_PATH = os.path.join(os.path.dirname(__file__), "higgsfield_latest_batch.json")

MODEL = "claude-haiku-4-5-20251001"  # cost-efficient for batch summarisation


def load_log() -> list:
    if os.path.exists(LOG_PATH):
        with open(LOG_PATH) as f:
            return json.load(f)
    return []


def save_log(entries: list) -> None:
    with open(LOG_PATH, "w") as f:
        json.dump(entries, f, indent=2)


def enrich_prompt_with_claude(base_prompt: str, label: str) -> str:
    """Use Claude to expand the base prompt into a more vivid, platform-ready description."""
    client = anthropic.Anthropic()
    response = client.messages.create(
        model=MODEL,
        max_tokens=256,
        messages=[
            {
                "type": "text",
                "text": (
                    f"You are a social media video director. Expand this prompt into a single "
                    f"vivid, cinematic sentence (max 80 words) optimised for AI video generation. "
                    f"Label/context: {label}.\n\nBase prompt: {base_prompt}\n\nExpanded prompt:"
                ),
                "cache_control": {"type": "ephemeral"},
            }
        ],
    )
    return response.content[0].text.strip()


def run_batch() -> list[dict]:
    run_id = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    results = []

    for item in CONTENT_PROMPTS:
        label = item["label"]
        print(f"\n[{label}] Enriching prompt with Claude...")
        try:
            enriched = enrich_prompt_with_claude(item["prompt"], label)
            print(f"  → {enriched[:80]}...")

            print(f"[{label}] Submitting to Higgsfield...")
            video_url = generate_and_wait(prompt=enriched)

            entry = {
                "run_id": run_id,
                "label": label,
                "timestamp": datetime.utcnow().isoformat(),
                "base_prompt": item["prompt"],
                "enriched_prompt": enriched,
                "video_url": video_url,
                "status": "success",
            }
            print(f"[{label}] Done → {video_url}")

        except Exception as exc:
            entry = {
                "run_id": run_id,
                "label": label,
                "timestamp": datetime.utcnow().isoformat(),
                "base_prompt": item["prompt"],
                "status": "error",
                "error": str(exc),
            }
            print(f"[{label}] ERROR: {exc}")

        results.append(entry)

    return results


def main():
    print(f"=== Higgsfield Daily Content Automation — {datetime.utcnow().date()} ===\n")

    batch = run_batch()

    # Save latest batch
    with open(LATEST_PATH, "w") as f:
        json.dump(batch, f, indent=2)

    # Append to persistent log
    log = load_log()
    log.extend(batch)
    save_log(log)

    success = sum(1 for r in batch if r["status"] == "success")
    print(f"\n=== Batch complete: {success}/{len(batch)} succeeded ===")
    print(f"Results saved to {LATEST_PATH}")
    print(f"Log updated at {LOG_PATH}")

    return 0 if success == len(batch) else 1


if __name__ == "__main__":
    sys.exit(main())
