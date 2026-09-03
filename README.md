# Continuity 🔄

> **Persistent project-context and work-state system for multi-agent and human AI collaboration.**

[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Continuity is **not** an opaque cloud database or proprietary AI memory.  
It is a **portable, machine-readable and human-readable source of truth about the work**, built on **Markdown + Git + Filesystem**, indexed with **SQLite FTS5**, and universally compatible with **any** AI agent or human developer.

---

## 💡 The Core Idea

Imagine this workflow:

1. **Today with Claude Code:**
   You say *"Implement refresh-token rotation"*. Claude works for two hours, changes multiple files, attempts a rollback approach that fails, and sets up token invalidation.
2. **Tomorrow with Cursor, Windsurf, or Antigravity:**
   You open your editor and say:
   ```bash
   /continuity resume
   ```
   Instead of asking *"What were we doing?"*, the AI immediately understands:
   > *"Authentication is 80% complete. Access token generation works. Refresh token rotation is unfinished. The last implementation attempt failed because the token replacement was not atomic. Continue from `src/auth/refresh.ts` by wrapping invalidation and creation in a database transaction."*

---

## 🏛️ Architecture & Conceptual Layers

```
                     ┌─────────────────────────────────────────┐
                     │ Any AI Agent (Claude, Cursor, Gemini,   │
                     │ OpenAI, Windsurf, Cline, OpenCode, etc) │
                     └────────────────────┬────────────────────┘
                                          │
                         ┌────────────────┴────────────────┐
                         │ CONTINUITY.md + Universal Skill │
                         └────────────────┬────────────────┘
                                          │
                            ┌─────────────▼────────────┐
                            │   Continuity Engine/CLI  │
                            └─────────────┬────────────┘
                                          │
           ┌───────────────────┬──────────┴───────────┬───────────────────┐
           ▼                   ▼                      ▼                   ▼
        Layer 1             Layer 2                Layer 3             Layer 4
         State             Knowledge               History            Retrieval
      (state.md,          (project.md,           (sessions/,         (SQLite FTS5
       tasks/)          architecture.md,          failures/,          + Context
                          decisions/)            handovers/)           Engine)
           │                   │                      │                   │
           └───────────────────┴──────────┬───────────┴───────────────────┘
                                          ▼
                                Git + Filesystem
                          (Portable & Provider-Agnostic)
```

### The 4 Layers of Continuity
1. **Layer 1 — State (Where are we right now?):**
   - `.continuity/state.md` — The canonical single source of truth for current branch, active task, progress %, blockers, and the structured **Next Action**.
   - `.continuity/tasks/` — Task lifecycle folders (`active/`, `completed/`, `blocked/`).
2. **Layer 2 — Knowledge (What does the project know?):**
   - `.continuity/project.md` — Project mission, purpose, database, and infrastructure.
   - `.continuity/architecture.md` — Architectural blueprint, components, invariants, and boundaries.
   - `.continuity/decisions/` — Lightweight Architecture Decision Records (ADRs).
3. **Layer 3 — History (What happened and what failed?):**
   - `.continuity/sessions/` — Structured session summaries (`summaries/YYYY/MM/DD/`) and raw logs (`raw/`).
   - `.continuity/failures/` — Documented failed attempts with **"Do Not Repeat"** lessons.
   - `.continuity/handovers/` — Actionable handover packages optimized for continuation.
   - `.continuity/snapshots/` — Point-in-time state checkpoints.
4. **Layer 4 — Retrieval (What context is needed right now?):**
   - Zero-compilation **SQLite FTS5** local index cache (`.continuity/cache/index.db`).
   - Sub-millisecond full-text and semantic keyword searches.

---

## 🚀 Quickstart

### 1. Installation
Install globally or run via your package manager:
```bash
npm install -g continuity
# or
pnpm add -g continuity
```

### 2. Initialize in Any Project
Run `continuity init` at the root of your project:
```bash
continuity init --with-agents
```
This creates:
- `CONTINUITY.md` at root for universal AI discovery.
- The `.continuity/` hierarchy (`project.md`, `state.md`, `architecture.md`, `tasks/`, `decisions/`, `failures/`, etc.).
- `skills/continuity/SKILL.md` (Universal Agent Skill).
- Pre-configured adapter rules for **Cursor** (`.cursor/rules/continuity.mdc`), **Claude Code** (`CLAUDE.md`), **Windsurf** (`.windsurfrules`), and **Cline** (`.clinerules`).

---

## 🛠️ Complete CLI Command Suite

| Command | Description |
|---|---|
| `continuity init` | Scaffolds `.continuity/` work-state hierarchy and root `CONTINUITY.md` protocol |
| `continuity status` | Shows machine & human-readable state: task, branch, progress %, next action |
| `continuity resume` | Compiles prioritized, token-efficient context for continuation |
| `continuity handover` | Formulates an actionable continuation package and updates state |
| `continuity task` | Manage task lifecycle: `start`, `update`, `complete`, `block`, `list` |
| `continuity decision` | Record or view Architecture Decision Records (ADRs) |
| `continuity log <msg>` | Shortcut to permanently log an architectural decision |
| `continuity failure` | Record failed approaches with **"Do Not Repeat"** lessons |
| `continuity session` | Record session summaries (`save`) and review historical logs (`list`) |
| `continuity context <query>` | Answers historical questions (e.g. *"why did we choose RabbitMQ?"*) |
| `continuity explain <file>` | Deep file provenance: purpose, introduced date, ADRs, known bugs |
| `continuity search <query>` | Fast full-text search across all markdown files via SQLite FTS5 |
| `continuity checkpoint` | Capture a point-in-time snapshot of the current working state |
| `continuity restore-context` | Restore project work-state from a historical checkpoint |
| `continuity doctor` | Health check: validates state, tasks, git health, and scans for secrets |
| `continuity done` | Finalize session, record summary, and generate handover in one command |
| `continuity export` | Bundle complete continuity knowledge into a single Markdown or JSON file |

---

## 🤖 Multi-AI Agent Compatibility

Continuity is designed from the ground up to be **AI-provider agnostic**:

```
Claude Code ────┐
Cursor ─────────┤
Windsurf ───────┼──> CONTINUITY.md + .continuity/ ──> Source of Truth
Cline / Roo ────┤
Antigravity ────┤
OpenCode ───────┘
```

### 1. Root Protocol: `CONTINUITY.md`
Any agent instructed to inspect the repository automatically reads `CONTINUITY.md`. It provides standard guidelines:
- **On start:** Run `continuity resume`, inspect `state.md`, check `failures/`.
- **While working:** Respect ADRs in `decisions/`, update task progress.
- **On completion:** Run `continuity handover` or `continuity done` with a concrete Next Action.

### 2. Universal Agent Skill
Found in `skills/continuity/SKILL.md`. Supported out-of-the-box by Antigravity, Claude Code, Cline, and any tool supporting agent skills.

### 3. Native IDE & Agent Adapters
- **Cursor:** Automatically recognized rules in `.cursor/rules/continuity.mdc`.
- **Claude Code:** Integrated protocol instructions in `CLAUDE.md`.
- **Windsurf:** Rules recognized in `.windsurfrules`.
- **Cline / Roo-Code:** Instructions recognized in `.clinerules`.

---

## 🔒 Security & Secret Redaction

Continuity never commits sensitive data into sessions or handovers.
The built-in `SecretRedactor` scans all inputs, diffs, and transcripts for:
- OpenAI, Anthropic, Google/Firebase, and AWS API keys
- GitHub tokens and Bearer authorization tokens
- Private keys and RSA blocks
- Generic password / secret assignments in key-value format
- Blacklisted files (`.env`, `.env.*`, `*.pem`, `*.key`, `id_rsa`)

Any matching credential is automatically masked as `[REDACTED:<TYPE>]` before touching disk.
Run `continuity doctor` anytime to audit your project for leaked credentials.

---

## 🧪 Testing & Reliability

The test suite provides 100% pass rates across unit and integration tests:
```bash
pnpm test
```
Tests cover:
- Real Git repository inspection and branch detection
- Secret detection and redaction regex precision
- Markdown frontmatter serialization with zero `undefined` dumping errors
- SQLite FTS5 document indexing and BM25 ranking
- Task lifecycle transitions and state synchronization
- End-to-end multi-agent handovers and resume compilations

---

## 📜 Core Design Principles

1. **Never make the AI remember something that the project can remember for it.**
2. **Every completed task must leave the project in a state where a different AI can continue without asking the previous AI what happened.**
3. **Continuity optimizes for continuation, not passive documentation.**

---

## 📄 License

MIT © 2026
