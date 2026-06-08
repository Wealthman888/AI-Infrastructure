"""Low-level Higgsfield API wrapper — submit generations, poll status, upload files."""

import os
import time
import httpx

BASE_URL = "https://platform.higgsfield.ai"
POLL_INTERVAL = 4  # seconds between status checks
MAX_POLL_SECONDS = 300  # 5-minute timeout


def _headers() -> dict:
    api_key = os.environ.get("HIGGSFIELD_API_KEY")
    if not api_key:
        raise EnvironmentError("HIGGSFIELD_API_KEY environment variable is not set.")
    return {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}


def submit_generation(
    prompt: str,
    image_url: str | None = None,
    reference_image_urls: list[str] | None = None,
    model: str = "higgsfield-v3.5",
    seed: int | None = None,
    webhook_url: str | None = None,
) -> dict:
    """Submit a video generation request. Returns the raw API response dict."""
    body: dict = {"prompt": prompt, "model": model}
    if image_url:
        body["image_url"] = image_url
    if reference_image_urls:
        body["reference_image_urls"] = reference_image_urls
    if seed is not None:
        body["seed"] = seed

    extra_headers = {}
    if webhook_url:
        extra_headers["X-Webhook-URL"] = webhook_url

    with httpx.Client(timeout=30) as client:
        resp = client.post(
            f"{BASE_URL}/v1/generations",
            headers={**_headers(), **extra_headers},
            json=body,
        )
        resp.raise_for_status()
        return resp.json()


def get_status(request_id: str) -> dict:
    """Check the status of a generation job."""
    with httpx.Client(timeout=30) as client:
        resp = client.get(
            f"{BASE_URL}/v2/requests/status/{request_id}",
            headers=_headers(),
        )
        resp.raise_for_status()
        return resp.json()


def wait_for_completion(request_id: str) -> dict:
    """Poll until the generation reaches a terminal state. Returns the final status dict."""
    terminal = {"COMPLETED", "FAILED", "NSFW", "CANCELLED"}
    elapsed = 0
    while elapsed < MAX_POLL_SECONDS:
        status = get_status(request_id)
        if status.get("status") in terminal:
            return status
        time.sleep(POLL_INTERVAL)
        elapsed += POLL_INTERVAL
    raise TimeoutError(f"Generation {request_id} did not complete within {MAX_POLL_SECONDS}s")


def upload_file(file_path: str) -> str:
    """Upload a local file and return its hosted URL."""
    with open(file_path, "rb") as f:
        headers = {k: v for k, v in _headers().items() if k != "Content-Type"}
        with httpx.Client(timeout=60) as client:
            resp = client.post(
                f"{BASE_URL}/api/v1/upload_file",
                headers=headers,
                files={"file": f},
            )
            resp.raise_for_status()
            data = resp.json()
            return data["url"]


def generate_and_wait(
    prompt: str,
    image_url: str | None = None,
    reference_image_urls: list[str] | None = None,
    model: str = "higgsfield-v3.5",
    seed: int | None = None,
) -> str:
    """One-shot helper: submit a generation and block until the video URL is ready."""
    result = submit_generation(
        prompt=prompt,
        image_url=image_url,
        reference_image_urls=reference_image_urls,
        model=model,
        seed=seed,
    )
    request_id = result["request_id"]
    print(f"  Submitted — request_id: {request_id}")

    final = wait_for_completion(request_id)
    if final["status"] != "COMPLETED":
        raise RuntimeError(f"Generation failed with status: {final['status']}")

    video_url = final.get("results", {}).get("video_url")
    if not video_url:
        raise RuntimeError(f"No video_url in results: {final}")
    return video_url
