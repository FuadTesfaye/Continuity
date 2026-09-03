// src/core/types/config.ts
import { z } from "zod";
var ContinuityConfigSchema = z.object({
  version: z.number().default(1),
  git: z.object({
    track: z.array(z.string()).default([
      "state.md",
      "project.md",
      "architecture.md",
      "roadmap.md",
      "index.md",
      "tasks/**",
      "decisions/**",
      "failures/**",
      "handovers/**",
      "sessions/summaries/**"
    ]),
    ignore: z.array(z.string()).default([
      "sessions/raw/**",
      "cache/**",
      "*.tmp"
    ])
  }).default({
    track: [
      "state.md",
      "project.md",
      "architecture.md",
      "roadmap.md",
      "index.md",
      "tasks/**",
      "decisions/**",
      "failures/**",
      "handovers/**",
      "sessions/summaries/**"
    ],
    ignore: ["sessions/raw/**", "cache/**", "*.tmp"]
  }),
  redaction: z.object({
    enabled: z.boolean().default(true),
    files: z.array(z.string()).default([
      ".env",
      ".env.*",
      "*.pem",
      "*.key",
      "id_rsa",
      "id_ed25519",
      "credentials.json"
    ]),
    patterns: z.array(z.string()).default([
      `(?i)(api[_-]?key|secret|token|password|auth[_-]?token)\\s*[:=]\\s*["']?([a-zA-Z0-9_\\-\\.~]{8,})["']?`,
      "gh[pous]_[a-zA-Z0-9]{36}",
      "sk-[a-zA-Z0-9_-]{20,}",
      "AIzaSy[a-zA-Z0-9_-]{33}",
      "bearer\\s+[a-zA-Z0-9_\\-\\.~]{20,}"
    ])
  }).default({
    enabled: true,
    files: [
      ".env",
      ".env.*",
      "*.pem",
      "*.key",
      "id_rsa",
      "id_ed25519",
      "credentials.json"
    ],
    patterns: [
      `(?i)(api[_-]?key|secret|token|password|auth[_-]?token)\\s*[:=]\\s*["']?([a-zA-Z0-9_\\-\\.~]{8,})["']?`,
      "gh[pous]_[a-zA-Z0-9]{36}",
      "sk-[a-zA-Z0-9_-]{20,}",
      "AIzaSy[a-zA-Z0-9_-]{33}",
      "bearer\\s+[a-zA-Z0-9_\\-\\.~]{20,}"
    ]
  }),
  ai: z.object({
    defaultModel: z.string().optional(),
    instructionsFile: z.string().default("CONTINUITY.md")
  }).default({
    instructionsFile: "CONTINUITY.md"
  })
});

// src/core/types/task.ts
import { z as z2 } from "zod";
var TaskStatusSchema = z2.enum(["active", "completed", "blocked"]);
var TaskItemSchema = z2.object({
  id: z2.string(),
  title: z2.string(),
  status: TaskStatusSchema.default("active"),
  progress: z2.number().min(0).max(100).default(0),
  description: z2.string().optional(),
  completed: z2.array(z2.string()).default([]),
  remaining: z2.array(z2.string()).default([]),
  blockers: z2.array(z2.string()).default([]),
  relatedFiles: z2.array(z2.string()).default([]),
  planId: z2.string().optional(),
  commits: z2.array(z2.string()).default([]),
  acceptanceCriteria: z2.array(z2.string()).default([]),
  createdAt: z2.string(),
  updatedAt: z2.string(),
  completedAt: z2.string().optional()
});

// src/core/types/decision.ts
import { z as z3 } from "zod";
var DecisionSchema = z3.object({
  id: z3.string(),
  // e.g. "ADR-001" or "2026-09-03-rabbitmq"
  title: z3.string(),
  status: z3.enum(["proposed", "accepted", "superseded", "deprecated"]).default("accepted"),
  date: z3.string(),
  decision: z3.string(),
  why: z3.string(),
  alternatives: z3.array(z3.string()).default([]),
  rejectedBecause: z3.string().optional(),
  implications: z3.array(z3.string()).default([]),
  author: z3.string().optional()
});

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

// src/core/types/session.ts
import { z as z5 } from "zod";
var SessionSummarySchema = z5.object({
  id: z5.string(),
  date: z5.string(),
  agent: z5.string().default("ai"),
  branch: z5.string().default("main"),
  task: z5.string().optional(),
  objective: z5.string(),
  workCompleted: z5.array(z5.string()).default([]),
  filesChanged: z5.array(z5.string()).default([]),
  decisions: z5.array(z5.string()).default([]),
  failedApproaches: z5.array(z5.string()).default([]),
  problems: z5.array(z5.string()).default([]),
  planId: z5.string().optional(),
  commitsCreated: z5.array(z5.string()).default([]),
  stagedChanges: z5.array(z5.string()).default([]),
  unstagedChanges: z5.array(z5.string()).default([]),
  nextStep: z5.string().optional(),
  importantContext: z5.string().optional(),
  gitCommit: z5.string().optional()
});

// src/core/types/handover.ts
import { z as z6 } from "zod";
var NextActionSchema = z6.object({
  file: z6.string().optional(),
  focus: z6.string().optional(),
  problem: z6.string(),
  expectedSolution: z6.string(),
  constraints: z6.array(z6.string()).default([])
});
var HandoverSchema = z6.object({
  id: z6.string(),
  date: z6.string(),
  project: z6.string(),
  branch: z6.string(),
  commit: z6.string().optional(),
  currentTask: z6.string().optional(),
  progress: z6.number().min(0).max(100).default(0),
  completed: z6.array(z6.string()).default([]),
  remaining: z6.array(z6.string()).default([]),
  modifiedFiles: z6.array(z6.string()).default([]),
  uncommittedChanges: z6.boolean().default(false),
  planId: z6.string().optional(),
  planStep: z6.string().optional(),
  commits: z6.array(z6.string()).default([]),
  decisions: z6.array(z6.string()).default([]),
  problems: z6.array(z6.string()).default([]),
  failedApproaches: z6.array(z6.string()).default([]),
  nextAction: NextActionSchema,
  author: z6.string().default("ai")
});

// src/core/types/state.ts
import { z as z7 } from "zod";
var ProjectInfoSchema = z7.object({
  name: z7.string(),
  purpose: z7.string().default(""),
  stack: z7.array(z7.string()).default([]),
  architecture: z7.string().default(""),
  database: z7.string().optional(),
  infrastructure: z7.array(z7.string()).default([]),
  repository: z7.string().optional()
});
var ContinuityStateSchema = z7.object({
  project: z7.string(),
  currentBranch: z7.string().default("main"),
  currentTask: z7.string().default("No active task"),
  status: z7.string().default("Ready"),
  progress: z7.number().min(0).max(100).default(0),
  completed: z7.array(z7.string()).default([]),
  remaining: z7.array(z7.string()).default([]),
  currentFiles: z7.array(z7.string()).default([]),
  currentBlocker: z7.string().nullable().default(null),
  lastAction: z7.string().default("Project initialized"),
  nextAction: NextActionSchema.or(z7.string()).default({
    problem: "No blocker",
    expectedSolution: "Continue with next task",
    constraints: []
  }),
  lastSession: z7.string().optional(),
  lastCommit: z7.string().optional(),
  updatedAt: z7.string()
});

// src/core/types/plan.ts
import { z as z8 } from "zod";
var PlanStatusSchema = z8.enum(["planned", "active", "blocked", "completed", "abandoned"]);
var PlanStepSchema = z8.object({
  id: z8.string(),
  description: z8.string(),
  status: z8.enum(["pending", "in_progress", "completed", "blocked"]).default("pending"),
  commits: z8.array(z8.string()).default([]),
  files: z8.array(z8.string()).default([])
});
var AcceptanceCriterionSchema = z8.object({
  id: z8.string(),
  description: z8.string(),
  satisfied: z8.boolean().default(false)
});
var PlanSchema = z8.object({
  id: z8.string(),
  title: z8.string(),
  status: PlanStatusSchema.default("active"),
  goal: z8.string(),
  scope: z8.array(z8.string()).default([]),
  steps: z8.array(PlanStepSchema).default([]),
  constraints: z8.array(z8.string()).default([]),
  dependencies: z8.array(z8.string()).default([]),
  acceptanceCriteria: z8.array(AcceptanceCriterionSchema).default([]),
  currentStep: z8.string().optional(),
  nextStep: z8.string().optional(),
  createdAt: z8.string(),
  updatedAt: z8.string(),
  completedAt: z8.string().optional(),
  abandonReason: z8.string().optional()
});

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
    let stats;
    const diffStat = await this.runGit(["diff", "--shortstat"]);
    if (diffStat) {
      const filesMatch = diffStat.match(/(\d+)\s+file/);
      const insMatch = diffStat.match(/(\d+)\s+insertion/);
      const delMatch = diffStat.match(/(\d+)\s+deletion/);
      stats = {
        filesChanged: filesMatch ? parseInt(filesMatch[1], 10) : 0,
        insertions: insMatch ? parseInt(insMatch[1], 10) : 0,
        deletions: delMatch ? parseInt(delMatch[1], 10) : 0
      };
    }
    return {
      isGitRepo: true,
      branch,
      commit,
      modifiedFiles: Array.from(new Set(modifiedFiles)),
      stagedFiles: Array.from(new Set(stagedFiles)),
      untrackedFiles: Array.from(new Set(untrackedFiles)),
      hasUncommittedChanges,
      stats
    };
  }
  // Level 2: Recent History
  async getRecentCommits(limit = 15, filterPath) {
    const args = [
      "log",
      `-${limit}`,
      "--pretty=format:%H%x1f%h%x1f%s%x1f%an%x1f%ad",
      "--date=short"
    ];
    if (filterPath) {
      args.push("--", filterPath);
    }
    const output = await this.runGit(args);
    if (!output) return [];
    const commits = [];
    for (const line of output.split("\n")) {
      if (!line.trim()) continue;
      const parts = line.split("");
      if (parts.length >= 5) {
        commits.push({
          hash: parts[0],
          shortHash: parts[1],
          message: parts[2],
          author: parts[3],
          date: parts[4]
        });
      }
    }
    return commits;
  }
  // Level 3: File Temporal History
  async getFileCommits(filePath, limit = 10) {
    return this.getRecentCommits(limit, filePath);
  }
  // Level 4: Change Archaeology (Pickaxe -S)
  async searchSymbolHistory(symbol, filterPath, limit = 10) {
    const args = [
      "log",
      `-${limit}`,
      `-S${symbol}`,
      "--pretty=format:%H%x1f%h%x1f%s%x1f%an%x1f%ad",
      "--date=short"
    ];
    if (filterPath) {
      args.push("--", filterPath);
    }
    const output = await this.runGit(args);
    if (!output) return [];
    return output.split("\n").map((line) => {
      const parts = line.split("");
      if (parts.length < 5) return null;
      return {
        hash: parts[0],
        shortHash: parts[1],
        message: parts[2],
        author: parts[3],
        date: parts[4]
      };
    }).filter((c) => c !== null);
  }
  // Level 4: Change Archaeology (Regex -G)
  async searchRegexHistory(regexPattern, filterPath, limit = 10) {
    const args = [
      "log",
      `-${limit}`,
      `-G${regexPattern}`,
      "--pretty=format:%H%x1f%h%x1f%s%x1f%an%x1f%ad",
      "--date=short"
    ];
    if (filterPath) {
      args.push("--", filterPath);
    }
    const output = await this.runGit(args);
    if (!output) return [];
    return output.split("\n").map((line) => {
      const parts = line.split("");
      if (parts.length < 5) return null;
      return {
        hash: parts[0],
        shortHash: parts[1],
        message: parts[2],
        author: parts[3],
        date: parts[4]
      };
    }).filter((c) => c !== null);
  }
  // Level 4: Blame
  async getFileBlame(filePath, lineStart, lineEnd) {
    const args = ["blame", "--porcelain"];
    if (lineStart !== void 0 && lineEnd !== void 0) {
      args.push(`-L${lineStart},${lineEnd}`);
    }
    args.push("--", filePath);
    const output = await this.runGit(args);
    if (!output) return [];
    const lines = output.split("\n");
    const result = [];
    let currentCommit = "";
    let currentAuthor = "";
    let currentDate = "";
    let lineNum = 1;
    for (const line of lines) {
      if (line.match(/^[a-f0-9]{40}/)) {
        currentCommit = line.split(" ")[0].substring(0, 7);
      } else if (line.startsWith("author ")) {
        currentAuthor = line.replace(/^author\s+/, "");
      } else if (line.startsWith("author-time ")) {
        const timestamp = parseInt(line.replace(/^author-time\s+/, ""), 10);
        currentDate = new Date(timestamp * 1e3).toISOString().split("T")[0];
      } else if (line.startsWith("	")) {
        result.push({
          lineNum: lineNum++,
          commit: currentCommit,
          author: currentAuthor,
          date: currentDate,
          content: line.substring(1)
        });
      }
    }
    return result;
  }
  // Commit Details
  async getCommitDetails(hash) {
    const output = await this.runGit([
      "show",
      hash,
      "--stat",
      "--pretty=format:%H%x1f%h%x1f%s%x1f%an%x1f%ad"
    ]);
    if (!output) return void 0;
    const splitIndex = output.indexOf("\n");
    const header = splitIndex !== -1 ? output.substring(0, splitIndex) : output;
    const stat = splitIndex !== -1 ? output.substring(splitIndex + 1).trim() : "";
    const parts = header.split("");
    if (parts.length < 5) return void 0;
    return {
      info: {
        hash: parts[0],
        shortHash: parts[1],
        message: parts[2],
        author: parts[3],
        date: parts[4]
      },
      stat
    };
  }
  // Tags & Releases
  async getTags() {
    const output = await this.runGit([
      "tag",
      "-l",
      "--sort=-creatordate",
      "--format=%(refname:short)%09%(objectname:short)%09%(creatordate:short)%09%(contents:subject)"
    ]);
    if (!output) return [];
    return output.split("\n").filter((l) => l.trim()).map((line) => {
      const parts = line.split("	");
      return {
        name: parts[0],
        commit: parts[1],
        date: parts[2],
        message: parts[3]
      };
    });
  }
  // Module Evolution across tags and commits
  async getModuleEvolution(modulePath) {
    const recentCommits = await this.getRecentCommits(30, modulePath);
    const tags = await this.getTags();
    const releases = [];
    for (const tag of tags.slice(0, 5)) {
      const tagCommits = await this.runGit([
        "log",
        "-5",
        "--pretty=format:%H%x1f%h%x1f%s%x1f%an%x1f%ad",
        "--date=short",
        tag.name,
        "--",
        modulePath
      ]);
      if (tagCommits) {
        const parsedCommits = tagCommits.split("\n").filter(Boolean).map((l) => {
          const parts = l.split("");
          return {
            hash: parts[0],
            shortHash: parts[1],
            message: parts[2],
            author: parts[3],
            date: parts[4]
          };
        });
        if (parsedCommits.length > 0) {
          releases.push({
            tag: tag.name,
            date: tag.date,
            commits: parsedCommits
          });
        }
      }
    }
    return {
      modulePath,
      totalCommits: recentCommits.length,
      releases,
      recentCommits: recentCommits.slice(0, 10)
    };
  }
  // Diff
  async getDiff(cached = false) {
    const args = ["diff"];
    if (cached) args.push("--cached");
    return this.runGit(args);
  }
  async getContextDiff(files, limitLines = 50) {
    const args = ["diff", "--stat"];
    if (files && files.length > 0) {
      args.push("--", ...files);
    }
    const stat = await this.runGit(args);
    const diffArgs = ["diff", "-U2"];
    if (files && files.length > 0) {
      diffArgs.push("--", ...files);
    }
    const diff = await this.runGit(diffArgs);
    const diffLines = diff.split("\n").slice(0, limitLines).join("\n");
    return `${stat}

${diffLines}`;
  }
};

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
  inMemoryFallbackRels = [];
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

      CREATE TABLE IF NOT EXISTS relationships (
        source_id TEXT,
        source_type TEXT,
        target_id TEXT,
        target_type TEXT,
        relation TEXT,
        created_at TEXT,
        PRIMARY KEY (source_id, source_type, target_id, target_type, relation)
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
    if (relativePath.includes("plans/")) return "plan";
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
  recordRelationship(rel) {
    if (this.isNodeSqliteAvailable && this.db) {
      try {
        const stmt = this.db.prepare(`
          INSERT OR REPLACE INTO relationships (source_id, source_type, target_id, target_type, relation, created_at)
          VALUES (?, ?, ?, ?, ?, ?);
        `);
        stmt.run(
          rel.sourceId,
          rel.sourceType,
          rel.targetId,
          rel.targetType,
          rel.relation,
          rel.createdAt || (/* @__PURE__ */ new Date()).toISOString()
        );
        return;
      } catch {
      }
    }
    this.inMemoryFallbackRels.push(rel);
  }
  getRelatedEntities(entityId, entityType) {
    if (this.isNodeSqliteAvailable && this.db) {
      try {
        const stmt = this.db.prepare(`
          SELECT target_id as id, target_type as type, relation FROM relationships
          WHERE source_id = ? AND source_type = ?
          UNION
          SELECT source_id as id, source_type as type, relation FROM relationships
          WHERE target_id = ? AND target_type = ?;
        `);
        return stmt.all(entityId, entityType, entityId, entityType);
      } catch {
      }
    }
    const matches = [];
    for (const r of this.inMemoryFallbackRels) {
      if (r.sourceId === entityId && r.sourceType === entityType) {
        matches.push({ id: r.targetId, type: r.targetType, relation: r.relation });
      } else if (r.targetId === entityId && r.targetType === entityType) {
        matches.push({ id: r.sourceId, type: r.sourceType, relation: r.relation });
      }
    }
    return matches;
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
  async saveProjectInfo(info) {
    const current = await this.getProjectInfo();
    const merged = {
      ...current,
      ...info
    };
    const content = `# Project Overview

## Name
${merged.name}

## Purpose
${merged.purpose || "Not specified"}

## Stack
${MarkdownHelper.formatBulletList(merged.stack)}

## Architecture
${merged.architecture || "Not specified"}

## Database
${merged.database || "Not specified"}

## Infrastructure
${MarkdownHelper.formatBulletList(merged.infrastructure)}

${merged.repository ? `## Repository
${merged.repository}
` : ""}
`;
    await this.fs.writeFile(this.fs.resolveContinuity("project.md"), content);
    return merged;
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

// src/core/engine/task-manager.ts
import path3 from "path";
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
      planId: options.planId,
      commits: [],
      acceptanceCriteria: options.acceptanceCriteria || [],
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
    const oldPath = path3.join(this.getTaskDir(previousStatus), `${task.id}.md`);
    const newPath = path3.join(this.getTaskDir("completed"), `${task.id}.md`);
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
    const oldPath = path3.join(this.getTaskDir(previousStatus), `${task.id}.md`);
    const newPath = path3.join(this.getTaskDir("blocked"), `${task.id}.md`);
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
      const taskPath = path3.join(this.getTaskDir(status), `${id}.md`);
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
        const id = path3.basename(file, ".md");
        const raw = await this.fs.readFile(file);
        const task = this.parseTaskMarkdown(raw, id, status);
        result[status].push(task);
      }
    }
    return result;
  }
  saveTaskFile(task) {
    const dir = this.getTaskDir(task.status);
    const filePath = path3.join(dir, `${task.id}.md`);
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
      planId: parsed.data.planId,
      commits: parsed.data.commits || [],
      acceptanceCriteria: parsed.data.acceptanceCriteria || [],
      createdAt: parsed.data.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: parsed.data.updatedAt || (/* @__PURE__ */ new Date()).toISOString(),
      completedAt: parsed.data.completedAt
    };
  }
};

// src/core/engine/decision-manager.ts
import path4 from "path";
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
      const filename = path4.basename(file);
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
    const filePath = path4.join(this.decisionsDir, filename);
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
      const decision = this.parseDecisionMarkdown(raw, path4.basename(file, ".md"));
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

// src/core/engine/failure-manager.ts
import path5 from "path";
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
    const filePath = path5.join(this.failuresDir, filename);
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
      const failure = this.parseFailureMarkdown(raw, path5.basename(file, ".md"));
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

// src/core/engine/session-manager.ts
import path6 from "path";
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
    const summaryDir = path6.join(this.sessionsDir, "summaries", dateInfo.year, dateInfo.month, dateInfo.day);
    const rawDir = path6.join(this.sessionsDir, "raw", dateInfo.year, dateInfo.month, dateInfo.day);
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
      commitsCreated: data.commitsCreated || [],
      stagedChanges: data.stagedChanges || [],
      unstagedChanges: data.unstagedChanges || [],
      nextStep: sanitizedNextStep,
      importantContext: sanitizedContext,
      gitCommit: data.gitCommit
    };
    const validated = SessionSummarySchema.parse(summary);
    const markdown = this.formatSessionMarkdown(validated);
    const summaryFilePath = path6.join(summaryDir, `${id}.md`);
    await this.fs.writeFile(summaryFilePath, markdown);
    if (rawContent) {
      await this.fs.ensureDir(rawDir);
      const sanitizedRaw = this.redactor.redact(rawContent).text;
      const rawFilePath = path6.join(rawDir, `${id}-raw.md`);
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
    const summariesRoot = path6.join(this.sessionsDir, "summaries");
    if (!this.fs.exists(summariesRoot)) return [];
    const files = await this.fs.listFiles(summariesRoot, ".md");
    const sessions = [];
    for (const file of files) {
      const raw = await this.fs.readFile(file);
      const sess = this.parseSessionMarkdown(raw, path6.basename(file, ".md"));
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
        commitsCreated: parsed.data.commitsCreated || [],
        stagedChanges: parsed.data.stagedChanges || [],
        unstagedChanges: parsed.data.unstagedChanges || [],
        nextStep: sections.get("Next Step"),
        importantContext: sections.get("Important Context"),
        gitCommit: parsed.data.gitCommit || sections.get("Git")?.replace(/^Commit:\s*/i, "").trim()
      };
    } catch {
      return void 0;
    }
  }
};

// src/core/engine/handover-manager.ts
import path7 from "path";
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
    const targetDir = path7.join(this.handoversDir, year, month);
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
      planId: data.planId,
      planStep: data.planStep,
      commits: data.commits || (gitStatus.commit ? [gitStatus.commit.shortHash] : []),
      decisions,
      problems: data.problems || (currentState.currentBlocker ? [currentState.currentBlocker] : []),
      failedApproaches,
      nextAction: sanitizedNextAction,
      author: data.author || "ai"
    };
    const validated = HandoverSchema.parse(handover);
    const markdown = this.formatHandoverMarkdown(validated);
    const filePath = path7.join(targetDir, `${id}.md`);
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
    files.sort((a, b) => path7.basename(b).localeCompare(path7.basename(a)));
    const raw = await this.fs.readFile(files[0]);
    return this.parseHandoverMarkdown(raw, path7.basename(files[0], ".md"));
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
        planId: parsed.data.planId,
        planStep: parsed.data.planStep,
        commits: parsed.data.commits || (parsed.data.commit ? [parsed.data.commit] : []),
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

// src/core/engine/resume-engine.ts
var ResumeEngine = class {
  constructor(stateManager, handoverManager, sessionManager, failureManager, decisionManager, git, planManager) {
    this.stateManager = stateManager;
    this.handoverManager = handoverManager;
    this.sessionManager = sessionManager;
    this.failureManager = failureManager;
    this.decisionManager = decisionManager;
    this.git = git;
    this.planManager = planManager;
  }
  stateManager;
  handoverManager;
  sessionManager;
  failureManager;
  decisionManager;
  git;
  planManager;
  async buildContext() {
    const projectInfo = await this.stateManager.getProjectInfo();
    const state = await this.stateManager.getState();
    const gitStatus = await this.git.getStatus();
    const latestHandover = await this.handoverManager.getLatestHandover();
    const latestSession = await this.sessionManager.getLatestSession();
    const failures = await this.failureManager.listFailures();
    const decisions = await this.decisionManager.listDecisions();
    const activePlan = this.planManager ? await this.planManager.getActivePlan() : void 0;
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
        ...nextAction.file ? [nextAction.file] : [],
        ...activePlan ? activePlan.steps.flatMap((s) => s.files) : []
      ])
    ).slice(0, 10);
    const recentCommits = await this.git.getRecentCommits(5);
    const previousFailedApproaches = [
      ...latestHandover?.failedApproaches || [],
      ...failures.map((f) => `[${f.title}]: ${f.doNotRepeat} -> ${f.betterApproach}`)
    ].slice(0, 3);
    const recentDecisions = [
      ...latestHandover?.decisions || [],
      ...decisions.slice(-3).map((d) => `${d.id} (${d.title}): ${d.decision}`)
    ].slice(0, 3);
    let planData;
    if (activePlan) {
      const completedSteps = activePlan.steps.filter((s) => s.status === "completed").length;
      const progressPercentage = activePlan.steps.length > 0 ? Math.round(completedSteps / activePlan.steps.length * 100) : 0;
      planData = {
        id: activePlan.id,
        title: activePlan.title,
        status: activePlan.status,
        goal: activePlan.goal,
        currentStep: activePlan.currentStep,
        nextStep: activePlan.nextStep,
        progressPercentage,
        steps: activePlan.steps.map((s) => ({ id: s.id, description: s.description, status: s.status })),
        constraints: activePlan.constraints
      };
    }
    return {
      project: projectInfo.name || state.project,
      purpose: projectInfo.purpose || "",
      architectureSummary: projectInfo.architecture || (projectInfo.stack.length > 0 ? projectInfo.stack.join(", ") : "Standard"),
      branch: gitStatus.branch || state.currentBranch,
      commit: gitStatus.commit?.shortHash || state.lastCommit,
      currentTask: state.currentTask,
      progress: state.progress,
      plan: planData,
      completed: state.completed,
      remaining: state.remaining,
      currentBlocker: state.currentBlocker,
      relevantFiles,
      recentCommits,
      previousFailedApproaches,
      recentDecisions,
      lastSession: latestSession?.id || state.lastSession,
      nextAction,
      hasUncommittedChanges: gitStatus.hasUncommittedChanges,
      uncommittedStats: gitStatus.stats
    };
  }
  formatCompact(ctx) {
    const lines = [
      "================ CONTINUITY RESUME ================\n",
      `Project: ${ctx.project}`,
      `Branch: ${ctx.branch}${ctx.commit ? ` (${ctx.commit})` : ""}`,
      `Current Task: ${ctx.currentTask} [${ctx.progress}% completed]`,
      `Status: ${ctx.currentBlocker ? `BLOCKED - ${ctx.currentBlocker}` : "In Progress"}`
    ];
    if (ctx.plan) {
      lines.push(
        `Active Plan: ${ctx.plan.title} [${ctx.plan.progressPercentage}% completed]`,
        `Current Step: ${ctx.plan.currentStep || "None"}`
      );
    }
    lines.push(
      `Uncommitted Changes: ${ctx.hasUncommittedChanges ? "YES (check git status)" : "None"}
`,
      "--- RECENT GIT COMMITS ---"
    );
    if (ctx.recentCommits.length > 0) {
      for (const c of ctx.recentCommits.slice(0, 3)) {
        lines.push(`\u2022 ${c.shortHash} ${c.message} (${c.author})`);
      }
    } else {
      lines.push("No recent commits");
    }
    lines.push(
      "\n--- LAST COMPLETED ---",
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
    );
    return lines.filter((l) => l !== "").join("\n");
  }
  formatFullMarkdown(ctx) {
    const lines = [
      "# Continuity Resume Context",
      "\n## 1. Project Identity",
      `- **Name**: ${ctx.project}`,
      `- **Purpose**: ${ctx.purpose || "Not specified"}`,
      `- **Architecture**: ${ctx.architectureSummary}`,
      `- **Branch**: \`${ctx.branch}\``,
      `- **Commit**: \`${ctx.commit || "unknown"}\``,
      `- **Uncommitted Changes**: ${ctx.hasUncommittedChanges ? "Yes" : "No"}`
    ];
    if (ctx.plan) {
      lines.push(
        "\n## 2. Active Plan",
        `- **Plan**: ${ctx.plan.title} (\`${ctx.plan.id}\`)`,
        `- **Goal**: ${ctx.plan.goal}`,
        `- **Progress**: ${ctx.plan.progressPercentage}%`,
        `- **Current Step**: ${ctx.plan.currentStep || "None"}`,
        `- **Next Step**: ${ctx.plan.nextStep || "None"}`
      );
      if (ctx.plan.constraints.length > 0) {
        lines.push(`- **Constraints**:
${MarkdownHelper.formatBulletList(ctx.plan.constraints, "  *")}`);
      }
    }
    lines.push(
      "\n## 3. Current Task & Progress",
      `- **Task**: ${ctx.currentTask}`,
      `- **Progress**: ${ctx.progress}%`,
      `- **Blocker**: ${ctx.currentBlocker || "None"}`,
      "\n### Completed",
      MarkdownHelper.formatBulletList(ctx.completed, "\u2713"),
      "\n### Remaining",
      MarkdownHelper.formatBulletList(ctx.remaining, "\u25A1"),
      "\n## 4. Recent Git History"
    );
    if (ctx.recentCommits.length > 0) {
      for (const c of ctx.recentCommits) {
        lines.push(`- \`${c.shortHash}\` **${c.message}** (${c.author}, ${c.date})`);
      }
    } else {
      lines.push("No recent commits.");
    }
    lines.push(
      "\n## 5. Relevant Source Files",
      MarkdownHelper.formatBulletList(ctx.relevantFiles),
      "\n## 6. Architectural Constraints & Key Decisions",
      MarkdownHelper.formatBulletList(ctx.recentDecisions),
      '\n## 7. Failed Approaches ("Do Not Repeat")',
      MarkdownHelper.formatBulletList(ctx.previousFailedApproaches, "\u26A0\uFE0F"),
      "\n## 8. Recommended Next Action",
      ctx.nextAction.file ? `- **Open**: \`${ctx.nextAction.file}\`` : "",
      ctx.nextAction.focus ? `- **Focus**: \`${ctx.nextAction.focus}\`` : "",
      `- **Problem**: ${ctx.nextAction.problem}`,
      `- **Expected Solution**: ${ctx.nextAction.expectedSolution}`,
      ctx.nextAction.constraints.length > 0 ? `- **Constraints**:
${MarkdownHelper.formatBulletList(ctx.nextAction.constraints, "  *")}` : ""
    );
    return lines.filter((l) => l !== "").join("\n");
  }
};

// src/core/engine/explain-engine.ts
import path8 from "path";
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
    const relativePath = path8.relative(this.fs.rootDir, fullPath);
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
      if (d.decision.includes(relativePath) || d.why.includes(relativePath) || d.title.toLowerCase().includes(path8.basename(relativePath, path8.extname(relativePath)).toLowerCase())) {
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

// src/core/engine/plan-manager.ts
import path9 from "path";
var PlanManager = class {
  constructor(fs2) {
    this.fs = fs2;
  }
  fs;
  get plansDir() {
    return this.fs.resolveContinuity("plans");
  }
  slugify(title) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").substring(0, 50);
  }
  getPlanDir(status) {
    return path9.join(this.plansDir, status);
  }
  async createPlan(data) {
    await this.fs.ensureDir(path9.join(this.plansDir, "active"));
    await this.fs.ensureDir(path9.join(this.plansDir, "blocked"));
    await this.fs.ensureDir(path9.join(this.plansDir, "completed"));
    await this.fs.ensureDir(path9.join(this.plansDir, "abandoned"));
    const id = this.slugify(data.title);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const steps = data.steps.map((s, index) => ({
      id: `step-${index + 1}`,
      description: s.description,
      status: index === 0 ? "in_progress" : "pending",
      commits: [],
      files: s.files || []
    }));
    const acceptanceCriteria = (data.acceptanceCriteria || []).map((ac, index) => ({
      id: `crit-${index + 1}`,
      description: ac,
      satisfied: false
    }));
    const plan = {
      id,
      title: data.title,
      status: "active",
      goal: data.goal,
      scope: data.scope || [],
      steps,
      constraints: data.constraints || [],
      dependencies: data.dependencies || [],
      acceptanceCriteria,
      currentStep: steps.length > 0 ? steps[0].description : void 0,
      nextStep: steps.length > 1 ? steps[1].description : void 0,
      createdAt: now,
      updatedAt: now
    };
    const validated = PlanSchema.parse(plan);
    await this.savePlanFile(validated);
    return validated;
  }
  async getPlan(id) {
    const statuses = ["active", "blocked", "completed", "abandoned", "planned"];
    for (const status of statuses) {
      const planPath = path9.join(this.getPlanDir(status), `${id}.md`);
      if (this.fs.exists(planPath)) {
        const raw = await this.fs.readFile(planPath);
        return this.parsePlanMarkdown(raw, id, status);
      }
    }
    return void 0;
  }
  async getActivePlan() {
    const activeDir = this.getPlanDir("active");
    if (!this.fs.exists(activeDir)) return void 0;
    const files = await this.fs.listFiles(activeDir, ".md");
    if (files.length === 0) return void 0;
    const raw = await this.fs.readFile(files[0]);
    return this.parsePlanMarkdown(raw, path9.basename(files[0], ".md"), "active");
  }
  async updatePlan(id, updates) {
    const plan = await this.getPlan(id);
    if (!plan) {
      throw new Error(`Plan with id '${id}' not found.`);
    }
    const previousStatus = plan.status;
    if (updates.completeStepIndex !== void 0 && plan.steps[updates.completeStepIndex]) {
      plan.steps[updates.completeStepIndex].status = "completed";
      const nextPending = plan.steps.find((s) => s.status === "pending");
      if (nextPending) {
        nextPending.status = "in_progress";
        plan.currentStep = nextPending.description;
        const nextNext = plan.steps.filter((s) => s.status === "pending")[1];
        plan.nextStep = nextNext ? nextNext.description : "Final verification";
      } else {
        plan.currentStep = "All steps completed";
        plan.nextStep = "Plan verification and handover";
      }
    }
    if (updates.addCommitsToStep && plan.steps[updates.addCommitsToStep.stepIndex]) {
      const step = plan.steps[updates.addCommitsToStep.stepIndex];
      step.commits = Array.from(/* @__PURE__ */ new Set([...step.commits, ...updates.addCommitsToStep.commits]));
    }
    if (updates.satisfyCriterionIndex !== void 0 && plan.acceptanceCriteria[updates.satisfyCriterionIndex]) {
      plan.acceptanceCriteria[updates.satisfyCriterionIndex].satisfied = true;
    }
    if (updates.currentStep) {
      plan.currentStep = updates.currentStep;
    }
    if (updates.status) {
      plan.status = updates.status;
    }
    if (updates.abandonReason) {
      plan.abandonReason = updates.abandonReason;
    }
    plan.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    if (updates.status && updates.status !== previousStatus) {
      const oldPath = path9.join(this.getPlanDir(previousStatus), `${plan.id}.md`);
      const newPath = path9.join(this.getPlanDir(updates.status), `${plan.id}.md`);
      await this.fs.ensureDir(this.getPlanDir(updates.status));
      if (this.fs.exists(oldPath)) {
        await this.fs.deleteFile(oldPath);
      }
      await this.fs.writeFile(newPath, this.formatPlanMarkdown(plan));
    } else {
      await this.savePlanFile(plan);
    }
    return plan;
  }
  async completePlan(id) {
    const plan = await this.getPlan(id);
    if (!plan) throw new Error(`Plan '${id}' not found.`);
    plan.status = "completed";
    plan.completedAt = (/* @__PURE__ */ new Date()).toISOString();
    plan.updatedAt = plan.completedAt;
    for (const step of plan.steps) {
      step.status = "completed";
    }
    for (const crit of plan.acceptanceCriteria) {
      crit.satisfied = true;
    }
    const oldPath = path9.join(this.getPlanDir("active"), `${plan.id}.md`);
    const newPath = path9.join(this.getPlanDir("completed"), `${plan.id}.md`);
    await this.fs.ensureDir(this.getPlanDir("completed"));
    if (this.fs.exists(oldPath)) {
      await this.fs.deleteFile(oldPath);
    }
    await this.fs.writeFile(newPath, this.formatPlanMarkdown(plan));
    return plan;
  }
  async blockPlan(id, reason) {
    return this.updatePlan(id, { status: "blocked", abandonReason: reason });
  }
  async abandonPlan(id, reason) {
    return this.updatePlan(id, { status: "abandoned", abandonReason: reason });
  }
  async listPlans() {
    const result = {
      active: [],
      blocked: [],
      completed: [],
      abandoned: []
    };
    const statuses = [
      "active",
      "blocked",
      "completed",
      "abandoned"
    ];
    for (const status of statuses) {
      const dir = this.getPlanDir(status);
      const files = await this.fs.listFiles(dir, ".md");
      for (const file of files) {
        const id = path9.basename(file, ".md");
        const raw = await this.fs.readFile(file);
        const plan = this.parsePlanMarkdown(raw, id, status);
        if (plan) result[status].push(plan);
      }
    }
    return result;
  }
  savePlanFile(plan) {
    const dir = this.getPlanDir(plan.status);
    const filePath = path9.join(dir, `${plan.id}.md`);
    const content = this.formatPlanMarkdown(plan);
    return this.fs.writeFile(filePath, content);
  }
  formatPlanMarkdown(p) {
    const frontmatter = {
      id: p.id,
      title: p.title,
      status: p.status,
      goal: p.goal,
      currentStep: p.currentStep,
      nextStep: p.nextStep,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      completedAt: p.completedAt,
      abandonReason: p.abandonReason
    };
    const stepsText = p.steps.map((s) => {
      const check = s.status === "completed" ? "[x]" : s.status === "in_progress" ? "[/]" : "[ ]";
      let line = `- ${check} ${s.description}`;
      if (s.commits && s.commits.length > 0) {
        line += `
  - Commits: ${s.commits.join(", ")}`;
      }
      if (s.files && s.files.length > 0) {
        line += `
  - Files: ${s.files.join(", ")}`;
      }
      return line;
    }).join("\n");
    const criteriaText = p.acceptanceCriteria.map((c) => `- [${c.satisfied ? "x" : " "}] ${c.description}`).join("\n");
    const body = `# Plan: ${p.title}

Status: ${p.status.toUpperCase()}

## Goal
${p.goal}

## Scope
${MarkdownHelper.formatBulletList(p.scope)}

## Plan Steps
${stepsText || "No steps specified."}

## Constraints
${MarkdownHelper.formatBulletList(p.constraints)}

## Acceptance Criteria
${criteriaText || "No criteria defined."}

## Current Step
${p.currentStep || "None"}

## Next Step
${p.nextStep || "None"}

${p.abandonReason ? `## Reason
${p.abandonReason}
` : ""}
`;
    return MarkdownHelper.stringify(body, frontmatter);
  }
  parsePlanMarkdown(raw, fallbackId, fallbackStatus) {
    const parsed = MarkdownHelper.parse(raw);
    const sections = MarkdownHelper.extractSections(parsed.content);
    const title = parsed.data.title || fallbackId;
    const goal = parsed.data.goal || sections.get("Goal") || "";
    const status = parsed.data.status || fallbackStatus;
    const stepsRaw = sections.get("Plan Steps") || "";
    const steps = [];
    const stepLines = stepsRaw.split("\n");
    let currentStepItem = null;
    for (const line of stepLines) {
      const match = line.match(/^-\s*\[([ x/])\]\s*(.+)$/);
      if (match) {
        if (currentStepItem) steps.push(currentStepItem);
        const check = match[1];
        const stepStatus = check === "x" ? "completed" : check === "/" ? "in_progress" : "pending";
        currentStepItem = {
          id: `step-${steps.length + 1}`,
          description: match[2].trim(),
          status: stepStatus,
          commits: [],
          files: []
        };
      } else if (currentStepItem && line.trim().startsWith("- Commits:")) {
        currentStepItem.commits = line.replace(/.*- Commits:\s*/, "").split(",").map((c) => c.trim());
      } else if (currentStepItem && line.trim().startsWith("- Files:")) {
        currentStepItem.files = line.replace(/.*- Files:\s*/, "").split(",").map((f) => f.trim());
      }
    }
    if (currentStepItem) steps.push(currentStepItem);
    const criteriaRaw = sections.get("Acceptance Criteria") || "";
    const criteria = [];
    for (const line of criteriaRaw.split("\n")) {
      const match = line.match(/^-\s*\[([ x])\]\s*(.+)$/);
      if (match) {
        criteria.push({
          id: `crit-${criteria.length + 1}`,
          description: match[2].trim(),
          satisfied: match[1] === "x"
        });
      }
    }
    return {
      id: parsed.data.id || fallbackId,
      title,
      status,
      goal,
      scope: MarkdownHelper.parseBulletList(sections.get("Scope") || ""),
      steps,
      constraints: MarkdownHelper.parseBulletList(sections.get("Constraints") || ""),
      dependencies: MarkdownHelper.parseBulletList(sections.get("Dependencies") || ""),
      acceptanceCriteria: criteria,
      currentStep: parsed.data.currentStep || sections.get("Current Step"),
      nextStep: parsed.data.nextStep || sections.get("Next Step"),
      createdAt: parsed.data.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: parsed.data.updatedAt || (/* @__PURE__ */ new Date()).toISOString(),
      completedAt: parsed.data.completedAt,
      abandonReason: parsed.data.abandonReason || sections.get("Reason")
    };
  }
};

// src/core/context/context-ranker.ts
var ContextRanker = class {
  rank(candidates) {
    const items = [];
    const taskTitle = candidates.task?.title || "Active Work";
    const taskWords = new Set(taskTitle.toLowerCase().split(/\s+/).filter((w) => w.length > 2));
    const targetFiles = new Set(candidates.currentFiles.map((f) => f.toLowerCase()));
    if (candidates.plan) {
      const p = candidates.plan;
      let planScore = 0.85;
      const reasons = ["Active architectural plan"];
      const stepText = p.steps.map((s) => `[${s.status}] ${s.description}`).join("; ");
      items.push({
        id: `plan-${p.id}`,
        source: "plan",
        title: `Plan: ${p.title} (${p.status.toUpperCase()})`,
        summary: `Goal: ${p.goal} | Current Step: ${p.currentStep || "None"}`,
        content: `Goal: ${p.goal}
Steps: ${stepText}
Constraints: ${p.constraints.join(", ")}`,
        files: p.steps.flatMap((s) => s.files),
        commits: p.steps.flatMap((s) => s.commits),
        score: planScore,
        tier: "HIGH",
        reasons
      });
    }
    for (const commit of candidates.recentCommits) {
      let score = 0.15;
      const reasons = [];
      if (commit.filesChanged) {
        const touchesTarget = commit.filesChanged.some((f) => targetFiles.has(f.toLowerCase()));
        if (touchesTarget) {
          score += 0.4;
          reasons.push("Touches currently active files");
        }
      }
      const msgWords = commit.message.toLowerCase().split(/\s+/);
      const overlap = msgWords.filter((w) => taskWords.has(w)).length;
      if (overlap > 0) {
        score += Math.min(0.35, overlap * 0.15);
        reasons.push(`Commit message matches task (${overlap} keywords)`);
      }
      score += 0.1;
      const tier = score >= 0.5 ? "HIGH" : score >= 0.25 ? "MEDIUM" : "FILTERED";
      items.push({
        id: `commit-${commit.shortHash}`,
        source: "git",
        title: `Commit ${commit.shortHash}: ${commit.message}`,
        summary: `${commit.author} on ${commit.date}`,
        content: commit.message,
        files: commit.filesChanged || [],
        commits: [commit.shortHash],
        date: commit.date,
        score,
        tier,
        reasons
      });
    }
    for (const decision of candidates.decisions) {
      let score = 0.2;
      const reasons = [];
      const decisionWords = (decision.title + " " + decision.decision + " " + decision.why).toLowerCase().split(/\s+/);
      const overlap = decisionWords.filter((w) => taskWords.has(w)).length;
      if (overlap > 0) {
        score += Math.min(0.5, overlap * 0.2);
        reasons.push(`ADR aligns with task keywords (${overlap})`);
      }
      const touchesFile = Array.from(targetFiles).some(
        (f) => decision.decision.toLowerCase().includes(f) || decision.why.toLowerCase().includes(f)
      );
      if (touchesFile) {
        score += 0.35;
        reasons.push("Decision references active file");
      }
      const tier = score >= 0.5 ? "HIGH" : score >= 0.25 ? "MEDIUM" : "FILTERED";
      items.push({
        id: `adr-${decision.id}`,
        source: "decision",
        title: `${decision.id}: ${decision.title}`,
        summary: decision.decision,
        content: `Decision: ${decision.decision}
Why: ${decision.why}`,
        files: [],
        commits: [],
        date: decision.date,
        score,
        tier,
        reasons
      });
    }
    for (const failure of candidates.failures) {
      let score = 0.3;
      const reasons = ["Failed approach lesson"];
      const failureWords = (failure.title + " " + failure.attempt + " " + failure.why).toLowerCase().split(/\s+/);
      const overlap = failureWords.filter((w) => taskWords.has(w)).length;
      if (overlap > 0) {
        score += 0.35;
        reasons.push("Directly related to active task context");
      }
      const touchesFile = failure.relatedFiles.some((rf) => targetFiles.has(rf.toLowerCase()));
      if (touchesFile) {
        score += 0.3;
        reasons.push("Touches current files");
      }
      const tier = score >= 0.5 ? "HIGH" : score >= 0.25 ? "MEDIUM" : "FILTERED";
      items.push({
        id: `failure-${failure.id}`,
        source: "failure",
        title: `DO NOT REPEAT: ${failure.title}`,
        summary: `${failure.doNotRepeat} -> ${failure.betterApproach}`,
        content: `Attempt: ${failure.attempt}
Why: ${failure.why}
Do Not Repeat: ${failure.doNotRepeat}
Better Approach: ${failure.betterApproach}`,
        files: failure.relatedFiles,
        commits: [],
        date: failure.date,
        score,
        tier,
        reasons
      });
    }
    for (const session of candidates.sessions) {
      let score = 0.1;
      const reasons = [];
      const sessionWords = (session.objective + " " + session.workCompleted.join(" ")).toLowerCase().split(/\s+/);
      const overlap = sessionWords.filter((w) => taskWords.has(w)).length;
      if (overlap > 0) {
        score += Math.min(0.4, overlap * 0.15);
        reasons.push("Session completed work related to task");
      }
      const touchesFile = session.filesChanged.some((fc) => targetFiles.has(fc.toLowerCase()));
      if (touchesFile) {
        score += 0.35;
        reasons.push("Session modified current files");
      }
      const tier = score >= 0.5 ? "HIGH" : score >= 0.25 ? "MEDIUM" : "FILTERED";
      items.push({
        id: `sess-${session.id}`,
        source: "session",
        title: `Session: ${session.objective}`,
        summary: `Agent: ${session.agent} (${session.date})`,
        content: `Work: ${session.workCompleted.join("; ")}
Next: ${session.nextStep || "None"}`,
        files: session.filesChanged,
        commits: session.gitCommit ? [session.gitCommit] : [],
        date: session.date,
        score,
        tier,
        reasons
      });
    }
    items.sort((a, b) => b.score - a.score);
    const highPriority = items.filter((i) => i.tier === "HIGH");
    const mediumPriority = items.filter((i) => i.tier === "MEDIUM");
    const allContent = [...highPriority, ...mediumPriority].map((i) => i.content).join(" ");
    const tokenEstimate = Math.ceil(allContent.length / 4);
    return {
      task: taskTitle,
      branch: candidates.branch,
      commit: candidates.headCommit,
      highPriority,
      mediumPriority,
      totalScore: items.reduce((acc, i) => acc + i.score, 0),
      tokenEstimate
    };
  }
  formatPrompt(ranked, uncommittedDiff) {
    const lines = [
      "# CONTINUITY CONTEXT PACKAGE",
      `Task: ${ranked.task}`,
      `Branch: ${ranked.branch}${ranked.commit ? ` (${ranked.commit})` : ""}`,
      "\n## HIGH PRIORITY CONTEXT"
    ];
    for (const item of ranked.highPriority) {
      lines.push(`
### [${item.source.toUpperCase()}] ${item.title}`);
      lines.push(item.content);
      if (item.files.length > 0) lines.push(`Relevant Files: ${item.files.join(", ")}`);
    }
    if (ranked.mediumPriority.length > 0) {
      lines.push("\n## MEDIUM PRIORITY CONTEXT (HISTORICAL)");
      for (const item of ranked.mediumPriority.slice(0, 5)) {
        lines.push(`
- **[${item.source.toUpperCase()}] ${item.title}**: ${item.summary}`);
      }
    }
    if (uncommittedDiff) {
      lines.push("\n## CURRENT UNCOMMITTED CHANGES");
      lines.push(uncommittedDiff);
    }
    return lines.join("\n");
  }
};

// src/core/verify/verification-engine.ts
import { execFile as execFile2 } from "child_process";
import { promisify as promisify2 } from "util";
var execFileAsync2 = promisify2(execFile2);
var VerificationEngine = class {
  constructor(planManager, git, fs2) {
    this.planManager = planManager;
    this.git = git;
    this.fs = fs2;
  }
  planManager;
  git;
  fs;
  async verify(planId, runTests = false) {
    const checks = [];
    const plan = planId ? await this.planManager.getPlan(planId) : await this.planManager.getActivePlan();
    let stepsTotal = 0;
    let stepsCompleted = 0;
    let criteriaTotal = 0;
    let criteriaSatisfied = 0;
    if (plan) {
      stepsTotal = plan.steps.length;
      stepsCompleted = plan.steps.filter((s) => s.status === "completed").length;
      criteriaTotal = plan.acceptanceCriteria.length;
      criteriaSatisfied = plan.acceptanceCriteria.filter((c) => c.satisfied).length;
      checks.push({
        name: "Plan Steps Progress",
        passed: stepsCompleted === stepsTotal,
        message: `${stepsCompleted}/${stepsTotal} planned steps completed`,
        warning: stepsCompleted < stepsTotal
      });
      checks.push({
        name: "Acceptance Criteria",
        passed: criteriaSatisfied === criteriaTotal,
        message: `${criteriaSatisfied}/${criteriaTotal} criteria satisfied`,
        warning: criteriaSatisfied < criteriaTotal
      });
    } else {
      checks.push({
        name: "Active Plan",
        passed: false,
        message: 'No active plan found. Run "continuity plan create" to establish a plan.',
        warning: true
      });
    }
    const gitStatus = await this.git.getStatus();
    const uncommittedFilesCount = gitStatus.modifiedFiles.length + gitStatus.stagedFiles.length;
    checks.push({
      name: "Working Tree State",
      passed: uncommittedFilesCount === 0,
      message: uncommittedFilesCount === 0 ? "Working tree is clean" : `${uncommittedFilesCount} uncommitted file(s) detected`,
      warning: uncommittedFilesCount > 0
    });
    let testsPassed;
    let testOutput;
    if (runTests) {
      const pkgPath = this.fs.resolve("package.json");
      if (this.fs.exists(pkgPath)) {
        try {
          const pkg = JSON.parse(await this.fs.readFile(pkgPath));
          if (pkg.scripts && pkg.scripts.test) {
            try {
              const { stdout } = await execFileAsync2("npm", ["test"], { cwd: this.fs.rootDir });
              testsPassed = true;
              testOutput = stdout.slice(-300);
            } catch (err) {
              testsPassed = false;
              testOutput = (err.stdout || err.message || "").slice(-300);
            }
            checks.push({
              name: "Automated Test Suite",
              passed: testsPassed === true,
              message: testsPassed ? "All automated tests passed" : "Test suite failed execution"
            });
          }
        } catch {
        }
      }
    }
    let status = "IN_PROGRESS";
    let nextRecommendedAction = "";
    if (plan && plan.status === "blocked") {
      status = "BLOCKED";
      nextRecommendedAction = `Resolve blocker: ${plan.abandonReason || "external dependency"}`;
    } else if (plan && stepsCompleted === stepsTotal && criteriaSatisfied === criteriaTotal && (testsPassed === void 0 || testsPassed === true)) {
      status = "READY_FOR_HANDOVER";
      nextRecommendedAction = uncommittedFilesCount > 0 ? 'Commit remaining changes and run "continuity handover"' : 'Run "continuity handover" to package completed work';
    } else {
      status = "IN_PROGRESS";
      const pendingStep = plan?.steps.find((s) => s.status !== "completed");
      nextRecommendedAction = pendingStep ? `Work on step: ${pendingStep.description}` : "Continue implementation of active task";
    }
    return {
      plan,
      status,
      stepsTotal,
      stepsCompleted,
      criteriaTotal,
      criteriaSatisfied,
      uncommittedFilesCount,
      testsPassed,
      testOutput,
      checks,
      nextRecommendedAction
    };
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
export {
  AcceptanceCriterionSchema,
  CLAUDE_CODE_SNIPPET,
  CLINE_RULES_SNIPPET,
  CURSOR_RULES_MDC,
  ContextRanker,
  ContinuityConfigSchema,
  ContinuityStateSchema,
  DEFAULT_ARCHITECTURE_MD,
  DEFAULT_CONFIG_YML,
  DEFAULT_CONTINUITY_MD,
  DEFAULT_INDEX_MD,
  DEFAULT_PROJECT_MD,
  DEFAULT_ROADMAP_MD,
  DEFAULT_STATE_MD,
  DecisionManager,
  DecisionSchema,
  DoctorEngine,
  ExplainEngine,
  FailureManager,
  FailureSchema,
  FileSystem,
  GitClient,
  HandoverManager,
  HandoverSchema,
  MarkdownHelper,
  NextActionSchema,
  PlanManager,
  PlanSchema,
  PlanStatusSchema,
  PlanStepSchema,
  ProjectInfoSchema,
  ResumeEngine,
  SQLiteIndexer,
  SecretRedactor,
  SessionManager,
  SessionSummarySchema,
  StateManager,
  TaskItemSchema,
  TaskManager,
  TaskStatusSchema,
  UNIVERSAL_SKILL_MD,
  VerificationEngine,
  WINDSURF_RULES_SNIPPET
};
//# sourceMappingURL=index.js.map