# update-docs Skill

AI-powered documentation updates based on code changes using Claude API.

## Overview

This skill automatically analyzes your code changes and suggests documentation updates to keep your docs in sync with your code. It can run:
- **Manually** via `/update-docs` command
- **Automatically** as a pre-commit git hook

## Setup

### 1. Set API Key

The skill requires an Anthropic API key:

```bash
# Add to your shell profile (~/.zshrc or ~/.bashrc)
export ANTHROPIC_API_KEY="your-api-key-here"

# Or create a .env file (remember to add to .gitignore)
echo "ANTHROPIC_API_KEY=your-key" > .env
```

### 2. Verify Installation

The skill should be automatically registered if this file exists:
```
/Users/videet/Desktop/global_news_map/.claude/settings.json
```

Test it:
```bash
cd /Users/videet/Desktop/global_news_map
/update-docs --help
```

## Usage

### Manual Mode

Update docs for all changes since main branch:
```bash
/update-docs
```

Compare against a different base branch:
```bash
/update-docs --base=develop
```

Auto-accept all suggestions (non-interactive):
```bash
/update-docs --auto-accept
```

### Hook Mode (Automatic)

The pre-commit hook is installed at `.git/hooks/pre-commit` and runs automatically:

```bash
# Make some changes
vim service/src/api/routes.py

# Commit normally
git add service/src/api/routes.py
git commit -m "feat: add new endpoint"

# Hook runs automatically and prompts for doc updates
```

To bypass the hook for a single commit:
```bash
git commit --no-verify
```

To disable the hook permanently:
```bash
rm .git/hooks/pre-commit
```

## How It Works

1. **Capture Changes**: Analyzes git diff and changed files
2. **Check Requirements**: Uses `scripts/check-docs-required.js` to filter user-facing changes
3. **AI Analysis**: Sends changes to Claude API for intelligent analysis
4. **Generate Updates**: AI suggests specific documentation updates
5. **Interactive Review**: You review and approve/edit/skip each suggestion
6. **Apply Updates**: Approved changes are written to documentation files

## Documentation Patterns

The skill knows which code changes require docs:

**Requires documentation:**
- `ui/src/components/**/*.{jsx,tsx}` → Updates `ui/public/docs/how-to-use.md` (user-facing)
- `ui/src/pages/**/*.{jsx,tsx}` → Updates `ui/public/docs/how-to-use.md` (user-facing)
- `service/src/api/**/*.py` → Updates `docs/api-reference.md` (technical/API)
- `data/locations.json` → Updates `ui/public/docs/how-to-use.md` (user-facing)

**Documentation structure:**
- `ui/public/docs/` - User-facing documentation (served by the UI)
- `docs/` - Technical documentation for developers (API, deployment, architecture)

**Does NOT require documentation:**
- Test files (`*.test.*`)
- Utility directories (`**/utils/**`)
- Scripts (`scripts/**`)

## Configuration

Edit [config.json](config.json) to customize:

- `hookMode.autoAccept` - Auto-accept suggestions in hook mode
- `hookMode.timeout` - Maximum time for hook to run
- `ai.model` - Claude model to use
- `ai.temperature` - AI creativity (0.0 = deterministic, 1.0 = creative)

## Examples

### Example 1: API Endpoint Change

```bash
# You modify service/src/api/routes.py to add a new endpoint
# Commit triggers hook:

📊 Analyzing changes...
   Found 1 changed file(s)

🔍 Checking if documentation updates are needed...
📝 User-facing changes detected

🤖 Analyzing changes with AI...
✅ Analysis complete:
   - 1 user-facing changes detected
   - 1 documentation updates suggested

--- Update 1 of 1 ---
File: docs/api-reference.md
Section: ## API Endpoints
Action: Append

Suggested content:
++++++++++++++++++++++++++++++++++++++++++++++
## Sharing Headlines

You can now share interesting headlines directly from the app:

1. Click a city marker to load a headline
2. Click the share button (📤) in the headline card
3. Choose your preferred sharing method

The share feature works on all modern browsers and mobile devices.
++++++++++++++++++++++++++++++++++++++++++++++

Accept this update? [a]ccept / [e]dit / [s]kip: a

✅ Documentation successfully updated!
   Updated files have been staged for commit
```

### Example 2: Internal Refactoring (Auto-Skip)

```bash
# You refactor service/src/utils/helpers.py
# Hook runs but exits immediately:

📊 Analyzing changes...
   Found 1 changed file(s)

🔍 Checking if documentation updates are needed...
✅ No user-facing changes detected

# Commit proceeds without interruption
```

## Troubleshooting

### "ANTHROPIC_API_KEY environment variable is required"

Set your API key as shown in Setup section above.

### Hook is not running

Check that `.git/hooks/pre-commit` exists and is executable:
```bash
ls -l .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

### "Git command failed"

Ensure you're in a git repository and have commits to compare:
```bash
git status
git log
```

### AI suggestions are not accurate

The AI analyzes your code changes and suggests updates. You can:
- Use the `[e]dit` option to manually refine suggestions
- Use `[s]kip` to reject inappropriate suggestions
- Edit `prompts/analyze-changes.txt` to improve AI prompts

## Cost

Using Claude Sonnet 4:
- **Per execution**: ~$0.045 (5k input tokens + 2k output tokens)
- **Monthly estimate**: ~$2.25 for 50 user-facing commits

Very affordable for automated documentation maintenance!

## Architecture

```
.claude/skills/update-docs/
├── skill.js                    # Main orchestration
├── config.json                 # Configuration
├── README.md                   # This file
├── lib/
│   ├── changelog.js            # Git operations
│   ├── analyzer.js             # AI analysis via Anthropic API
│   ├── doc-mapper.js           # Map changes to doc sections
│   ├── patcher.js              # Apply updates to files
│   └── reviewer.js             # Interactive approval UI
└── prompts/
    └── analyze-changes.txt     # AI prompt template
```

## Integration

This skill integrates with existing project infrastructure:
- Uses `scripts/check-docs-required.js` for change detection
- Follows same API pattern as `scripts/sync-draft-docs.js`
- Updates `docs/*.md` files maintained by the project
- Compatible with existing GitHub Actions workflows

## License

MIT
