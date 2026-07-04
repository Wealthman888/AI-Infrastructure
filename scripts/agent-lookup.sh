#!/usr/bin/env bash
# agent-lookup.sh -- find installed .claude/agents/*.md files by filename or keyword.
#
# Usage:
#   agent-lookup.sh                 List all installed agents (filename, name, description)
#   agent-lookup.sh <query>         Case-insensitive match against filename, name, description
#
# Output is tab-separated: filename<TAB>frontmatter-name<TAB>description
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENTS_DIR="$SCRIPT_DIR/../.claude/agents"

query="${1:-}"

describe() {
  local file="$1"
  local name desc
  name=$(sed -n 's/^name: *//p' "$file" | head -1 | tr -d '"')
  desc=$(sed -n 's/^description: *//p' "$file" | head -1)
  printf '%s\t%s\t%s\n' "$(basename "$file" .md)" "$name" "$desc"
}

if [[ -z "$query" ]]; then
  for f in "$AGENTS_DIR"/*.md; do describe "$f"; done | sort
  exit 0
fi

# Exact filename match wins outright.
exact="$AGENTS_DIR/$query.md"
if [[ -f "$exact" ]]; then
  describe "$exact"
  exit 0
fi

query_lc="$(printf '%s' "$query" | tr '[:upper:]' '[:lower:]')"
matches=()
for f in "$AGENTS_DIR"/*.md; do
  base_lc="$(basename "$f" .md | tr '[:upper:]' '[:lower:]')"
  line="$(describe "$f")"
  line_lc="$(printf '%s' "$line" | tr '[:upper:]' '[:lower:]')"
  if [[ "$base_lc" == *"$query_lc"* || "$line_lc" == *"$query_lc"* ]]; then
    matches+=("$line")
  fi
done

if [[ ${#matches[@]} -eq 0 ]]; then
  echo "No agents matched '$query'. Run with no argument to list all installed agents." >&2
  exit 1
fi

printf '%s\n' "${matches[@]}" | sort
