"""
Claude-powered Higgsfield content agent.

The agent accepts natural-language requests and uses Higgsfield to generate
videos via a tool-use loop. Supports text-to-video, image-to-video, and
Soul Mode.

Usage:
    python agents/higgsfield_content_agent.py
    python agents/higgsfield_content_agent.py --prompt "A sunrise over the ocean"
"""

import argparse
import json
import os
import sys

import anthropic

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from tools.higgsfield import generate_and_wait, upload_file

MODEL = "claude-opus-4-7"

SYSTEM_PROMPT = """You are a creative AI video director with access to the Higgsfield video generation API.

When the user describes a video they want, use the available tools to generate it.
Write vivid, cinematic prompts — describe camera movement, lighting, mood, and subject action.
Always confirm the video URL with the user when generation completes.

If the user uploads an image path, use the upload_file tool first, then pass the URL to generate_video.
"""

TOOLS = [
    {
        "name": "generate_video",
        "description": (
            "Generate an AI video using Higgsfield. Supports text-to-video, "
            "image-to-video (pass image_url), and Soul Mode (pass reference_image_urls). "
            "Blocks until complete and returns the video URL."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "prompt": {
                    "type": "string",
                    "description": "Cinematic description of the video to generate.",
                },
                "image_url": {
                    "type": "string",
                    "description": "URL of a source image for image-to-video mode.",
                },
                "reference_image_urls": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Reference face/style image URLs for Soul Mode.",
                },
                "seed": {
                    "type": "integer",
                    "description": "Optional seed for reproducible results.",
                },
            },
            "required": ["prompt"],
        },
    },
    {
        "name": "upload_file",
        "description": "Upload a local image file to Higgsfield's CDN. Returns a hosted URL.",
        "input_schema": {
            "type": "object",
            "properties": {
                "file_path": {
                    "type": "string",
                    "description": "Absolute or relative path to the local image file.",
                },
            },
            "required": ["file_path"],
        },
    },
]


def run_tool(name: str, inputs: dict) -> str:
    if name == "generate_video":
        print(f"\n  Generating video: \"{inputs['prompt'][:60]}...\"")
        url = generate_and_wait(
            prompt=inputs["prompt"],
            image_url=inputs.get("image_url"),
            reference_image_urls=inputs.get("reference_image_urls"),
            seed=inputs.get("seed"),
        )
        return json.dumps({"video_url": url})

    if name == "upload_file":
        print(f"\n  Uploading file: {inputs['file_path']}")
        url = upload_file(inputs["file_path"])
        return json.dumps({"url": url})

    return json.dumps({"error": f"Unknown tool: {name}"})


def run_agent(user_message: str) -> str:
    client = anthropic.Anthropic()
    messages = [{"role": "user", "content": user_message}]

    while True:
        response = client.messages.create(
            model=MODEL,
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            tools=TOOLS,
            messages=messages,
        )

        if response.stop_reason == "end_turn":
            for block in response.content:
                if hasattr(block, "text"):
                    return block.text
            return ""

        if response.stop_reason == "tool_use":
            messages.append({"role": "assistant", "content": response.content})
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    result = run_tool(block.name, block.input)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result,
                    })
            messages.append({"role": "user", "content": tool_results})
            continue

        break

    return "Agent finished without a final text response."


def main():
    parser = argparse.ArgumentParser(description="Higgsfield content generation agent")
    parser.add_argument("--prompt", type=str, help="Video prompt to generate directly")
    args = parser.parse_args()

    if args.prompt:
        print(f"\nGenerating: {args.prompt}\n")
        result = run_agent(args.prompt)
        print(f"\n{result}")
        return

    print("Higgsfield Content Agent — type your video request (ctrl+c to exit)\n")
    while True:
        try:
            user_input = input("You: ").strip()
            if not user_input:
                continue
            result = run_agent(user_input)
            print(f"\nAgent: {result}\n")
        except KeyboardInterrupt:
            print("\nBye!")
            break


if __name__ == "__main__":
    main()
