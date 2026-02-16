#!/usr/bin/env node

/**
 * doc-mapper.js
 *
 * Maps AI-suggested updates to specific sections in documentation files.
 */

import { readFile } from "node:fs/promises";

/**
 * Maps suggested updates to documentation file sections.
 */
export class DocMapper {
  /**
   * @param {string} projectRoot - Absolute path to project root
   */
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
  }

  /**
   * Reads a documentation file.
   * @param {string} docFile - Relative path to doc file (e.g., "docs/api-reference.md" or "ui/public/docs/how-to-use.md")
   * @returns {Promise<string>} File content
   */
  async readDocFile(docFile) {
    // Build full path from project root
    const fullPath = `${this.projectRoot}/${docFile}`;

    try {
      return await readFile(fullPath, "utf-8");
    } catch (error) {
      throw new Error(`Failed to read ${docFile}: ${error.message}`);
    }
  }

  /**
   * Finds a section in markdown content by header.
   * @param {string} content - Markdown content
   * @param {string} sectionHeader - Section header to find (e.g., "## GET /api/news")
   * @returns {Object|null} Section info with startIndex, endIndex, currentContent
   */
  findSection(content, sectionHeader) {
    const lines = content.split("\n");

    // Normalize header (remove leading/trailing whitespace, ensure starts with #)
    const normalizedHeader = sectionHeader.trim();

    // Find the section start
    const startIdx = lines.findIndex((line) => {
      const trimmed = line.trim();
      return trimmed === normalizedHeader ||
             trimmed.startsWith(normalizedHeader + " ") ||
             trimmed === normalizedHeader.replace(/^#+\s*/, "").trim();
    });

    if (startIdx === -1) {
      return null;
    }

    // Find the section end (next header of same or higher level)
    const headerLevel = (normalizedHeader.match(/^#+/) || ["##"])[0].length;
    const headerLevelRegex = new RegExp(`^#{1,${headerLevel}}\\s`);

    let endIdx = lines.length;
    for (let i = startIdx + 1; i < lines.length; i++) {
      if (headerLevelRegex.test(lines[i])) {
        endIdx = i;
        break;
      }
    }

    return {
      startIndex: startIdx,
      endIndex: endIdx,
      currentContent: lines.slice(startIdx, endIdx).join("\n"),
    };
  }

  /**
   * Creates update patches for suggested changes.
   * @param {Array} suggestedUpdates - Array of updates from DocAnalyzer
   * @returns {Promise<Array>} Array of patches with doc file content
   */
  async createPatches(suggestedUpdates) {
    const patches = [];

    for (const update of suggestedUpdates) {
      const { docFile, section, reason, suggestedContent } = update;

      try {
        // Read the current doc file
        const currentContent = await this.readDocFile(docFile);

        // Find the section
        const sectionInfo = this.findSection(currentContent, section);

        const patch = {
          docFile,
          section,
          reason,
          suggestedContent,
          currentContent,
          sectionInfo,
          patchType: sectionInfo ? "update" : "append",
        };

        patches.push(patch);
      } catch (error) {
        console.error(`\n⚠️  Warning: Failed to create patch for ${docFile}:`);
        console.error(`   ${error.message}`);
        // Continue with other patches
      }
    }

    return patches;
  }

  /**
   * Applies a patch to document content.
   * @param {string} content - Current document content
   * @param {Object} patch - Patch to apply
   * @returns {string} Updated content
   */
  applyPatch(content, patch) {
    const { sectionInfo, suggestedContent, section } = patch;

    if (sectionInfo) {
      // Update existing section
      const lines = content.split("\n");
      const before = lines.slice(0, sectionInfo.startIndex);
      const after = lines.slice(sectionInfo.endIndex);

      // Keep the section header, replace the content
      const sectionHeader = lines[sectionInfo.startIndex];
      const newSection = [sectionHeader, "", suggestedContent].join("\n");

      return [...before, newSection, ...after].join("\n");
    } else {
      // Append new section
      const newSection = [
        "",
        section,
        "",
        suggestedContent,
        "",
      ].join("\n");

      return content + newSection;
    }
  }

  /**
   * Generates a preview diff for a patch.
   * @param {Object} patch - Patch to preview
   * @returns {string} Diff preview
   */
  generatePreview(patch) {
    const { docFile, section, reason, patchType, sectionInfo, suggestedContent } = patch;

    let preview = `\n${"=".repeat(60)}\n`;
    preview += `File: ${docFile}\n`;
    preview += `Section: ${section}\n`;
    preview += `Action: ${patchType === "update" ? "Update" : "Append"}\n`;
    preview += `Reason: ${reason}\n`;
    preview += `${"=".repeat(60)}\n\n`;

    if (patchType === "update" && sectionInfo) {
      preview += "Current content:\n";
      preview += `${"-".repeat(60)}\n`;
      preview += sectionInfo.currentContent;
      preview += `\n${"-".repeat(60)}\n\n`;
    }

    preview += "Suggested content:\n";
    preview += `${"+".repeat(60)}\n`;
    preview += suggestedContent;
    preview += `\n${"+".repeat(60)}\n`;

    return preview;
  }
}
