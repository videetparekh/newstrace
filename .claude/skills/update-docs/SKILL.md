---
name: update-docs
description: Update user-facing documentation based on code and UI changes
context: fork
agent: Explore
allowed-tools: Bash(git *), Read, Edit
---

## Context
- Merge base: !`git merge-base HEAD main`
- Code changes: Use the merge base from above to run `git diff <merge-base>..HEAD -- src/`
- UI changes: Use the merge base from above to run `git diff <merge-base>..HEAD -- ui/`
- Documentation: `docs/` and `ui/public/docs/` directories

## Your task
1. Get the merge base commit hash
2. View code changes: `git diff <merge-base>..HEAD -- src/`
3. View UI changes: `git diff <merge-base>..HEAD -- ui/`
4. Identify which docs are affected
5. Update those docs

### Identification criteria
- API changes → `docs/` (getting started, API reference)
- Backend features → `docs/guides/`
- UI changes → `ui/public/docs/` (user interface guides, feature docs)
- New UI features → `ui/public/docs/`
- Workflow changes → Both `docs/` and `ui/public/docs/` as appropriate
- Pure refactoring (no user-visible changes) → Skip docs

### Update guidelines
- Preserve structure and tone
- Update affected sections
- Add new sections for new features
- Remove outdated content
- Keep examples and screenshots accurate
- Update UI screenshots/examples if interface changed

### Location guidance
- Backend/API documentation → `docs/`
- Frontend/UI documentation → `ui/public/docs/`
- End-to-end workflows → Update both as needed

Do NOT commit. Dev will review with `git diff docs/ ui/public/docs/` and commit manually.