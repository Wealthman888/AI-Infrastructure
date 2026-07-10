"""Skill B — bloomwell-lab-decoder.

Input: a lab PDF. Output: lab_panels + biomarkers rows, plus doctor_flags for
anything out of range.

Hard rules (also encoded in the system prompt):
- Extract-and-explain ONLY.
- Every out-of-range marker produces plain English + a question for the doctor.
- NEVER a supplement, food, or protocol suggestion. NEVER banned-list words.
- All user-facing strings pass copy_validator before insert (RULE 1).

Entry point: decode_pdf(pdf_path, profile_id)
"""

from __future__ import annotations

import base64
import json
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent / "validators"))

from common import MODEL_COACH, cached_system, get_anthropic, get_supabase
from copy_validator import validate_all

SYSTEM_PROMPT = """\
You are Bloomwell's lab decoder. You receive a lab report PDF and extract its
biomarkers. Bloomwell is a wellness coordinator, NOT a medical provider — you
extract and explain, you never advise.

Output ONLY a JSON object:
{
  "drawn_on": "YYYY-MM-DD" | null,
  "biomarkers": [
    {
      "name": "<canonical marker name, e.g. 'LDL-C', 'HbA1c', 'Vitamin D'>",
      "value": <number>,
      "unit": "<unit as printed>",
      "range_low": <number | null>,
      "range_high": <number | null>,
      "system_group": "metabolic" | "cardio" | "hormonal" | "immune" | "renal" | "hepatic" | "hematology" | "vitamins_minerals" | "other",
      "out_of_range": true | false,
      "plain_english": "<ONLY if out_of_range: 1-2 sentences on what this marker
                        generally relates to, in plain 8th-grade English. No causes
                        claimed for this person, no severity judgment.>",
      "question_for_doctor": "<ONLY if out_of_range: the exact question the user
                              should ask their physician about this result.>"
    }
  ]
}

HARD RULES for plain_english and question_for_doctor:
- NEVER suggest a supplement, food, dosage, protocol, or lifestyle fix.
- NEVER use: diagnose/diagnosis, treat/treatment, cure, prescribe/prescription,
  dosage/dose, deficiency (as a claim about this person), "you should take",
  "medical advice".
- Frame findings as "worth discussing with your doctor", "a pattern worth
  flagging", or "question for your next appointment".
- Do not speculate about what caused the result for this individual.
"""


def decode_pdf_bytes(pdf_bytes: bytes) -> dict:
    """Extract structured biomarkers from raw PDF bytes (no DB writes)."""
    client = get_anthropic()
    response = client.messages.create(
        model=MODEL_COACH,
        max_tokens=8192,
        system=cached_system(SYSTEM_PROMPT),
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "document",
                    "source": {
                        "type": "base64",
                        "media_type": "application/pdf",
                        "data": base64.standard_b64encode(pdf_bytes).decode(),
                    },
                },
                {"type": "text", "text": "Extract this lab report."},
            ],
        }],
    )
    raw = next((b.text for b in response.content if b.type == "text"), "{}")
    raw = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```")
    return json.loads(raw)


def decode_pdf(pdf_path: str, profile_id: str, source: str = "pdf_upload") -> dict:
    """Full pipeline: extract -> validate copy -> insert panel, biomarkers, flags."""
    parsed = decode_pdf_bytes(Path(pdf_path).read_bytes())

    # RULE 1: every user-facing string must clear the validator BEFORE insert.
    out_of_range = [b for b in parsed["biomarkers"] if b.get("out_of_range")]
    flag_texts = [b["plain_english"] for b in out_of_range] + \
                 [b["question_for_doctor"] for b in out_of_range]
    if flag_texts:
        result = validate_all(flag_texts, source="lab_decoder", profile_id=profile_id)
        if not result.ok:
            raise ValueError(
                f"lab_decoder output failed copy validation; not inserting. "
                f"Violations: {result.violations}"
            )

    sb = get_supabase()
    panel = sb.table("lab_panels").insert({
        "profile_id": profile_id,
        "drawn_on": parsed.get("drawn_on"),
        "source": source,
    }).execute().data[0]

    marker_rows = [{
        "panel_id": panel["id"],
        "name": b["name"],
        "value": b["value"],
        "unit": b.get("unit"),
        "range_low": b.get("range_low"),
        "range_high": b.get("range_high"),
        "system_group": b.get("system_group"),
    } for b in parsed["biomarkers"]]
    inserted = sb.table("biomarkers").insert(marker_rows).execute().data

    # RULE 2: out-of-range = doctor referral, always. The DB's generated `status`
    # column is authoritative; flag anything it marks below/above.
    by_name = {b["name"]: b for b in parsed["biomarkers"]}
    flags = []
    for row in inserted:
        if row["status"] in ("below", "above"):
            src = by_name.get(row["name"], {})
            flags.append({
                "profile_id": profile_id,
                "biomarker_id": row["id"],
                "plain_english": src.get("plain_english")
                    or f"{row['name']} came back outside its reference range — "
                       "worth discussing with your doctor.",
                "question_for_doctor": src.get("question_for_doctor")
                    or f"My {row['name']} was {row['value']} {row.get('unit') or ''} — "
                       "what could be worth looking into?",
            })
    if flags:
        sb.table("doctor_flags").insert(flags).execute()

    return {
        "panel_id": panel["id"],
        "biomarkers": len(inserted),
        "doctor_flags": len(flags),
    }


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("usage: python lab_decoder.py <lab.pdf> <profile_id>")
        sys.exit(1)
    print(json.dumps(decode_pdf(sys.argv[1], sys.argv[2]), indent=2))
