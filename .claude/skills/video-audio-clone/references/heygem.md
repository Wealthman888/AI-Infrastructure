# HeyGem (Duix-Avatar) — offline talking-avatar / digital-human cloning

Repo: https://github.com/duixcom/Duix-Avatar (13.8k★) · Site: https://www.duix.com/
The open-source HeyGen alternative: clone your face and voice from a sample video,
then generate lip-synced talking-avatar videos fully offline. Multi-language
lip-sync: English, Chinese, Japanese, Korean, French, German, Arabic, Spanish.

## Hardware requirements (heavy)

- CPU: recent Core i5+ (i5-13400F recommended)
- RAM: 32 GB minimum
- GPU: NVIDIA RTX 4070 or better, drivers installed
- Disk: 100 GB+ free (system drive) plus ~30 GB for data
- OS: Windows 10/11 (via WSL2 + Docker) or Ubuntu 22.04 (NVIDIA Container Toolkit required)

## Install (Docker, from the repo's `/deploy` directory)

Windows:
```bash
wsl --update
cd deploy
docker-compose up -d
# or the lite version:
docker-compose -f docker-compose-lite.yml up -d
```

Ubuntu:
```bash
cd deploy
docker-compose -f docker-compose-linux.yml up -d
```

Desktop client: download the `.exe` (Windows) or `.AppImage` (Linux) from the
repo's GitHub Releases and run it.

## Services / API

| Service | Endpoint |
|---------|----------|
| Audio synthesis (voice clone / TTS) | `127.0.0.1:18180` |
| Video synthesis (avatar generation) | `127.0.0.1:8383` |

## Usage workflow

1. Record a short, well-lit video of the person speaking (the clone source).
2. In the client, create the avatar: it extracts appearance + voice.
3. Drive the avatar with text (uses the cloned voice) or with an audio file.
4. Video synthesis renders the final lip-synced MP4 offline.

For automation, POST audio + source video to the synthesis services above instead
of using the desktop client.

## Notes

- Only clone the user's own likeness/voice or one they have explicit permission for.
- Pair with OmniVoice Studio when you need higher-quality multilingual audio:
  generate the audio there, then feed it to HeyGem's video synthesis.
