#!/usr/bin/env bash
set -euo pipefail

MERGE_BASE=$(git merge-base HEAD main)

# Check if there are code or UI changes
if git diff --quiet "$MERGE_BASE..HEAD" -- 'src/' 'ui/'; then
  echo "No code or UI changes detected, skipping doc update"
  exit 0
fi

claude /update-docs

echo ""
echo "Review changes:"
echo "  git diff docs/ ui/public/docs/"
echo ""
echo "Commit when ready:"
echo "  git add docs/ ui/public/docs/ && git commit -m 'docs: update for recent changes'"