# Hyperframes — Agent-Written Motion Graphics

## Skill Purpose
Generate short animated graphics (titles, lower-thirds, social overlays, intro/outro clips) by having the agent write plain HTML/CSS/JS directly into a single scene file, then render that scene to a video file. This replaces paid video-render SaaS tools with a $0, open-source workflow: open `https://github.com/heygen-com/hyperframes` for the reference implementation this skill is modeled on.

Core principle (from the Hyperframes approach): **the agent writes plain web standards, not a new format.**
- No React, no GSAP, no proprietary animation DSL.
- Animation lives in CSS (`@keyframes` / `animation:`) or the native Web Animations API.
- All work happens inside one self-contained `scene.html` file — markup, styles, and animation timing together.

## When to Use
- User wants a quick animated title card, social clip, or motion graphic and doesn't want to pay for a SaaS renderer.
- User asks for "Hyperframes", "agent-written animation", or a CSS/HTML-driven video.
- Triggered by `/hyperframes <description of the animation>`.

## How to Execute

### Step 1: Write the scene
Create `scene.html` with the markup and a `<style>` block containing the animation. Keep it minimal — one file, plain CSS:

```html
<!DOCTYPE html>
<html>
<head>
<style>
  body { margin:0; width:1280px; height:720px; background:#000; display:flex; align-items:center; justify-content:center; }
  .title { color:#fff; font-family:sans-serif; font-size:64px; opacity:0; animation: pop .6s ease-out forwards; }
  @keyframes pop { from { opacity:0; transform:scale(.8); } to { opacity:1; transform:scale(1); } }
</style>
</head>
<body>
  <div class="title">Hello</div>
</body>
</html>
```

Adjust markup/CSS to match what the user asked for. Prefer `@keyframes` for simple motion; only reach for the Web Animations API (`element.animate(...)`) if the user needs JS-driven sequencing.

### Step 2: Render the scene to video
Use `scripts/render_scene.py` to capture the scene with a headless browser and encode it to MP4:

```bash
python3 scripts/render_scene.py scene.html --duration 3 --fps 30 --out output.mp4
```

The script requires `playwright` and `ffmpeg` to be installed:
```bash
pip install playwright
playwright install chromium
```

### Step 3: Iterate
If the animation timing or look needs adjustment, edit `scene.html` directly and re-run the render — there's no rebuild step, no proprietary project file.

## Notes
- This skill is for short, declarative motion graphics (titles, overlays, transitions) — not full video editing or compositing of footage.
- Keep scenes self-contained so they can be versioned and diffed like any other text file.
