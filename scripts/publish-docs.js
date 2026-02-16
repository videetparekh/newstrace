#!/usr/bin/env node

/**
 * publish-docs.js
 *
 * Publishes a versioned snapshot of markdown documentation from /docs into
 * a Notion "Released" database using the Anthropic API with Notion MCP
 * integration. Each published page is tagged with the version string and
 * the current date.
 *
 * Environment variables:
 *   ANTHROPIC_API_KEY  - API key for the Anthropic API
 *   NOTION_MCP_TOKEN   - Authentication token for the Notion MCP endpoint
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... NOTION_MCP_TOKEN=ntn_... node scripts/publish-docs.js v1.0.0
 */

import { readdir, readFile } from "node:fs/promises";
import { join, basename, extname, resolve } from "node:path";

const NOTION_MCP_ENDPOINT = "https://mcp.notion.so/sse";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_MODEL = "claude-sonnet-4-20250514";
const PROJECT_ROOT = resolve(import.meta.dirname, "..");
const DOCS_DIR = join(PROJECT_ROOT, "docs");

const SEMVER_REGEX = /^v?\d+\.\d+\.\d+(-[\w.]+)?$/;

/**
 * Parses and validates the version argument from the command line.
 * @returns {string} The validated version string.
 */
function parseVersionArg() {
  const version = process.argv[2];

  if (!version) {
    console.error("[ERROR] A version argument is required.");
    console.error("Usage: node scripts/publish-docs.js <version>");
    console.error("Example: node scripts/publish-docs.js v1.0.0");
    process.exit(1);
  }

  if (!SEMVER_REGEX.test(version)) {
    console.error(
      `[ERROR] Invalid version format: "${version}". Expected semver (e.g., v1.0.0).`
    );
    process.exit(1);
  }

  return version;
}

/**
 * Validates that all required environment variables are set.
 */
function validateEnv() {
  const required = ["ANTHROPIC_API_KEY", "NOTION_MCP_TOKEN"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `[ERROR] Missing required environment variables: ${missing.join(", ")}`
    );
    console.error(
      "Set them before running this script. Example:"
    );
    console.error(
      "  ANTHROPIC_API_KEY=sk-... NOTION_MCP_TOKEN=ntn_... node scripts/publish-docs.js v1.0.0"
    );
    process.exit(1);
  }
}

/**
 * Discovers all markdown files in the docs directory.
 * @returns {Promise<string[]>} Array of absolute paths to .md files.
 */
async function discoverMarkdownFiles() {
  let entries;
  try {
    entries = await readdir(DOCS_DIR, { withFileTypes: true });
  } catch (err) {
    if (err.code === "ENOENT") {
      console.error(`[ERROR] Docs directory not found: ${DOCS_DIR}`);
      process.exit(1);
    }
    throw err;
  }

  const mdFiles = entries
    .filter((entry) => entry.isFile() && extname(entry.name) === ".md")
    .map((entry) => join(DOCS_DIR, entry.name));

  return mdFiles;
}

/**
 * Reads the content of a markdown file.
 * @param {string} filePath - Absolute path to the markdown file.
 * @returns {Promise<{name: string, content: string}>} File name and content.
 */
async function readMarkdownFile(filePath) {
  const content = await readFile(filePath, "utf-8");
  const name = basename(filePath, ".md");
  return { name, content };
}

/**
 * Calls the Anthropic API with Notion MCP integration to publish a single
 * document as a versioned page in the Notion "Released" database.
 *
 * @param {string} docName    - Document name (without extension).
 * @param {string} docContent - Full markdown content.
 * @param {string} version    - Semantic version string (e.g., "v1.0.0").
 * @param {string} publishDate - ISO 8601 date string (e.g., "2026-02-15").
 * @returns {Promise<object>} The API response body.
 */
async function publishDocToNotion(docName, docContent, version, publishDate) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const notionToken = process.env.NOTION_MCP_TOKEN;

  const requestBody = {
    model: ANTHROPIC_MODEL,
    max_tokens: 4096,
    system: [
      {
        type: "text",
        text: [
          "You are a documentation management assistant.",
          'You have access to a Notion workspace through the MCP integration. Your task is to publish the provided markdown document as a versioned snapshot in the Notion "Released" database.',
          "Steps:",
          '1. Search for a database named "Released" in the workspace.',
          `2. Create a new page with the title formatted as: "${docName} - ${version}".`,
          "3. Set the page content to the provided markdown.",
          `4. Set the "Version" property to "${version}".`,
          `5. Set the "Published Date" property to "${publishDate}".`,
          '6. Set the "Status" property to "Released".',
          "7. If any of these properties do not exist on the database, still create the page with the title and content, and note which properties were skipped.",
          "Return a brief summary of what you did.",
        ].join("\n"),
      },
    ],
    messages: [
      {
        role: "user",
        content: `Publish the following documentation to the Notion Released database.\n\nDocument title: ${docName}\nVersion: ${version}\nPublish date: ${publishDate}\n\n---\n\n${docContent}`,
      },
    ],
    mcp_servers: [
      {
        type: "url",
        url: NOTION_MCP_ENDPOINT,
        authorization_token: notionToken,
      },
    ],
  };

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2025-01-01",
      "anthropic-beta": "mcp-client-2025-04-04",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Anthropic API returned ${response.status}: ${errorText}`
    );
  }

  return response.json();
}

/**
 * Extracts readable text from an Anthropic API response.
 * @param {object} apiResponse - Parsed JSON response.
 * @returns {string} Concatenated text blocks.
 */
function extractResponseText(apiResponse) {
  if (!apiResponse.content || !Array.isArray(apiResponse.content)) {
    return "(no content in response)";
  }

  return apiResponse.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");
}

/**
 * Main entry point. Validates inputs, discovers docs, publishes each one.
 */
async function main() {
  const version = parseVersionArg();
  const publishDate = new Date().toISOString().split("T")[0];

  console.log("[publish-docs] Starting versioned documentation publish to Notion...");
  console.log(`[publish-docs] Version:      ${version}`);
  console.log(`[publish-docs] Publish date: ${publishDate}`);
  console.log(`[publish-docs] Docs dir:     ${DOCS_DIR}`);

  validateEnv();

  const mdFiles = await discoverMarkdownFiles();

  if (mdFiles.length === 0) {
    console.log("[publish-docs] No markdown files found in docs/. Nothing to publish.");
    process.exit(0);
  }

  console.log(`[publish-docs] Found ${mdFiles.length} markdown file(s):`);
  for (const f of mdFiles) {
    console.log(`  - ${basename(f)}`);
  }
  console.log();

  const results = { published: [], failed: [] };

  for (const filePath of mdFiles) {
    const { name, content } = await readMarkdownFile(filePath);
    const pageTitle = `${name} - ${version}`;
    console.log(`[publish-docs] Publishing "${pageTitle}"...`);

    try {
      const apiResponse = await publishDocToNotion(
        name,
        content,
        version,
        publishDate
      );
      const summary = extractResponseText(apiResponse);
      console.log(`[publish-docs] Published "${pageTitle}" successfully.`);
      console.log(`  Result: ${summary}`);
      results.published.push(pageTitle);
    } catch (err) {
      console.error(
        `[publish-docs] Failed to publish "${pageTitle}": ${err.message}`
      );
      results.failed.push({ name: pageTitle, error: err.message });
    }

    console.log();
  }

  console.log("[publish-docs] ---- Summary ----");
  console.log(`  Version:   ${version}`);
  console.log(`  Date:      ${publishDate}`);
  console.log(`  Published: ${results.published.length}`);
  console.log(`  Failed:    ${results.failed.length}`);

  if (results.failed.length > 0) {
    console.log("  Failed documents:");
    for (const { name, error } of results.failed) {
      console.log(`    - ${name}: ${error}`);
    }
    process.exit(1);
  }

  console.log("[publish-docs] All documents published successfully.");
}

main().catch((err) => {
  console.error(`[publish-docs] Unexpected error: ${err.message}`);
  process.exit(1);
});
