#!/usr/bin/env node

// src/cli.ts
import { Command } from "commander";

// src/cli/commands/init.ts
import path3 from "path";

// src/core/storage/file-system.ts
import fs from "fs/promises";
import path from "path";
import { existsSync } from "fs";
var FileSystem = class {
  constructor(rootDir = process.cwd()) {
    this.rootDir = rootDir;
  }
  rootDir;
  get continuityDir() {
    return path.join(this.rootDir, ".continuity");
  }
  resolve(...subpaths) {
    return path.join(this.rootDir, ...subpaths);
  }
  resolveContinuity(...subpaths) {
    return path.join(this.continuityDir, ...subpaths);
  }
  exists(filePath) {
    return existsSync(filePath);
  }
  isInitialized() {
    return this.exists(this.continuityDir) && this.exists(this.resolveContinuity("state.md"));
  }
  async ensureDir(dirPath) {
    await fs.mkdir(dirPath, { recursive: true });
  }
  async readFile(filePath) {
    return fs.readFile(filePath, "utf-8");
  }
  async writeFile(filePath, content) {
    await this.ensureDir(path.dirname(filePath));
    const tmpPath = `${filePath}.${Date.now()}.${Math.random().toString(36).substring(7)}.tmp`;
    await fs.writeFile(tmpPath, content, "utf-8");
    await fs.rename(tmpPath, filePath);
  }
  async listFiles(dirPath, extension) {
    if (!this.exists(dirPath)) return [];
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      if (entry.isFile()) {
        if (!extension || entry.name.endsWith(extension)) {
          files.push(path.join(dirPath, entry.name));
        }
      } else if (entry.isDirectory()) {
        const subFiles = await this.listFiles(path.join(dirPath, entry.name), extension);
        files.push(...subFiles);
      }
    }
    return files;
  }
  async deleteFile(filePath) {
    if (this.exists(filePath)) {
      await fs.unlink(filePath);
    }
  }
  async moveFile(srcPath, destPath) {
    await this.ensureDir(path.dirname(destPath));
    await fs.rename(srcPath, destPath);
  }
  async copyFile(srcPath, destPath) {
    await this.ensureDir(path.dirname(destPath));
    await fs.copyFile(srcPath, destPath);
  }
};

// src/core/git/git-client.ts
import { execFile } from "child_process";
import { promisify } from "util";
var execFileAsync = promisify(execFile);
var GitClient = class {
  constructor(cwd = process.cwd()) {
    this.cwd = cwd;
  }
  cwd;
  async runGit(args) {
    try {
      const { stdout } = await execFileAsync("git", args, { cwd: this.cwd });
      return stdout.trim();
    } catch {
      return "";
    }
  }
  async isGitRepository() {
    const res = await this.runGit(["rev-parse", "--is-inside-work-tree"]);
    return res === "true";
  }
  async getCurrentBranch() {
    const branch = await this.runGit(["branch", "--show-current"]);
    if (branch) return branch;
    const fallback = await this.runGit(["rev-parse", "--abbrev-ref", "HEAD"]);
    return fallback || "main";
  }
  async getLatestCommit() {
    const log = await this.runGit([
      "log",
      "-1",
      "--pretty=format:%H%x1f%h%x1f%s%x1f%an%x1f%ad",
      "--date=iso"
    ]);
    if (!log) return void 0;
    const parts = log.split("");
    if (parts.length < 5) return void 0;
    return {
      hash: parts[0],
      shortHash: parts[1],
      message: parts[2],
      author: parts[3],
      date: parts[4]
    };
  }
  async getStatus() {
    const isRepo = await this.isGitRepository();
    if (!isRepo) {
      return {
        isGitRepo: false,
        branch: "unknown",
        modifiedFiles: [],
        stagedFiles: [],
        untrackedFiles: [],
        hasUncommittedChanges: false
      };
    }
    const branch = await this.getCurrentBranch();
    const commit = await this.getLatestCommit();
    const statusOutput = await this.runGit(["status", "--porcelain=v1"]);
    const modifiedFiles = [];
    const stagedFiles = [];
    const untrackedFiles = [];
    if (statusOutput) {
      const lines = statusOutput.split("\n");
      for (const line of lines) {
        if (!line.trim()) continue;
        const indexStatus = line.charAt(0);
        const workTreeStatus = line.charAt(1);
        const filePath = line.substring(3).trim();
        if (indexStatus === "?" && workTreeStatus === "?") {
          untrackedFiles.push(filePath);
        } else {
          if (indexStatus !== " " && indexStatus !== "?") {
            stagedFiles.push(filePath);
          }
          if (workTreeStatus !== " " && workTreeStatus !== "?") {
            modifiedFiles.push(filePath);
          }
        }
      }
    }
    const hasUncommittedChanges = modifiedFiles.length > 0 || stagedFiles.length > 0 || untrackedFiles.length > 0;
    return {
      isGitRepo: true,
      branch,
      commit,
      modifiedFiles: Array.from(new Set(modifiedFiles)),
      stagedFiles: Array.from(new Set(stagedFiles)),
      untrackedFiles: Array.from(new Set(untrackedFiles)),
      hasUncommittedChanges
    };
  }
  async getDiff(cached = false) {
    const args = ["diff"];
    if (cached) args.push("--cached");
    return this.runGit(args);
  }
  async getChangedFilesSince(commitHash) {
    if (!commitHash) {
      const status = await this.getStatus();
      return [...status.modifiedFiles, ...status.stagedFiles];
    }
    const output = await this.runGit(["diff", "--name-only", `${commitHash}..HEAD`]);
    if (!output) return [];
    return output.split("\n").map((f) => f.trim()).filter(Boolean);
  }
  async getFileCommits(filePath, limit = 5) {
    const output = await this.runGit([
      "log",
      `-${limit}`,
      "--pretty=format:%h%x1f%s%x1f%ad",
      "--date=short",
      "--",
      filePath
    ]);
    if (!output) return [];
    return output.split("\n").map((line) => {
      const [hash, message, date] = line.split("");
      return { hash, message, date };
    }).filter((c) => Boolean(c.hash));
  }
};

// src/core/search/sqlite-indexer.ts
import path2 from "path";
var SQLiteIndexer = class {
  constructor(fs2) {
    this.fs = fs2;
  }
  fs;
  db = null;
  isNodeSqliteAvailable = false;
  inMemoryFallbackDocs = /* @__PURE__ */ new Map();
  async init() {
    const cacheDir = this.fs.resolveContinuity("cache");
    await this.fs.ensureDir(cacheDir);
    const dbPath = path2.join(cacheDir, "index.db");
    try {
      const sqliteModule = await import("sqlite");
      if (sqliteModule && sqliteModule.DatabaseSync) {
        this.db = new sqliteModule.DatabaseSync(dbPath);
        this.isNodeSqliteAvailable = true;
        this.setupTables();
        return;
      }
    } catch {
    }
    this.isNodeSqliteAvailable = false;
  }
  setupTables() {
    if (!this.db) return;
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS documents (
        path TEXT PRIMARY KEY,
        relative_path TEXT,
        type TEXT,
        title TEXT,
        content TEXT,
        modified_at INTEGER
      );
    `);
    try {
      this.db.exec(`
        CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
          path UNINDEXED,
          relative_path UNINDEXED,
          type,
          title,
          content,
          tokenize='porter unicode61'
        );
      `);
    } catch {
      this.isNodeSqliteAvailable = false;
    }
  }
  determineType(relativePath) {
    if (relativePath.includes("decisions/")) return "decision";
    if (relativePath.includes("tasks/")) return "task";
    if (relativePath.includes("sessions/")) return "session";
    if (relativePath.includes("failures/")) return "failure";
    if (relativePath.includes("handovers/")) return "handover";
    if (relativePath.endsWith("state.md")) return "state";
    if (relativePath.endsWith("project.md")) return "project";
    if (relativePath.endsWith("architecture.md")) return "architecture";
    if (relativePath.endsWith("roadmap.md")) return "roadmap";
    return "document";
  }
  extractTitle(content, fallback) {
    const match = content.match(/^#+\s+(.+)$/m);
    if (match && match[1]) {
      return match[1].trim();
    }
    return fallback;
  }
  async indexFile(filePath) {
    if (!this.fs.exists(filePath)) return;
    const content = await this.fs.readFile(filePath);
    const relativePath = path2.relative(this.fs.rootDir, filePath);
    const type = this.determineType(relativePath);
    const filename = path2.basename(filePath, ".md");
    const title = this.extractTitle(content, filename);
    const doc = {
      path: filePath,
      relativePath,
      type,
      title,
      content,
      modifiedAt: Date.now()
    };
    if (this.isNodeSqliteAvailable && this.db) {
      try {
        const stmt = this.db.prepare(`
          INSERT INTO documents (path, relative_path, type, title, content, modified_at)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(path) DO UPDATE SET
            relative_path=excluded.relative_path,
            type=excluded.type,
            title=excluded.title,
            content=excluded.content,
            modified_at=excluded.modified_at;
        `);
        stmt.run(doc.path, doc.relativePath, doc.type, doc.title, doc.content, doc.modifiedAt);
        const delFts = this.db.prepare(`DELETE FROM documents_fts WHERE path = ?;`);
        delFts.run(doc.path);
        const insFts = this.db.prepare(`
          INSERT INTO documents_fts (path, relative_path, type, title, content)
          VALUES (?, ?, ?, ?, ?);
        `);
        insFts.run(doc.path, doc.relativePath, doc.type, doc.title, doc.content);
        return;
      } catch {
      }
    }
    this.inMemoryFallbackDocs.set(filePath, doc);
  }
  async reindexAll() {
    const files = await this.fs.listFiles(this.fs.continuityDir, ".md");
    const continuityRootMd = this.fs.resolve("CONTINUITY.md");
    if (this.fs.exists(continuityRootMd)) {
      files.push(continuityRootMd);
    }
    let indexedCount = 0;
    for (const file of files) {
      if (file.includes("/cache/") || file.includes("\\cache\\")) continue;
      await this.indexFile(file);
      indexedCount++;
    }
    return indexedCount;
  }
  search(query, options = {}) {
    const limit = options.limit || 10;
    const sanitizedQuery = query.trim().replace(/['"*]/g, "");
    if (this.isNodeSqliteAvailable && this.db && sanitizedQuery) {
      try {
        let sql = `
          SELECT path, relative_path, type, title, snippet(documents_fts, 4, '>>>', '<<<', '...', 32) as snippet, bm25(documents_fts) as score
          FROM documents_fts
          WHERE documents_fts MATCH ?
        `;
        const params = [`"${sanitizedQuery}"*`];
        if (options.type) {
          sql += ` AND type = ?`;
          params.push(options.type);
        }
        sql += ` ORDER BY score ASC LIMIT ?;`;
        params.push(limit);
        const rows = this.db.prepare(sql).all(...params);
        return rows.map((row) => ({
          path: row.path,
          relativePath: row.relative_path,
          type: row.type,
          title: row.title,
          snippet: row.snippet || row.title,
          score: Math.abs(row.score)
        }));
      } catch {
      }
    }
    return this.fallbackSearch(sanitizedQuery, options.type, limit);
  }
  fallbackSearch(query, filterType, limit = 10) {
    const results = [];
    const lowerQuery = query.toLowerCase();
    const terms = lowerQuery.split(/\s+/).filter(Boolean);
    for (const doc of this.inMemoryFallbackDocs.values()) {
      if (filterType && doc.type !== filterType) continue;
      const lowerContent = doc.content.toLowerCase();
      const lowerTitle = doc.title.toLowerCase();
      let matchCount = 0;
      for (const term of terms) {
        if (lowerTitle.includes(term)) matchCount += 3;
        if (lowerContent.includes(term)) matchCount += 1;
      }
      if (matchCount > 0) {
        let snippet = doc.title;
        const firstIndex = lowerContent.indexOf(terms[0]);
        if (firstIndex !== -1) {
          const start = Math.max(0, firstIndex - 50);
          const end = Math.min(doc.content.length, firstIndex + 150);
          snippet = "..." + doc.content.slice(start, end).replace(/\n+/g, " ") + "...";
        }
        results.push({
          path: doc.path,
          relativePath: doc.relativePath,
          type: doc.type,
          title: doc.title,
          snippet,
          score: matchCount
        });
      }
    }
    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }
  close() {
    if (this.db) {
      try {
        this.db.close();
      } catch {
      }
      this.db = null;
    }
  }
};

// src/cli/formatters/terminal.ts
import pc from "picocolors";
var TerminalFormatter = class {
  static header(title) {
    console.log("\n" + pc.bold(pc.cyan(`=== ${title.toUpperCase()} ===`)));
  }
  static section(title) {
    console.log("\n" + pc.bold(pc.yellow(title)));
    console.log(pc.gray("-".repeat(Math.max(title.length, 30))));
  }
  static item(label, value) {
    console.log(`${pc.bold(label.padEnd(16))}: ${value !== void 0 ? value : pc.gray("None")}`);
  }
  static success(message) {
    console.log(pc.green(`\u2713 ${message}`));
  }
  static warning(message) {
    console.log(pc.yellow(`! ${message}`));
  }
  static error(message) {
    console.log(pc.red(`\u2717 ${message}`));
  }
  static info(message) {
    console.log(pc.blue(`\u2139 ${message}`));
  }
  static checklist(completed, remaining) {
    if (completed.length > 0) {
      console.log(pc.bold(pc.green("\nCOMPLETED")));
      for (const item of completed) {
        console.log(pc.green(`  \u2713 ${item}`));
      }
    }
    if (remaining.length > 0) {
      console.log(pc.bold(pc.cyan("\nREMAINING")));
      for (const item of remaining) {
        console.log(pc.cyan(`  \u25A1 ${item}`));
      }
    }
  }
  static box(title, lines) {
    const width = Math.max(...lines.map((l) => l.length), title.length + 4, 45);
    const top = `\u250C\u2500 ${title} ${"\u2500".repeat(Math.max(0, width - title.length - 4))}\u2510`;
    const bottom = `\u2514${"\u2500".repeat(width)}\u2518`;
    console.log("\n" + pc.cyan(top));
    for (const line of lines) {
      console.log(pc.cyan("\u2502 ") + line.padEnd(width - 2) + pc.cyan(" \u2502"));
    }
    console.log(pc.cyan(bottom) + "\n");
  }
};

// src/templates/defaults.ts
var DEFAULT_CONTINUITY_MD = `# Continuity Protocol

This project uses the **Continuity** persistent context and work-state system.
Continuity is the portable, machine-readable and human-readable source of truth about the work.

## Before Working (Session Start)
1. Run \`continuity resume\` (or inspect \`.continuity/state.md\`).
2. Read \`.continuity/project.md\` and \`.continuity/architecture.md\` to understand system boundaries.
3. Inspect Git status: \`git status\` to check for any uncommitted changes or current branch.
4. Read the **Next Action** recorded in \`.continuity/state.md\` and continue directly from it.
5. Check \`.continuity/failures/\` to make sure you do NOT attempt previously failed approaches.

## While Working
- Respect existing architectural decisions recorded in \`.continuity/decisions/\`.
- If an approach fails, record it with \`continuity failure record\`.
- If you make a significant architectural or design decision, log it with \`continuity decision\`.
- Update task progress as you complete checklist items: \`continuity task update\`.

## After Completing Work (Session End)
1. Run \`continuity handover\` or \`continuity done\` to capture:
   - What was completed
   - What remains
   - Files changed
   - Known blockers or bugs
   - Concrete, actionable **Next Action** (file, problem, expected solution, and constraints)
2. Save your session record: \`continuity session save\`.

Do not make the next AI or developer ask "What were we doing?". Leave the project ready to continue.
`;
var DEFAULT_PROJECT_MD = (projectName, description = "", stack = []) => `# Project

## Name
${projectName}

## Purpose
${description || "Describe the core mission and purpose of this project."}

## Stack
${stack.length > 0 ? stack.map((s) => `- ${s}`).join("\n") : "- Node.js\n- TypeScript"}

## Architecture
Modular architecture with clean separation of concerns.

## Database
SQLite / PostgreSQL

## Infrastructure
Docker / Local
`;
var DEFAULT_STATE_MD = (projectName, branch = "main") => `# Current State

## Project
${projectName}

## Current Branch
${branch}

## Current Task
Project setup & initialization

## Status
Ready \u2014 100%

## Progress
100%

## Completed
\u2713 Continuity system initialized

## Remaining
\u25A1 Define initial feature task

## Current Files
- CONTINUITY.md

## Current Blocker
None

## Last Action
Project initialized with Continuity

## Next Action
Problem: No active task defined yet.
Expected solution: Run 'continuity task start <name>' to begin feature work.
Constraints:
- Respect architectural boundaries defined in architecture.md

## Last Session
None

## Last Commit
Initial
`;
var DEFAULT_ARCHITECTURE_MD = (projectName) => `# Architecture: ${projectName}

## Overview
High-level architectural blueprint and engineering conventions.

## Services & Components
- **Core Engine**: Business logic, persistence, and state operations.
- **Interfaces**: CLI and programmatic API.

## Communication Patterns
- Synchronous function calls for local operations.
- Explicit atomic file persistence for state and history.

## Design Constraints & Invariants
1. **Never make the AI remember something the project can remember for it.**
2. **Persistence is canonical in Git-tracked Markdown.** Fast indexing is handled via SQLite.
3. **Optimized for continuation, not merely passive documentation.**
`;
var DEFAULT_ROADMAP_MD = `# Product & Technical Roadmap

## Phase 1: Core Functionality
- [x] Repository initialization and continuity setup
- [ ] Core feature implementation
- [ ] Automated testing suite

## Phase 2: Refinement & Scale
- [ ] Integration and performance testing
- [ ] Production deployment
`;
var DEFAULT_INDEX_MD = `# Continuity Index

This directory holds the persistent state and memory for the project.

- **[Current State](state.md)**: Live state of current branch, task, progress, and next action.
- **[Project Identity](project.md)**: Project purpose, tech stack, and goals.
- **[Architecture](architecture.md)**: Architectural boundaries, components, and rules.
- **[Tasks](tasks/)**: Active, completed, and blocked tasks.
- **[Decisions](decisions/)**: Architecture Decision Records (ADRs).
- **[Failures](failures/)**: Documented failed approaches ("Do Not Repeat").
- **[Handovers](handovers/)**: Actionable work handovers between sessions.
- **[Sessions](sessions/)**: Chronological records of developer & AI sessions.
`;
var DEFAULT_CONFIG_YML = `# Continuity Configuration

version: 1

git:
  track:
    - state.md
    - project.md
    - architecture.md
    - roadmap.md
    - index.md
    - tasks/**
    - decisions/**
    - failures/**
    - handovers/**
    - sessions/summaries/**
  ignore:
    - sessions/raw/**
    - cache/**
    - "*.tmp"

redaction:
  enabled: true
  files:
    - .env
    - .env.*
    - "*.pem"
    - "*.key"
    - id_rsa
    - credentials.json

ai:
  instructionsFile: CONTINUITY.md
`;

// src/templates/universal-skill.ts
var UNIVERSAL_SKILL_MD = `---
name: continuity
description: Read, update, and manage persistent project-context and work-state using the Continuity system.
---

# Continuity Universal Agent Skill

You are operating inside a codebase that uses **Continuity** for persistent project-context, task state, and cross-AI work continuation.

## 1. When Resuming Work (Session Start)
Whenever you start a session or are asked to work on a task:
1. Run \`continuity resume\` in the terminal (or read \`CONTINUITY.md\` and \`.continuity/state.md\`).
2. Review the output:
   - **Current Task & Progress**
   - **Remaining items**
   - **Relevant files**
   - **Failed Approaches ("Do Not Repeat")**
   - **Recommended Next Action**
3. Check \`git status\` to see if there are any uncommitted changes from prior work.
4. Continue directly from the recommended next action without asking "What should I work on?".

## 2. While Working
- **Architectural decisions**: Respect existing decisions in \`.continuity/decisions/\`.
- **New major decisions**: Record them using \`continuity decision "<title>"\` or \`continuity log "<message>"\`.
- **Failures & Blockers**: If an implementation attempt fails, NEVER silently discard it. Record it with \`continuity failure record\` so subsequent agents will not repeat the mistake.
- **Task updates**: As you make progress, update the task with \`continuity task update\`.

## 3. When Concluding Work (Session End / Handover)
Before ending your work:
1. Run \`continuity handover\` or \`continuity done\` to generate an actionable continuation package.
2. Ensure the **Next Action** contains:
   - Specific file path to open
   - Exact function or block to focus on
   - Clear problem description
   - Expected technical solution
   - Any constraints (e.g. "Do not modify the auth architecture")
3. Save the session: \`continuity session save\`.
`;
var CURSOR_RULES_MDC = `---
description: Continuity system integration for Cursor
globs: *
---

# Continuity Protocol for Cursor

This repository uses Continuity for persistent context across AI and human sessions.

- Before starting work:
  1. Inspect \`.continuity/state.md\` or run \`continuity resume\`.
  2. Follow the recorded "Next Action".
  3. Never repeat failed approaches listed in \`.continuity/failures/\`.

- After making significant changes or completing tasks:
  1. Update \`.continuity/state.md\` or run \`continuity task update\`.
  2. If handing over, run \`continuity handover\`.
`;
var CLAUDE_CODE_SNIPPET = `# Continuity Protocol (Claude Code)

This repository uses the Continuity work-state system.
Before working on any task:
1. Run \`continuity resume\` to load current project state, active task, and the exact next action.
2. Respect existing Architecture Decision Records in \`.continuity/decisions/\`.
3. Check \`.continuity/failures/\` to avoid previously failed approaches.
4. When finished or handing over, run \`continuity handover\` and save session with \`continuity session save\`.
`;
var WINDSURF_RULES_SNIPPET = `# Continuity Rules for Windsurf
- On task start: Run \`continuity resume\` and follow Next Action.
- Do not repeat approaches documented in \`.continuity/failures/\`.
- On completion: Run \`continuity handover\`.
`;
var CLINE_RULES_SNIPPET = `# Continuity Protocol for Cline / Roo-Code
Always check \`.continuity/state.md\` before beginning.
Resume context using \`continuity resume\`.
Record failed attempts into \`.continuity/failures/\`.
Generate handover on completion using \`continuity handover\`.
`;

// src/cli/commands/init.ts
async function runInit(options = {}) {
  const fs2 = new FileSystem();
  const git = new GitClient();
  if (fs2.isInitialized() && !options.force) {
    TerminalFormatter.warning("Continuity is already initialized in this repository.");
    console.log("Use --force to re-initialize files.");
    return;
  }
  let projectName = options.name;
  if (!projectName) {
    const pkgPath = fs2.resolve("package.json");
    if (fs2.exists(pkgPath)) {
      try {
        const pkg = JSON.parse(await fs2.readFile(pkgPath));
        projectName = pkg.name;
      } catch {
      }
    }
  }
  if (!projectName) {
    projectName = path3.basename(process.cwd());
  }
  const branch = await git.isGitRepository() ? await git.getCurrentBranch() : "main";
  TerminalFormatter.header(`Initializing Continuity for "${projectName}"`);
  const dirs = [
    fs2.resolveContinuity("tasks", "active"),
    fs2.resolveContinuity("tasks", "completed"),
    fs2.resolveContinuity("tasks", "blocked"),
    fs2.resolveContinuity("sessions", "summaries"),
    fs2.resolveContinuity("sessions", "raw"),
    fs2.resolveContinuity("handovers"),
    fs2.resolveContinuity("decisions"),
    fs2.resolveContinuity("failures"),
    fs2.resolveContinuity("snapshots"),
    fs2.resolveContinuity("cache"),
    fs2.resolve("skills", "continuity")
  ];
  for (const dir of dirs) {
    await fs2.ensureDir(dir);
  }
  await fs2.writeFile(fs2.resolve("CONTINUITY.md"), DEFAULT_CONTINUITY_MD);
  TerminalFormatter.success("Created CONTINUITY.md (root protocol file)");
  await fs2.writeFile(fs2.resolveContinuity("project.md"), DEFAULT_PROJECT_MD(projectName, options.description, options.stack));
  TerminalFormatter.success("Created .continuity/project.md");
  await fs2.writeFile(fs2.resolveContinuity("state.md"), DEFAULT_STATE_MD(projectName, branch));
  TerminalFormatter.success("Created .continuity/state.md");
  await fs2.writeFile(fs2.resolveContinuity("architecture.md"), DEFAULT_ARCHITECTURE_MD(projectName));
  TerminalFormatter.success("Created .continuity/architecture.md");
  await fs2.writeFile(fs2.resolveContinuity("roadmap.md"), DEFAULT_ROADMAP_MD);
  TerminalFormatter.success("Created .continuity/roadmap.md");
  await fs2.writeFile(fs2.resolveContinuity("index.md"), DEFAULT_INDEX_MD);
  TerminalFormatter.success("Created .continuity/index.md");
  await fs2.writeFile(fs2.resolveContinuity("config.yml"), DEFAULT_CONFIG_YML);
  TerminalFormatter.success("Created .continuity/config.yml");
  await fs2.writeFile(fs2.resolve("skills", "continuity", "SKILL.md"), UNIVERSAL_SKILL_MD);
  TerminalFormatter.success("Created skills/continuity/SKILL.md");
  if (options.withAgents) {
    await fs2.ensureDir(fs2.resolve(".cursor", "rules"));
    await fs2.writeFile(fs2.resolve(".cursor", "rules", "continuity.mdc"), CURSOR_RULES_MDC);
    await fs2.writeFile(fs2.resolve("CLAUDE.md"), CLAUDE_CODE_SNIPPET);
    await fs2.writeFile(fs2.resolve(".windsurfrules"), WINDSURF_RULES_SNIPPET);
    await fs2.writeFile(fs2.resolve(".clinerules"), CLINE_RULES_SNIPPET);
    TerminalFormatter.success("Created AI agent adapters (Cursor, Claude Code, Windsurf, Cline)");
  }
  const gitignorePath = fs2.resolve(".gitignore");
  let gitignoreContent = fs2.exists(gitignorePath) ? await fs2.readFile(gitignorePath) : "";
  const ignoresToAdd = [];
  if (!gitignoreContent.includes(".continuity/cache")) {
    ignoresToAdd.push(".continuity/cache/");
  }
  if (!gitignoreContent.includes(".continuity/sessions/raw")) {
    ignoresToAdd.push(".continuity/sessions/raw/");
  }
  if (ignoresToAdd.length > 0) {
    const updatedGitignore = (gitignoreContent ? gitignoreContent.trim() + "\n\n" : "") + "# Continuity local cache and raw transcripts\n" + ignoresToAdd.join("\n") + "\n";
    await fs2.writeFile(gitignorePath, updatedGitignore);
    TerminalFormatter.success("Updated .gitignore with .continuity/cache/ and .continuity/sessions/raw/");
  }
  const indexer = new SQLiteIndexer(fs2);
  await indexer.init();
  const indexed = await indexer.reindexAll();
  indexer.close();
  TerminalFormatter.success(`Indexed ${indexed} initial documents into SQLite cache`);
  TerminalFormatter.box("Continuity Initialized Successfully", [
    "Your repository is now equipped with Continuity.",
    "Any AI agent can now resume work with:",
    "  continuity resume",
    "",
    "Next steps:",
    "1. Review .continuity/project.md and architecture.md",
    '2. Start your first task: continuity task start "<task-title>"'
  ]);
}

// src/core/types/state.ts
import { z as z2 } from "zod";

// src/core/types/handover.ts
import { z } from "zod";
var NextActionSchema = z.object({
  file: z.string().optional(),
  focus: z.string().optional(),
  problem: z.string(),
  expectedSolution: z.string(),
  constraints: z.array(z.string()).default([])
});
var HandoverSchema = z.object({
  id: z.string(),
  date: z.string(),
  project: z.string(),
  branch: z.string(),
  commit: z.string().optional(),
  currentTask: z.string().optional(),
  progress: z.number().min(0).max(100).default(0),
  completed: z.array(z.string()).default([]),
  remaining: z.array(z.string()).default([]),
  modifiedFiles: z.array(z.string()).default([]),
  uncommittedChanges: z.boolean().default(false),
  decisions: z.array(z.string()).default([]),
  problems: z.array(z.string()).default([]),
  failedApproaches: z.array(z.string()).default([]),
  nextAction: NextActionSchema,
  author: z.string().default("ai")
});

// src/core/types/state.ts
var ProjectInfoSchema = z2.object({
  name: z2.string(),
  purpose: z2.string().default(""),
  stack: z2.array(z2.string()).default([]),
  architecture: z2.string().default(""),
  database: z2.string().optional(),
  infrastructure: z2.array(z2.string()).default([]),
  repository: z2.string().optional()
});
var ContinuityStateSchema = z2.object({
  project: z2.string(),
  currentBranch: z2.string().default("main"),
  currentTask: z2.string().default("No active task"),
  status: z2.string().default("Ready"),
  progress: z2.number().min(0).max(100).default(0),
  completed: z2.array(z2.string()).default([]),
  remaining: z2.array(z2.string()).default([]),
  currentFiles: z2.array(z2.string()).default([]),
  currentBlocker: z2.string().nullable().default(null),
  lastAction: z2.string().default("Project initialized"),
  nextAction: NextActionSchema.or(z2.string()).default({
    problem: "No blocker",
    expectedSolution: "Continue with next task",
    constraints: []
  }),
  lastSession: z2.string().optional(),
  lastCommit: z2.string().optional(),
  updatedAt: z2.string()
});

// src/core/storage/markdown.ts
import matter from "gray-matter";
var MarkdownHelper = class {
  static parse(rawContent) {
    const parsed = matter(rawContent);
    return {
      data: parsed.data,
      content: parsed.content.trim()
    };
  }
  static stringify(content, data) {
    if (!data || Object.keys(data).length === 0) {
      return content.trim() + "\n";
    }
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== void 0) {
        cleaned[key] = value;
      }
    }
    if (Object.keys(cleaned).length === 0) {
      return content.trim() + "\n";
    }
    return matter.stringify(content.trim() + "\n", cleaned);
  }
  /**
   * Extracts top-level or H2 sections from markdown text
   */
  static extractSections(markdown) {
    const sections = /* @__PURE__ */ new Map();
    const lines = markdown.split("\n");
    let currentHeader = "";
    let currentContent = [];
    for (const line of lines) {
      const headerMatch = line.match(/^#{1,3}\s+(.+)$/);
      if (headerMatch) {
        if (currentHeader) {
          sections.set(currentHeader.trim(), currentContent.join("\n").trim());
        }
        currentHeader = headerMatch[1].trim();
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }
    if (currentHeader) {
      sections.set(currentHeader.trim(), currentContent.join("\n").trim());
    }
    return sections;
  }
  /**
   * Parses Markdown bullet list into string array
   */
  static parseBulletList(text) {
    if (!text) return [];
    return text.split("\n").map((line) => line.trim()).filter((line) => line.startsWith("-") || line.startsWith("*") || line.startsWith("\u2713") || line.startsWith("\u25A1")).map((line) => line.replace(/^[-*✓□]\s*/, "").trim()).filter(Boolean);
  }
  /**
   * Formats string array into Markdown bullet list
   */
  static formatBulletList(items, bullet = "-") {
    if (!items || items.length === 0) return "None";
    return items.map((item) => `${bullet} ${item}`).join("\n");
  }
  /**
   * Formats checked bullet list (✓ / □)
   */
  static formatChecklist(items) {
    if (!items || items.length === 0) return "None";
    return items.map((item) => `${item.completed ? "\u2713" : "\u25A1"} ${item.title}`).join("\n");
  }
};

// src/core/engine/state-manager.ts
var StateManager = class {
  constructor(fs2) {
    this.fs = fs2;
  }
  fs;
  async getState() {
    const statePath = this.fs.resolveContinuity("state.md");
    if (!this.fs.exists(statePath)) {
      throw new Error(`State file not found at ${statePath}. Run 'continuity init' first.`);
    }
    const content = await this.fs.readFile(statePath);
    return this.parseStateMarkdown(content);
  }
  async saveState(state) {
    let current;
    try {
      current = await this.getState();
    } catch {
      current = {
        project: state.project || "Untitled Project",
        currentBranch: "main",
        currentTask: "No active task",
        status: "Ready",
        progress: 0,
        completed: [],
        remaining: [],
        currentFiles: [],
        currentBlocker: null,
        lastAction: "Initialized",
        nextAction: {
          problem: "No blocker",
          expectedSolution: "Define task and start development",
          constraints: []
        },
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    const merged = {
      ...current,
      ...state,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const validated = ContinuityStateSchema.parse(merged);
    const markdown = this.formatStateMarkdown(validated);
    await this.fs.writeFile(this.fs.resolveContinuity("state.md"), markdown);
    return validated;
  }
  async getProjectInfo() {
    const projectPath = this.fs.resolveContinuity("project.md");
    if (!this.fs.exists(projectPath)) {
      let fallbackName = "";
      try {
        const statePath = this.fs.resolveContinuity("state.md");
        if (this.fs.exists(statePath)) {
          const raw2 = await this.fs.readFile(statePath);
          const sections2 = MarkdownHelper.extractSections(raw2);
          fallbackName = sections2.get("Project") || "";
        }
      } catch {
      }
      return {
        name: fallbackName || "Project",
        purpose: "",
        stack: [],
        architecture: "",
        infrastructure: []
      };
    }
    const raw = await this.fs.readFile(projectPath);
    const sections = MarkdownHelper.extractSections(raw);
    const name = sections.get("Name") || "Project";
    const purpose = sections.get("Purpose") || "";
    const stack = MarkdownHelper.parseBulletList(sections.get("Stack") || "");
    const architecture = sections.get("Architecture") || "";
    const database = sections.get("Database") || void 0;
    const infrastructure = MarkdownHelper.parseBulletList(sections.get("Infrastructure") || "");
    const repository = sections.get("Repository") || void 0;
    return {
      name,
      purpose,
      stack,
      architecture,
      database,
      infrastructure,
      repository
    };
  }
  async getArchitecture() {
    const archPath = this.fs.resolveContinuity("architecture.md");
    if (!this.fs.exists(archPath)) return "";
    return this.fs.readFile(archPath);
  }
  parseStateMarkdown(markdown) {
    const sections = MarkdownHelper.extractSections(markdown);
    const project = sections.get("Project") || "Project";
    const currentBranch = sections.get("Current Branch") || "main";
    const currentTask = sections.get("Current Task") || "No active task";
    const status = sections.get("Status") || "In Progress";
    const progressStr = sections.get("Progress") || "0";
    const progress = parseInt(progressStr.replace(/[^0-9]/g, ""), 10) || 0;
    const completed = MarkdownHelper.parseBulletList(sections.get("Completed") || "");
    const remaining = MarkdownHelper.parseBulletList(sections.get("Remaining") || "");
    const currentFiles = MarkdownHelper.parseBulletList(sections.get("Current Files") || "");
    const rawBlocker = sections.get("Current Blocker");
    const currentBlocker = !rawBlocker || rawBlocker.toLowerCase() === "none" ? null : rawBlocker;
    const lastAction = sections.get("Last Action") || "";
    const lastSession = sections.get("Last Session") || void 0;
    const lastCommit = sections.get("Last Commit") || void 0;
    const nextActionRaw = sections.get("Next Action") || "";
    let nextAction;
    if (typeof nextActionRaw === "string") {
      const fileMatch = nextActionRaw.match(/Open:\s*([^\n]+)/);
      const focusMatch = nextActionRaw.match(/Focus:\s*([^\n]+)/);
      const problemMatch = nextActionRaw.match(/Problem:\s*([^\n]+)/);
      const solutionMatch = nextActionRaw.match(/Expected solution:\s*([^\n]+)/i) || nextActionRaw.match(/Solution:\s*([^\n]+)/i);
      nextAction = {
        file: fileMatch ? fileMatch[1].trim() : void 0,
        focus: focusMatch ? focusMatch[1].trim() : void 0,
        problem: problemMatch ? problemMatch[1].trim() : nextActionRaw.trim() || "Continue current task",
        expectedSolution: solutionMatch ? solutionMatch[1].trim() : "Proceed with implementation",
        constraints: MarkdownHelper.parseBulletList(nextActionRaw)
      };
    } else {
      nextAction = nextActionRaw;
    }
    return {
      project,
      currentBranch,
      currentTask,
      status,
      progress,
      completed,
      remaining,
      currentFiles,
      currentBlocker,
      lastAction,
      nextAction,
      lastSession,
      lastCommit,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  formatStateMarkdown(state) {
    let nextActionBlock = "";
    if (typeof state.nextAction === "string") {
      nextActionBlock = state.nextAction;
    } else {
      const parts = [];
      if (state.nextAction.file) parts.push(`Open:
${state.nextAction.file}`);
      if (state.nextAction.focus) parts.push(`Focus:
${state.nextAction.focus}`);
      parts.push(`Problem:
${state.nextAction.problem}`);
      parts.push(`Expected solution:
${state.nextAction.expectedSolution}`);
      if (state.nextAction.constraints && state.nextAction.constraints.length > 0) {
        parts.push(`Constraints:
${MarkdownHelper.formatBulletList(state.nextAction.constraints)}`);
      }
      nextActionBlock = parts.join("\n\n");
    }
    return `# Current State

## Project
${state.project}

## Current Branch
${state.currentBranch}

## Current Task
${state.currentTask}

## Status
${state.status}

## Progress
${state.progress}%

## Completed
${MarkdownHelper.formatBulletList(state.completed, "\u2713")}

## Remaining
${MarkdownHelper.formatBulletList(state.remaining, "\u25A1")}

## Current Files
${MarkdownHelper.formatBulletList(state.currentFiles)}

## Current Blocker
${state.currentBlocker || "None"}

## Last Action
${state.lastAction}

## Next Action
${nextActionBlock}

## Last Session
${state.lastSession || "None"}

## Last Commit
${state.lastCommit || "None"}
`;
  }
};

// src/cli/commands/status.ts
async function runStatus(options = {}) {
  const fs2 = new FileSystem();
  if (!fs2.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized in this project. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }
  const git = new GitClient();
  const stateManager = new StateManager(fs2);
  const state = await stateManager.getState();
  const gitStatus = await git.getStatus();
  const projectInfo = await stateManager.getProjectInfo();
  const projectName = projectInfo.name || state.project;
  const branch = gitStatus.isGitRepo ? gitStatus.branch : state.currentBranch;
  const commit = gitStatus.commit?.shortHash || state.lastCommit || "unknown";
  if (options.json) {
    console.log(
      JSON.stringify(
        {
          project: projectName,
          branch,
          commit,
          currentTask: state.currentTask,
          status: state.status,
          progress: state.progress,
          completed: state.completed,
          remaining: state.remaining,
          currentFiles: state.currentFiles,
          currentBlocker: state.currentBlocker,
          lastAction: state.lastAction,
          lastSession: state.lastSession,
          nextAction: state.nextAction
        },
        null,
        2
      )
    );
    return;
  }
  TerminalFormatter.section("PROJECT");
  TerminalFormatter.item("Name", projectName);
  TerminalFormatter.item("Branch", branch);
  TerminalFormatter.item("Commit", commit);
  TerminalFormatter.section("CURRENT TASK");
  console.log(state.currentTask);
  TerminalFormatter.section("STATUS");
  console.log(`${state.status} (${state.progress}%)`);
  TerminalFormatter.checklist(state.completed, state.remaining);
  TerminalFormatter.section("LAST WORKED ON");
  if (state.currentFiles.length > 0) {
    for (const f of state.currentFiles) {
      console.log(`- ${f}`);
    }
  } else {
    console.log("None recorded");
  }
  TerminalFormatter.section("LAST SESSION");
  console.log(state.lastSession || "None recorded");
  TerminalFormatter.section("NEXT ACTION");
  if (typeof state.nextAction === "string") {
    console.log(state.nextAction);
  } else {
    if (state.nextAction.file) console.log(`Open: ${state.nextAction.file}`);
    if (state.nextAction.focus) console.log(`Focus: ${state.nextAction.focus}`);
    console.log(`Problem: ${state.nextAction.problem}`);
    console.log(`Expected solution: ${state.nextAction.expectedSolution}`);
  }
}

// src/core/engine/handover-manager.ts
import path4 from "path";

// src/core/security/redactor.ts
var SecretRedactor = class {
  patterns = [
    // Anthropic API Keys (ordered before generic sk-)
    {
      name: "Anthropic API Key",
      regex: /sk-ant-[a-zA-Z0-9_\-]{20,}/g,
      replacement: "[REDACTED:ANTHROPIC_KEY]"
    },
    // OpenAI API Keys
    {
      name: "OpenAI API Key",
      regex: /sk-(?!ant-)[a-zA-Z0-9_\-]{20,}/g,
      replacement: "[REDACTED:OPENAI_KEY]"
    },
    // Google / Firebase API Keys
    {
      name: "Google API Key",
      regex: /AIzaSy[a-zA-Z0-9_\-]{33}/g,
      replacement: "[REDACTED:GOOGLE_API_KEY]"
    },
    // GitHub Tokens
    {
      name: "GitHub Token",
      regex: /gh[pousr]_[a-zA-Z0-9]{36,}/g,
      replacement: "[REDACTED:GITHUB_TOKEN]"
    },
    // AWS Access Key
    {
      name: "AWS Access Key ID",
      regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g,
      replacement: "[REDACTED:AWS_KEY]"
    },
    // RSA / Private Keys
    {
      name: "Private Key Block",
      regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
      replacement: "[REDACTED:PRIVATE_KEY]"
    },
    // Generic JWT tokens
    {
      name: "JSON Web Token (JWT)",
      regex: /eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g,
      replacement: "[REDACTED:JWT_TOKEN]"
    },
    // Bearer tokens
    {
      name: "Bearer Token",
      regex: /Bearer\s+([a-zA-Z0-9_\-\.~]{25,})/gi,
      replacement: "Bearer [REDACTED:BEARER_TOKEN]"
    },
    // Common Key-Value assignments (e.g. api_key = "...", password: "...")
    {
      name: "Credential Assignment",
      regex: /(?<=\b(?:password|passwd|secret|api_?key|access_?token|auth_?token|client_?secret)\s*[:=]\s*["'])([^"'\r\n]{6,})(?=["'])/gi,
      replacement: "[REDACTED:CREDENTIAL]"
    }
  ];
  restrictedFileGlobs = [
    /^\.env(\..+)?$/,
    /.*\.pem$/,
    /.*\.key$/,
    /^id_rsa$/,
    /^id_ed25519$/,
    /.*credentials\.json$/
  ];
  constructor(customPatterns = []) {
    for (const p of customPatterns) {
      this.patterns.push({
        name: p.name,
        regex: new RegExp(p.regex, "g"),
        replacement: p.replacement
      });
    }
  }
  isRestrictedFile(filePath) {
    const filename = filePath.split(/[/\\]/).pop() || filePath;
    return this.restrictedFileGlobs.some((pattern) => pattern.test(filename));
  }
  redact(input) {
    let result = input;
    let totalRedacted = 0;
    const detections = [];
    for (const pattern of this.patterns) {
      pattern.regex.lastIndex = 0;
      const matches = result.match(pattern.regex);
      if (matches && matches.length > 0) {
        totalRedacted += matches.length;
        detections.push(`${pattern.name} (${matches.length})`);
        result = result.replace(pattern.regex, pattern.replacement);
      }
    }
    return {
      text: result,
      redactedCount: totalRedacted,
      detections
    };
  }
};

// src/core/engine/handover-manager.ts
var HandoverManager = class {
  constructor(fs2, git, stateManager, decisionManager, failureManager) {
    this.fs = fs2;
    this.git = git;
    this.stateManager = stateManager;
    this.decisionManager = decisionManager;
    this.failureManager = failureManager;
    this.redactor = new SecretRedactor();
  }
  fs;
  git;
  stateManager;
  decisionManager;
  failureManager;
  redactor;
  get handoversDir() {
    return this.fs.resolveContinuity("handovers");
  }
  async createHandover(data) {
    const now = /* @__PURE__ */ new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");
    const timeStr = `${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}`;
    const projectInfo = await this.stateManager.getProjectInfo();
    const currentState = await this.stateManager.getState();
    const gitStatus = await this.git.getStatus();
    const taskSlug = (data.currentTask || currentState.currentTask).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").substring(0, 30);
    const id = `handover_${year}${month}${day}_${timeStr}_${taskSlug}`;
    const targetDir = path4.join(this.handoversDir, year, month);
    await this.fs.ensureDir(targetDir);
    const modifiedFiles = Array.from(
      /* @__PURE__ */ new Set([
        ...gitStatus.modifiedFiles,
        ...gitStatus.stagedFiles,
        ...currentState.currentFiles,
        ...data.nextAction.file ? [data.nextAction.file] : []
      ])
    );
    let decisions = data.decisions || [];
    if (decisions.length === 0) {
      const adrs = await this.decisionManager.listDecisions();
      decisions = adrs.slice(-3).map((a) => `${a.id}: ${a.title} - ${a.decision}`);
    }
    let failedApproaches = data.failedApproaches || [];
    if (failedApproaches.length === 0) {
      const failures = await this.failureManager.listFailures();
      failedApproaches = failures.slice(0, 3).map((f) => `${f.title}: ${f.doNotRepeat}`);
    }
    const sanitizedNextAction = {
      file: data.nextAction.file,
      focus: data.nextAction.focus,
      problem: this.redactor.redact(data.nextAction.problem).text,
      expectedSolution: this.redactor.redact(data.nextAction.expectedSolution).text,
      constraints: (data.nextAction.constraints || []).map((c) => this.redactor.redact(c).text)
    };
    const handover = {
      id,
      date: `${year}-${month}-${day} ${timeStr.slice(0, 2)}:${timeStr.slice(2, 4)}`,
      project: projectInfo.name || currentState.project,
      branch: gitStatus.branch || currentState.currentBranch,
      commit: gitStatus.commit?.shortHash || currentState.lastCommit,
      currentTask: data.currentTask || currentState.currentTask,
      progress: data.progress !== void 0 ? data.progress : currentState.progress,
      completed: data.completed || currentState.completed,
      remaining: data.remaining || currentState.remaining,
      modifiedFiles,
      uncommittedChanges: gitStatus.hasUncommittedChanges,
      decisions,
      problems: data.problems || (currentState.currentBlocker ? [currentState.currentBlocker] : []),
      failedApproaches,
      nextAction: sanitizedNextAction,
      author: data.author || "ai"
    };
    const validated = HandoverSchema.parse(handover);
    const markdown = this.formatHandoverMarkdown(validated);
    const filePath = path4.join(targetDir, `${id}.md`);
    await this.fs.writeFile(filePath, markdown);
    await this.stateManager.saveState({
      currentBranch: validated.branch,
      currentTask: validated.currentTask,
      progress: validated.progress,
      status: `In progress \u2014 ${validated.progress}%`,
      completed: validated.completed,
      remaining: validated.remaining,
      currentFiles: validated.modifiedFiles,
      currentBlocker: validated.problems.length > 0 ? validated.problems[0] : null,
      lastAction: `Handover created (${validated.id})`,
      nextAction: validated.nextAction,
      lastCommit: validated.commit
    });
    return validated;
  }
  async getLatestHandover() {
    if (!this.fs.exists(this.handoversDir)) return void 0;
    const files = await this.fs.listFiles(this.handoversDir, ".md");
    if (files.length === 0) return void 0;
    files.sort((a, b) => path4.basename(b).localeCompare(path4.basename(a)));
    const raw = await this.fs.readFile(files[0]);
    return this.parseHandoverMarkdown(raw, path4.basename(files[0], ".md"));
  }
  formatHandoverMarkdown(h) {
    const frontmatter = {
      id: h.id,
      date: h.date,
      project: h.project,
      branch: h.branch,
      commit: h.commit,
      task: h.currentTask,
      progress: h.progress
    };
    const nextActionLines = [];
    if (h.nextAction.file) nextActionLines.push(`Open:
\`${h.nextAction.file}\``);
    if (h.nextAction.focus) nextActionLines.push(`Focus:
\`${h.nextAction.focus}\``);
    nextActionLines.push(`Problem:
${h.nextAction.problem}`);
    nextActionLines.push(`Expected Solution:
${h.nextAction.expectedSolution}`);
    if (h.nextAction.constraints.length > 0) {
      nextActionLines.push(`Constraints:
${MarkdownHelper.formatBulletList(h.nextAction.constraints)}`);
    }
    const body = `# Continuity Handover: ${h.currentTask}

## Project State
- **Project**: ${h.project}
- **Branch**: \`${h.branch}\`
- **Commit**: \`${h.commit || "uncommitted"}\`
- **Uncommitted Changes**: ${h.uncommittedChanges ? "Yes (inspect git status)" : "Clean"}

## Current Task & Progress
- **Task**: ${h.currentTask}
- **Progress**: ${h.progress}%

### Completed
${MarkdownHelper.formatBulletList(h.completed, "\u2713")}

### Remaining
${MarkdownHelper.formatBulletList(h.remaining, "\u25A1")}

## Modified Files
${MarkdownHelper.formatBulletList(h.modifiedFiles)}

## Important Decisions
${MarkdownHelper.formatBulletList(h.decisions)}

## Known Problems & Blockers
${MarkdownHelper.formatBulletList(h.problems)}

## Failed Approaches (Do Not Repeat)
${MarkdownHelper.formatBulletList(h.failedApproaches)}

## Next Action
${nextActionLines.join("\n\n")}
`;
    return MarkdownHelper.stringify(body, frontmatter);
  }
  parseHandoverMarkdown(raw, fallbackId) {
    try {
      const parsed = MarkdownHelper.parse(raw);
      const sections = MarkdownHelper.extractSections(parsed.content);
      const nextActionRaw = sections.get("Next Action") || "";
      const fileMatch = nextActionRaw.match(/Open:\s*`?([^`\n]+)`?/);
      const focusMatch = nextActionRaw.match(/Focus:\s*`?([^`\n]+)`?/);
      const problemMatch = nextActionRaw.match(/Problem:\s*([^\n]+)/);
      const solMatch = nextActionRaw.match(/Expected Solution:\s*([^\n]+)/i);
      return {
        id: parsed.data.id || fallbackId,
        date: parsed.data.date || (/* @__PURE__ */ new Date()).toISOString(),
        project: parsed.data.project || "Project",
        branch: parsed.data.branch || "main",
        commit: parsed.data.commit,
        currentTask: parsed.data.task || "Task",
        progress: typeof parsed.data.progress === "number" ? parsed.data.progress : 0,
        completed: MarkdownHelper.parseBulletList(sections.get("Completed") || ""),
        remaining: MarkdownHelper.parseBulletList(sections.get("Remaining") || ""),
        modifiedFiles: MarkdownHelper.parseBulletList(sections.get("Modified Files") || ""),
        uncommittedChanges: false,
        decisions: MarkdownHelper.parseBulletList(sections.get("Important Decisions") || ""),
        problems: MarkdownHelper.parseBulletList(sections.get("Known Problems & Blockers") || ""),
        failedApproaches: MarkdownHelper.parseBulletList(sections.get("Failed Approaches (Do Not Repeat)") || ""),
        nextAction: {
          file: fileMatch ? fileMatch[1].trim() : void 0,
          focus: focusMatch ? focusMatch[1].trim() : void 0,
          problem: problemMatch ? problemMatch[1].trim() : nextActionRaw,
          expectedSolution: solMatch ? solMatch[1].trim() : "Continue implementation",
          constraints: MarkdownHelper.parseBulletList(nextActionRaw)
        },
        author: "ai"
      };
    } catch {
      return void 0;
    }
  }
};

// src/core/engine/session-manager.ts
import path5 from "path";

// src/core/types/session.ts
import { z as z3 } from "zod";
var SessionSummarySchema = z3.object({
  id: z3.string(),
  date: z3.string(),
  agent: z3.string().default("ai"),
  branch: z3.string().default("main"),
  task: z3.string().optional(),
  objective: z3.string(),
  workCompleted: z3.array(z3.string()).default([]),
  filesChanged: z3.array(z3.string()).default([]),
  decisions: z3.array(z3.string()).default([]),
  failedApproaches: z3.array(z3.string()).default([]),
  problems: z3.array(z3.string()).default([]),
  nextStep: z3.string().optional(),
  importantContext: z3.string().optional(),
  gitCommit: z3.string().optional()
});

// src/core/engine/session-manager.ts
var SessionManager = class {
  constructor(fs2, stateManager) {
    this.fs = fs2;
    this.stateManager = stateManager;
    this.redactor = new SecretRedactor();
  }
  fs;
  stateManager;
  redactor;
  get sessionsDir() {
    return this.fs.resolveContinuity("sessions");
  }
  getDateParts(d = /* @__PURE__ */ new Date()) {
    const year = d.getFullYear().toString();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    const hours = d.getHours().toString().padStart(2, "0");
    const mins = d.getMinutes().toString().padStart(2, "0");
    return {
      year,
      month,
      day,
      dateStr: `${year}-${month}-${day}`,
      timeStr: `${hours}${mins}`
    };
  }
  async saveSession(data, rawContent) {
    const dateInfo = this.getDateParts();
    const id = `sess_${dateInfo.dateStr.replace(/-/g, "")}_${dateInfo.timeStr}`;
    const summaryDir = path5.join(this.sessionsDir, "summaries", dateInfo.year, dateInfo.month, dateInfo.day);
    const rawDir = path5.join(this.sessionsDir, "raw", dateInfo.year, dateInfo.month, dateInfo.day);
    await this.fs.ensureDir(summaryDir);
    const sanitizedObjective = this.redactor.redact(data.objective).text;
    const sanitizedCompleted = (data.workCompleted || []).map((w) => this.redactor.redact(w).text);
    const sanitizedDecisions = (data.decisions || []).map((d) => this.redactor.redact(d).text);
    const sanitizedFailures = (data.failedApproaches || []).map((f) => this.redactor.redact(f).text);
    const sanitizedProblems = (data.problems || []).map((p) => this.redactor.redact(p).text);
    const sanitizedNextStep = data.nextStep ? this.redactor.redact(data.nextStep).text : void 0;
    const sanitizedContext = data.importantContext ? this.redactor.redact(data.importantContext).text : void 0;
    const summary = {
      id,
      date: dateInfo.dateStr,
      agent: data.agent || "ai",
      branch: data.branch || "main",
      task: data.task,
      objective: sanitizedObjective,
      workCompleted: sanitizedCompleted,
      filesChanged: data.filesChanged || [],
      decisions: sanitizedDecisions,
      failedApproaches: sanitizedFailures,
      problems: sanitizedProblems,
      nextStep: sanitizedNextStep,
      importantContext: sanitizedContext,
      gitCommit: data.gitCommit
    };
    const validated = SessionSummarySchema.parse(summary);
    const markdown = this.formatSessionMarkdown(validated);
    const summaryFilePath = path5.join(summaryDir, `${id}.md`);
    await this.fs.writeFile(summaryFilePath, markdown);
    if (rawContent) {
      await this.fs.ensureDir(rawDir);
      const sanitizedRaw = this.redactor.redact(rawContent).text;
      const rawFilePath = path5.join(rawDir, `${id}-raw.md`);
      await this.fs.writeFile(rawFilePath, sanitizedRaw);
    }
    await this.stateManager.saveState({
      lastSession: `${validated.date} (${validated.id})`,
      lastCommit: validated.gitCommit || void 0,
      lastAction: `Session finished: ${validated.objective}`
    });
    return validated;
  }
  async listSessions() {
    const summariesRoot = path5.join(this.sessionsDir, "summaries");
    if (!this.fs.exists(summariesRoot)) return [];
    const files = await this.fs.listFiles(summariesRoot, ".md");
    const sessions = [];
    for (const file of files) {
      const raw = await this.fs.readFile(file);
      const sess = this.parseSessionMarkdown(raw, path5.basename(file, ".md"));
      if (sess) sessions.push(sess);
    }
    return sessions.sort((a, b) => b.id.localeCompare(a.id));
  }
  async getLatestSession() {
    const list = await this.listSessions();
    return list[0];
  }
  formatSessionMarkdown(s) {
    const frontmatter = {
      id: s.id,
      date: s.date,
      agent: s.agent,
      branch: s.branch,
      task: s.task,
      gitCommit: s.gitCommit
    };
    const body = `# Session Summary

## Objective
${s.objective}

## Work Completed
${MarkdownHelper.formatBulletList(s.workCompleted)}

## Files Changed
${MarkdownHelper.formatBulletList(s.filesChanged)}

## Decisions
${MarkdownHelper.formatBulletList(s.decisions)}

## Failed Approaches
${MarkdownHelper.formatBulletList(s.failedApproaches)}

## Problems
${MarkdownHelper.formatBulletList(s.problems)}

## Next Step
${s.nextStep || "None specified."}

## Important Context
${s.importantContext || "None."}

## Git
Commit: ${s.gitCommit || "None"}
`;
    return MarkdownHelper.stringify(body, frontmatter);
  }
  parseSessionMarkdown(raw, fallbackId) {
    try {
      const parsed = MarkdownHelper.parse(raw);
      const sections = MarkdownHelper.extractSections(parsed.content);
      return {
        id: parsed.data.id || fallbackId,
        date: parsed.data.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        agent: parsed.data.agent || "ai",
        branch: parsed.data.branch || "main",
        task: parsed.data.task,
        objective: sections.get("Objective") || "",
        workCompleted: MarkdownHelper.parseBulletList(sections.get("Work Completed") || ""),
        filesChanged: MarkdownHelper.parseBulletList(sections.get("Files Changed") || ""),
        decisions: MarkdownHelper.parseBulletList(sections.get("Decisions") || ""),
        failedApproaches: MarkdownHelper.parseBulletList(sections.get("Failed Approaches") || ""),
        problems: MarkdownHelper.parseBulletList(sections.get("Problems") || ""),
        nextStep: sections.get("Next Step"),
        importantContext: sections.get("Important Context"),
        gitCommit: parsed.data.gitCommit || sections.get("Git")?.replace(/^Commit:\s*/i, "").trim()
      };
    } catch {
      return void 0;
    }
  }
};

// src/core/engine/failure-manager.ts
import path6 from "path";

// src/core/types/failure.ts
import { z as z4 } from "zod";
var FailureSchema = z4.object({
  id: z4.string(),
  title: z4.string(),
  date: z4.string(),
  attempt: z4.string(),
  result: z4.string(),
  why: z4.string(),
  doNotRepeat: z4.string(),
  betterApproach: z4.string(),
  relatedTask: z4.string().optional(),
  relatedFiles: z4.array(z4.string()).default([])
});

// src/core/engine/failure-manager.ts
var FailureManager = class {
  constructor(fs2) {
    this.fs = fs2;
  }
  fs;
  get failuresDir() {
    return this.fs.resolveContinuity("failures");
  }
  slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").substring(0, 45);
  }
  async recordFailure(data) {
    await this.fs.ensureDir(this.failuresDir);
    const date = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const slug = this.slugify(data.title);
    const id = `${date}-${slug}`;
    const filename = `${id}.md`;
    const filePath = path6.join(this.failuresDir, filename);
    const failure = {
      id,
      title: data.title,
      date,
      attempt: data.attempt,
      result: data.result,
      why: data.why,
      doNotRepeat: data.doNotRepeat,
      betterApproach: data.betterApproach,
      relatedTask: data.relatedTask,
      relatedFiles: data.relatedFiles || []
    };
    const validated = FailureSchema.parse(failure);
    const markdown = this.formatFailureMarkdown(validated);
    await this.fs.writeFile(filePath, markdown);
    return validated;
  }
  async listFailures() {
    if (!this.fs.exists(this.failuresDir)) return [];
    const files = await this.fs.listFiles(this.failuresDir, ".md");
    const failures = [];
    for (const file of files) {
      const raw = await this.fs.readFile(file);
      const failure = this.parseFailureMarkdown(raw, path6.basename(file, ".md"));
      if (failure) failures.push(failure);
    }
    return failures.sort((a, b) => b.date.localeCompare(a.date));
  }
  formatFailureMarkdown(f) {
    const frontmatter = {
      id: f.id,
      title: f.title,
      date: f.date,
      relatedTask: f.relatedTask,
      relatedFiles: f.relatedFiles
    };
    const body = `# ${f.title}

## Attempt
${f.attempt}

## Result
${f.result}

## Why
${f.why}

## Do Not Repeat
${f.doNotRepeat}

## Better Approach
${f.betterApproach}

## Related Files
${MarkdownHelper.formatBulletList(f.relatedFiles)}
`;
    return MarkdownHelper.stringify(body, frontmatter);
  }
  parseFailureMarkdown(raw, fallbackId) {
    try {
      const parsed = MarkdownHelper.parse(raw);
      const sections = MarkdownHelper.extractSections(parsed.content);
      return {
        id: parsed.data.id || fallbackId,
        title: parsed.data.title || sections.get("Attempt") || fallbackId,
        date: parsed.data.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        attempt: sections.get("Attempt") || "",
        result: sections.get("Result") || "Failed",
        why: sections.get("Why") || "",
        doNotRepeat: sections.get("Do Not Repeat") || "",
        betterApproach: sections.get("Better Approach") || "",
        relatedTask: parsed.data.relatedTask,
        relatedFiles: parsed.data.relatedFiles || MarkdownHelper.parseBulletList(sections.get("Related Files") || "")
      };
    } catch {
      return void 0;
    }
  }
};

// src/core/engine/decision-manager.ts
import path7 from "path";

// src/core/types/decision.ts
import { z as z5 } from "zod";
var DecisionSchema = z5.object({
  id: z5.string(),
  // e.g. "ADR-001" or "2026-09-03-rabbitmq"
  title: z5.string(),
  status: z5.enum(["proposed", "accepted", "superseded", "deprecated"]).default("accepted"),
  date: z5.string(),
  decision: z5.string(),
  why: z5.string(),
  alternatives: z5.array(z5.string()).default([]),
  rejectedBecause: z5.string().optional(),
  implications: z5.array(z5.string()).default([]),
  author: z5.string().optional()
});

// src/core/engine/decision-manager.ts
var DecisionManager = class {
  constructor(fs2) {
    this.fs = fs2;
  }
  fs;
  get decisionsDir() {
    return this.fs.resolveContinuity("decisions");
  }
  slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").substring(0, 40);
  }
  async getNextAdrId() {
    await this.fs.ensureDir(this.decisionsDir);
    const files = await this.fs.listFiles(this.decisionsDir, ".md");
    let maxId = 0;
    for (const file of files) {
      const filename = path7.basename(file);
      const match = filename.match(/ADR-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxId) maxId = num;
      }
    }
    const nextNum = maxId + 1;
    return `ADR-${nextNum.toString().padStart(3, "0")}`;
  }
  async recordDecision(data) {
    await this.fs.ensureDir(this.decisionsDir);
    const id = await this.getNextAdrId();
    const date = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const slug = this.slugify(data.title);
    const filename = `${id}-${slug}.md`;
    const filePath = path7.join(this.decisionsDir, filename);
    const decision = {
      id,
      title: data.title,
      status: "accepted",
      date,
      decision: data.decision,
      why: data.why,
      alternatives: data.alternatives || [],
      rejectedBecause: data.rejectedBecause,
      implications: [],
      author: data.author || "developer"
    };
    const validated = DecisionSchema.parse(decision);
    const markdown = this.formatDecisionMarkdown(validated);
    await this.fs.writeFile(filePath, markdown);
    return validated;
  }
  async listDecisions() {
    if (!this.fs.exists(this.decisionsDir)) return [];
    const files = await this.fs.listFiles(this.decisionsDir, ".md");
    const decisions = [];
    for (const file of files) {
      const raw = await this.fs.readFile(file);
      const decision = this.parseDecisionMarkdown(raw, path7.basename(file, ".md"));
      if (decision) decisions.push(decision);
    }
    return decisions.sort((a, b) => a.id.localeCompare(b.id));
  }
  async getDecision(id) {
    const decisions = await this.listDecisions();
    return decisions.find((d) => d.id.toLowerCase() === id.toLowerCase() || d.title.toLowerCase().includes(id.toLowerCase()));
  }
  formatDecisionMarkdown(d) {
    const frontmatter = {
      id: d.id,
      title: d.title,
      status: d.status,
      date: d.date,
      author: d.author
    };
    const body = `# ${d.id}: ${d.title}

## Decision
${d.decision}

## Why
${d.why}

## Alternatives
${MarkdownHelper.formatBulletList(d.alternatives)}

## Rejected Because
${d.rejectedBecause || "None specified."}

## Date
${d.date}
`;
    return MarkdownHelper.stringify(body, frontmatter);
  }
  parseDecisionMarkdown(raw, fallbackId) {
    try {
      const parsed = MarkdownHelper.parse(raw);
      const sections = MarkdownHelper.extractSections(parsed.content);
      const id = parsed.data.id || fallbackId.split("-")[0];
      const title = parsed.data.title || sections.get("Decision") || fallbackId;
      const date = parsed.data.date || sections.get("Date") || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      return {
        id,
        title,
        status: parsed.data.status || "accepted",
        date,
        decision: sections.get("Decision") || "",
        why: sections.get("Why") || "",
        alternatives: parsed.data.alternatives || MarkdownHelper.parseBulletList(sections.get("Alternatives") || ""),
        rejectedBecause: sections.get("Rejected Because"),
        implications: parsed.data.implications || [],
        author: parsed.data.author
      };
    } catch {
      return void 0;
    }
  }
};

// src/core/engine/resume-engine.ts
var ResumeEngine = class {
  constructor(stateManager, handoverManager, sessionManager, failureManager, decisionManager, git) {
    this.stateManager = stateManager;
    this.handoverManager = handoverManager;
    this.sessionManager = sessionManager;
    this.failureManager = failureManager;
    this.decisionManager = decisionManager;
    this.git = git;
  }
  stateManager;
  handoverManager;
  sessionManager;
  failureManager;
  decisionManager;
  git;
  async buildContext() {
    const projectInfo = await this.stateManager.getProjectInfo();
    const state = await this.stateManager.getState();
    const gitStatus = await this.git.getStatus();
    const latestHandover = await this.handoverManager.getLatestHandover();
    const latestSession = await this.sessionManager.getLatestSession();
    const failures = await this.failureManager.listFailures();
    const decisions = await this.decisionManager.listDecisions();
    let nextAction = latestHandover?.nextAction || (typeof state.nextAction === "object" ? state.nextAction : {
      problem: state.nextAction || "Continue work",
      expectedSolution: "Proceed to next task milestone",
      constraints: []
    });
    const relevantFiles = Array.from(
      /* @__PURE__ */ new Set([
        ...state.currentFiles,
        ...latestHandover?.modifiedFiles || [],
        ...gitStatus.modifiedFiles,
        ...nextAction.file ? [nextAction.file] : []
      ])
    ).slice(0, 10);
    const previousFailedApproaches = [
      ...latestHandover?.failedApproaches || [],
      ...failures.map((f) => `[${f.title}]: ${f.doNotRepeat} -> ${f.betterApproach}`)
    ].slice(0, 3);
    const recentDecisions = [
      ...latestHandover?.decisions || [],
      ...decisions.slice(-3).map((d) => `${d.id} (${d.title}): ${d.decision}`)
    ].slice(0, 3);
    return {
      project: projectInfo.name || state.project,
      purpose: projectInfo.purpose || "",
      architectureSummary: projectInfo.architecture || (projectInfo.stack.length > 0 ? projectInfo.stack.join(", ") : "Standard"),
      branch: gitStatus.branch || state.currentBranch,
      commit: gitStatus.commit?.shortHash || state.lastCommit,
      currentTask: state.currentTask,
      progress: state.progress,
      completed: state.completed,
      remaining: state.remaining,
      currentBlocker: state.currentBlocker,
      relevantFiles,
      previousFailedApproaches,
      recentDecisions,
      lastSession: latestSession?.id || state.lastSession,
      nextAction,
      hasUncommittedChanges: gitStatus.hasUncommittedChanges
    };
  }
  formatCompact(ctx) {
    const lines = [
      "================ CONTINUITY RESUME ================\n",
      `Project: ${ctx.project}`,
      `Branch: ${ctx.branch}${ctx.commit ? ` (${ctx.commit})` : ""}`,
      `Current Task: ${ctx.currentTask} [${ctx.progress}% completed]`,
      `Status: ${ctx.currentBlocker ? `BLOCKED - ${ctx.currentBlocker}` : "In Progress"}`,
      `Uncommitted Changes: ${ctx.hasUncommittedChanges ? "YES (check git status)" : "None"}
`,
      "--- LAST COMPLETED ---",
      ctx.completed.length > 0 ? ctx.completed.slice(-3).map((c) => `\u2713 ${c}`).join("\n") : "None recorded",
      "\n--- WORK REMAINING ---",
      ctx.remaining.length > 0 ? ctx.remaining.slice(0, 4).map((r) => `\u25A1 ${r}`).join("\n") : "None recorded",
      "\n--- RELEVANT FILES ---",
      ctx.relevantFiles.length > 0 ? ctx.relevantFiles.map((f) => `- ${f}`).join("\n") : "None",
      "\n--- DO NOT REPEAT (FAILED APPROACHES) ---",
      ctx.previousFailedApproaches.length > 0 ? ctx.previousFailedApproaches.map((f) => `! ${f}`).join("\n") : "None recorded",
      "\n--- RECOMMENDED NEXT ACTION ---",
      ctx.nextAction.file ? `Open: ${ctx.nextAction.file}` : "",
      ctx.nextAction.focus ? `Focus: ${ctx.nextAction.focus}` : "",
      `Problem: ${ctx.nextAction.problem}`,
      `Expected Solution: ${ctx.nextAction.expectedSolution}`,
      ctx.nextAction.constraints && ctx.nextAction.constraints.length > 0 ? `Constraints:
${ctx.nextAction.constraints.map((c) => `  * ${c}`).join("\n")}` : "",
      "\n===================================================="
    ];
    return lines.filter((l) => l !== "").join("\n");
  }
  formatFullMarkdown(ctx) {
    return `# Continuity Resume Context

## 1. Project Identity
- **Name**: ${ctx.project}
- **Purpose**: ${ctx.purpose || "Not specified"}
- **Architecture**: ${ctx.architectureSummary}
- **Branch**: \`${ctx.branch}\`
- **Commit**: \`${ctx.commit || "unknown"}\`
- **Uncommitted Changes**: ${ctx.hasUncommittedChanges ? "Yes" : "No"}

## 2. Current Task & Progress
- **Task**: ${ctx.currentTask}
- **Progress**: ${ctx.progress}%
- **Blocker**: ${ctx.currentBlocker || "None"}

### Completed
${MarkdownHelper.formatBulletList(ctx.completed, "\u2713")}

### Remaining
${MarkdownHelper.formatBulletList(ctx.remaining, "\u25A1")}

## 3. Relevant Source Files
${MarkdownHelper.formatBulletList(ctx.relevantFiles)}

## 4. Architectural Constraints & Key Decisions
${MarkdownHelper.formatBulletList(ctx.recentDecisions)}

## 5. Failed Approaches ("Do Not Repeat")
${MarkdownHelper.formatBulletList(ctx.previousFailedApproaches, "\u26A0\uFE0F")}

## 6. Recommended Next Action
${ctx.nextAction.file ? `- **Open**: \`${ctx.nextAction.file}\`` : ""}
${ctx.nextAction.focus ? `- **Focus**: \`${ctx.nextAction.focus}\`` : ""}
- **Problem**: ${ctx.nextAction.problem}
- **Expected Solution**: ${ctx.nextAction.expectedSolution}
${ctx.nextAction.constraints.length > 0 ? `- **Constraints**:
${MarkdownHelper.formatBulletList(ctx.nextAction.constraints, "  *")}` : ""}
`;
  }
};

// src/cli/commands/resume.ts
async function runResume(options = {}) {
  const fs2 = new FileSystem();
  if (!fs2.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized in this project. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }
  const git = new GitClient();
  const stateManager = new StateManager(fs2);
  const decisionManager = new DecisionManager(fs2);
  const failureManager = new FailureManager(fs2);
  const handoverManager = new HandoverManager(fs2, git, stateManager, decisionManager, failureManager);
  const sessionManager = new SessionManager(fs2, stateManager);
  const resumeEngine = new ResumeEngine(
    stateManager,
    handoverManager,
    sessionManager,
    failureManager,
    decisionManager,
    git
  );
  const context = await resumeEngine.buildContext();
  if (options.json) {
    console.log(JSON.stringify(context, null, 2));
    return;
  }
  if (options.full) {
    console.log(resumeEngine.formatFullMarkdown(context));
    return;
  }
  console.log(resumeEngine.formatCompact(context));
}

// src/cli/commands/handover.ts
async function runHandover(options = {}) {
  const fs2 = new FileSystem();
  if (!fs2.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized in this project. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }
  const git = new GitClient();
  const stateManager = new StateManager(fs2);
  const decisionManager = new DecisionManager(fs2);
  const failureManager = new FailureManager(fs2);
  const handoverManager = new HandoverManager(fs2, git, stateManager, decisionManager, failureManager);
  const currentState = await stateManager.getState();
  const progress = options.progress !== void 0 ? parseInt(options.progress, 10) : void 0;
  const completed = options.completed ? options.completed.split(",").map((s) => s.trim()) : void 0;
  const remaining = options.remaining ? options.remaining.split(",").map((s) => s.trim()) : void 0;
  const constraints = options.constraints ? options.constraints.split(",").map((s) => s.trim()) : [];
  const nextAction = {
    file: options.file,
    focus: options.focus,
    problem: options.problem || (typeof currentState.nextAction === "object" ? currentState.nextAction.problem : "No blocker specified"),
    expectedSolution: options.solution || (typeof currentState.nextAction === "object" ? currentState.nextAction.expectedSolution : "Continue implementation"),
    constraints
  };
  const handover = await handoverManager.createHandover({
    currentTask: options.task || currentState.currentTask,
    progress,
    completed,
    remaining,
    nextAction,
    author: options.author || "ai"
  });
  TerminalFormatter.header("Handover Created");
  TerminalFormatter.item("Handover ID", handover.id);
  TerminalFormatter.item("Task", handover.currentTask);
  TerminalFormatter.item("Progress", `${handover.progress}%`);
  TerminalFormatter.item("Branch", handover.branch);
  TerminalFormatter.item("Modified Files", handover.modifiedFiles.length);
  TerminalFormatter.box("Actionable Next Action", [
    handover.nextAction.file ? `File: ${handover.nextAction.file}` : "File: None specified",
    handover.nextAction.focus ? `Focus: ${handover.nextAction.focus}` : "",
    `Problem: ${handover.nextAction.problem}`,
    `Solution: ${handover.nextAction.expectedSolution}`
  ].filter(Boolean));
  TerminalFormatter.success("Handover archived in .continuity/handovers/ and synced to .continuity/state.md");
}

// src/cli/commands/session.ts
async function runSessionSave(options = {}) {
  const fs2 = new FileSystem();
  if (!fs2.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }
  const git = new GitClient();
  const stateManager = new StateManager(fs2);
  const sessionManager = new SessionManager(fs2, stateManager);
  const gitStatus = await git.getStatus();
  const currentState = await stateManager.getState();
  const objective = options.objective || `Work on ${currentState.currentTask}`;
  const workCompleted = options.completed ? options.completed.split(",").map((s) => s.trim()) : currentState.completed;
  const filesChanged = options.files ? options.files.split(",").map((s) => s.trim()) : gitStatus.modifiedFiles;
  const decisions = options.decisions ? options.decisions.split(",").map((s) => s.trim()) : [];
  const failedApproaches = options.failed ? options.failed.split(",").map((s) => s.trim()) : [];
  const problems = options.problems ? options.problems.split(",").map((s) => s.trim()) : [];
  let rawContent;
  if (options.rawFile && fs2.exists(options.rawFile)) {
    rawContent = await fs2.readFile(options.rawFile);
  }
  const session = await sessionManager.saveSession(
    {
      agent: options.agent || "ai",
      branch: gitStatus.branch,
      task: currentState.currentTask,
      objective,
      workCompleted,
      filesChanged,
      decisions,
      failedApproaches,
      problems,
      nextStep: options.next,
      importantContext: options.context,
      gitCommit: gitStatus.commit?.shortHash
    },
    rawContent
  );
  TerminalFormatter.success(`Session recorded: ${session.id}`);
  TerminalFormatter.item("Date", session.date);
  TerminalFormatter.item("Agent", session.agent);
  TerminalFormatter.item("Objective", session.objective);
  TerminalFormatter.item("Files Changed", session.filesChanged.length);
}
async function runSessionList() {
  const fs2 = new FileSystem();
  if (!fs2.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }
  const stateManager = new StateManager(fs2);
  const sessionManager = new SessionManager(fs2, stateManager);
  const sessions = await sessionManager.listSessions();
  TerminalFormatter.header(`Recorded Sessions (${sessions.length})`);
  if (sessions.length === 0) {
    console.log("No sessions recorded yet.");
    return;
  }
  for (const s of sessions) {
    console.log(`
\u2022 ${s.id} (${s.date}) [${s.agent}]`);
    console.log(`  Objective: ${s.objective}`);
    if (s.filesChanged.length > 0) {
      console.log(`  Files: ${s.filesChanged.join(", ")}`);
    }
  }
}

// src/cli/commands/context.ts
async function runContext(query, options = {}) {
  const fs2 = new FileSystem();
  if (!fs2.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }
  const indexer = new SQLiteIndexer(fs2);
  await indexer.init();
  await indexer.reindexAll();
  const results = indexer.search(query, { limit: options.limit || 5, type: options.type });
  indexer.close();
  TerminalFormatter.header(`Historical Context: "${query}"`);
  if (results.length === 0) {
    console.log("No historical matches found.");
    return;
  }
  for (const r of results) {
    console.log(`
\u2022 [${r.type.toUpperCase()}] ${r.title}`);
    console.log(`  File: ${r.relativePath}`);
    console.log(`  ${r.snippet}`);
  }
}

// src/core/engine/task-manager.ts
import path8 from "path";
var TaskManager = class {
  constructor(fs2, stateManager) {
    this.fs = fs2;
    this.stateManager = stateManager;
  }
  fs;
  stateManager;
  slugify(title) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").substring(0, 50);
  }
  getTaskDir(status) {
    if (status === "completed") return this.fs.resolveContinuity("tasks", "completed");
    if (status === "blocked") return this.fs.resolveContinuity("tasks", "blocked");
    return this.fs.resolveContinuity("tasks", "active");
  }
  async startTask(title, options = {}) {
    const id = this.slugify(title);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const task = {
      id,
      title,
      status: "active",
      progress: 0,
      description: options.description || "",
      completed: [],
      remaining: options.remaining || [],
      blockers: [],
      relatedFiles: options.relatedFiles || [],
      createdAt: now,
      updatedAt: now
    };
    await this.saveTaskFile(task);
    await this.stateManager.saveState({
      currentTask: title,
      status: "In progress \u2014 0%",
      progress: 0,
      completed: [],
      remaining: options.remaining || [],
      currentFiles: options.relatedFiles || [],
      currentBlocker: null,
      lastAction: `Started task: ${title}`
    });
    return task;
  }
  async updateTask(id, updates) {
    const task = await this.getTask(id);
    if (!task) {
      throw new Error(`Task with id '${id}' not found.`);
    }
    if (updates.progress !== void 0) {
      task.progress = Math.min(100, Math.max(0, updates.progress));
    }
    if (updates.addCompleted) {
      task.completed = Array.from(/* @__PURE__ */ new Set([...task.completed, ...updates.addCompleted]));
      task.remaining = task.remaining.filter((r) => !updates.addCompleted.includes(r));
    }
    if (updates.addRemaining) {
      task.remaining = Array.from(/* @__PURE__ */ new Set([...task.remaining, ...updates.addRemaining]));
    }
    if (updates.removeRemaining) {
      task.remaining = task.remaining.filter((r) => !updates.removeRemaining.includes(r));
    }
    if (updates.blocker !== void 0) {
      if (updates.blocker) {
        task.blockers = Array.from(/* @__PURE__ */ new Set([...task.blockers, updates.blocker]));
      }
    }
    if (updates.relatedFiles) {
      task.relatedFiles = Array.from(/* @__PURE__ */ new Set([...task.relatedFiles, ...updates.relatedFiles]));
    }
    task.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    await this.saveTaskFile(task);
    await this.stateManager.saveState({
      currentTask: task.title,
      progress: task.progress,
      status: `In progress \u2014 ${task.progress}%`,
      completed: task.completed,
      remaining: task.remaining,
      currentFiles: task.relatedFiles,
      currentBlocker: updates.blocker !== void 0 ? updates.blocker : void 0,
      lastAction: `Updated task: ${task.title}`
    });
    return task;
  }
  async completeTask(id, summary) {
    const task = await this.getTask(id);
    if (!task) {
      throw new Error(`Task with id '${id}' not found.`);
    }
    const previousStatus = task.status;
    task.status = "completed";
    task.progress = 100;
    task.completedAt = (/* @__PURE__ */ new Date()).toISOString();
    task.updatedAt = task.completedAt;
    if (summary) {
      task.completed = Array.from(/* @__PURE__ */ new Set([...task.completed, summary]));
    }
    const oldPath = path8.join(this.getTaskDir(previousStatus), `${task.id}.md`);
    const newPath = path8.join(this.getTaskDir("completed"), `${task.id}.md`);
    await this.fs.ensureDir(this.getTaskDir("completed"));
    const content = this.formatTaskMarkdown(task);
    if (this.fs.exists(oldPath) && oldPath !== newPath) {
      await this.fs.deleteFile(oldPath);
    }
    await this.fs.writeFile(newPath, content);
    await this.stateManager.saveState({
      currentTask: `Completed: ${task.title}`,
      progress: 100,
      status: "Completed",
      currentBlocker: null,
      lastAction: `Completed task: ${task.title}`
    });
    return task;
  }
  async blockTask(id, reason) {
    const task = await this.getTask(id);
    if (!task) {
      throw new Error(`Task with id '${id}' not found.`);
    }
    const previousStatus = task.status;
    task.status = "blocked";
    task.blockers = Array.from(/* @__PURE__ */ new Set([...task.blockers, reason]));
    task.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    const oldPath = path8.join(this.getTaskDir(previousStatus), `${task.id}.md`);
    const newPath = path8.join(this.getTaskDir("blocked"), `${task.id}.md`);
    await this.fs.ensureDir(this.getTaskDir("blocked"));
    const content = this.formatTaskMarkdown(task);
    if (this.fs.exists(oldPath) && oldPath !== newPath) {
      await this.fs.deleteFile(oldPath);
    }
    await this.fs.writeFile(newPath, content);
    await this.stateManager.saveState({
      status: "Blocked",
      currentBlocker: reason,
      lastAction: `Blocked task: ${task.title}`
    });
    return task;
  }
  async getTask(id) {
    const statuses = ["active", "blocked", "completed"];
    for (const status of statuses) {
      const taskPath = path8.join(this.getTaskDir(status), `${id}.md`);
      if (this.fs.exists(taskPath)) {
        const raw = await this.fs.readFile(taskPath);
        return this.parseTaskMarkdown(raw, id, status);
      }
    }
    return void 0;
  }
  async listTasks() {
    const result = {
      active: [],
      completed: [],
      blocked: []
    };
    const statuses = ["active", "completed", "blocked"];
    for (const status of statuses) {
      const dir = this.getTaskDir(status);
      const files = await this.fs.listFiles(dir, ".md");
      for (const file of files) {
        const id = path8.basename(file, ".md");
        const raw = await this.fs.readFile(file);
        const task = this.parseTaskMarkdown(raw, id, status);
        result[status].push(task);
      }
    }
    return result;
  }
  saveTaskFile(task) {
    const dir = this.getTaskDir(task.status);
    const filePath = path8.join(dir, `${task.id}.md`);
    const content = this.formatTaskMarkdown(task);
    return this.fs.writeFile(filePath, content);
  }
  formatTaskMarkdown(task) {
    const frontmatter = {
      id: task.id,
      title: task.title,
      status: task.status,
      progress: task.progress,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      completedAt: task.completedAt
    };
    const body = `# ${task.title}

## Description
${task.description || "No description provided."}

## Progress
${task.progress}%

## Completed
${MarkdownHelper.formatBulletList(task.completed, "\u2713")}

## Remaining
${MarkdownHelper.formatBulletList(task.remaining, "\u25A1")}

## Blockers
${MarkdownHelper.formatBulletList(task.blockers)}

## Related Files
${MarkdownHelper.formatBulletList(task.relatedFiles)}
`;
    return MarkdownHelper.stringify(body, frontmatter);
  }
  parseTaskMarkdown(raw, id, fallbackStatus) {
    const parsed = MarkdownHelper.parse(raw);
    const sections = MarkdownHelper.extractSections(parsed.content);
    const title = parsed.data.title || sections.get("Description") || id;
    const progress = typeof parsed.data.progress === "number" ? parsed.data.progress : 0;
    const status = parsed.data.status || fallbackStatus;
    return {
      id,
      title,
      status,
      progress,
      description: sections.get("Description") || "",
      completed: parsed.data.completed || MarkdownHelper.parseBulletList(sections.get("Completed") || ""),
      remaining: parsed.data.remaining || MarkdownHelper.parseBulletList(sections.get("Remaining") || ""),
      blockers: parsed.data.blockers || MarkdownHelper.parseBulletList(sections.get("Blockers") || ""),
      relatedFiles: parsed.data.relatedFiles || MarkdownHelper.parseBulletList(sections.get("Related Files") || ""),
      createdAt: parsed.data.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: parsed.data.updatedAt || (/* @__PURE__ */ new Date()).toISOString(),
      completedAt: parsed.data.completedAt
    };
  }
};

// src/cli/commands/task.ts
async function runTaskStart(title, options = {}) {
  const fs2 = new FileSystem();
  if (!fs2.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }
  const stateManager = new StateManager(fs2);
  const taskManager = new TaskManager(fs2, stateManager);
  const remaining = options.remaining ? options.remaining.split(",").map((s) => s.trim()) : [];
  const relatedFiles = options.files ? options.files.split(",").map((s) => s.trim()) : [];
  const task = await taskManager.startTask(title, {
    description: options.description,
    remaining,
    relatedFiles
  });
  TerminalFormatter.success(`Task started: "${task.title}" (id: ${task.id})`);
  TerminalFormatter.info(`Created .continuity/tasks/active/${task.id}.md`);
  TerminalFormatter.info("Synced with .continuity/state.md");
}
async function runTaskUpdate(id, options = {}) {
  const fs2 = new FileSystem();
  if (!fs2.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }
  const stateManager = new StateManager(fs2);
  const taskManager = new TaskManager(fs2, stateManager);
  let taskId = id;
  if (!taskId) {
    const state = await stateManager.getState();
    const tasks = await taskManager.listTasks();
    const activeMatch = tasks.active.find((t) => t.title === state.currentTask);
    if (activeMatch) {
      taskId = activeMatch.id;
    } else if (tasks.active.length > 0) {
      taskId = tasks.active[0].id;
    } else {
      TerminalFormatter.error('No active task found to update. Specify a task id or run "continuity task start".');
      process.exitCode = 1;
      return;
    }
  }
  const progress = options.progress !== void 0 ? parseInt(options.progress, 10) : void 0;
  const addCompleted = options.completed ? options.completed.split(",").map((s) => s.trim()) : void 0;
  const addRemaining = options.remaining ? options.remaining.split(",").map((s) => s.trim()) : void 0;
  const relatedFiles = options.files ? options.files.split(",").map((s) => s.trim()) : void 0;
  const updated = await taskManager.updateTask(taskId, {
    progress,
    addCompleted,
    addRemaining,
    blocker: options.blocker,
    relatedFiles
  });
  TerminalFormatter.success(`Task updated: "${updated.title}"`);
  TerminalFormatter.item("Progress", `${updated.progress}%`);
  TerminalFormatter.item("Completed Items", updated.completed.length);
  TerminalFormatter.item("Remaining Items", updated.remaining.length);
}
async function runTaskComplete(id, options = {}) {
  const fs2 = new FileSystem();
  if (!fs2.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }
  const stateManager = new StateManager(fs2);
  const taskManager = new TaskManager(fs2, stateManager);
  let taskId = id;
  if (!taskId) {
    const tasks = await taskManager.listTasks();
    if (tasks.active.length > 0) {
      taskId = tasks.active[0].id;
    } else {
      TerminalFormatter.error("No active task found to complete.");
      process.exitCode = 1;
      return;
    }
  }
  const completed = await taskManager.completeTask(taskId, options.summary);
  TerminalFormatter.success(`Task marked completed: "${completed.title}"`);
  TerminalFormatter.info(`Moved to .continuity/tasks/completed/${completed.id}.md`);
  TerminalFormatter.info('Run "continuity handover" to prepare continuation package for the next milestone.');
}
async function runTaskBlock(id, options) {
  const fs2 = new FileSystem();
  if (!fs2.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }
  const stateManager = new StateManager(fs2);
  const taskManager = new TaskManager(fs2, stateManager);
  const blocked = await taskManager.blockTask(id, options.reason || "Blocked by external dependency");
  TerminalFormatter.warning(`Task blocked: "${blocked.title}"`);
  TerminalFormatter.info(`Reason: ${options.reason}`);
  TerminalFormatter.info(`Moved to .continuity/tasks/blocked/${blocked.id}.md`);
}
async function runTaskList() {
  const fs2 = new FileSystem();
  if (!fs2.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }
  const stateManager = new StateManager(fs2);
  const taskManager = new TaskManager(fs2, stateManager);
  const tasks = await taskManager.listTasks();
  TerminalFormatter.header("Continuity Tasks");
  console.log(`
ACTIVE (${tasks.active.length}):`);
  if (tasks.active.length === 0) console.log("  None");
  for (const t of tasks.active) {
    console.log(`  \u2022 [${t.progress}%] ${t.title} (id: ${t.id})`);
  }
  console.log(`
BLOCKED (${tasks.blocked.length}):`);
  if (tasks.blocked.length === 0) console.log("  None");
  for (const t of tasks.blocked) {
    console.log(`  \u2022 ${t.title} - Blocker: ${t.blockers.join(", ")}`);
  }
  console.log(`
COMPLETED (${tasks.completed.length}):`);
  if (tasks.completed.length === 0) console.log("  None");
  for (const t of tasks.completed) {
    console.log(`  \u2713 ${t.title} (completed: ${t.completedAt?.split("T")[0]})`);
  }
}

// src/cli/commands/decision.ts
async function runDecision(title, options = {}) {
  const fs2 = new FileSystem();
  if (!fs2.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }
  const decisionManager = new DecisionManager(fs2);
  if (options.list || !title) {
    const decisions = await decisionManager.listDecisions();
    TerminalFormatter.header(`Architecture Decision Records (${decisions.length})`);
    if (decisions.length === 0) {
      console.log('No decisions recorded yet. Run "continuity decision <title>" to record an ADR.');
      return;
    }
    for (const d of decisions) {
      console.log(`
\u2022 [${d.id}] ${d.title} (${d.date})`);
      console.log(`  Decision: ${d.decision}`);
      console.log(`  Why: ${d.why}`);
    }
    return;
  }
  const alternatives = options.alternatives ? options.alternatives.split(",").map((s) => s.trim()) : [];
  const why = options.why || "Architecture consistency and requirement alignment";
  const decisionText = options.decision || title;
  const adr = await decisionManager.recordDecision({
    title,
    decision: decisionText,
    why,
    alternatives,
    rejectedBecause: options.rejected
  });
  TerminalFormatter.success(`Recorded Architecture Decision: [${adr.id}] ${adr.title}`);
  TerminalFormatter.item("File", `.continuity/decisions/${adr.id}-*.md`);
  TerminalFormatter.item("Decision", adr.decision);
  TerminalFormatter.item("Why", adr.why);
}
async function runLog(message) {
  await runDecision(message, { why: "Recorded via continuity log" });
}

// src/cli/commands/failure.ts
async function runFailure(title, options = {}) {
  const fs2 = new FileSystem();
  if (!fs2.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }
  const failureManager = new FailureManager(fs2);
  if (options.list || !title) {
    const failures = await failureManager.listFailures();
    TerminalFormatter.header(`Recorded Failures & "Do Not Repeat" Lessons (${failures.length})`);
    if (failures.length === 0) {
      console.log("No failures recorded yet.");
      return;
    }
    for (const f of failures) {
      console.log(`
\u2022 ${f.title} (${f.date})`);
      console.log(`  Attempt: ${f.attempt}`);
      console.log(`  Result: ${f.result}`);
      console.log(`  \u26A0\uFE0F DO NOT REPEAT: ${f.doNotRepeat}`);
      console.log(`  \u2713 BETTER APPROACH: ${f.betterApproach}`);
    }
    return;
  }
  const relatedFiles = options.files ? options.files.split(",").map((s) => s.trim()) : [];
  const failure = await failureManager.recordFailure({
    title,
    attempt: options.attempt || title,
    result: options.result || "Failed approach",
    why: options.why || "Did not meet requirements or caused architectural regression",
    doNotRepeat: options.doNotRepeat || "Do not repeat this attempt",
    betterApproach: options.better || "Consider transaction wrappers or clean refactoring",
    relatedFiles
  });
  TerminalFormatter.warning(`Recorded Failed Approach: "${failure.title}"`);
  TerminalFormatter.item("Do Not Repeat", failure.doNotRepeat);
  TerminalFormatter.item("Better Approach", failure.betterApproach);
  TerminalFormatter.info(`Stored in .continuity/failures/${failure.id}.md`);
}

// src/cli/commands/checkpoint.ts
import path9 from "path";
async function runCheckpoint(name) {
  const fs2 = new FileSystem();
  if (!fs2.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }
  const git = new GitClient();
  const stateManager = new StateManager(fs2);
  const state = await stateManager.getState();
  const gitStatus = await git.getStatus();
  const now = /* @__PURE__ */ new Date();
  const dateStr = now.toISOString().split("T")[0];
  const timeStr = `${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}`;
  const slug = (name || state.currentTask).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").substring(0, 30);
  const snapshotId = `${dateStr}-${timeStr}-${slug}`;
  const snapshotsDir = fs2.resolveContinuity("snapshots");
  await fs2.ensureDir(snapshotsDir);
  const snapshotPath = path9.join(snapshotsDir, `${snapshotId}.md`);
  const content = await fs2.readFile(fs2.resolveContinuity("state.md"));
  await fs2.writeFile(snapshotPath, content);
  TerminalFormatter.success(`Checkpoint snapshot created: ${snapshotId}`);
  TerminalFormatter.item("Snapshot File", `.continuity/snapshots/${snapshotId}.md`);
  TerminalFormatter.item("Branch", gitStatus.branch);
  TerminalFormatter.item("Commit", gitStatus.commit?.shortHash || "uncommitted");
}
async function runRestoreContext(snapshotId) {
  const fs2 = new FileSystem();
  if (!fs2.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }
  const snapshotsDir = fs2.resolveContinuity("snapshots");
  const files = await fs2.listFiles(snapshotsDir, ".md");
  const match = files.find((f) => path9.basename(f, ".md").includes(snapshotId));
  if (!match) {
    TerminalFormatter.error(`Snapshot matching '${snapshotId}' not found in .continuity/snapshots/`);
    process.exitCode = 1;
    return;
  }
  const content = await fs2.readFile(match);
  await fs2.writeFile(fs2.resolveContinuity("state.md"), content);
  TerminalFormatter.success(`Restored state context from snapshot: ${path9.basename(match)}`);
  TerminalFormatter.info('Run "continuity status" to view the restored work state.');
}

// src/core/engine/explain-engine.ts
import path10 from "path";
var ExplainEngine = class {
  constructor(fs2, git, taskManager, decisionManager, failureManager, sessionManager) {
    this.fs = fs2;
    this.git = git;
    this.taskManager = taskManager;
    this.decisionManager = decisionManager;
    this.failureManager = failureManager;
    this.sessionManager = sessionManager;
  }
  fs;
  git;
  taskManager;
  decisionManager;
  failureManager;
  sessionManager;
  async explain(targetPath) {
    const fullPath = this.fs.resolve(targetPath);
    const relativePath = path10.relative(this.fs.rootDir, fullPath);
    const exists = this.fs.exists(fullPath);
    const commits = await this.git.getFileCommits(relativePath, 20);
    const lastCommit = commits[0];
    const firstCommit = commits[commits.length - 1];
    const allTasks = await this.taskManager.listTasks();
    const relatedTasks = [];
    for (const t of [...allTasks.active, ...allTasks.completed, ...allTasks.blocked]) {
      if (t.relatedFiles.some((f) => f.includes(relativePath) || relativePath.includes(f)) || t.description && t.description.includes(relativePath)) {
        relatedTasks.push(`${t.title} (${t.status})`);
      }
    }
    const decisions = await this.decisionManager.listDecisions();
    const relatedDecisions = [];
    for (const d of decisions) {
      if (d.decision.includes(relativePath) || d.why.includes(relativePath) || d.title.toLowerCase().includes(path10.basename(relativePath, path10.extname(relativePath)).toLowerCase())) {
        relatedDecisions.push(`${d.id}: ${d.title}`);
      }
    }
    const failures = await this.failureManager.listFailures();
    const knownFailures = [];
    for (const f of failures) {
      if (f.relatedFiles.some((rf) => rf.includes(relativePath) || relativePath.includes(rf)) || f.attempt.includes(relativePath) || f.why.includes(relativePath)) {
        knownFailures.push(`${f.title} (${f.doNotRepeat})`);
      }
    }
    const sessions = await this.sessionManager.listSessions();
    let sessionMentionsCount = 0;
    for (const s of sessions) {
      if (s.filesChanged.some((fc) => fc.includes(relativePath) || relativePath.includes(fc)) || s.objective.includes(relativePath)) {
        sessionMentionsCount++;
      }
    }
    let purpose = "General codebase module";
    if (relatedTasks.length > 0) {
      purpose = `Related to task: ${relatedTasks[0]}`;
    } else if (commits.length > 0) {
      purpose = `Created for: ${commits[commits.length - 1].message}`;
    }
    return {
      filePath: relativePath,
      exists,
      purpose,
      introducedDate: firstCommit?.date,
      introducedCommit: firstCommit?.hash,
      lastModifiedDate: lastCommit?.date,
      lastModifiedCommit: lastCommit?.hash,
      relatedTasks,
      relatedDecisions,
      knownFailures,
      sessionMentionsCount
    };
  }
  formatExplanation(exp) {
    const lines = [
      `File Context: ${exp.filePath}`,
      "--------------------------------------------------",
      `Exists on disk: ${exp.exists ? "Yes" : "No (historical reference)"}`,
      `Purpose: ${exp.purpose}`,
      `Introduced: ${exp.introducedDate || "Unknown"} ${exp.introducedCommit ? `(${exp.introducedCommit})` : ""}`,
      `Last Modified: ${exp.lastModifiedDate || "Unknown"} ${exp.lastModifiedCommit ? `(${exp.lastModifiedCommit})` : ""}`,
      `Related Tasks: ${exp.relatedTasks.length > 0 ? exp.relatedTasks.join(", ") : "None directly tagged"}`,
      `Related Decisions: ${exp.relatedDecisions.length > 0 ? exp.relatedDecisions.join(", ") : "None"}`,
      `Historical Sessions: ${exp.sessionMentionsCount} session(s) modified or mentioned this file`,
      `Known Issues/Failures: ${exp.knownFailures.length > 0 ? exp.knownFailures.join("; ") : "None recorded"}`,
      "--------------------------------------------------"
    ];
    return lines.join("\n");
  }
};

// src/cli/commands/explain.ts
async function runExplain(filePath, options = {}) {
  const fs2 = new FileSystem();
  if (!fs2.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }
  const git = new GitClient();
  const stateManager = new StateManager(fs2);
  const taskManager = new TaskManager(fs2, stateManager);
  const decisionManager = new DecisionManager(fs2);
  const failureManager = new FailureManager(fs2);
  const sessionManager = new SessionManager(fs2, stateManager);
  const explainEngine = new ExplainEngine(
    fs2,
    git,
    taskManager,
    decisionManager,
    failureManager,
    sessionManager
  );
  const explanation = await explainEngine.explain(filePath);
  if (options.json) {
    console.log(JSON.stringify(explanation, null, 2));
    return;
  }
  console.log(explainEngine.formatExplanation(explanation));
}

// src/cli/commands/search.ts
async function runSearch(query, options = {}) {
  const fs2 = new FileSystem();
  if (!fs2.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }
  const indexer = new SQLiteIndexer(fs2);
  await indexer.init();
  if (options.reindex) {
    const indexed = await indexer.reindexAll();
    TerminalFormatter.info(`Re-indexed ${indexed} document(s).`);
  } else {
    await indexer.reindexAll();
  }
  const limit = options.limit ? parseInt(options.limit, 10) : 10;
  const results = indexer.search(query, { type: options.type, limit });
  indexer.close();
  TerminalFormatter.header(`Search Results: "${query}" (${results.length} matches)`);
  if (results.length === 0) {
    console.log("No matches found.");
    return;
  }
  for (const r of results) {
    console.log(`
\u2022 [${r.type.toUpperCase()}] ${r.title}`);
    console.log(`  Path: ${r.relativePath}`);
    console.log(`  Snippet: ${r.snippet}`);
  }
}

// src/core/engine/doctor-engine.ts
var DoctorEngine = class {
  constructor(fs2, git, stateManager, taskManager) {
    this.fs = fs2;
    this.git = git;
    this.stateManager = stateManager;
    this.taskManager = taskManager;
    this.redactor = new SecretRedactor();
  }
  fs;
  git;
  stateManager;
  taskManager;
  redactor;
  async runDiagnostics() {
    const checks = [];
    const continuityExists = this.fs.exists(this.fs.continuityDir);
    checks.push({
      name: ".continuity directory",
      passed: continuityExists,
      message: continuityExists ? ".continuity directory exists" : "Missing .continuity directory. Run continuity init."
    });
    const stateExists = this.fs.exists(this.fs.resolveContinuity("state.md"));
    if (stateExists) {
      try {
        const state = await this.stateManager.getState();
        checks.push({
          name: "state.md valid",
          passed: true,
          message: `state.md is valid (Task: "${state.currentTask}", Progress: ${state.progress}%)`
        });
      } catch (err) {
        checks.push({
          name: "state.md valid",
          passed: false,
          message: `state.md failed validation: ${err.message}`
        });
      }
    } else {
      checks.push({
        name: "state.md valid",
        passed: false,
        message: "state.md does not exist"
      });
    }
    const projectExists = this.fs.exists(this.fs.resolveContinuity("project.md"));
    checks.push({
      name: "project.md exists",
      passed: projectExists,
      message: projectExists ? "project.md exists" : "project.md is missing",
      warning: !projectExists
    });
    const rootProtocolExists = this.fs.exists(this.fs.resolve("CONTINUITY.md"));
    checks.push({
      name: "Root CONTINUITY.md protocol file",
      passed: rootProtocolExists,
      message: rootProtocolExists ? "CONTINUITY.md protocol file is present at project root" : "CONTINUITY.md missing from root. AIs may not auto-discover the system.",
      warning: !rootProtocolExists
    });
    const isGit = await this.git.isGitRepository();
    if (isGit) {
      const branch = await this.git.getCurrentBranch();
      checks.push({
        name: "Git repository detected",
        passed: true,
        message: `Git repository active on branch: ${branch}`
      });
    } else {
      checks.push({
        name: "Git repository detected",
        passed: false,
        message: "Not inside a Git repository. Version tracking is disabled.",
        warning: true
      });
    }
    try {
      const tasks = await this.taskManager.listTasks();
      const totalTasks = tasks.active.length + tasks.completed.length + tasks.blocked.length;
      checks.push({
        name: "Task tracking integrity",
        passed: true,
        message: `${totalTasks} task(s) found (${tasks.active.length} active, ${tasks.completed.length} completed, ${tasks.blocked.length} blocked)`
      });
    } catch (err) {
      checks.push({
        name: "Task tracking integrity",
        passed: false,
        message: `Error reading tasks: ${err.message}`
      });
    }
    if (continuityExists) {
      const markdownFiles = await this.fs.listFiles(this.fs.continuityDir, ".md");
      let leakedSecrets = 0;
      const leakedFiles = [];
      for (const file of markdownFiles) {
        if (file.includes("/cache/")) continue;
        const content = await this.fs.readFile(file);
        const scan = this.redactor.redact(content);
        if (scan.redactedCount > 0) {
          leakedSecrets += scan.redactedCount;
          leakedFiles.push(file);
        }
      }
      checks.push({
        name: "Secret scanning",
        passed: leakedSecrets === 0,
        message: leakedSecrets === 0 ? "No unredacted secrets or credentials detected in .continuity/" : `WARNING: Found ${leakedSecrets} potential raw secret(s) in: ${leakedFiles.join(", ")}`,
        warning: leakedSecrets > 0
      });
    }
    const overallHealthy = checks.every((c) => c.passed || c.warning);
    return {
      overallHealthy,
      checks
    };
  }
};

// src/cli/commands/doctor.ts
async function runDoctor() {
  const fs2 = new FileSystem();
  const git = new GitClient();
  const stateManager = new StateManager(fs2);
  const taskManager = new TaskManager(fs2, stateManager);
  const doctor = new DoctorEngine(fs2, git, stateManager, taskManager);
  TerminalFormatter.header("Continuity Doctor Diagnostics");
  const report = await doctor.runDiagnostics();
  for (const check of report.checks) {
    if (check.passed) {
      TerminalFormatter.success(`${check.name}: ${check.message}`);
    } else if (check.warning) {
      TerminalFormatter.warning(`${check.name}: ${check.message}`);
    } else {
      TerminalFormatter.error(`${check.name}: ${check.message}`);
    }
  }
  if (report.overallHealthy) {
    console.log("\nAll essential checks passed. Continuity is healthy!");
  } else {
    console.log("\nSome checks failed. Review the errors above to restore full integrity.");
    process.exitCode = 1;
  }
}

// src/cli/commands/export.ts
async function runExport(options = {}) {
  const fs2 = new FileSystem();
  if (!fs2.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }
  const stateManager = new StateManager(fs2);
  const taskManager = new TaskManager(fs2, stateManager);
  const decisionManager = new DecisionManager(fs2);
  const failureManager = new FailureManager(fs2);
  const state = await stateManager.getState();
  const projectInfo = await stateManager.getProjectInfo();
  const architecture = await stateManager.getArchitecture();
  const tasks = await taskManager.listTasks();
  const decisions = await decisionManager.listDecisions();
  const failures = await failureManager.listFailures();
  if (options.json) {
    const payload = JSON.stringify(
      {
        project: projectInfo,
        state,
        architecture,
        tasks,
        decisions,
        failures,
        exportedAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      null,
      2
    );
    if (options.output) {
      await fs2.writeFile(fs2.resolve(options.output), payload);
      TerminalFormatter.success(`Exported JSON context to ${options.output}`);
    } else {
      console.log(payload);
    }
    return;
  }
  const bundle = `# Continuity Context Bundle: ${projectInfo.name}

Generated at: ${(/* @__PURE__ */ new Date()).toISOString()}

---

## 1. Project Information
- **Name**: ${projectInfo.name}
- **Purpose**: ${projectInfo.purpose}
- **Stack**: ${projectInfo.stack.join(", ")}

---

## 2. Current State
- **Branch**: ${state.currentBranch}
- **Task**: ${state.currentTask}
- **Progress**: ${state.progress}%
- **Blocker**: ${state.currentBlocker || "None"}
- **Next Action**:
${typeof state.nextAction === "string" ? state.nextAction : state.nextAction.problem + " -> " + state.nextAction.expectedSolution}

---

## 3. Architecture
${architecture}

---

## 4. Architecture Decisions (${decisions.length})
${decisions.map((d) => `### [${d.id}] ${d.title}
- **Decision**: ${d.decision}
- **Why**: ${d.why}`).join("\n\n")}

---

## 5. Documented Failures & Lessons (${failures.length})
${failures.map((f) => `### ${f.title}
- **Attempt**: ${f.attempt}
- **Result**: ${f.result}
- **Do Not Repeat**: ${f.doNotRepeat}
- **Better**: ${f.betterApproach}`).join("\n\n")}
`;
  if (options.output) {
    await fs2.writeFile(fs2.resolve(options.output), bundle);
    TerminalFormatter.success(`Exported Markdown context bundle to ${options.output}`);
  } else {
    console.log(bundle);
  }
}

// src/cli/commands/done.ts
async function runDone(options = {}) {
  const fs2 = new FileSystem();
  if (!fs2.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }
  const git = new GitClient();
  const stateManager = new StateManager(fs2);
  const taskManager = new TaskManager(fs2, stateManager);
  const decisionManager = new DecisionManager(fs2);
  const failureManager = new FailureManager(fs2);
  const sessionManager = new SessionManager(fs2, stateManager);
  const handoverManager = new HandoverManager(fs2, git, stateManager, decisionManager, failureManager);
  const gitStatus = await git.getStatus();
  const state = await stateManager.getState();
  TerminalFormatter.header("Finalizing Session & Work State");
  const summary = options.summary || `Completed work on ${state.currentTask}`;
  const filesChanged = Array.from(/* @__PURE__ */ new Set([...gitStatus.modifiedFiles, ...gitStatus.stagedFiles]));
  const session = await sessionManager.saveSession({
    agent: options.agent || "ai",
    branch: gitStatus.branch,
    task: state.currentTask,
    objective: summary,
    workCompleted: [summary],
    filesChanged,
    gitCommit: gitStatus.commit?.shortHash
  });
  TerminalFormatter.success(`Session saved: ${session.id}`);
  const nextAction = {
    file: options.nextFile,
    problem: options.nextProblem || "Continue development with next feature item",
    expectedSolution: options.nextSolution || "Proceed with implementation",
    constraints: []
  };
  const handover = await handoverManager.createHandover({
    currentTask: state.currentTask,
    progress: state.progress,
    completed: [...state.completed, summary],
    remaining: state.remaining,
    nextAction,
    author: options.agent || "ai"
  });
  TerminalFormatter.success(`Handover generated: ${handover.id}`);
  TerminalFormatter.box("Session Concluded & State Preserved", [
    `Branch: ${gitStatus.branch}`,
    `Files Changed: ${filesChanged.length}`,
    `Next AI will resume cleanly with:`,
    `  continuity resume`
  ]);
}

// src/cli.ts
var program = new Command();
program.name("continuity").description("Persistent project-context and work-state system for multi-agent and human AI collaboration").version("0.1.0");
program.command("init").description("Initialize Continuity in the current repository").option("-n, --name <name>", "Project name").option("-d, --description <desc>", "Project purpose and description").option("-s, --stack <items...>", "Key technologies / stack items").option("-f, --force", "Overwrite existing files").option("--with-agents", "Scaffold configuration files for Cursor, Claude Code, Windsurf, Cline").action(runInit);
program.command("status").description("Display current project work-state, active task, progress, and next action").option("--json", "Output machine-readable JSON").action(runStatus);
program.command("resume").description("Assemble and load compact prioritized context for continuation by any AI agent").option("-c, --compact", "Output token-efficient compact prompt format (default)").option("--full", "Output full multi-section markdown documentation").option("--json", "Output structured JSON payload").action(runResume);
program.command("handover").description("Package current work state into an actionable continuation package").option("-t, --task <name>", "Current task name").option("-p, --progress <number>", "Progress percentage (0-100)").option("-c, --completed <items>", "Comma-separated completed items").option("-r, --remaining <items>", "Comma-separated remaining items").option("--problem <problem>", "Current blocker or problem to solve").option("--solution <solution>", "Expected solution approach").option("--file <file>", "Specific file to open for next action").option("--focus <focus>", "Specific function or block to focus on").option("--constraints <items>", "Comma-separated architectural constraints").option("--author <author>", "Author or agent identifier").action(runHandover);
var sessionCmd = program.command("session").description("Manage and record developer and AI sessions");
sessionCmd.command("save").description("Record a session summary and optional raw archive").option("-a, --agent <agent>", "Agent identifier (claude, cursor, gpt, human, etc.)").option("-o, --objective <objective>", "Session objective").option("-c, --completed <items>", "Comma-separated completed work").option("-f, --files <items>", "Comma-separated modified files").option("-d, --decisions <items>", "Comma-separated decisions made").option("--failed <items>", "Comma-separated failed approaches").option("-p, --problems <items>", "Comma-separated problems or blockers").option("-n, --next <nextStep>", "Next step").option("--context <context>", "Important context or constraints").option("--raw-file <path>", "Path to file containing raw session transcript").action(runSessionSave);
sessionCmd.command("list").description("List all recorded historical sessions").action(runSessionList);
program.command("context <query>").description("Search historical sessions, decisions, architecture, and failures to answer questions").option("-l, --limit <number>", "Maximum number of results to display", "5").option("-t, --type <type>", "Filter by document type (decision, session, task, etc.)").action((query, opts) => runContext(query, { limit: parseInt(opts.limit, 10), type: opts.type }));
var taskCmd = program.command("task").description("Manage active, completed, and blocked tasks");
taskCmd.command("start <title>").description("Start a new active task").option("-d, --description <desc>", "Task description").option("-r, --remaining <items>", "Comma-separated remaining checklist items").option("-f, --files <items>", "Comma-separated related files").action(runTaskStart);
taskCmd.command("update [id]").description("Update progress, completed items, or blockers for a task").option("-p, --progress <number>", "New progress percentage (0-100)").option("-c, --completed <items>", "Comma-separated completed items to add").option("-r, --remaining <items>", "Comma-separated remaining items to add").option("-b, --blocker <reason>", "Set current blocker").option("-f, --files <items>", "Comma-separated related files to add").action(runTaskUpdate);
taskCmd.command("complete [id]").description("Mark a task as completed and move to tasks/completed/").option("-s, --summary <summary>", "Summary of final delivery").action(runTaskComplete);
taskCmd.command("block <id>").description("Mark a task as blocked with a specific reason").requiredOption("-r, --reason <reason>", "Reason for blocker").action((id, opts) => runTaskBlock(id, { reason: opts.reason }));
taskCmd.command("list").description("List all active, completed, and blocked tasks").action(runTaskList);
program.command("decision [title]").description("Record or list Architecture Decision Records (ADRs)").option("-d, --decision <decision>", "The decision statement").option("-w, --why <why>", "Why this decision was made").option("-a, --alternatives <items>", "Comma-separated alternatives considered").option("-r, --rejected <reason>", "Why alternatives were rejected").option("-l, --list", "List all recorded decisions").action(runDecision);
program.command("log <message>").description("Quickly log an architectural or permanent decision to .continuity/decisions/").action(runLog);
var failureCmd = program.command("failure").description("Record and view failed approaches to prevent repetition");
failureCmd.command("record <title>").description("Record a failed approach with reasons and lessons learned").option("-a, --attempt <attempt>", "What was attempted").option("-r, --result <result>", "Outcome / what broke").option("-w, --why <why>", "Why it failed").option("-d, --do-not-repeat <doNotRepeat>", "Rule on what not to repeat").option("-b, --better <betterApproach>", "Recommended better approach").option("-f, --files <items>", "Comma-separated related files").action((title, opts) => runFailure(title, opts));
failureCmd.command("list").description("List all documented failed approaches").action(() => runFailure(void 0, { list: true }));
program.command("checkpoint [name]").description("Capture a point-in-time snapshot of the current state, commit, and task context").action(runCheckpoint);
program.command("restore-context <id>").description("Restore project work-state from a historical checkpoint snapshot").action(runRestoreContext);
program.command("explain <file>").description("Explain why a file exists, its purpose, related tasks, ADRs, and historical changes").option("--json", "Output machine-readable JSON").action(runExplain);
program.command("search <query>").description("Search across all continuity documents using SQLite FTS5").option("-t, --type <type>", "Filter by type (task, decision, session, failure, etc.)").option("-l, --limit <number>", "Maximum matches").option("--reindex", "Force complete re-indexing before search").action(runSearch);
program.command("doctor").description("Run health checks on .continuity/, git status, secret scanning, and file integrity").action(runDoctor);
program.command("export").description("Export all project continuity context into a single Markdown or JSON bundle").option("-o, --output <file>", "Output file path").option("--json", "Export as structured JSON").action(runExport);
program.command("done").description("Finalize the current session, record summary, and generate handover in one command").option("-s, --summary <summary>", "Summary of work accomplished").option("--next-file <file>", "Next file to open").option("--next-problem <problem>", "Next problem to address").option("--next-solution <solution>", "Expected solution approach").option("-a, --agent <agent>", "Agent identifier").action(runDone);
program.parse(process.argv);
//# sourceMappingURL=cli.js.map