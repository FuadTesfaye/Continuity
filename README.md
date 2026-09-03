# Continuity 🔄

> **The persistent project-context and work-state system that lets any AI pick up software work from where another AI or human left it.**

[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-FuadTesfaye%2FContinuity-blue.svg)](https://github.com/FuadTesfaye/Continuity)

Continuity is **not** “AI memory.”  
It is a **portable source of truth about the work**—built on **Markdown + Git + Filesystem**, indexed with **SQLite FTS5 & Relationship Graph**, and universally compatible with **any** AI agent (Claude Code, Cursor, Windsurf, Cline, Gemini, Antigravity, OpenAI) or human engineer.

> **Core Principle**: Never make the AI remember something that the project can remember for it.

---

## 🎬 The Workflow Experience

Imagine this real-world scenario:

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
> *"What were we doing?"*

The AI immediately receives:
```text
================ CONTINUITY RESUME ================

Project: Procurement System
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

## 🏛️ The 6 Context Sources

Instead of relying on a single memory file, Continuity reconstructs project state from **6 independent sources of truth**:

```
                    CONTINUITY v2
                          │
         ┌────────────────┼────────────────┐
         │                │                │
       Code              Git            Sessions
         │                │                │
         │                │                │
       Plans          Decisions         Failures
         │                │                │
         └────────────────┼────────────────┘
                          │
                   Context Ranker
                   (No Token Bloat)
                          │
                          ▼
                       AI Agent
```

| Source | Question Answered | Storage & Tooling |
|---|---|---|
| **1. Code** | *What exists right now?* | Working tree source code |
| **2. Git History** | *How did we get here?* | 4-level Git inspection, pickaxe archaeology (`continuity git`, `continuity history`) |
| **3. Current State** | *Where are we right now?* | `.continuity/state.md`, active task progress % |
| **4. Persistent Plans** | *Where are we supposed to go?* | `.continuity/plans/{active,blocked,completed}/` |
| **5. Sessions** | *What happened during previous work?* | `.continuity/sessions/summaries/` |
| **6. Decisions & Failures** | *Why was it built this way? What failed?* | `.continuity/decisions/` (ADRs), `.continuity/failures/` ("Do Not Repeat") |

---

## 🔍 Git as a First-Class Context Source

Continuity intelligently retrieves repository history across **4 temporal levels** without overwhelming the LLM context window:

```
Task: "Fix payment retry logic"
 │
 ▼
Identify Relevant Files
 │
 ▼
Level 1: Current Git State (branch, commit, uncommitted stats)
 │
 ▼
Level 2: Recent Commits touching active files
 │
 ▼
Level 3: File History (temporal evolution of file over time)
 │
 ▼
Level 4: Change Archaeology (-S pickaxe, -G regex, blame)
```

### Git CLI Demonstrations:

#### Level 1 & 2: Repository Overview (`continuity git`)
```bash
$ continuity git

=== GIT CONTEXT OVERVIEW ===

CURRENT REPOSITORY STATE
------------------------------
Branch          : main
HEAD Commit     : a81d92e - feat: add payment transaction service
Working Tree    : Uncommitted changes present
Diff Stats      : 2 files (+45 / -12)

MODIFIED FILES
------------------------------
  M src/payment/service.ts
  M src/payment/repository.ts

RECENT COMMITS (LEVEL 2)
------------------------------
• `a81d92e` Add payment transaction service (Claude, 2026-09-03)
• `72fa31a` Add payment repository (Claude, 2026-09-03)
• `9bd82f2` Introduce payment module (Fuad, 2026-09-02)
```

#### Level 3 & 4: Temporal Evolution & Pickaxe Archaeology (`continuity history`)
Discovers **when and why** a specific symbol or function was introduced or modified:
```bash
$ continuity history src/payment/service.ts --symbol processPayment

=== ARCHAEOLOGY: SYMBOL "PROCESSPAYMENT" IN SRC/PAYMENT/SERVICE.TS ===
• `a81d92e` (2026-09-03) Move payment validation into service layer [Claude]
• `9bd82f2` (2026-09-02) Initial payment controller logic [Fuad]
```

#### Smart Context Diff (`continuity diff`)
Displays a focused, context-aware diff of the active task's files rather than an overwhelming dump:
```bash
$ continuity diff
```

---

## 📋 Persistent Plans & Lifecycle

Plans belong to the **project**, not the AI. Claude can create a plan, GPT can edit it, Cursor can execute it, and a developer can review it.

```
.continuity/plans/
├── active/         # Currently under execution
├── blocked/        # Halted by external dependency or blocker
├── completed/      # All steps and acceptance criteria satisfied
└── abandoned/      # Canceled with explicit recorded rationale
```

### Plan Commands:
```bash
# Create a new plan with goal, steps, constraints, and criteria:
continuity plan create "Payment Refactor" \
  --goal "Separate payment orchestration from transport concerns" \
  --steps "Extract service,Extract repository,Introduce transaction boundary,Add retry handling" \
  --constraints "Do not change public API,No database migration" \
  --criteria "Payment retry is idempotent,No duplicate payment records,Transactions rollback cleanly"

# List plans by state:
continuity plan list

# Inspect plan steps and criteria checklist:
continuity plan show payment-refactor

# Advance plan steps as work is completed:
continuity plan update payment-refactor --complete-step 1 --satisfy-criterion 1
```

---

## 🔗 The Context Graph

Continuity connects project entities inside a lightweight local SQLite index (`.continuity/cache/index.db`):

```
                 PROJECT
                    │
         ┌──────────┼──────────┐
         │          │          │
       PLAN       MODULE     BRANCH
         │          │          │
       TASK ───── FILE ───── COMMIT
         │          │          │
      SESSION ── DECISION ─ FAILURE
         │
      HANDOVER
```

This enables multi-hop relationship queries:
- *Given a file*, find all related ADRs, tasks, and commits.
- *Given a task*, find all associated commits, sessions, and "Do Not Repeat" lessons.

---

## 🎯 Context Ranker: High Signal, Zero Bloat

Continuity scores each candidate piece of context before assembling the prompt:
$$\text{Relevance} = 0.35 \times \text{FileOverlap} + 0.25 \times \text{TaskSimilarity} + 0.20 \times \text{CommitRelation} + 0.10 \times \text{Recency} + 0.10 \times \text{ExplicitReference}$$

- **HIGH Priority:** Active task, current plan step, modified files, recent commits touching those files, relevant ADRs.
- **MEDIUM Priority:** Previous related sessions, "Do Not Repeat" lessons, uncommitted diff.
- **FILTERED:** Unrelated older sessions and commits.

### Pipe Directly to Any AI:
```bash
# Pipe token-efficient context into Claude Code:
continuity prompt | claude

# Copy ranked prompt to clipboard for Cursor / ChatGPT:
continuity prompt | pbcopy
```

---

## ✅ Automated Plan Verification (`continuity verify`)

Continuity doesn't take an AI's word that a task is done. It evaluates **objective evidence**:
```bash
continuity verify --test
```

```text
=== CONTINUITY PLAN & WORK VERIFICATION ===
✓ Plan Steps Progress: 4/4 planned steps completed
✓ Acceptance Criteria: 3/3 criteria satisfied
✓ Automated Test Suite: All automated tests passed (22/22)
! Working Tree State: 2 uncommitted file(s) detected

VERIFICATION STATUS
------------------------------
Status                 : READY FOR HANDOVER
Next Recommended Action: Commit remaining changes and run "continuity handover"

┌─ Ready for Handover ────────────────────────┐
│ All planned steps and criteria are satisfied. │
│ Run: continuity handover                     │
└──────────────────────────────────────────────┘
```

---

## 🚀 Quickstart & Installation

### 1. Installation
Install globally:
```bash
npm install -g continuity
# or
pnpm add -g continuity
```

### 2. Initialize in Any Project
```bash
cd my-project
continuity init --with-agents
```
This scaffolds:
- `CONTINUITY.md` at root for automatic AI discovery.
- `.continuity/` canonical work-state hierarchy.
- Universal Agent Skill in `skills/continuity/SKILL.md`.
- Adapter rules for **Cursor** (`.cursor/rules/continuity.mdc`), **Claude Code** (`CLAUDE.md`), **Windsurf** (`.windsurfrules`), and **Cline** (`.clinerules`).

---

## 🛠️ Complete CLI Command Reference

Run `continuity --help` or `continuity` anytime for categorized assistance:

```text
======================================================================
  CONTINUITY 🔄 — Portable Project Context & Work-State System
======================================================================

  Reconstructs work from 6 sources of truth:
  Code • Git History • Current State • Persistent Plans • Sessions • ADRs & Failures

USAGE:
  $ continuity <command> [options]

COMMANDS BY CATEGORY:

  🚀 PROJECT SETUP & HEALTH
    init                  Initialize Continuity, protocol, and AI agent adapters
    status                Show current branch, active task, progress %, and next action
    doctor                Validate project health, git state, and scan for leaked secrets

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
    resume                Compile compact 6-source context for any AI agent to continue
    prompt [task]         Generate ranked context payload ready to pipe to any LLM CLI
    verify [planId]       Evaluate plan steps, criteria, git changes, and test suite
    handover              Package current work into an actionable continuation package
    done                  One-step wrapup: record summary and generate handover
```

---

## 🔒 Security & Secret Redaction

Continuity includes an automatic credential and secret scanner:
- Automatically masks keys for **OpenAI**, **Anthropic**, **Google AI**, **AWS**, **GitHub tokens**, and **generic Bearer tokens**.
- Masks private RSA / SSH keys.
- Excludes `.env*`, `*.pem`, and `*.key` files from indexes.
- Scans files during `continuity doctor` to alert before any commit.

---

## 📄 License

MIT © [Fuad Tesfaye](https://github.com/FuadTesfaye)
