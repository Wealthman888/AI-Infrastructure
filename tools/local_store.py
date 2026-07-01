"""
Tiny JSON-file append log, used for the data Instantly/GHL don't hand back on
their own: classified-reply history (for the funnel sentiment split) and
closed-deal revenue events (for Panel 3). Good enough at this volume; swap
for a real DB if reply volume ever makes JSON-file writes a bottleneck.
"""
import json
import threading
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = REPO_ROOT / "data"
_lock = threading.Lock()


def _path(store_name: str) -> Path:
    return DATA_DIR / f"{store_name}.json"


def append_event(store_name: str, event: dict) -> None:
    path = _path(store_name)
    with _lock:
        events = json.loads(path.read_text()) if path.exists() else []
        events.append(event)
        path.write_text(json.dumps(events, indent=2))


def read_events(store_name: str) -> list[dict]:
    path = _path(store_name)
    if not path.exists():
        return []
    return json.loads(path.read_text())
