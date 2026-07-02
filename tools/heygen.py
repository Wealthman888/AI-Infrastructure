"""Wrapper around the HeyGen v2 API for personalized video generation."""

import os

import requests

BASE_URL = "https://api.heygen.com"


class HeyGenClient:
    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or os.environ["HEYGEN_API_KEY"]
        self.session = requests.Session()
        self.session.headers.update({"X-Api-Key": self.api_key})

    def remaining_quota(self) -> dict:
        resp = self.session.get(f"{BASE_URL}/v2/user/remaining_quota", timeout=30)
        resp.raise_for_status()
        return resp.json()["data"]

    def generate_video(self, avatar_id: str, voice_id: str, script: str, title: str = "") -> dict:
        payload = {
            "video_inputs": [
                {
                    "character": {"type": "avatar", "avatar_id": avatar_id},
                    "voice": {"type": "text", "input_text": script, "voice_id": voice_id},
                }
            ],
            "test": False,
            "title": title,
        }
        resp = self.session.post(f"{BASE_URL}/v2/video/generate", json=payload, timeout=60)
        resp.raise_for_status()
        return resp.json()["data"]
