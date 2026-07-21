---
name: content-generator
description: Our content generator — ComfyUI-based AI image and video generation. Use whenever the user wants to set up, install, learn, or troubleshoot ComfyUI; build or debug node-based generation workflows/pipelines; pick models/checkpoints for local image or video generation; or says things like "content generator", "comfy", "node workflow", "generate images locally", "run a model on my GPU". Also use when the user asks how to produce AI images/video with full pipeline control rather than a hosted API. (For quick cloud generation via Fal.ai, the media-gen skill is the better fit — this skill is for the local ComfyUI pipeline.)
---

# Content Generator (ComfyUI)

Our content generator is built on **ComfyUI** — a free, open-source, node-based interface for AI image and video generation (121K+ stars, GPL-3.0).

Repo: https://github.com/Comfy-Org/ComfyUI · Docs + desktop download: comfy.org (linked from the repo README)

## What it is and why we use it

Most AI image apps are a black box: type a prompt, get an image, hope for the best. ComfyUI flips that. You build your own generation pipeline visually — connecting nodes like a flowchart: **load model → prompt → sampler → upscale → output**. Every step is controllable, which is why serious AI-art and video creators use it to make things simple apps can't. It runs locally and supports all the top open models. No coding required — you connect nodes, not write code.

The payoff for the learning curve: chain models, add upscalers, control every setting, build video workflows, and save pipelines to reuse forever.

## Requirements check (do this first)

Before walking the user through setup, confirm:

- **Hardware**: a decent computer. A GPU with good VRAM helps a lot, especially for video. Image gen is doable on modest GPUs; video and big models want more VRAM. If their machine struggles, suggest cloud options.
- **Storage**: models are big — make sure they have room.
- **Expectations**: there's a real learning curve. Encourage a few sessions before judging it.

## Setup — easiest path

Walk the user through these steps in order (check the live README for current install options and model setup, as details change):

1. **Get the Desktop app** (recommended for beginners). Official installer for Windows and macOS — the simplest way in. Grab it from the repo README / comfy.org.
2. **Or portable / manual install.** The repo offers a portable Windows build and a manual install:
   ```bash
   git clone https://github.com/Comfy-Org/ComfyUI.git
   # then follow the README for dependencies + how to launch
   ```
   Pick based on the user's comfort level.
3. **Download a model.** ComfyUI needs a checkpoint to generate. Download an open image model and drop it in the `models` folder as the README shows.
4. **Load a starter workflow.** ComfyUI ships default/template workflows — a ready-made node graph, so the user isn't building from scratch on day one.
5. **Hit generate.** Type the prompt in the prompt node, run it, watch the pipeline produce the image. Then start tweaking nodes.

## Teaching the user (don't rush them)

Guide learning incrementally — this order matters:

- [ ] Start with a built-in template workflow — don't build from zero
- [ ] Change ONE node at a time and see what it does
- [ ] Learn the core chain: model → prompt → sampler → output
- [ ] Add an upscaler node once basics work
- [ ] Explore the Manager to install community nodes + models
- [ ] Save workflows you like — they're reusable and shareable

## Honest caveats to surface

- **Learning curve is real.** It's more powerful and more complex than a prompt app.
- **Hardware matters.** Video and large models want serious VRAM; recommend cloud fallbacks when needed.
- **Security: only install trusted community nodes.** Custom nodes run arbitrary code — stick to well-known ones and say so explicitly whenever the user reaches for the Manager.

## Reference

The original setup guide this skill is based on is preserved verbatim in `references/comfyui-setup-guide.md` — read it if the user asks for the original document or credits.
