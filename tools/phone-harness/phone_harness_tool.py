"""Thin wrapper around the locally-installed `phone-harness` CLI.

phone-harness (https://github.com/ShawnPana/phone-harness) must already be
installed, paired, and permissioned on this machine — see README.md in this
directory for the one-time local setup steps. This module does not install,
pair, or grant permissions; it only shells out to the CLI once it's present.

The upstream CLI works by piping a Python snippet to stdin, with helper
functions (ocr, tap, tap_text, open_app, ...) pre-imported into that scope —
see `phone-harness --help` and upstream's `src/phone_harness/helpers.py` for
the full surface. This wrapper covers the common calls and exposes `run()`
as an escape hatch for anything else.
"""

from __future__ import annotations

import json
import shutil
import subprocess


class PhoneHarnessUnavailable(RuntimeError):
    """Raised when the `phone-harness` CLI isn't installed/on PATH."""


class PhoneHarness:
    def __init__(self, binary: str = "phone-harness"):
        self._binary = binary
        if shutil.which(binary) is None:
            raise PhoneHarnessUnavailable(
                f"'{binary}' not found on PATH. Install and pair it first — "
                "see tools/phone-harness/README.md."
            )

    def run(self, python_source: str) -> str:
        """Execute a raw script in the harness's stdin-exec scope. Helpers
        like ocr(), tap(), tap_text(), open_app() are pre-imported."""
        result = subprocess.run(
            [self._binary],
            input=python_source,
            capture_output=True,
            text=True,
            check=True,
        )
        return result.stdout

    def doctor(self) -> str:
        """Verify the local install/pairing chain is healthy. Raises
        (non-zero exit) on the first failing check."""
        result = subprocess.run(
            [self._binary, "--doctor"], capture_output=True, text=True, check=True
        )
        return result.stdout

    def connection_state(self) -> str:
        """'ready' | 'blocked' | 'no-window' | 'not-running'."""
        return self.run("print(connection_state())").strip()

    def ensure_mirroring(self) -> None:
        """Raises with a message for the user if the phone isn't connected.
        Never taps through a Connect/blocked screen — that's intentional
        upstream behavior; reconnecting is a physical action only the user
        can do."""
        self.run("ensure_mirroring()")

    def ocr(self, min_confidence: float = 0.3) -> list[dict]:
        out = self.run(f"import json; print(json.dumps(ocr({min_confidence})))")
        return json.loads(out)

    def screen_info(self) -> dict:
        out = self.run("import json; print(json.dumps(screen_info()))")
        return json.loads(out)

    def tap(self, x: float, y: float) -> None:
        self.run(f"tap({x}, {y})")

    def tap_text(self, query: str, index: int = 0, exact: bool = False) -> None:
        self.run(f"tap_text({query!r}, index={index}, exact={exact})")

    def type_text(self, text: str) -> None:
        self.run(f"type_text({text!r})")

    def open_app(self, name: str) -> None:
        self.run(f"open_app({name!r})")

    def home(self) -> None:
        self.run("home()")

    def swipe(self, direction: str, distance: float = 0.4) -> None:
        self.run(f"swipe({direction!r}, {distance})")

    def scroll(self, amount: int = 300) -> None:
        self.run(f"scroll({amount})")
