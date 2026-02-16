#!/usr/bin/env node

/**
 * analyzer.js
 *
 * Uses Anthropic API to analyze code changes and suggest documentation updates.
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 8192;

/**
 * Analyzes code changes using AI to suggest documentation updates.
 */
export class DocAnalyzer {
  /**
   * @param {string} apiKey - Anthropic API key
   * @param {string} promptPath - Path to prompt template file
   */
  constructor(apiKey, promptPath) {
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY environment variable is required");
    }
    this.apiKey = apiKey;
    this.promptPath = promptPath;
  }

  /**
   * Loads and prepares the prompt template.
   * @param {Object} data - Data to interpolate into prompt
   * @returns {Promise<string>} Formatted prompt
   */
  async _preparePrompt(data) {
    const template = await readFile(this.promptPath, "utf-8");

    return template
      .replace("{{CHANGED_FILES}}", data.changedFiles.join("\n"))
      .replace("{{FULL_DIFF}}", data.diff)
      .replace("{{REQUIRED_DOC_FILES}}", data.docFiles.join("\n"))
      .replace("{{COMMITS}}",
        data.commits.map(c => `- ${c.hash.slice(0, 8)}: ${c.message}`).join("\n")
      );
  }

  /**
   * Calls Anthropic API with the analysis request.
   * @param {string} prompt - Formatted prompt
   * @returns {Promise<Object>} API response
   */
  async _callAnthropicAPI(prompt) {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: MAX_TOKENS,
        temperature: 0.3,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API error (${response.status}): ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Parses AI response and extracts structured suggestions.
   * @param {Object} apiResponse - Response from Anthropic API
   * @returns {Object} Parsed suggestions
   */
  _parseResponse(apiResponse) {
    try {
      // Extract text content from API response
      const content = apiResponse.content[0].text;

      // Try to find JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in API response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate structure
      if (!parsed.userFacingChanges || !parsed.suggestedUpdates) {
        throw new Error("Invalid response structure from AI");
      }

      return {
        userFacingChanges: parsed.userFacingChanges || [],
        suggestedUpdates: parsed.suggestedUpdates || [],
      };
    } catch (error) {
      throw new Error(`Failed to parse AI response: ${error.message}\n\nRaw response: ${JSON.stringify(apiResponse, null, 2)}`);
    }
  }

  /**
   * Analyzes code changes and suggests documentation updates.
   * @param {Object} changelog - Changelog data from ChangelogCapture
   * @param {string[]} docFiles - List of documentation files to consider
   * @returns {Promise<Object>} Analysis results with suggested updates
   */
  async analyze(changelog, docFiles) {
    console.log("\n🤖 Analyzing changes with AI...");

    // Prepare prompt
    const prompt = await this._preparePrompt({
      changedFiles: changelog.changedFiles,
      diff: changelog.diff,
      commits: changelog.commits,
      docFiles,
    });

    // Call API
    let apiResponse;
    try {
      apiResponse = await this._callAnthropicAPI(prompt);
    } catch (error) {
      console.error("\n❌ Error calling Anthropic API:");
      console.error(error.message);
      throw error;
    }

    // Parse response
    try {
      const analysis = this._parseResponse(apiResponse);

      console.log(`\n✅ Analysis complete:`);
      console.log(`   - ${analysis.userFacingChanges.length} user-facing changes detected`);
      console.log(`   - ${analysis.suggestedUpdates.length} documentation updates suggested`);

      return analysis;
    } catch (error) {
      console.error("\n❌ Error parsing AI response:");
      console.error(error.message);
      throw error;
    }
  }
}
