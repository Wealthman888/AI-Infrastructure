"""Reusable wrapper around the HeyGen API for use by agents.

Covers video generation, avatar/voice listing, video status, and quota.
Requires HEYGEN_API_KEY in the environment.
"""

import os
import time
import httpx

BASE_URL = "https://api.heygen.com"


def _headers() -> dict:
    key = os.environ.get("HEYGEN_API_KEY")
    if not key:
        raise RuntimeError("HEYGEN_API_KEY environment variable is not set")
    return {"X-Api-Key": key, "Content-Type": "application/json"}


def _get(path: str, params: dict | None = None) -> dict:
    r = httpx.get(f"{BASE_URL}{path}", headers=_headers(), params=params, timeout=30)
    r.raise_for_status()
    return r.json()


def _post(path: str, body: dict) -> dict:
    r = httpx.post(f"{BASE_URL}{path}", headers=_headers(), json=body, timeout=30)
    r.raise_for_status()
    return r.json()


# --- Avatars & Voices ---

def list_avatars() -> dict:
    return _get("/v2/avatars")


def list_voices(language: str | None = None) -> dict:
    params = {}
    if language:
        params["language"] = language
    return _get("/v2/voices", params)


# --- Video Generation ---

def generate_video(
    avatar_id: str,
    voice_id: str,
    script: str,
    background_color: str = "#ffffff",
    width: int = 1280,
    height: int = 720,
    title: str = "Generated Video",
) -> dict:
    """Generate an AI avatar video with a voice-over script."""
    payload = {
        "video_inputs": [
            {
                "character": {
                    "type": "avatar",
                    "avatar_id": avatar_id,
                    "avatar_style": "normal",
                },
                "voice": {
                    "type": "text",
                    "input_text": script,
                    "voice_id": voice_id,
                },
                "background": {
                    "type": "color",
                    "value": background_color,
                },
            }
        ],
        "dimension": {"width": width, "height": height},
        "title": title,
    }
    return _post("/v2/video/generate", payload)


def get_video_status(video_id: str) -> dict:
    return _get("/v1/video_status.get", {"video_id": video_id})


def wait_for_video(video_id: str, poll_interval: int = 10, max_wait: int = 600) -> dict:
    """Poll until a video finishes processing or max_wait seconds elapse."""
    elapsed = 0
    while elapsed < max_wait:
        status = get_video_status(video_id)
        data = status.get("data", {})
        if data.get("status") in ("completed", "failed"):
            return status
        time.sleep(poll_interval)
        elapsed += poll_interval
    return {"error": "Timed out waiting for video", "video_id": video_id}


def list_videos(page: int = 1, limit: int = 20) -> dict:
    return _get("/v1/video.list", {"page": page, "limit": limit})


def delete_video(video_id: str) -> dict:
    return _post("/v1/video.delete", {"video_id": video_id})


# --- Talking Photo ---

def generate_talking_photo(photo_url: str, voice_id: str, script: str) -> dict:
    """Generate a talking photo video (animate a still image with voice)."""
    payload = {
        "video_inputs": [
            {
                "character": {
                    "type": "talking_photo",
                    "talking_photo_url": photo_url,
                },
                "voice": {
                    "type": "text",
                    "input_text": script,
                    "voice_id": voice_id,
                },
            }
        ],
        "dimension": {"width": 720, "height": 720},
    }
    return _post("/v2/video/generate", payload)


# --- Quota ---

def get_quota() -> dict:
    return _get("/v1/user/remaining_quota")


TOOL_DEFINITIONS = [
    {
        "name": "heygen_list_avatars",
        "description": "List all available HeyGen AI avatars.",
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "heygen_list_voices",
        "description": "List available HeyGen voices. Optionally filter by language code (e.g. 'en', 'es').",
        "input_schema": {
            "type": "object",
            "properties": {
                "language": {"type": "string", "description": "Language code filter (e.g. 'en', 'es', 'fr')."},
            },
        },
    },
    {
        "name": "heygen_generate_video",
        "description": "Generate an AI avatar video with a spoken script. Returns a video_id to poll for completion.",
        "input_schema": {
            "type": "object",
            "properties": {
                "avatar_id": {"type": "string", "description": "HeyGen avatar ID."},
                "voice_id": {"type": "string", "description": "HeyGen voice ID."},
                "script": {"type": "string", "description": "The text the avatar will speak."},
                "title": {"type": "string", "description": "Title for the generated video."},
                "background_color": {"type": "string", "default": "#ffffff"},
                "width": {"type": "integer", "default": 1280},
                "height": {"type": "integer", "default": 720},
            },
            "required": ["avatar_id", "voice_id", "script"],
        },
    },
    {
        "name": "heygen_video_status",
        "description": "Check the processing status of a HeyGen video. Returns status and download URL when complete.",
        "input_schema": {
            "type": "object",
            "properties": {
                "video_id": {"type": "string"},
            },
            "required": ["video_id"],
        },
    },
    {
        "name": "heygen_wait_for_video",
        "description": "Poll until a HeyGen video finishes processing and return the final status with download URL.",
        "input_schema": {
            "type": "object",
            "properties": {
                "video_id": {"type": "string"},
                "max_wait": {"type": "integer", "default": 600, "description": "Max seconds to wait."},
            },
            "required": ["video_id"],
        },
    },
    {
        "name": "heygen_talking_photo",
        "description": "Generate a talking photo video — animate a still image with a spoken script.",
        "input_schema": {
            "type": "object",
            "properties": {
                "photo_url": {"type": "string", "description": "Public URL of the photo to animate."},
                "voice_id": {"type": "string"},
                "script": {"type": "string", "description": "Text the photo will speak."},
            },
            "required": ["photo_url", "voice_id", "script"],
        },
    },
    {
        "name": "heygen_list_videos",
        "description": "List previously generated HeyGen videos.",
        "input_schema": {
            "type": "object",
            "properties": {
                "page": {"type": "integer", "default": 1},
                "limit": {"type": "integer", "default": 20},
            },
        },
    },
    {
        "name": "heygen_get_quota",
        "description": "Get remaining HeyGen API credit quota.",
        "input_schema": {"type": "object", "properties": {}},
    },
]


def call_tool(name: str, tool_input: dict) -> dict:
    if name == "heygen_list_avatars":
        return list_avatars()
    if name == "heygen_list_voices":
        return list_voices(tool_input.get("language"))
    if name == "heygen_generate_video":
        return generate_video(
            tool_input["avatar_id"],
            tool_input["voice_id"],
            tool_input["script"],
            tool_input.get("background_color", "#ffffff"),
            tool_input.get("width", 1280),
            tool_input.get("height", 720),
            tool_input.get("title", "Generated Video"),
        )
    if name == "heygen_video_status":
        return get_video_status(tool_input["video_id"])
    if name == "heygen_wait_for_video":
        return wait_for_video(tool_input["video_id"], max_wait=tool_input.get("max_wait", 600))
    if name == "heygen_talking_photo":
        return generate_talking_photo(tool_input["photo_url"], tool_input["voice_id"], tool_input["script"])
    if name == "heygen_list_videos":
        return list_videos(tool_input.get("page", 1), tool_input.get("limit", 20))
    if name == "heygen_get_quota":
        return get_quota()
    raise ValueError(f"Unknown tool: {name}")
