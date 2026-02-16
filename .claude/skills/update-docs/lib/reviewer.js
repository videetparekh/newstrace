#!/usr/bin/env node

/**
 * reviewer.js
 *
 * Interactive review interface for documentation updates.
 */

import { createInterface } from "node:readline";
import { stdin as input, stdout as output } from "node:process";

/**
 * Provides interactive review of documentation patches.
 */
export class InteractiveReviewer {
  /**
   * @param {Object} mapper - DocMapper instance for generating previews
   * @param {boolean} autoAccept - Auto-accept all updates (non-interactive)
   */
  constructor(mapper, autoAccept = false) {
    this.mapper = mapper;
    this.autoAccept = autoAccept;
  }

  /**
   * Prompts user for input via readline.
   * @param {string} question - Question to ask
   * @returns {Promise<string>} User's answer
   */
  async _prompt(question) {
    const rl = createInterface({ input, output });

    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.trim().toLowerCase());
      });
    });
  }

  /**
   * Reviews a single patch interactively.
   * @param {Object} patch - Patch to review
   * @param {number} index - Patch index (for display)
   * @param {number} total - Total number of patches
   * @returns {Promise<string>} Action: 'accept', 'skip', or 'edit'
   */
  async reviewPatch(patch, index, total) {
    // Show preview
    console.log(`\n--- Update ${index + 1} of ${total} ---`);
    console.log(this.mapper.generatePreview(patch));

    // Auto-accept if configured
    if (this.autoAccept) {
      console.log("✅ Auto-accepted");
      return "accept";
    }

    // Prompt for action
    while (true) {
      const answer = await this._prompt(
        "\nAccept this update? [a]ccept / [e]dit / [s]kip: "
      );

      if (answer === "a" || answer === "accept") {
        return "accept";
      } else if (answer === "e" || answer === "edit") {
        return "edit";
      } else if (answer === "s" || answer === "skip") {
        return "skip";
      } else if (answer === "q" || answer === "quit") {
        console.log("\n⚠️  Review cancelled by user");
        process.exit(0);
      } else {
        console.log("Invalid option. Please choose [a]ccept, [e]dit, [s]kip, or [q]uit.");
      }
    }
  }

  /**
   * Opens an editor for manual editing of content.
   * @param {string} content - Initial content
   * @returns {Promise<string>} Edited content
   */
  async editContent(content) {
    const { spawn } = await import("node:child_process");
    const { writeFile, readFile, unlink } = await import("node:fs/promises");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");

    // Create temp file
    const tmpFile = join(tmpdir(), `doc-update-${Date.now()}.md`);
    await writeFile(tmpFile, content, "utf-8");

    // Get editor (prefer EDITOR env var, fallback to vim)
    const editor = process.env.EDITOR || "vim";

    return new Promise((resolve, reject) => {
      const editorProcess = spawn(editor, [tmpFile], {
        stdio: "inherit",
      });

      editorProcess.on("exit", async (code) => {
        if (code === 0) {
          try {
            const editedContent = await readFile(tmpFile, "utf-8");
            await unlink(tmpFile);
            resolve(editedContent);
          } catch (error) {
            reject(error);
          }
        } else {
          await unlink(tmpFile).catch(() => {});
          reject(new Error(`Editor exited with code ${code}`));
        }
      });

      editorProcess.on("error", async (error) => {
        await unlink(tmpFile).catch(() => {});
        reject(error);
      });
    });
  }

  /**
   * Reviews all patches and returns approved ones.
   * @param {Array} patches - Array of patches to review
   * @returns {Promise<Array>} Array of approved patches
   */
  async reviewAll(patches) {
    if (patches.length === 0) {
      console.log("\n✅ No documentation updates suggested");
      return [];
    }

    console.log(`\n📋 Reviewing ${patches.length} suggested documentation update(s)...`);

    const approved = [];

    for (let i = 0; i < patches.length; i++) {
      const patch = patches[i];
      const action = await this.reviewPatch(patch, i, patches.length);

      if (action === "accept") {
        approved.push(patch);
      } else if (action === "edit") {
        try {
          // Open editor
          const editedContent = await this.editContent(patch.suggestedContent);

          // Update patch with edited content
          patch.suggestedContent = editedContent;

          console.log("\n✅ Using edited version");
          approved.push(patch);
        } catch (error) {
          console.error(`\n❌ Error editing content: ${error.message}`);
          console.log("Skipping this update");
        }
      } else {
        console.log("⏭️  Skipped");
      }
    }

    console.log(`\n✅ Approved ${approved.length} of ${patches.length} update(s)`);

    return approved;
  }
}
