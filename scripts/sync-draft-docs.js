#!/usr/bin/env node

/**
 * sync-draft-docs.js
 *
 * Syncs markdown documentation files from the /docs directory to a Notion
 * "Draft" database using the Anthropic API with Notion MCP integration.
 *
 * Environment variables:
 *   ANTHROPIC_API_KEY  - API key for the Anthropic API
 *   NOTION_MCP_TOKEN   - Authentication token for the Notion MCP endpoint
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... NOTION_MCP_TOKEN=ntn_... node scripts/sync-draft-docs.js
 */

import { readdir, readFile } from "node:fs/promises";
import { join, basename, extname, resolve } from "node:path";

const NOTION_MCP_ENDPOINT = "https://mcp.notion.so/sse";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_MODEL = "claude-sonnet-4-20250514";
const PROJECT_ROOT = resolve(import.meta.dirname, "..");
const DOCS_DIR = join(PROJECT_ROOT, "docs");

/**
 * Validates that all required environment variables are set.
 * Exits with an error message if any are missing.
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
      "  ANTHROPIC_API_KEY=sk-... NOTION_MCP_TOKEN=ntn_... node scripts/sync-draft-docs.js"
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
 * Calls the Anthropic API with Notion MCP server integration to sync
 * a single document into the Notion "Draft" database.
 *
 * @param {string} docName  - Human-readable document name (without extension).
 * @param {string} docContent - Full markdown content of the document.
 * @returns {Promise<object>} The API response body.
 */
async function syncDocToNotion(docName, docContent) {
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
          'You have access to a Notion workspace through the MCP integration. Your task is to sync the provided markdown document into the Notion "Draft" database.',
          "Steps:",
          '1. Search for a database named "Draft" in the workspace.',
          "2. Check if a page with the same title already exists.",
          "3. If it exists, update the page content with the new markdown.",
          "4. If it does not exist, create a new page with the document title and content.",
          '5. Set the "Status" property to "Draft" and the "Last Synced" property to the current date.',
          "Return a brief summary of what you did.",
        ].join("\n"),
      },
    ],
    messages: [
      {
        role: "user",
        content: `Sync the following documentation file to the Notion Draft database.\n\nDocument title: ${docName}\n\n---\n\n${docContent}`,
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
 * Extracts a human-readable text summary from the Anthropic API response.
 * @param {object} apiResponse - The parsed JSON response from the API.
 * @returns {string} The extracted text content.
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
 * Main entry point. Discovers docs, syncs each one, and reports results.
 */
async function main() {
  console.log("[sync-draft-docs] Starting documentation sync to Notion Draft database...");
  console.log(`[sync-draft-docs] Docs directory: ${DOCS_DIR}`);

  validateEnv();

  const mdFiles = await discoverMarkdownFiles();

  if (mdFiles.length === 0) {
    console.log("[sync-draft-docs] No markdown files found in docs/. Nothing to sync.");
    process.exit(0);
  }

  console.log(`[sync-draft-docs] Found ${mdFiles.length} markdown file(s):`);
  for (const f of mdFiles) {
    console.log(`  - ${basename(f)}`);
  }
  console.log();

  const results = { synced: [], failed: [] };

  for (const filePath of mdFiles) {
    const { name, content } = await readMarkdownFile(filePath);
    console.log(`[sync-draft-docs] Syncing "${name}"...`);

    try {
      const apiResponse = await syncDocToNotion(name, content);
      const summary = extractResponseText(apiResponse);
      console.log(`[sync-draft-docs] Synced "${name}" successfully.`);
      console.log(`  Result: ${summary}`);
      results.synced.push(name);
    } catch (err) {
      console.error(`[sync-draft-docs] Failed to sync "${name}": ${err.message}`);
      results.failed.push({ name, error: err.message });
    }

    console.log();
  }

  console.log("[sync-draft-docs] ---- Summary ----");
  console.log(`  Synced:  ${results.synced.length}`);
  console.log(`  Failed:  ${results.failed.length}`);

  if (results.failed.length > 0) {
    console.log("  Failed documents:");
    for (const { name, error } of results.failed) {
      console.log(`    - ${name}: ${error}`);
    }
    process.exit(1);
  }

  console.log("[sync-draft-docs] All documents synced successfully.");
}

main().catch((err) => {
  console.error(`[sync-draft-docs] Unexpected error: ${err.message}`);
  process.exit(1);
});
