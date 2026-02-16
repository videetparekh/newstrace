# Documentation Update Skill

## Purpose
Automatically update user-facing documentation (guides, tutorials, getting started docs) based on code changes in a feature branch.

## When to use
Run `make update-docs` when:
- Feature logic is complete and stable
- Before pushing branch for review
- After significant refactoring that affects user workflows

## How it works
1. **Identify**: Analyzes code changes since branch point, determines which docs are affected
2. **Update**: Modifies relevant documentation files to reflect changes
3. **Review**: Dev reviews updates with `git diff docs/` and commits

## Stage 1: Identification
**Goal**: Determine which documentation files need updates

**Input**:
- Code diff since merge base
- All files in `docs/` directory

**Output**: List of file paths (relative to repo root), one per line, nothing else

**Instructions**:
- Read code changes to understand what functionality changed
- Read documentation files to understand what each doc covers
- Map code changes to affected docs based on:
  - API changes → Getting started guides, API reference docs
  - New features → Feature-specific guides
  - Workflow changes → Tutorial docs
  - Configuration changes → Setup/configuration guides
- If a code change is purely internal refactoring with no user-visible impact, no docs need updating
- Output ONLY file paths, one per line. No explanations, no markdown formatting.

**Example output**:
```
docs/getting-started.md
docs/guides/monitoring-setup.md
docs/guides/custom-metrics.md
```

## Stage 2: Update
**Goal**: Update a specific documentation file to reflect code changes

**Input**:
- Specific doc file to update
- Code diff since merge base

**Instructions**:
- Read the current documentation file
- Understand its structure, tone, and target audience
- Identify sections affected by the code changes
- Update those sections to reflect new behavior:
  - Modify examples if API changed
  - Add new sections for new features
  - Update step-by-step instructions if workflow changed
  - Remove or mark deprecated content for removed features
- Preserve:
  - Existing doc structure and organization
  - Writing style and tone
  - Unaffected sections (don't rewrite unnecessarily)
- Do NOT:
  - Document internal implementation details
  - Add technical jargon inappropriate for the audience
  - Commit any changes

**Quality criteria**:
- User can follow updated instructions successfully
- Examples are accurate and runnable
- Tone matches existing documentation
- Changes are minimal but complete

## File locations
- Documentation: `docs/` directory
- Code: `src/` directory
- Invoke: `make update-docs` or `./scripts/update-docs.sh`

## Notes
- This is for user-facing docs, not code comments or API docs
- Updates should focus on what changed from the user's perspective
- When in doubt, be conservative—don't update docs that aren't clearly affected