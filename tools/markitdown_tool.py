"""Reusable wrapper around Microsoft's MarkItDown for use by agents.

Converts documents (PDF, Word, PowerPoint, Excel, HTML, images, audio)
and web pages into clean Markdown for AI preprocessing.

Requires: pip install markitdown
"""

import tempfile
import urllib.request
from pathlib import Path

from markitdown import MarkItDown


_converter = None


def _client() -> MarkItDown:
    global _converter
    if _converter is None:
        _converter = MarkItDown()
    return _converter


def convert_file(path: str) -> dict:
    """Convert a local file (PDF, DOCX, PPTX, XLSX, HTML, etc.) to Markdown."""
    result = _client().convert(path)
    return {"path": path, "markdown": result.text_content, "title": result.title}


def convert_url(url: str) -> dict:
    """Download a file from a URL and convert it to Markdown."""
    suffix = Path(url.split("?")[0]).suffix or ".html"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        urllib.request.urlretrieve(url, tmp.name)  # noqa: S310
        return convert_file(tmp.name)


TOOL_DEFINITIONS = [
    {
        "name": "convert_file_to_markdown",
        "description": (
            "Convert a local file (PDF, Word, PowerPoint, Excel, HTML, image, audio) "
            "to clean Markdown. Provide the absolute path to the file."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Absolute path to the file to convert."},
            },
            "required": ["path"],
        },
    },
    {
        "name": "convert_url_to_markdown",
        "description": "Download a document from a URL and convert it to Markdown.",
        "input_schema": {
            "type": "object",
            "properties": {
                "url": {"type": "string", "description": "URL of the document to download and convert."},
            },
            "required": ["url"],
        },
    },
]


def call_tool(name: str, tool_input: dict) -> dict:
    if name == "convert_file_to_markdown":
        return convert_file(tool_input["path"])
    if name == "convert_url_to_markdown":
        return convert_url(tool_input["url"])
    raise ValueError(f"Unknown tool: {name}")
