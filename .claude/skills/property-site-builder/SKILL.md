---
name: property-site-builder
description: >
  Builds a complete luxury real estate listing or agent website with AI-generated
  cinematic visuals in a single run. Use when the user wants a property page, listing
  site, or agent site that needs hero video, gallery films, and marketing stills.
  Orchestrates Higgsfield MCP (generate_video / generate_image) and the HTML build
  so visuals and page come together in one pass. Trigger phrases: "build a listing
  site", "luxury property page with visuals", "agent website with hero film",
  "generate the property visuals and the site".
---

# Property Site Builder (Axiom)

Turns a short property brief into a finished, visual-loaded listing page.
Runs Higgsfield generations async while building the page shell, then drops each
asset URL into its slot as it completes. One continuous run, no manual URL carrying.

## When to use
- Luxury single-property listing pages
- Agent / brokerage brand sites needing cinematic content
- Any build where the deliverable = web page + AI visuals together

## Requirements
- Higgsfield MCP connected in Claude Code (`claude mcp list` shows `higgsfield` green)
- Higgsfield credits available (hero film uses a premium video model — budget for it)
- Node not required; output is a single self-contained HTML file

## Inputs the skill collects (ask if missing — do NOT guess)
1. property_name           e.g. "Casa Lumière"
2. location / setting       coastal | desert | urban penthouse | classic estate
3. price                    e.g. "$6,950,000"
4. specs                    beds, baths, sqft, lot
5. agent_name + blurb
6. aesthetic keywords       e.g. "warm minimal, teal shadows, golden hour"
7. asset_tier               draft (cheap models) | premium (Veo/Kling for hero)
8. real_tour_url            optional — their existing Matterport/3D tour to embed

If the user gives a one-line brief, infer sensible defaults and STATE them, then proceed.

## Workflow (the "simultaneous" pass)

### Phase 1 — Fire all generations FIRST (async, non-blocking)
Submit every visual job before building anything, so they render while you work.
Use the prompt templates in `templates/visual_prompts.md`, filling in {setting}
and {aesthetic} from inputs. Submit in this order and capture each job id:

1. generate_video  → HERO film (premium model: Veo 3.1 or Kling 3.0). 16:9, ~8s.
2. generate_video  → great room interior. 16:9, ~6s.
3. generate_image  → infinity pool / signature exterior still (poster frame fallback).
4. generate_video  → primary suite. 16:9, ~5s.
5. generate_video  → social cut. 9:16 vertical, ~9s.

Do NOT wait on each before submitting the next. Collect all job ids, then poll
`get_generation_status` in a loop. See `scripts/orchestrate.md` for the polling pattern.

### Phase 2 — Build the page shell WHILE generations render
Copy `templates/listing.html` to the output dir. It has labeled slots:
  HERO_VIDEO_URL, GALLERY_1_VIDEO_URL, GALLERY_2_IMG_URL,
  SUITE_VIDEO_URL, SOCIAL_VIDEO_URL, HERO_POSTER_URL, TOUR_EMBED_URL
Fill in all TEXT content (name, price, specs, agent, copy) immediately — none of it
depends on the visuals.

### Phase 3 — Drop URLs as jobs complete
Each time a job returns `completed` with a result URL, replace the matching slot
token in the HTML. Use the image still as the hero <video> poster so the page looks
finished even before video buffers. Embed real_tour_url in TOUR_EMBED_URL if given;
otherwise leave the styled "tour integrates here" panel.

### Phase 4 — Finalize
- Verify every slot token is replaced (grep for remaining UPPER_CASE_URL tokens).
- If a generation failed, retry once; if still failing, leave its poster/placeholder
  and flag it in the summary rather than shipping a broken tag.
- Output single HTML file + a short manifest of which model produced each asset.

## Hard rules (Axiom brand + honesty)
- NEVER claim AI-generated "virtual tour" of a real property. Visuals are the
  cinematic STORYTELLING layer; a walkable tour requires their real capture, which
  embeds via TOUR_EMBED_URL.
- Keep all generation prompts "no people, no text" — clean plates for per-client branding.
- Hero film always runs on a premium model. Never economize the money shot.
- This is the visual + web layer of an Axiom offer, not a standalone product.

## Files
- templates/listing.html        — the page shell with slot tokens
- templates/visual_prompts.md    — parameterized Higgsfield prompts
- scripts/orchestrate.md         — submit-all-then-poll pattern + URL injection
