#!/usr/bin/env python3
"""Render a Hyperframes-style HTML/CSS scene file to an MP4 using a headless
browser for frame capture and ffmpeg for encoding.

Usage:
    python3 render_scene.py scene.html --duration 3 --fps 30 --out output.mp4

Requires: pip install playwright && playwright install chromium
          ffmpeg available on PATH
"""
import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright


def render(scene_path: Path, duration: float, fps: int, width: int, height: int, out_path: Path) -> None:
    frame_count = int(duration * fps)
    with tempfile.TemporaryDirectory() as tmpdir:
        frames_dir = Path(tmpdir)
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={"width": width, "height": height})
            page.goto(scene_path.resolve().as_uri())
            for i in range(frame_count):
                page.wait_for_timeout(1000 / fps)
                page.screenshot(path=str(frames_dir / f"frame_{i:05d}.png"))
            browser.close()

        subprocess.run(
            [
                "ffmpeg", "-y",
                "-framerate", str(fps),
                "-i", str(frames_dir / "frame_%05d.png"),
                "-pix_fmt", "yuv420p",
                str(out_path),
            ],
            check=True,
        )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("scene", type=Path, help="Path to the scene HTML file")
    parser.add_argument("--duration", type=float, default=3.0, help="Clip length in seconds")
    parser.add_argument("--fps", type=int, default=30, help="Frames per second")
    parser.add_argument("--width", type=int, default=1280, help="Viewport width")
    parser.add_argument("--height", type=int, default=720, help="Viewport height")
    parser.add_argument("--out", type=Path, default=Path("output.mp4"), help="Output video path")
    args = parser.parse_args()

    if not args.scene.exists():
        sys.exit(f"Scene file not found: {args.scene}")
    if shutil.which("ffmpeg") is None:
        sys.exit("ffmpeg not found on PATH")

    render(args.scene, args.duration, args.fps, args.width, args.height, args.out)
    print(f"Rendered {args.out}")


if __name__ == "__main__":
    main()
