#!/usr/bin/env node

/**
 * changelog.js
 *
 * Captures git changes for documentation analysis.
 * Extracts changed files, commit messages, and diffs.
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

/**
 * Captures changelog data from git for documentation analysis.
 */
export class ChangelogCapture {
  /**
   * @param {string} repoPath - Absolute path to git repository
   * @param {string} baseBranch - Base branch to compare against (e.g., 'main')
   * @param {boolean} hookMode - Whether running from pre-commit hook (staged files only)
   */
  constructor(repoPath, baseBranch = "main", hookMode = false) {
    this.repoPath = repoPath;
    this.baseBranch = baseBranch;
    this.hookMode = hookMode;
  }

  /**
   * Executes a git command in the repository.
   * @param {string} command - Git command to execute
   * @returns {Promise<string>} Command output
   */
  async _execGit(command) {
    try {
      const { stdout } = await execAsync(command, { cwd: this.repoPath });
      return stdout.trim();
    } catch (error) {
      throw new Error(`Git command failed: ${command}\n${error.message}`);
    }
  }

  /**
   * Gets list of changed files.
   * In hook mode: returns staged files
   * In manual mode: returns files changed between base branch and HEAD
   * @returns {Promise<string[]>} Array of file paths
   */
  async getChangedFiles() {
    let command;
    if (this.hookMode) {
      // Staged files only
      command = "git diff --cached --name-only";
    } else {
      // All files changed between base and current branch
      command = `git diff ${this.baseBranch}...HEAD --name-only`;
    }

    const output = await this._execGit(command);
    return output ? output.split("\n").filter(Boolean) : [];
  }

  /**
   * Gets commit messages between base branch and HEAD.
   * Not applicable in hook mode (returns empty array).
   * @returns {Promise<Array<{hash: string, message: string}>>} Array of commits
   */
  async getCommitMessages() {
    if (this.hookMode) {
      return [];
    }

    try {
      const output = await this._execGit(
        `git log ${this.baseBranch}..HEAD --pretty=format:%H||%s`
      );

      if (!output) {
        return [];
      }

      return output.split("\n").map((line) => {
        const [hash, message] = line.split("||");
        return { hash, message };
      });
    } catch (error) {
      // Branch may not have diverged from base yet
      return [];
    }
  }

  /**
   * Gets full git diff.
   * In hook mode: returns staged diff
   * In manual mode: returns diff between base branch and HEAD
   * @param {number} maxLines - Maximum number of diff lines to return
   * @returns {Promise<string>} Git diff output
   */
  async getDiff(maxLines = 1000) {
    let command;
    if (this.hookMode) {
      command = "git diff --cached";
    } else {
      command = `git diff ${this.baseBranch}...HEAD`;
    }

    const output = await this._execGit(command);
    const lines = output.split("\n");

    if (lines.length > maxLines) {
      return lines.slice(0, maxLines).join("\n") +
             `\n\n... (truncated ${lines.length - maxLines} lines)`;
    }

    return output;
  }

  /**
   * Gets current branch name.
   * @returns {Promise<string>} Current branch name
   */
  async getCurrentBranch() {
    return await this._execGit("git branch --show-current");
  }

  /**
   * Captures all changelog data.
   * @returns {Promise<Object>} Complete changelog data
   */
  async capture() {
    const [changedFiles, commits, diff, currentBranch] = await Promise.all([
      this.getChangedFiles(),
      this.getCommitMessages(),
      this.getDiff(),
      this.getCurrentBranch(),
    ]);

    return {
      changedFiles,
      commits,
      diff,
      currentBranch,
      baseBranch: this.baseBranch,
      hookMode: this.hookMode,
    };
  }
}
