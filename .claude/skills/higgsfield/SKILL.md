# Higgsfield Video Generation Skill

Use this skill whenever the user wants to generate AI videos, animate images, or create social media video content using Higgsfield.

## What Higgsfield Does

Higgsfield is an AI video generation platform that supports:
- **Text-to-Video**: Generate video from a text prompt alone
- **Image-to-Video**: Animate a static image with a prompt
- **Soul Mode**: Apply a reference face/style to generated video

Pricing: $0.10/second of generated video.

## Authentication

Set the environment variable before running any script:
```bash
export HIGGSFIELD_API_KEY="your_api_key_here"
```

Get your API key at: https://cloud.higgsfield.ai/ → API section.

## API Reference

**Base URL**: `https://platform.higgsfield.ai`

### Submit a Generation

```
POST /v1/generations
Authorization: Bearer {API_KEY}
Content-Type: application/json
```

**Text-to-Video body:**
```json
{
  "prompt": "A cinematic shot of a city at night, rain, neon lights",
  "model": "higgsfield-v3.5"
}
```

**Image-to-Video body:**
```json
{
  "prompt": "The person walks forward confidently",
  "image_url": "https://example.com/image.jpg",
  "model": "higgsfield-v3.5"
}
```

**Soul Mode body:**
```json
{
  "prompt": "Speaking directly to camera",
  "reference_image_urls": ["https://example.com/face.jpg"],
  "model": "higgsfield-v3.5"
}
```

Optional: Add `"seed": 42` for reproducible results.
Optional header: `X-Webhook-URL: https://your-server/webhook` for callback instead of polling.

**Response:**
```json
{
  "success": true,
  "request_id": "abc123",
  "status_url": "https://platform.higgsfield.ai/v2/requests/status/abc123"
}
```

### Poll Status

```
GET /v2/requests/status/{request_id}
Authorization: Bearer {API_KEY}
```

**Response:**
```json
{
  "request_id": "abc123",
  "status": "COMPLETED",
  "results": { "video_url": "https://..." }
}
```

Status values: `QUEUED` → `IN_PROGRESS` → `COMPLETED` | `FAILED` | `NSFW` | `CANCELLED`

Poll every 3–5 seconds until terminal status.

### Upload a File

```
POST /api/v1/upload_file
Authorization: Bearer {API_KEY}
Content-Type: multipart/form-data
```

Returns a URL you can pass as `image_url`.

## How to Help the User

### When they say "generate a video from this prompt":
1. Ask for the prompt if not given
2. Ask for an image URL if they want image-to-video
3. Run `agents/higgsfield_content_agent.py` or call the API directly
4. Poll until complete and return the video URL

### When they say "automate Higgsfield content":
1. Point them to `scripts/higgsfield_daily_content.py`
2. Ask what prompts/schedule they want
3. Update `CONTENT_PROMPTS` in that file with their topics
4. Set up a cron job: `0 9 * * * python scripts/higgsfield_daily_content.py`

### When they want to run the agent interactively:
```bash
python agents/higgsfield_content_agent.py
```

## Quick Install

```bash
pip install higgsfield-client httpx anthropic
export HIGGSFIELD_API_KEY="your_key"
export ANTHROPIC_API_KEY="your_key"
```

## File Map

| File | Purpose |
|------|---------|
| `tools/higgsfield.py` | Low-level API wrapper (submit, poll, upload) |
| `agents/higgsfield_content_agent.py` | Claude agent with Higgsfield tools |
| `scripts/higgsfield_daily_content.py` | Scheduled batch automation |
