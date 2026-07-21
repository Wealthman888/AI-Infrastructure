# Wan2.1 — open text-to-video / image-to-video model (Alibaba)

Repo: https://github.com/Wan-Video/Wan2.1 (16.5k★, Apache-2.0) · Site: https://wan.video
The open Runway alternative: generate real AI video locally from a text prompt or a
still image. Also supports first/last-frame-to-video, video editing (VACE),
text-to-image, and video-to-audio. Renders English and Chinese text inside videos.

## Model sizes and hardware

- **1.3B** — ~8.2 GB VRAM; consumer GPUs. 5-second 480p clip in ~4 min on an RTX 4090.
- **14B** — high VRAM; 480p and 720p; supports multi-GPU (FSDP + Ulysses) inference.

Recommend 1.3B by default unless the user has serious hardware.

## Install

```bash
git clone https://github.com/Wan-Video/Wan2.1.git
cd Wan2.1
pip install -r requirements.txt   # needs torch >= 2.4.0
```

Download weights (Hugging Face):
```bash
pip install "huggingface_hub[cli]"
huggingface-cli download Wan-AI/Wan2.1-T2V-1.3B --local-dir ./Wan2.1-T2V-1.3B
# or: Wan-AI/Wan2.1-T2V-14B, Wan-AI/Wan2.1-I2V-14B-720P, etc.
```

## Generate

Text-to-video, 1.3B (consumer GPU — note the memory-saving flags):
```bash
python generate.py --task t2v-1.3B --size 832*480 --ckpt_dir ./Wan2.1-T2V-1.3B \
  --offload_model True --t5_cpu --sample_shift 8 --sample_guide_scale 6 \
  --prompt "Two anthropomorphic cats in comfy boxing gear fight intensely on stage."
```

Text-to-video, 14B at 720p:
```bash
python generate.py --task t2v-14B --size 1280*720 --ckpt_dir ./Wan2.1-T2V-14B \
  --prompt "..."
```

Image-to-video (animate a still):
```bash
python generate.py --task i2v-14B --size 1280*720 \
  --ckpt_dir ./Wan2.1-I2V-14B-720P --image input.jpg --prompt "..."
```

Multi-GPU (8x):
```bash
torchrun --nproc_per_node=8 generate.py --task t2v-14B --size 1280*720 \
  --ckpt_dir ./Wan2.1-T2V-14B --dit_fsdp --t5_fsdp --ulysses_size 8 --prompt "..."
```

## Prompting tips

- Descriptive natural language works best: subject, action, setting, camera
  movement, lighting, style.
- Keep clips short (5 s); iterate at 480p with the 1.3B model, then re-run the
  final prompt on 14B/720p if hardware allows.
