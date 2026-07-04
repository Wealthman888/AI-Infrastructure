# Google Drive Integration

MCP namespace: `mcp__Google_Drive__*`. Connected account: `davidonewaycapital@gmail.com`.

## Scoped workspace

All agency-generated files live under one dedicated folder — **`GemLabs Agency OS`** (`parentId: 19X3xMt1XKpxgsWqCE4029pmcHdjXdngn`). This account's Drive also holds unrelated personal and other-business files; agents must not read, write, or search outside this folder for agency work.

## Available operations

| Tool | Use |
|------|-----|
| `search_files` | Find files (always scope with `parentId = '19X3xMt1XKpxgsWqCE4029pmcHdjXdngn'` for agency work, or narrower subfolders under it) |
| `list_recent_files` | List recently touched files (not scoped by folder — avoid for agency lookups, prefer `search_files`) |
| `create_file` | Create a file or subfolder (always pass `parentId` pointing inside the GemLabs Agency OS tree) |
| `read_file_content` / `download_file_content` | Read a file's content |
| `get_file_metadata` / `get_file_permissions` | Inspect a file |
| `copy_file` | Duplicate a file |

## Conventions

- Create subfolders under the root folder per work type as needed (e.g. `Proposals`, `Audits`, `Reports`) rather than dumping everything flat — check with `search_files` (scoped by `parentId`) before creating a subfolder that might already exist.
- Deliverables produced by a dispatched agent (proposal drafts, audit reports, client-facing docs) should be saved here via `create_file`, not left only in chat output, so they're a durable record.
- Never use `list_recent_files` as a substitute for scoped `search_files` — it surfaces the whole account's recent activity, including unrelated personal files.
