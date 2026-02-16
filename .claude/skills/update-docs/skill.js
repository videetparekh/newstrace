#!/usr/bin/env node

/**
 * skill.js
 *
 * Main orchestration for the update-docs Claude Code skill.
 * AI-powered documentation updates based on code changes.
 *
 * Usage:
 *   node skill.js [options]
 *
 * Options:
 *   --base=BRANCH     Base branch to compare against (default: main)
 *   --hook-mode       Run from pre-commit hook (staged files only)
 *   --skip            Skip documentation updates
 *   --auto-accept     Auto-accept all suggested updates
 *   --help            Show help message
 *
 * Exit codes:
 *   0 - Success (docs updated or not needed)
 *   1 - Docs needed but user skipped
 *   2 - Error occurred
 */

import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

// Import skill components
import { ChangelogCapture } from "./lib/changelog.js";
import { DocAnalyzer } from "./lib/analyzer.js";
import { DocMapper } from "./lib/doc-mapper.js";
import { DocPatcher } from "./lib/patcher.js";
import { InteractiveReviewer } from "./lib/reviewer.js";

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Project paths
const SKILL_DIR = __dirname;
const PROJECT_ROOT = resolve(__dirname, "../../..");
const SCRIPTS_DIR = join(PROJECT_ROOT, "scripts");
const PROMPT_FILE = join(SKILL_DIR, "prompts", "analyze-changes.txt");

/**
 * Parses command-line arguments.
 */
function parseArgs() {
  const args = {
    baseBranch: "main",
    hookMode: false,
    skip: false,
    autoAccept: false,
    help: false,
  };

  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--base=")) {
      args.baseBranch = arg.split("=")[1];
    } else if (arg === "--hook-mode") {
      args.hookMode = true;
    } else if (arg === "--skip") {
      args.skip = true;
    } else if (arg === "--auto-accept") {
      args.autoAccept = true;
    } else if (arg === "--help" || arg === "-h") {
      args.help = true;
    }
  }

  return args;
}

/**
 * Shows help message.
 */
function showHelp() {
  console.log(`
update-docs - AI-powered documentation updates

Usage:
  /update-docs [options]

Options:
  --base=BRANCH     Base branch to compare against (default: main)
  --hook-mode       Run from pre-commit hook (staged files only)
  --skip            Skip documentation updates
  --auto-accept     Auto-accept all suggested updates
  --help, -h        Show this help message

Examples:
  /update-docs                  # Update docs for current branch vs main
  /update-docs --base=develop   # Compare against develop branch
  /update-docs --auto-accept    # Auto-accept all suggestions

Exit codes:
  0 - Success (docs updated or not needed)
  1 - Docs needed but user skipped
  2 - Error occurred

Environment:
  ANTHROPIC_API_KEY - Required for AI analysis
`);
}


/**
 * Checks if documentation is required using existing check-docs-required.js script.
 */
async function checkDocsRequired(changedFiles) {
  return new Promise((resolve, reject) => {
    const checkScript = join(SCRIPTS_DIR, "check-docs-required.js");
    const process = spawn("node", [checkScript], {
      stdio: ["pipe", "inherit", "inherit"],
    });

    // Send changed files to stdin
    process.stdin.write(changedFiles.join("\n"));
    process.stdin.end();

    process.on("exit", (code) => {
      if (code === 0) {
        resolve(false); // No docs required
      } else if (code === 1) {
        resolve(true); // Docs required
      } else {
        reject(new Error(`check-docs-required.js exited with code ${code}`));
      }
    });

    process.on("error", (error) => {
      reject(new Error(`Failed to run check-docs-required.js: ${error.message}`));
    });
  });
}

/**
 * Gets list of documentation files.
 */
async function getDocFiles() {
  return [
    "docs/api-reference.md",
    "docs/deployment.md",
    "docs/development.md",
    "ui/public/docs/how-to-use.md",
  ];
}

/**
 * Main execution function.
 */
async function main() {
  console.log("🚀 update-docs - AI-powered documentation updates\n");

  // Parse arguments
  const args = parseArgs();

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  if (args.skip) {
    console.log("⏭️  Skipping documentation updates (--skip flag)");
    process.exit(0);
  }

  // 1. Capture changelog
  console.log(`📊 Analyzing changes (base: ${args.baseBranch}, hook mode: ${args.hookMode})...`);

  const changelog = new ChangelogCapture(PROJECT_ROOT, args.baseBranch, args.hookMode);
  let changelogData;

  try {
    changelogData = await changelog.capture();
  } catch (error) {
    console.error(`\n❌ Error capturing changes: ${error.message}`);
    process.exit(2);
  }

  if (changelogData.changedFiles.length === 0) {
    console.log("\n✅ No changes detected");
    process.exit(0);
  }

  console.log(`   Found ${changelogData.changedFiles.length} changed file(s)`);

  // 2. Check if docs are required using existing script
  console.log("\n🔍 Checking if documentation updates are needed...");

  let docsRequired;
  try {
    docsRequired = await checkDocsRequired(changelogData.changedFiles);
  } catch (error) {
    console.error(`\n❌ Error checking doc requirements: ${error.message}`);
    process.exit(2);
  }

  if (!docsRequired) {
    console.log("✅ No user-facing changes detected - documentation updates not needed");
    process.exit(0);
  }

  console.log("📝 User-facing changes detected - documentation updates needed");

  // 3. Analyze with AI
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("\n❌ Error: ANTHROPIC_API_KEY environment variable is required");
    console.error("\nSet it before running this skill:");
    console.error("  export ANTHROPIC_API_KEY='your-key-here'");
    console.error("\nOr add it to your shell profile (~/.zshrc or ~/.bashrc)");
    process.exit(2);
  }

  const analyzer = new DocAnalyzer(apiKey, PROMPT_FILE);
  const docFiles = await getDocFiles();

  let analysis;
  try {
    analysis = await analyzer.analyze(changelogData, docFiles);
  } catch (error) {
    console.error(`\n❌ Error during analysis: ${error.message}`);
    console.error("\nYou can:");
    console.error("  - Check your ANTHROPIC_API_KEY");
    console.error("  - Try again later");
    console.error("  - Skip with: git commit --no-verify");
    process.exit(2);
  }

  if (analysis.suggestedUpdates.length === 0) {
    console.log("\n✅ AI determined no documentation updates are needed");
    process.exit(0);
  }

  // 4. Create patches
  const mapper = new DocMapper(PROJECT_ROOT);
  let patches;

  try {
    patches = await mapper.createPatches(analysis.suggestedUpdates);
  } catch (error) {
    console.error(`\n❌ Error creating patches: ${error.message}`);
    process.exit(2);
  }

  if (patches.length === 0) {
    console.log("\n✅ No applicable documentation updates");
    process.exit(0);
  }

  // 5. Review patches
  const reviewer = new InteractiveReviewer(mapper, args.autoAccept);
  let approvedPatches;

  try {
    approvedPatches = await reviewer.reviewAll(patches);
  } catch (error) {
    console.error(`\n❌ Error during review: ${error.message}`);
    process.exit(2);
  }

  if (approvedPatches.length === 0) {
    console.log("\n⏭️  No updates approved - documentation not updated");
    process.exit(args.hookMode ? 1 : 0);
  }

  // 6. Apply patches
  const patcher = new DocPatcher(PROJECT_ROOT, args.hookMode);

  try {
    await patcher.applyPatches(approvedPatches, mapper);
  } catch (error) {
    console.error(`\n❌ Error applying patches: ${error.message}`);
    process.exit(2);
  }

  console.log("\n✅ Documentation successfully updated!");

  if (args.hookMode) {
    console.log("\n   Updated files have been staged for commit");
  } else {
    console.log("\n   Remember to commit the updated documentation:");
    console.log(`   git add docs/`);
    console.log(`   git commit -m "docs: update documentation"`);
  }

  process.exit(0);
}

// Run main function
main().catch((error) => {
  console.error(`\n❌ Unexpected error: ${error.message}`);
  console.error(error.stack);
  process.exit(2);
});
