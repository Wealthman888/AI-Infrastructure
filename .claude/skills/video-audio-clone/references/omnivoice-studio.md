# OmniVoice Studio — local voice cloning, TTS/STT, dubbing, dictation

Repo: https://github.com/debpalash/OmniVoice-Studio (8.1k★, AGPL-3.0) · Site: https://palash.dev/omnivoice
The open-source ElevenLabs alternative. Desktop app; everything local — no
accounts, no API keys, no cloud.

## Capabilities

- **Voice cloning**: 3-second clip → zero-shot clone; 646 languages.
- **TTS**: 14 engines with voice design (gender, accent, pitch, emotion).
- **STT**: 11 engines incl. WhisperX with word-level timestamps.
- **Video dubbing**: transcribe → translate → re-voice → export MP4.
- **Audiobooks**: import text/EPUB/PDF, export chaptered `.m4b`.
- **Dictation**: global hotkey (`⌘+⇧+Space`) transcribes into any app.

## Requirements

- RAM 8 GB min (16 GB+ recommended); VRAM 4 GB (auto-offloads to CPU) — GPU optional.
- NVIDIA CUDA, Apple Silicon MPS, or AMD ROCm (Linux). **Intel Macs unsupported.**
- Disk 10–20 GB; Python 3.10+ if running the backend directly.
- Windows 10+, macOS 12+ (Apple Silicon), Ubuntu 24.04+.

## Install

Grab the installer from https://github.com/debpalash/OmniVoice-Studio/releases/latest:
macOS DMG (Apple Silicon), Windows MSI, Linux AppImage, or Docker image
`palashdeb/omnivoice-studio`. On macOS first launch: right-click → Open.

## OpenAI-compatible API (localhost:3900) — use this for automation

TTS:
```bash
curl http://localhost:3900/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{"model":"tts-1","voice":"alloy","input":"Text here","response_format":"wav"}' \
  --output speech.wav
```

STT (Python, standard OpenAI client):
```python
from openai import OpenAI
client = OpenAI(base_url="http://localhost:3900/v1", api_key="none")
result = client.audio.transcriptions.create(model="whisper-1", file=open("clip.wav", "rb"))
```

Cloned voices are addressable through the same API — pass the clone's voice name.

## Claude Code integration

The repo bundles agent skills:
```bash
npx skills add debpalash/omnivoice-studio
```
- `omnivoice` — lets agents speak and transcribe through the local install,
  including cloned voices. Also usable as a TTS/STT provider for pipecat and
  similar agent frameworks.

## License caveat

AGPL-3.0: free for any use, but network-deployed modifications must publish
source. Commercial embedding needs a separate license (OmniVoice@palash.dev).
Flag this before wiring it into a proprietary product.
