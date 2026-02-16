#!/usr/bin/env node

/**
 * check-docs-required.js
 *
 * Determines whether a merge request requires documentation updates based on
 * the set of changed files. Accepts changed file paths via command-line
 * arguments or from stdin (one path per line).
 *
 * User-facing paths that REQUIRE docs:
 *   - service/src/api/
 *   - ui/src/components/
 *   - ui/src/pages/
 *   - data/locations.json
 *
 * Internal paths that DO NOT require docs:
 *   - any file matching *.test.* (test files)
 *   - any path containing /utils/
 *   - any path under scripts/
 *
 * Doc mapping:
 *   - API changes (service/src/api/)        -> docs/api-reference.md
 *   - UI changes (ui/src/components|pages/) -> docs/user-guide.md
 *   - Data changes (data/locations.json)    -> docs/user-guide.md
 *
 * Exit codes:
 *   0 - No documentation updates required
 *   1 - Documentation updates are required
 *
 * Usage:
 *   node scripts/check-docs-required.js file1.js file2.js
 *   echo "service/src/api/routes.js" | node scripts/check-docs-required.js
 *   git diff --name-only main | node scripts/check-docs-required.js
 */

import { readFileSync } from "node:fs";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Patterns for paths that are considered internal / non-user-facing.
 * Files matching any of these are excluded from the docs-requirement check.
 */
const INTERNAL_PATTERNS = [
  /\.test\./,      // test files: *.test.*
  /\/utils\//,     // utility directories
  /^scripts\//,    // automation scripts
];

/**
 * Rules mapping user-facing path prefixes (or exact paths) to the
 * documentation files that must be updated when those paths change.
 *
 * Each rule has:
 *   match    - a function that returns true if the changed file matches
 *   docFiles - the doc files that need updating
 *   label    - human-readable description of the category
 */
const DOC_RULES = [
  {
    label: "API changes",
    match: (filePath) => filePath.startsWith("service/src/api/"),
    docFiles: ["docs/api-reference.md"],
  },
  {
    label: "UI component changes",
    match: (filePath) => filePath.startsWith("ui/src/components/"),
    docFiles: ["docs/user-guide.md"],
  },
  {
    label: "UI page changes",
    match: (filePath) => filePath.startsWith("ui/src/pages/"),
    docFiles: ["docs/user-guide.md"],
  },
  {
    label: "Data file changes",
    match: (filePath) => filePath === "data/locations.json",
    docFiles: ["docs/user-guide.md"],
  },
];

// ---------------------------------------------------------------------------
// Input parsing
// ---------------------------------------------------------------------------

/**
 * Reads the list of changed files from CLI arguments or stdin.
 * @returns {string[]} Array of file paths (trimmed, deduplicated).
 */
function getChangedFiles() {
  let raw = [];

  // If file paths were passed as arguments, use those.
  if (process.argv.length > 2) {
    raw = process.argv.slice(2);
  } else {
    // Otherwise read from stdin (piped input).
    try {
      const stdinContent = readFileSync(0, "utf-8"); // fd 0 = stdin
      raw = stdinContent.split("\n");
    } catch {
      // stdin not available or empty
    }
  }

  // Trim whitespace, remove empty lines, and deduplicate.
  const files = [...new Set(raw.map((f) => f.trim()).filter(Boolean))];
  return files;
}

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

/**
 * Returns true if the file path matches any internal/excluded pattern.
 * @param {string} filePath
 * @returns {boolean}
 */
function isInternalPath(filePath) {
  return INTERNAL_PATTERNS.some((pattern) => pattern.test(filePath));
}

/**
 * Analyses the list of changed files and determines which documentation
 * files need updating.
 *
 * @param {string[]} changedFiles - List of changed file paths.
 * @returns {{
 *   docsRequired: boolean,
 *   requiredDocFiles: string[],
 *   triggeringFiles: {filePath: string, label: string, docFiles: string[]}[],
 *   skippedInternal: string[],
 *   skippedIrrelevant: string[]
 * }}
 */
function analyzeChangedFiles(changedFiles) {
  const requiredDocFilesSet = new Set();
  const triggeringFiles = [];
  const skippedInternal = [];
  const skippedIrrelevant = [];

  for (const filePath of changedFiles) {
    // 1. Skip internal paths.
    if (isInternalPath(filePath)) {
      skippedInternal.push(filePath);
      continue;
    }

    // 2. Check against doc rules.
    let matched = false;
    for (const rule of DOC_RULES) {
      if (rule.match(filePath)) {
        matched = true;
        triggeringFiles.push({
          filePath,
          label: rule.label,
          docFiles: rule.docFiles,
        });
        for (const docFile of rule.docFiles) {
          requiredDocFilesSet.add(docFile);
        }
      }
    }

    if (!matched) {
      skippedIrrelevant.push(filePath);
    }
  }

  const requiredDocFiles = [...requiredDocFilesSet].sort();

  return {
    docsRequired: requiredDocFiles.length > 0,
    requiredDocFiles,
    triggeringFiles,
    skippedInternal,
    skippedIrrelevant,
  };
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

/**
 * Prints the analysis results to stdout in a human-readable format.
 * @param {ReturnType<typeof analyzeChangedFiles>} result
 * @param {string[]} changedFiles
 */
function printResults(result, changedFiles) {
  console.log("[check-docs-required] Analyzing changed files for documentation requirements...");
  console.log(`[check-docs-required] Total changed files: ${changedFiles.length}`);
  console.log();

  if (result.skippedInternal.length > 0) {
    console.log(`Skipped (internal/test paths): ${result.skippedInternal.length}`);
    for (const f of result.skippedInternal) {
      console.log(`  - ${f}`);
    }
    console.log();
  }

  if (result.skippedIrrelevant.length > 0) {
    console.log(`Skipped (no doc rules matched): ${result.skippedIrrelevant.length}`);
    for (const f of result.skippedIrrelevant) {
      console.log(`  - ${f}`);
    }
    console.log();
  }

  if (result.triggeringFiles.length > 0) {
    console.log(`Files triggering doc updates: ${result.triggeringFiles.length}`);
    for (const { filePath, label, docFiles } of result.triggeringFiles) {
      console.log(`  - ${filePath} (${label}) -> ${docFiles.join(", ")}`);
    }
    console.log();
  }

  console.log("---- Result ----");

  if (result.docsRequired) {
    console.log("Documentation updates REQUIRED.");
    console.log("The following doc files need updates:");
    for (const docFile of result.requiredDocFiles) {
      console.log(`  - ${docFile}`);
    }
  } else {
    console.log("No documentation updates required.");
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const changedFiles = getChangedFiles();

  if (changedFiles.length === 0) {
    console.log("[check-docs-required] No changed files provided.");
    console.log("Usage:");
    console.log("  node scripts/check-docs-required.js file1.js file2.js");
    console.log('  echo "service/src/api/routes.js" | node scripts/check-docs-required.js');
    console.log("  git diff --name-only main | node scripts/check-docs-required.js");
    process.exit(0);
  }

  const result = analyzeChangedFiles(changedFiles);
  printResults(result, changedFiles);

  // Exit code: 1 if docs are required, 0 otherwise.
  process.exit(result.docsRequired ? 1 : 0);
}

main();
