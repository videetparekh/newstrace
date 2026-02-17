---
name: update-docs
description: Update user-facing documentation based on code and UI changes
context: fork
agent: Explore
allowed-tools: Read, Edit
---

## Context
- Code changes:
!`git diff $(git merge-base HEAD main)..HEAD -- service/src/`
- UI changes:
!`git diff $(git merge-base HEAD main)..HEAD -- ui/`
- Documentation: `docs/` and `ui/public/docs/` directories

## Your task
1. Review the code and UI changes above
2. Identify which docs are affected
3. Update those docs

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