"""
HeyGen wrapper for the "video on positive reply" force multiplier (Section 6).

The moment a lead replies interested, we generate a 60-second personalized
video walking through their 3 flagged audit findings. Reads HEYGEN_API_KEY /
HEYGEN_AVATAR_ID / HEYGEN_VOICE_ID from .env.
"""
import os
import time
import requests
from dotenv import load_dotenv

load_dotenv()

HEYGEN_BASE_URL = "https://api.heygen.com"


class HeyGenClient:
    def __init__(self, api_key: str | None = None, avatar_id: str | None = None,
                 voice_id: str | None = None):
        self.api_key = api_key or os.environ.get("HEYGEN_API_KEY")
        self.avatar_id = avatar_id or os.environ.get("HEYGEN_AVATAR_ID")
        self.voice_id = voice_id or os.environ.get("HEYGEN_VOICE_ID")
        if not self.api_key:
            raise RuntimeError("HEYGEN_API_KEY is not set. Add it to .env (see .env.example).")
        self._session = requests.Session()
        self._session.headers.update({
            "X-Api-Key": self.api_key,
            "Content-Type": "application/json",
        })

    def script_for_findings(self, first_name: str, company: str, findings: list[str]) -> str:
        bullet_lines = " Second, ".join(findings[:3]) if len(findings) > 1 else (findings[0] if findings else "")
        return (
            f"Hey {first_name}, quick video for you. I pulled up {company}'s online presence "
            f"and flagged a few things. First, {findings[0] if findings else 'a gap in your booking flow'}. "
            f"{('Second, ' + findings[1] + '.') if len(findings) > 1 else ''} "
            f"{('And third, ' + findings[2] + '.') if len(findings) > 2 else ''} "
            f"None of this is a big lift to fix -- happy to walk you through it on a quick call."
        )

    def generate_video(self, first_name: str, company: str, findings: list[str]) -> dict:
        script = self.script_for_findings(first_name, company, findings)
        payload = {
            "video_inputs": [{
                "character": {"type": "avatar", "avatar_id": self.avatar_id, "avatar_style": "normal"},
                "voice": {"type": "text", "input_text": script, "voice_id": self.voice_id},
            }],
            "dimension": {"width": 720, "height": 1280},
            "test": False,
        }
        r = self._session.post(f"{HEYGEN_BASE_URL}/v2/video/generate", json=payload, timeout=30)
        r.raise_for_status()
        return r.json()

    def poll_video_status(self, video_id: str, timeout_seconds: int = 300,
                           interval_seconds: int = 10) -> dict:
        deadline = time.time() + timeout_seconds
        while time.time() < deadline:
            r = self._session.get(
                f"{HEYGEN_BASE_URL}/v1/video_status.get", params={"video_id": video_id}, timeout=30
            )
            r.raise_for_status()
            data = r.json().get("data", {})
            if data.get("status") in ("completed", "failed"):
                return data
            time.sleep(interval_seconds)
        raise TimeoutError(f"HeyGen video {video_id} did not finish within {timeout_seconds}s")

    def generate_and_wait(self, first_name: str, company: str, findings: list[str]) -> str:
        """Returns the final video URL, or raises on failure/timeout."""
        resp = self.generate_video(first_name, company, findings)
        video_id = resp["data"]["video_id"]
        status = self.poll_video_status(video_id)
        if status.get("status") != "completed":
            raise RuntimeError(f"HeyGen video generation failed: {status}")
        return status["video_url"]
