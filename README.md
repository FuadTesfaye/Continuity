# Continuity 🔄 (v2)

> **Persistent project-context, Git archaeology, architectural plans, and work-state system for multi-agent and human AI collaboration.**

[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-FuadTesfaye%2FContinuity-blue.svg)](https://github.com/FuadTesfaye/Continuity)

Continuity is **not** an opaque cloud database or proprietary AI memory.  
It is a **portable, machine-readable and human-readable source of truth about the work**, built on **Markdown + Git + Filesystem**, indexed with **SQLite FTS5 & Relationship Graph**, and universally compatible with **any** AI agent or human developer.

---

## 💡 The Core Idea

The AI should reconstruct the project from **multiple sources of truth** instead of relying on a single memory file.

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

### The 6 Context Sources:
| Source | Answers | Storage / Tooling |
|---|---|---|
| **Code** | What exists right now? | Working tree source files |
| **Git History** | How did we get here? | Levels 1–4 temporal context, pickaxe archaeology (`continuity git`, `continuity history`) |
| **Current State** | Where are we now? | `.continuity/state.md`, active task progress |
| **Plans** | Where are we supposed to go? | `.continuity/plans/{active,blocked,completed}/`, goals, steps, criteria |
| **Sessions** | What happened during previous AI work? | `.continuity/sessions/summaries/` |
| **Decisions & Failures** | Why was it designed this way? What failed? | `.continuity/decisions/` (ADRs), `.continuity/failures/` ("Do Not Repeat") |

---

## 🏛️ Git as a First-Class Context Source

Continuity does not dump 10,000 commits into LLM context. It structures Git history into **4 intelligent levels**:

- **Level 1 — Current State (`continuity git`):** Branch, HEAD commit, modified files, staged files, uncommitted diff stats (`+3592 / -241`).
- **Level 2 — Recent Relevant History:** Last 5–15 commits touching currently active files or modules with author, date, and commit messages.
- **Level 3 — File Temporal Evolution (`continuity history <file>`):** Chronological history of commits that shaped a specific file over time.
- **Level 4 — Change Archaeology (`continuity history <file> --symbol <name>`):**
  - Pickaxe search (`git log -S "<symbol>"`) — discovers exact commit introducing or modifying a function or class.
  - Regex search (`git log -G "<pattern>"`).
  - Fine-grained line blame (`git blame`).
  - Version boundaries: Tag and release milestones (`continuity history <module>`).

---

## 📋 Persistent Plans & Lifecycle

Plans are **first-class, persistent artifacts** owned by the repository—never by an individual AI vendor.

```
.continuity/plans/
├── active/         # In progress
├── blocked/        # Waiting on external dependencies
├── completed/      # Fully implemented and verified
└── abandoned/      # Canceled with recorded rationale
```

### Example Plan (`.continuity/plans/active/payment-refactor.md`):
```markdown
# Plan: Payment Refactor
Status: ACTIVE

## Goal
Separate payment orchestration from transport concerns.

## Plan Steps
- [x] Extract payment service
  - Commits: a81d92e
  - Files: src/payment/service.ts
- [x] Extract payment repository
  - Commits: 72fa31a
- [/] Introduce transaction boundary
- [ ] Add idempotent retry handling

## Acceptance Criteria
- [x] Payment retry is idempotent
- [ ] No duplicate payment records
- [ ] Transactions rollback cleanly

## Constraints
- Do not change public API
- Maintain existing payment behavior
```

---

## 🔗 The Context Graph

Instead of disconnected Markdown files, Continuity maintains a relationship index in `.continuity/cache/index.db`:

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

---

## 🎯 Context Ranker: High Signal, Zero Bloat

Continuity calculates a relevance score before compiling AI context:
$$\text{Relevance} = 0.35 \times \text{FileOverlap} + 0.25 \times \text{TaskSimilarity} + 0.20 \times \text{CommitRelation} + 0.10 \times \text{Recency} + 0.10 \times \text{ExplicitReference}$$

- **HIGH Priority:** Active task, current plan step, modified files, recent commits touching those files, relevant ADRs.
- **MEDIUM Priority:** Previous related sessions, "Do Not Repeat" lessons, uncommitted diffs.
- **FILTERED:** Unrelated older sessions and commits.

Use `continuity prompt` to pipe this compact payload directly into any AI tool:
```bash
continuity prompt | claude
# or
continuity prompt | pbcopy
```

---

## ✅ Automated Plan Verification (`continuity verify`)

Continuity doesn't trust a simple *"I'm done"*. It verifies evidence:
```bash
continuity verify
```
Reports:
```
=== CONTINUITY PLAN & WORK VERIFICATION ===
✓ Plan Steps Progress: 4/4 planned steps completed
✓ Acceptance Criteria: 3/3 criteria satisfied
✓ Automated Test Suite: All automated tests passed (13/13)
✓ Working Tree State: Working tree is clean

VERIFICATION STATUS
------------------------------
Status                 : READY FOR HANDOVER
Next Recommended Action: Run "continuity handover" to package completed work
```

---

## 🚀 Quickstart

### 1. Installation
```bash
npm install -g continuity
# or
pnpm add -g continuity
```

### 2. Initialize in Any Project
```bash
continuity init --with-agents
```

### 3. Everyday Workflow
1. **Resume Context:**
   ```bash
   continuity resume
   ```
2. **Create or Inspect Plan:**
   ```bash
   continuity plan create "Authentication Refactor" --goal "Implement JWT and refresh rotation" --steps "Middleware,Refresh Tokens,Revocation" --criteria "Tokens expire in 15m,Replay rejected"
   continuity plan list
   ```
3. **Inspect Git Context & Evolution:**
   ```bash
   continuity git
   continuity history src/auth/service.ts --symbol verifyToken
   ```
4. **Log Decisions and Failures:**
   ```bash
   continuity decision "Token Revocation Strategy" --decision "Use Redis denylist" --why "Avoid DB query on each request"
   continuity failure record "In-memory token cache" --why "Fails in multi-replica cluster" --do-not-repeat "No local caching for auth tokens" --better "Use distributed Redis store"
   ```
5. **Verify and Handover:**
   ```bash
   continuity verify --test
   continuity handover --problem "Revocation edge-case" --solution "Add TTL sync" --file "src/auth/redis.ts"
   ```

---

## 🛠️ Complete CLI Command Suite

| Category | Command | Description |
|---|---|---|
| **Project** | `continuity init` | Scaffolds `.continuity/` hierarchy and root `CONTINUITY.md` |
| | `continuity status` | Shows work-state: task, branch, progress %, next action |
| | `continuity doctor` | Health check: state, tasks, git health, secret leak scanner |
| **Work** | `continuity plan create <title>` | Create persistent plan with goal, steps, criteria |
| | `continuity plan list` | Lists `active`, `blocked`, `completed`, `abandoned` plans |
| | `continuity plan show <id>` | Full plan details, steps checklist, criteria |
| | `continuity plan update <id>` | Complete step, satisfy criterion, update status |
| | `continuity verify [id]` | Verifies plan steps, criteria, uncommitted git files, tests |
| | `continuity task start <title>` | Start active task with checklist and files |
| | `continuity task update [id]` | Update progress %, completed/remaining items, blocker |
| | `continuity task complete [id]`| Archive task to `tasks/completed/` |
| | `continuity task list` | List active, completed, and blocked tasks |
| | `continuity checkpoint` | Snapshot point-in-time state and context |
| | `continuity restore-context <id>` | Restore state from historical checkpoint |
| | `continuity handover` | Package continuation state with Next Action |
| | `continuity done` | Finalize session, save summary, and generate handover |
| **Git** | `continuity git` | Inspect Levels 1 & 2: branch, HEAD, modified files, diff stats, recent commits |
| | `continuity history <path>` | Temporal evolution across commits, releases, and tags |
| | `continuity history <p> -s <sym>`| Pickaxe archaeology (`-S`): when was a symbol introduced/modified |
| | `continuity diff [files...]` | Context-aware smart diff of working tree changes |
| **Memory**| `continuity session save` | Record session summary and optional raw archive |
| | `continuity session list` | View chronological session history |
| | `continuity decision [title]` | Record or view Architecture Decision Records (ADRs) |
| | `continuity log <msg>` | Shortcut to permanently log an architectural decision |
| | `continuity failure record` | Record failed approaches with **"Do Not Repeat"** lessons |
| | `continuity failure list` | List all documented failed approaches |
| | `continuity search <query>` | SQLite FTS5 search across all markdown documents |
| | `continuity context <query>` | Answer historical questions from knowledge base |
| | `continuity explain <file>` | File provenance, purpose, related tasks, ADRs |
| | `continuity export` | Export complete project context into Markdown or JSON |
| **AI** | `continuity resume` | 6-source prioritized compact prompt for continuation |
| | `continuity prompt [task]` | Ranked context package ready to pipe to any LLM CLI |

---

## 🤖 Multi-AI Agent Compatibility

```
Claude Code ────┐
Cursor ─────────┤
Windsurf ───────┼──> CONTINUITY.md + .continuity/ ──> Single Source of Truth
Cline / Roo ────┤
Antigravity ────┤
OpenCode ───────┘
```

Continuity works out of the box with:
- **`CONTINUITY.md`**: Root protocol discovered automatically by any LLM.
- **`skills/continuity/SKILL.md`**: Universal Agent Skill instructions.
- **`.cursor/rules/continuity.mdc`**: Cursor native rules.
- **`CLAUDE.md`**: Claude Code native commands and rules.
- **`.windsurfrules`**: Windsurf native instructions.
- **`.clinerules`**: Cline native instructions.

---

## 🔒 Security & Secret Redaction

Continuity includes an automatic redaction engine that masks secrets before writing to disk:
- OpenAI, Anthropic, Google, AWS, GitHub tokens, generic Bearer tokens.
- Private SSH / RSA keys.
- Automatic exclusion of `.env*`, `*.pem`, `*.key` files.

---

## 📄 License

MIT © Fuad Tesfaye
