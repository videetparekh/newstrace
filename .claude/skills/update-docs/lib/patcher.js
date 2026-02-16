#!/usr/bin/env node

/**
 * patcher.js
 *
 * Applies approved documentation updates to files and stages them for commit.
 */

import { writeFile, stat } from "node:fs/promises";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

/**
 * Applies documentation patches to files.
 */
export class DocPatcher {
  /**
   * @param {string} repoPath - Absolute path to git repository
   * @param {boolean} stageFiles - Whether to git add files after patching (hook mode)
   */
  constructor(repoPath, stageFiles = false) {
    this.repoPath = repoPath;
    this.stageFiles = stageFiles;
  }

  /**
   * Writes updated content to a file, preserving permissions.
   * @param {string} filePath - Path to file
   * @param {string} content - New content
   */
  async writeFile(filePath, content) {
    try {
      // Get current file stats to preserve permissions
      const stats = await stat(filePath).catch(() => null);

      // Write the file
      await writeFile(filePath, content, "utf-8");

      // Restore permissions if we had them
      if (stats) {
        await execAsync(`chmod ${(stats.mode & parseInt("777", 8)).toString(8)} "${filePath}"`);
      }
    } catch (error) {
      throw new Error(`Failed to write ${filePath}: ${error.message}`);
    }
  }

  /**
   * Stages a file for git commit.
   * @param {string} filePath - Relative path from repo root
   */
  async stageFile(filePath) {
    if (!this.stageFiles) {
      return;
    }

    try {
      await execAsync(`git add "${filePath}"`, { cwd: this.repoPath });
    } catch (error) {
      throw new Error(`Failed to stage ${filePath}: ${error.message}`);
    }
  }

  /**
   * Applies a single patch.
   * @param {Object} patch - Patch object with docFile and updatedContent
   * @param {Object} mapper - DocMapper instance for applying patches
   * @returns {Promise<boolean>} Success status
   */
  async applyPatch(patch, mapper) {
    const { docFile } = patch;

    try {
      // Apply the patch to get updated content
      const updatedContent = mapper.applyPatch(patch.currentContent, patch);

      // Resolve full path from project root
      const fullPath = `${mapper.projectRoot}/${docFile}`;

      // Write the file
      await this.writeFile(fullPath, updatedContent);

      // Stage for commit if in hook mode
      if (this.stageFiles) {
        await this.stageFile(docFile);
      }

      console.log(`   ✅ Updated ${docFile}`);
      return true;
    } catch (error) {
      console.error(`   ❌ Failed to apply patch to ${docFile}:`);
      console.error(`      ${error.message}`);
      return false;
    }
  }

  /**
   * Applies multiple patches.
   * @param {Array} patches - Array of approved patches
   * @param {Object} mapper - DocMapper instance
   * @returns {Promise<Object>} Results summary
   */
  async applyPatches(patches, mapper) {
    console.log(`\n📝 Applying ${patches.length} documentation update(s)...`);

    const results = {
      successful: [],
      failed: [],
    };

    for (const patch of patches) {
      const success = await this.applyPatch(patch, mapper);

      if (success) {
        results.successful.push(patch.docFile);
      } else {
        results.failed.push(patch.docFile);
      }
    }

    // Summary
    console.log(`\n✅ Applied ${results.successful.length} update(s)`);
    if (results.failed.length > 0) {
      console.log(`❌ Failed ${results.failed.length} update(s)`);
    }

    return results;
  }
}
