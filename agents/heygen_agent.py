"""HeyGen video generation agent powered by Claude.

Generates AI avatar videos, checks status, lists avatars/voices, and
manages the video library via a tool-use loop.

Usage:
    python -m agents.heygen_agent "List all available avatars and English voices"
    python -m agents.heygen_agent "Generate a 60-second product demo video using avatar <id>"
    python -m agents.heygen_agent "Check status of video <id> and give me the download link"

Requires: ANTHROPIC_API_KEY, HEYGEN_API_KEY
"""

import json
import os
import sys

import anthropic

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tools.heygen_tool import TOOL_DEFINITIONS, call_tool

MODEL = "claude-haiku-4-5-20251001"

SYSTEM_PROMPT = (
    "You are a HeyGen video production assistant. You can list avatars and voices, "
    "generate AI avatar videos, animate talking photos, check video status, and manage "
    "the video library. When generating a video, always confirm the avatar, voice, and "
    "script with the user before submitting. After submitting, provide the video_id and "
    "offer to poll for completion. Present download URLs clearly when videos are ready."
)


def run(task: str, max_turns: int = 15) -> str:
    client = anthropic.Anthropic()
    messages = [{"role": "user", "content": task}]

    for _ in range(max_turns):
        response = client.messages.create(
            model=MODEL,
            max_tokens=4096,
            system=[
                {
                    "type": "text",
                    "text": SYSTEM_PROMPT,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            tools=TOOL_DEFINITIONS,
            messages=messages,
        )

        messages.append({"role": "assistant", "content": response.content})

        if response.stop_reason != "tool_use":
            return "".join(
                block.text for block in response.content if block.type == "text"
            )

        tool_results = []
        for block in response.content:
            if block.type != "tool_use":
                continue
            try:
                result = call_tool(block.name, block.input)
                content = json.dumps(result, default=str)
            except Exception as exc:
                content = f"Error: {exc}"
            tool_results.append(
                {"type": "tool_result", "tool_use_id": block.id, "content": content}
            )

        messages.append({"role": "user", "content": tool_results})

    return "Reached max turns without a final answer."


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python -m agents.heygen_agent <task>")
        sys.exit(1)
    print(run(" ".join(sys.argv[1:])))


if __name__ == "__main__":
    main()
