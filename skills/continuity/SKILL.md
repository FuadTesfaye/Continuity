---
name: continuity
description: Read, update, and manage persistent project-context, plans, git history, and work-state using the Continuity system.
---

# Continuity Universal Agent Skill (v2)

You are operating inside a codebase that uses **Continuity** for persistent project-context, architectural plans, git archaeology, and cross-AI work continuation.

Continuity reconstructs project context from **6 sources of truth**:
1. **Code**: What exists right now?
2. **Git History**: How did we get here? (`continuity git`, `continuity history`)
3. **Current State**: Where are we now? (`.continuity/state.md`)
4. **Plans**: Where are we supposed to go? (`.continuity/plans/`)
5. **Sessions**: What happened during previous AI work? (`.continuity/sessions/`)
6. **Decisions & Failures**: Why was it designed this way? (`.continuity/decisions/`, `.continuity/failures/`)

---

## 1. When Resuming Work (Session Start)
Whenever you start a session:
1. Run `continuity resume` in the terminal to inspect the unified continuation package.
2. Check the active plan: `continuity plan list` and `continuity plan show <id>`.
3. Check Git context: `continuity git` (Level 1 state + Level 2 recent commits).
4. If you need historical context on why a file/module exists:
   - File evolution: `continuity history <path>`
   - Symbol archaeology: `continuity history <path> --symbol <symbol>`
5. Review **"Do Not Repeat"** lessons from `.continuity/failures/` to avoid repeating mistakes.
6. Continue directly from the recommended **Current Step** or **Next Action**.

## 2. While Working
- **Follow the Plan**: Work on the current step defined in `.continuity/plans/active/`.
- **Update Steps**: As each step finishes, mark it: `continuity plan update <id> --complete-step <n>`.
- **Architectural decisions**: Respect existing decisions in `.continuity/decisions/`. Record new ones with `continuity decision "<title>"`.
- **Failures & Blockers**: If an approach fails, document it with `continuity failure record` so future agents avoid the dead end.
- **Inspect Context Diff**: Run `continuity diff` to review your uncommitted changes.

## 3. When Concluding Work (Session End / Handover)
Before ending your session:
1. **Verify completeness**:
   ```bash
   continuity verify
   ```
   Check that plan steps and acceptance criteria are satisfied.
2. Commit your code to Git (`git add`, `git commit`).
3. Generate handover:
   ```bash
   continuity handover
   # or
   continuity done --summary "Implemented payment retry logic"
   ```
4. Save session summary: `continuity session save`.
