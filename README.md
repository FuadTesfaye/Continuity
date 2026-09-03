# Continuity 🔄

> **The persistent project-context and work-state system that lets any AI pick up software work from where another AI or human left it.**

[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-FuadTesfaye%2FContinuity-blue.svg)](https://github.com/FuadTesfaye/Continuity)

Continuity is **not** “AI memory.”  
It is a **portable source of truth about the work**—built on **Markdown + Git + Filesystem**, indexed with **SQLite FTS5 & Relationship Graph**, and universally compatible with **any** AI agent (Claude Code, Cursor, Windsurf, Cline, Gemini, Antigravity, OpenAI) or human engineer.

> **Core Principle**: Never make the AI remember something that the project or machine can remember for it.

---

## 🏛️ The Two-Memory Architecture (v3)

Do not store all continuity data inside every project repository. Continuity separates context into two distinct layers:

```
                       CONTINUITY v3
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
  GLOBAL MEMORY                           PROJECT MEMORY
 (~/.continuity/)                         (.continuity/)
        │                                       │
 ├── profile/ (developer bio, preferences)     ├── project.yml (identity & stack)
 ├── devices/ (OS, CPU, runtimes, editors)     ├── state.md (current truth)
 ├── toolchain/ (runtimes, databases, CLI)     ├── architecture.md (invariants)
 ├── accounts/ (profiles, keychain refs)       ├── plans/ (active, blocked, done)
 ├── projects/ (registry by category)          ├── tasks/ (lifecycle)
 ├── knowledge/ (cross-project technical notes)├── sessions/ (summaries & raw)
 ├── workflows/ (frontend, backend, deploy)    ├── decisions/ (ADRs)
 ├── history/ (tech, lessons, milestones)      ├── failures/ (do not repeat)
 └── index.db (global SQLite FTS index)        ├── handovers/ (next actions)
        │                                      └── cache/ (project index.db)
        │                                       │
        └───────────────────┬───────────────────┘
                            │
                   HIERARCHICAL ENGINE
                 (Defaults -> Overrides)
                            │
                   CLIENT ISOLATION &
                   SCOPED CONTEXT RANKER
                   (--scope task|project|dev)
                            │
                            ▼
                         AI AGENT
```

| Memory Layer | Storage | Responsibilities |
|---|---|---|
| **Global Memory** | `~/.continuity/` | Developer identity, machine specs, global toolchain defaults, account profiles (secure keychain references), cross-project engineering patterns, and local project registry. |
| **Project Memory** | `.continuity/` | Repository-specific source of truth: active plan, current task checklist, Git history, session summaries, ADRs, failures, and handover packages. |

---

## 🎬 The Workflow Experience

### 1. Today with Claude:
You tell Claude: *"Implement authentication with refresh-token rotation."*  
Claude works for two hours across `src/auth/`, `src/middleware/`, and `src/db/`.  
Claude tries an in-memory lock that fails, switches to database transactions, logs an ADR, and updates the persistent plan.  
The session concludes.

### 2. Tomorrow with Cursor or Windsurf:
You open your editor and run:
```bash
continuity resume
```

Instead of asking:
> *"What were we doing? Which Node version? Which package manager?"*

The AI immediately receives:
```text
================ CONTINUITY RESUME ================

Project: Procurement System [Category: CLIENT]
Environment: node 22.x (project) | pnpm (detected)
Branch: feature/auth-refactor (a81d92e)
Current Task: Implement Refresh Token Rotation [65% completed]
Status: In Progress
Active Plan: Authentication Engine [60% completed]
Current Step: Introduce transaction boundary for rotation
Uncommitted Changes: YES (check git status)

--- RECENT GIT COMMITS ---
• a81d92e feat: add token revocation repository (Claude)
• 72fa31a feat: extract jwt validation middleware (Claude)

--- LAST COMPLETED ---
✓ Access token signing with asymmetric keys
✓ Bearer auth middleware in Express router

--- WORK REMAINING ---
□ Transactional refresh-token rotation
□ Redis token revocation blacklist
□ Integration test suite

--- RELEVANT FILES ---
- src/auth/token-service.ts
- src/auth/repository.ts
- src/middleware/auth.ts

--- DO NOT REPEAT (FAILED APPROACHES) ---
! [In-Memory Token Cache]: Never store tokens in local memory -> Use database transactions or Redis to avoid node desync

--- RECOMMENDED NEXT ACTION ---
Open: src/auth/token-service.ts
Focus: rotateRefreshToken()
Problem: Non-atomic token replacement causes race conditions
Expected Solution: Wrap token invalidation and new token issue in a DB transaction
Constraints:
  * Do not change public API contract
  * No DB migrations without lead review

====================================================
```

And the AI immediately continues from the exact line of code without asking a single question.

---

## 💻 Machine Environment & Drift Diagnostics

Never let an AI guess your machine configuration or get surprised by tool upgrades:

```bash
continuity device
```

```text
=== DEVICE ENVIRONMENT: PRIMARY WORKSTATION ===

SYSTEM HARDWARE & OS
------------------------------
Operating System: Fedora Linux 44 (Workstation Edition)
Platform        : linux
Architecture    : x64
Active Shell    : bash
Default Editor  : nvim

DETECTED RUNTIMES
------------------------------
node            : 22.23.1
pnpm            : 10.33.0
npm             : 10.9.8
python          : 3.14.7

INSTALLED TOOLS & SERVICES
------------------------------
git             : 2.55.0
docker          : 29.7.2
postgresql      : 18.4
sqlite          : 3.51.2
```

### Environment Drift Detection (`continuity doctor`):
When you upgrade Node or tools, Continuity detects drift between your stored profile and your live machine:
```text
⚠ Stored Node version was 22.14.0
  Current live version: 22.23.1
  Status: Environment changed. Run "continuity device --sync" to update.
```

---

## ⚙️ Hierarchical Toolchain Resolution

Continuity reconciles tool configurations with clear precedence:
$$\text{Task Override} > \text{Project Config} > \text{Detected in Project} > \text{Global Default}$$

```bash
$ continuity toolchain

=== HIERARCHICAL TOOLCHAIN RESOLUTION ===

EFFECTIVE RUNTIME
------------------------------
Runtime         : node 22.x
Source          : PROJECT configuration (package.json)

PACKAGE MANAGER
------------------------------
Package Manager : pnpm 10.33.0
Source          : DETECTED configuration (pnpm-lock.yaml)

DEVELOPER TOOLS
------------------------------
git             : 2.55.0 (global)
docker          : 29.7.2 (global)
postgresql      : 18.4 (global)
```

---

## 🗂️ Project Registry & Client Isolation

Register and categorize all local projects in `~/.continuity/projects/`:
```bash
# List all registered repositories across your computer:
continuity projects

# Classify a project:
continuity project classify client --client "Acme Corp"
# or
continuity init --type personal
# or
continuity init --type open-source
```

### Supported Categories:
- `personal` — Personal pet projects and experiments
- `client` — Professional client projects (Strict Client Isolation enforced)
- `work` — Company work repositories
- `open-source` — Public open-source libraries
- `learning` — Educational and tutorial codebases
- `experimental` — Spike prototypes and exploratory code
- `archived` — Completed or decommissioned repositories

### 🛡️ Strict Client Isolation Guarantee:
When working inside a `client` project, Continuity guarantees that sessions, ADRs, failures, and account credentials from one client **can never leak** into another client's prompt or context.

---

## 🔐 Secure Credential References (Zero Plaintext Secrets)

Continuity **never** stores raw API keys, passwords, or tokens in Markdown, YAML, or SQLite. Instead, it tracks metadata and secure OS keychain references:

```bash
$ continuity account

=== DEVELOPER ACCOUNT PROFILES (~/.continuity/accounts) ===

GITHUB
------------------------------
  • Profile: personal
    Username: FuadTesfaye
    Status: ✓ Authenticated
    Credential: keychain://github/personal (Secure Keychain Reference)

  • Profile: work
    Username: fuad-enterprise
    Status: ✓ Authenticated
    Credential: keychain://github/work (Secure Keychain Reference)
```

> **AI-Safe Rule**: AI agents only receive sanitized account metadata (`account: personal`, `user: FuadTesfaye`), never secret tokens. Let git, gh, and npm CLIs handle secret retrieval securely.

---

## 🛠️ Environment Bootstrap (`continuity bootstrap`)

Clone a new repository and immediately verify whether your machine is equipped to run it:

```bash
$ continuity bootstrap

=== CONTINUITY ENVIRONMENT BOOTSTRAP ===
Checking requirements for project: procurement-service

TOOLCHAIN STATUS
------------------------------
✓ Node.js                 : 22.23.1
✓ Package Manager (pnpm)  : pnpm 10.33.0
✓ Git                     : 2.55.0
✗ PostgreSQL              : Not found
    ↳ Recommendation: sudo dnf install postgresql

# Generate toolchain configuration on demand:
$ continuity bootstrap --generate mise
$ continuity bootstrap --generate nvm
$ continuity bootstrap --generate tool-versions
```

---

## 📋 Complete CLI Command Reference (v3)

Run `continuity --help` or `continuity` anytime for categorized assistance:

```text
======================================================================
  CONTINUITY 🔄 — Portable Project Context & Work-State System (v3)
======================================================================

  Two-Memory Architecture:
  Global Memory (~/.continuity)   • Developer Profile, Machine Devices, Accounts, Knowledge, Projects
  Project Memory (.continuity)    • State, Plans, Tasks, Git History, Sessions, ADRs, Handover

USAGE:
  $ continuity <command> [options]

COMMANDS BY CATEGORY:

  🌐 GLOBAL DEVELOPER & MACHINE MEMORY (~/.continuity)
    profile               View developer bio & preferences (~/.continuity/profile)
    device [--sync]       Inspect OS, CPU, runtimes, tools, and detect environment drift
    toolchain             Resolve effective toolchain (Global Default -> Project -> Task)
    account               Account profiles & secure keychain references (Zero plain secrets)
    projects              Registry of all local repositories by category (Client, Work, Personal)
    project <cmd>         Register or classify projects in the global registry
    knowledge [category]  Cross-project technical lessons & architectural notes
    bootstrap             Check machine tools against project needs & generate config files

  🚀 PROJECT SETUP & HEALTH
    init [--type <type>]  Initialize Continuity, protocol, and AI agent adapters
    status                Show current branch, active task, progress %, and next action
    doctor                Validate project health, git state, secret leaks, and machine drift

  📋 PLANS & TASKS (LIFECYCLE)
    plan create <title>    Create persistent plan with goals, steps, criteria, constraints
    plan list             List active, blocked, completed, and abandoned plans
    plan show <id>         Show full plan steps checklist and acceptance criteria
    plan update <id>       Advance steps, mark criteria satisfied, or update status
    task start <title>     Start an active task with checklist and target files
    task update [id]       Update task progress, completed items, or blockers
    task complete [id]     Mark active task finished and archive to tasks/completed/
    task list             List active, completed, and blocked tasks

  🔍 GIT CONTEXT & ARCHAEOLOGY
    git                   Inspect branch, HEAD commit, uncommitted stats, and recent commits
    history <path>        Temporal evolution of a file/module across commits and tags
    history <p> -s <sym>  Pickaxe archaeology: find exact commit introducing a symbol
    diff [files...]       Context-aware smart diff of working tree changes

  🧠 KNOWLEDGE, MEMORY & SEARCH
    session save          Record session summary, changes, decisions, and raw transcript
    session list          View historical developer and AI sessions
    decision [title]      Record or list Architecture Decision Records (ADRs)
    log <message>         Quickly append an architectural decision to ADRs
    failure record        Document failed attempts and "Do Not Repeat" lessons
    failure list          Review all recorded failure post-mortems
    context <query>       Ask questions about past decisions, sessions, architecture
    search <query>        Fast full-text search across all markdown files via SQLite FTS5
    explain <file>        Show file provenance, related tasks, ADRs, and commit history
    checkpoint [name]     Snapshot point-in-time state and context
    restore-context <id>  Roll back work-state to a previous checkpoint
    export                Bundle all continuity context into a single Markdown or JSON file

  🤖 AI RESUME, VERIFICATION & HANDOVER
    resume [--scope <s>]  Compile compact 6-source context for any AI agent to continue
    prompt [task]         Generate ranked context payload ready to pipe to any LLM CLI
    verify [planId]       Evaluate plan steps, criteria, git changes, and test suite
    handover              Package current work into an actionable continuation package
    done                  One-step wrapup: record summary and generate handover
```

---

## 🎯 Scoped Resume & Prompt Pipeline

Continuity supports 4 context scopes to prevent prompt bloat:
- `continuity resume --scope task`: Current task checklist and uncommitted changes only.
- `continuity resume --scope project` *(default)*: Project work-state, plan, git history, and effective environment.
- `continuity resume --scope developer`: Includes developer profile and styling preferences.
- `continuity resume --scope global`: Includes cross-project technical knowledge.

### Pipe to LLM CLIs:
```bash
# Pipe directly to Claude Code:
continuity prompt | claude

# Copy to clipboard for Cursor or ChatGPT:
continuity prompt | pbcopy
```

---

## 📄 License

MIT © [Fuad Tesfaye](https://github.com/FuadTesfaye)
