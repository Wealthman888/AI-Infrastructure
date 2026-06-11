# Orchestration — submit-all, then poll, then inject

This is the pattern that makes the build feel "simultaneous": all generations are
in flight before the page build starts, and URLs are injected as they land.

## Step 1 — Submit all jobs (do not await between them)
For each of the 5 prompts in visual_prompts.md, call the Higgsfield tool and record:
  { slot_token, job_id, model, kind: video|image }

Slot tokens (must match templates/listing.html exactly):
  HERO_VIDEO_URL      ← prompt 1 (video)
  GALLERY_1_VIDEO_URL ← prompt 2 (video)
  GALLERY_2_IMG_URL   ← prompt 3 (image)  ← also used as HERO_POSTER_URL
  SUITE_VIDEO_URL     ← prompt 4 (video)
  SOCIAL_VIDEO_URL    ← prompt 5 (video)

## Step 2 — Build the page shell now (parallel work)
While jobs render, copy listing.html to the output dir and fill ALL text content.
None of the text depends on visuals, so the page is ~90% done before any render lands.

## Step 3 — Poll and inject
Loop get_generation_status over outstanding job_ids (every ~10s, cap ~5 min):
  - on completed: take result URL, replace its slot_token everywhere in the HTML.
  - set HERO_POSTER_URL = the image still URL (prompt 3) so hero looks finished
    before the video buffers.
  - on failed: retry once. If it fails again, leave the styled placeholder for that
    slot and add a line to the manifest.

## Step 4 — Verify
Grep the HTML for any remaining tokens matching /[A-Z0-9_]+_URL/. If any remain
unreplaced AND no placeholder fallback is in place, do not ship — flag it.

## Step 5 — Manifest
Emit visuals_manifest.md:
  | slot | model | job_id | status | url |
So the build is auditable and assets are reusable in GHL packaging.

## Notes
- Higgsfield tool surface (per current MCP): generate_image, generate_video,
  get_generation_status, create_character, list_characters.
- Renders typically complete in 30–90s; premium video can be longer.
- This skill produces the visual+web layer only; hand the manifest to the GHL
  packaging step downstream.
