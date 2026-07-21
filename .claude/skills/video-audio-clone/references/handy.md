# Handy — offline push-to-talk speech-to-text for any app

Repo: https://github.com/cjpais/Handy (26k★, MIT) · Site: https://handy.computer
The open-source Wispr Flow alternative: press a hotkey, speak, release — the
transcribed text is pasted into whatever app has focus. Completely offline; no
audio ever leaves the machine.

## Platforms

macOS (Intel + Apple Silicon), Windows x64, Linux x64. No GPU required.

## Install

- Downloads: GitHub Releases or https://handy.computer
- macOS: `brew install --cask handy`
- Windows: `winget install cjpais.Handy`
- From source: see the repo's `BUILD.md` (Tauri/Rust app).

## Models

- **Whisper** (GPU-accelerated where available): Small 487 MB, Medium 492 MB,
  Turbo 1.6 GB, Large 1.1 GB.
- **Parakeet V3**: CPU-optimized, automatic language detection, ~5x real-time on
  mid-range hardware — best default for machines without a GPU.

Silero VAD filters silence before transcription.

## Usage

1. Set a keyboard shortcut in settings (hold-to-talk or toggle mode).
2. Hold the shortcut, speak, release.
3. Handy transcribes locally and pastes the text into the active text field.

## When to pick Handy over OmniVoice

Handy is dictation-only and much lighter. If the user just wants voice typing,
recommend Handy; if they need cloning, dubbing, TTS, or an API, use OmniVoice
Studio (which also has a dictation hotkey).
