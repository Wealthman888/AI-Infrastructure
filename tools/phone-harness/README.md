# phone-harness

Integration point for [ShawnPana/phone-harness](https://github.com/ShawnPana/phone-harness) —
lets an agent drive a real iPhone from a Mac via the built-in iPhone Mirroring
feature (Vision-framework OCR to read the screen, HID-level CGEvents to tap/
type). No jailbreak, no WebDriverAgent, no API keys, no remote network
access — everything runs locally on the Mac, over the Mac's mirrored view of
the phone.

This directory does **not** vendor the upstream project. phone-harness talks
to macOS system frameworks (Quartz/Vision/AppKit) and a physically paired
iPhone, so it has to be installed, paired, and permissioned on the Mac that
owns both — that step can't be done from a cloud agent session or CI runner.
What lives here is (a) pointers to the real setup flow, and (b) a thin Python
wrapper (`phone_harness_tool.py`) so agents in `agents/` can drive it once
it's installed, following this repo's tool-wrapper convention.

## One-time local setup (run on the Mac itself)

The upstream repo is designed to be installed by pasting its own setup
prompt into a **local** Claude Code (or Codex) session running on the Mac —
it walks through cloning, installing, and registering itself as a Claude
Code skill, then pauses for the two steps only a human can do. See the
"Setup prompt" section of the [upstream README](https://github.com/ShawnPana/phone-harness#readme).
The short version, from `install.md`:

```bash
git clone https://github.com/ShawnPana/phone-harness ~/.phone-harness   # canonical home
cd ~/.phone-harness
pip install pyobjc-framework-Quartz pyobjc-framework-Vision pyobjc-framework-AppKit
pip install -e . --no-deps            # installs the global `phone-harness` command
phone-harness --doctor
```

Two things need a human at the physical Mac — no agent, local or remote, can
do these:

1. **Pair iPhone Mirroring** with the phone once (open the app manually;
   pairing prompts need the physical device).
2. **Grant the terminal two permissions** in System Settings → Privacy &
   Security:
   - **Accessibility** — taps & keystrokes (effective immediately)
   - **Screen Recording** — seeing the phone (effective after the terminal
     restarts)

Verify the whole chain with `phone-harness --doctor` — it checks pyobjc →
Accessibility → Screen Recording → app installed → app running → window
found → capture → OCR, in order.

## Requirements

- macOS Sequoia or later (iPhone Mirroring support)
- Python 3.10+ with the pyobjc frameworks above
- An iPhone, paired through the macOS **iPhone Mirroring** app

## Security notes

- No credentials, API keys, or remote endpoints are involved — this is
  strictly local automation over the Mac's own mirrored display of the phone.
- Accessibility + Screen Recording are broad OS-level grants. Only give them
  to a terminal/environment you trust, since anything with those permissions
  can read the screen and inject input system-wide.
- Upstream's own usage rules (see `SKILL.md` in the repo) say to stop and ask
  the user before anything outward-facing or hard to reverse — sending a
  message, posting, purchasing, deleting, changing settings — and to never
  tap through a "Connect" / "iPhone in Use" screen, since resuming mirroring
  is a physical action only the user can do. Any agent using this tool should
  follow the same rules.
- Single phone/session only; no multi-touch gestures; DRM video shows as
  black; unlocking the physical phone pauses mirroring.

## Using it from an agent

`phone_harness_tool.py` shells out to the installed `phone-harness` CLI,
which works by piping a Python snippet to stdin (helpers like `ocr()`,
`tap()`, `tap_text()`, `open_app()` are pre-imported into that scope — see
upstream's `src/phone_harness/helpers.py`). The wrapper assumes
`phone-harness` is already installed, paired, and permissioned on the host
running the agent, and raises a clear error if it isn't. It does not attempt
to install, pair, or grant permissions itself.

```python
from tools.phone_harness.phone_harness_tool import PhoneHarness

phone = PhoneHarness()
phone.doctor()                        # verify setup, raises if unavailable
state = phone.connection_state()      # 'ready' | 'blocked' | 'no-window' | 'not-running'
phone.ensure_mirroring()              # raises with instructions if not ready; never taps Connect
text = phone.ocr()                    # [{text, confidence, x, y, w, h}, ...]
phone.tap_text("Weather")
phone.type_text("hello")
```

For anything beyond these few convenience methods, drop down to a raw
script via `phone.run(python_source)` — that's the actual upstream surface
and it's larger than what's wrapped here (scrolling helpers, gestures, app
switching, etc. — see `SKILL.md` upstream).
