# COMFY 🚨 The Setup Guide

> Source: Google Doc shared by Seb / @seb.ai (preserved verbatim)

You commented COMFY — here's the most powerful free AI content tool. ComfyUI is a node-based interface for AI image + video generation. Free, open-source, 121K+ stars, GPL-3.0.

Repo: https://github.com/Comfy-Org/ComfyUI

## What it actually is

Most AI image apps are a black box: type a prompt, get an image, hope for the best. ComfyUI flips that. You build your own generation pipeline visually — connecting nodes like a flowchart: load model → prompt → sampler → upscale → output. Every step is yours to control, which is exactly why serious AI-art and video creators use it to make things the simple apps can't. It runs on your own computer and supports all the top open models.

## Why it's worth the learning curve

Yes, it looks intimidating at first — it's a node graph, not a text box. But that's the power: you can chain models, add upscalers, control every setting, build video workflows, and save your pipeline to reuse forever. Once it clicks, you can create things that basic apps simply can't produce.

## What you need

A decent computer (a GPU with good VRAM helps a lot, especially for video) · storage for models (they're big) · a bit of patience. It's free. No coding required — you connect nodes, not write code.

## Setup — easiest path

1. Get the Desktop app (recommended for beginners). ComfyUI has an official desktop installer for Windows and macOS — it's the simplest way in. Grab it from the repo's README / comfy.org.
2. Or use the portable / manual install. The repo offers a portable Windows build and a manual install (clone + Python). The README walks through each — pick based on your comfort level.

   ```bash
   git clone https://github.com/Comfy-Org/ComfyUI.git
   # then follow the README for dependencies + how to launch
   ```

3. Download a model. ComfyUI needs a checkpoint (the AI model) to generate. Download one (e.g. an open image model) and drop it in the models folder as the README shows.
4. Load a starter workflow. ComfyUI comes with default/template workflows. Open one — it's a ready-made node graph — so you're not building from scratch on day one.
5. Hit generate. Type your prompt in the prompt node, run it, and watch the pipeline produce your image. Then start tweaking nodes to see what each does.

## How to actually learn it (don't rush)

- ☐ Start with a built-in template workflow — don't build from zero
- ☐ Change ONE node at a time and see what it does
- ☐ Learn the core chain: model → prompt → sampler → output
- ☐ Add an upscaler node once basics work
- ☐ Explore the Manager to install community nodes + models
- ☐ Save workflows you like — they're reusable and shareable

## A couple of honest notes

- There's a real learning curve. It's more powerful and more complex than a prompt app — give it a few sessions before judging it.
- It needs decent hardware. Image gen is doable on modest GPUs; video and big models want more VRAM. Cloud options exist if your machine struggles.
- Only install trusted community nodes. Custom nodes are amazing but run code — stick to well-known ones.

## Links

- Repo: https://github.com/Comfy-Org/ComfyUI
- Docs + desktop download: linked from the repo README (comfy.org).
- (Check the live README for the current install options and model setup.)

Tag @seb.ai with your first Comfy creation — best one gets featured.

— Seb / @seb.ai
