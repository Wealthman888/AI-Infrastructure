---
name: bloomwell-lab-decoder
description: Bloomwell Skill B — extract biomarkers from a lab PDF into lab_panels/biomarkers rows and create doctor_flags for out-of-range markers. Use when processing lab uploads or testing the lab decoding pipeline.
---

# Bloomwell Lab Decoder (Skill B)

Extracts a lab report PDF into `lab_panels` + `biomarkers` rows and creates
`doctor_flags` for anything out of range, using `claude-sonnet-4-6`.

## How to run

```bash
python bloomwell/agents/lab_decoder.py path/to/labs.pdf <profile_id>
```

## Hard rules (compliance-critical — do not weaken)

- **Extract-and-explain ONLY.** Every out-of-range marker produces plain English
  (what the marker generally relates to) + the exact question to ask a physician.
- **NEVER** a supplement, food, dosage, or protocol suggestion (RULE 2).
- **NEVER** banned-list words: diagnose, treat, cure, prescribe, dosage,
  deficiency-as-claim, "you should take", "medical advice" (RULE 1).
- All `plain_english` / `question_for_doctor` strings run through
  `bloomwell/validators/copy_validator.py` BEFORE insert; a failed validation
  aborts the whole insert.
- The DB's generated `biomarkers.status` column is authoritative for
  below/above/in_range — flags are created from it, not from the model's own
  out-of-range judgment.

## When modifying

The system prompt in `bloomwell/agents/lab_decoder.py` encodes the rules above —
any edit to it must keep RULE 1 and RULE 2 language intact and keep the prompt
static/cached. Test with `bloomwell/validators/test_copy_validator.py` plus a
sample PDF before shipping.
