#!/usr/bin/env bash
# scripts/update-docs.sh
#
# Automatically update documentation based on code changes in the current branch.
# Uses Claude to identify affected docs and update them.

set -euo pipefail

MERGE_BASE=$(git merge-base HEAD origin/main)
REPO_ROOT=$(git rev-parse --show-toplevel)
SKILL_PATH="$REPO_ROOT/.claude/skills/update-docs"

# Check if there are code changes
if git diff --quiet "$MERGE_BASE..HEAD" -- 'src/'; then
  echo "No code changes detected, skipping doc update"
  exit 0
fi

# Cache the diff to avoid re-reading
DIFF_FILE=$(mktemp)
trap "rm -f $DIFF_FILE" EXIT
git diff "$MERGE_BASE..HEAD" -- src/ > "$DIFF_FILE"

echo "Analyzing which docs need updates..."
echo ""

# Stage 1: Identify affected docs
AFFECTED_DOCS=$(claude -p "Analyze the code changes provided. 
List which documentation files in docs/ need to be updated based on these changes.
Output ONLY the file paths relative to repo root, one per line, nothing else.

Code changes:
$(cat "$DIFF_FILE")" \
  --allowedTools "Read")

if [ -z "$AFFECTED_DOCS" ]; then
  echo "No documentation updates needed."
  exit 0
fi

echo "Updating the following docs:"
echo "$AFFECTED_DOCS"
echo ""

# Stage 2: Update each doc
echo "$AFFECTED_DOCS" | while read -r doc; do
  if [ -n "$doc" ] && [ -f "$REPO_ROOT/$doc" ]; then
    echo "Updating $doc..."
    claude -p "Update $doc to reflect the code changes provided.

Code changes:
$(cat "$DIFF_FILE")

Instructions:
- Preserve structure and tone
- Update affected sections
- Add new sections for new features
- Remove outdated content
- Focus on user-visible changes only

Do NOT commit anything." \
      --allowedTools "Read,Edit"
    echo ""
  fi
done

echo "Documentation updated."
echo ""
echo "Review changes:"
echo "  git diff docs/"
echo ""
echo "Commit when ready:"
echo "  git add docs/ && git commit -m 'docs: update for recent changes'"