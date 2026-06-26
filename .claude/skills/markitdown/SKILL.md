---
name: markitdown
description: Convert PDFs, Word docs, Excel sheets, PowerPoint decks, and other files into clean Markdown using Microsoft's open-source markitdown tool. Use whenever the user asks to convert, extract, or read content from a PDF/DOCX/XLSX/PPTX file, or needs a document turned into Markdown/text for an agent's context, RAG pipeline, or summarization. The package is auto-installed via the project's SessionStart hook, so it is always available — no setup step needed.
---

# MarkItDown Skill

Wraps Microsoft's `markitdown` CLI/library to turn documents into clean, structured Markdown. Already installed every session via `.claude/hooks/session-start.sh` — just call it.

## When to use

- "Convert this PDF/Word doc/Excel sheet/PPTX to markdown"
- "What does this document say?" when the source is a non-text file
- Feeding a document into an agent's context, a RAG index, or a summarization step in `tools/` or `agents/`

## Usage

CLI, single file to stdout:

```bash
markitdown "<path-to-file>"
```

Write to a file instead of stdout:

```bash
markitdown "<path-to-file>" -o "<output-path>.md"
```

Python API, when wiring this into an agent tool in `tools/`:

```python
from markitdown import MarkItDown

md = MarkItDown()
result = md.convert("<path-to-file>")
print(result.text_content)
```

## Notes

- Supports PDF, Word, Excel, PowerPoint, plain text, HTML, and more — pass any supported file straight through.
- Output is plain Markdown: headings, tables, and lists are preserved where the source format had structure; this is what makes it cleaner for LLM context than raw extracted text.
- If `markitdown` is somehow missing (e.g. a fresh environment that skipped the hook), run `pip install markitdown` once — no other setup needed.
- For multi-file batches, loop the CLI call per file rather than asking the user to convert one at a time.
