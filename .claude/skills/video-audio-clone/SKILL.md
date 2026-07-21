---
name: video-audio-clone
description: Video and audio cloning with free, open-source, offline tools — self-hosted alternatives to HeyGen, Runway, ElevenLabs, and Wispr Flow. Use whenever the user wants to clone their face or voice, create a talking AI avatar or digital human, generate AI video from a text prompt or image, clone a voice for TTS, dub a video into another language, or set up offline speech-to-text dictation. Trigger phrases include "clone my voice", "clone my face", "talking avatar", "digital human", "AI video", "text to video", "dub this video", "voice clone", "offline transcription", "dictation", or mentions of HeyGem, Duix-Avatar, Wan2.1, OmniVoice, or Handy.
date_added: 2026-07-21
---

# Video and Audio Clone

A curated stack of four open-source, fully offline tools that replace paid AI media
subscriptions. Everything runs on the user's own machine — no cloud, no credits, no
per-seat pricing.

| # | Tool | Replaces | What it does | Reference |
|---|------|----------|--------------|-----------|
| 1 | **HeyGem** (`duixcom/Duix-Avatar`) | HeyGen ($29/mo) | Clones your face + voice into a lip-synced talking avatar video | [references/heygem.md](references/heygem.md) |
| 2 | **Wan2.1** (`Wan-Video/Wan2.1`) | Runway ($28/mo) | Text-to-video and image-to-video generation (Alibaba's open model) | [references/wan21.md](references/wan21.md) |
| 3 | **OmniVoice Studio** (`debpalash/OmniVoice-Studio`) | ElevenLabs ($99/mo) | Voice cloning, TTS, STT, video dubbing, dictation; plugs into Claude | [references/omnivoice-studio.md](references/omnivoice-studio.md) |
| 4 | **Handy** (`cjpais/Handy`) | Wispr Flow ($15/mo) | Offline push-to-talk speech-to-text into any app | [references/handy.md](references/handy.md) |

## Picking the right tool

Route by what the user actually wants to produce:

- **A video of *themselves* (or a person) talking** → HeyGem. It clones appearance
  and voice from a sample video and drives the avatar with text or audio.
- **A generated video of *anything else*** (scenes, products, b-roll) → Wan2.1.
  Prompt-to-video or animate a still image.
- **Audio only** — a cloned voice reading text, dubbing a video into another
  language, transcribing audio, or an audiobook → OmniVoice Studio. It also
  exposes an OpenAI-compatible API on `localhost:3900` and bundles a Claude Code
  skill (`npx skills add debpalash/omnivoice-studio`), so agents in this repo can
  speak and transcribe through it.
- **Typing by voice** (dictation into any app, no pipeline) → Handy. Lightest of
  the four; no GPU required.

Combine them for full pipelines, e.g. *"make a video of me speaking Spanish"*:
OmniVoice clones the voice and generates the Spanish audio → HeyGem drives the
face clone with that audio.

## Workflow

1. **Confirm hardware before recommending.** HeyGem and Wan2.1-14B need a serious
   NVIDIA GPU (RTX 4070+ / high VRAM). Wan2.1-1.3B runs on ~8 GB VRAM. OmniVoice
   runs on CPU (GPU optional, works on Apple Silicon). Handy runs anywhere. If the
   user's hardware is unknown, ask once before pointing them at a heavy install.
2. **Open the matching reference file** for exact install commands, ports, model
   downloads, and generation commands. Don't paraphrase from memory.
3. **Prefer the API surfaces for automation.** When building agents or scripts in
   this repo, use OmniVoice's OpenAI-compatible endpoint (`localhost:3900/v1`) and
   HeyGem's synthesis services (audio `127.0.0.1:18180`, video `127.0.0.1:8383`)
   rather than driving desktop UIs.
4. **Consent check for cloning.** Face/voice cloning is only for the user's own
   likeness or voices they have explicit permission to clone. Decline to help clone
   a third party's face or voice without consent.

## Notes

- All four are free for personal use; OmniVoice is AGPL-3.0 (network-deployed
  modifications must share source — flag this if the user wants to embed it in a
  commercial product).
- Stars/activity as of mid-2026: HeyGem 13.8k★, Wan2.1 16.5k★, OmniVoice 8.1k★,
  Handy 26k★. All actively maintained.
