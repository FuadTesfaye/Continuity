# Continuity Protocol (v2)

This project uses **Continuity**, a persistent project-context and work-state system that lets any AI or human pick up software work from where another left it.

Continuity reconstructs the project from **6 context sources**:
1. **Code**: What exists right now?
2. **Git History**: How did we get here? (recent commits, file evolution, archaeology)
3. **Current State**: Where are we now? (`.continuity/state.md`)
4. **Plans**: Where are we supposed to go? (`.continuity/plans/`)
5. **Sessions**: What happened during previous AI work? (`.continuity/sessions/`)
6. **Decisions & Failures**: Why was it built this way and what must never be repeated? (`.continuity/decisions/`, `.continuity/failures/`)

---

## 1. Before Working (Session Start)
1. Run `continuity resume` to receive the unified 6-source continuation package.
2. Check the active plan: `continuity plan list` or `continuity plan show <id>`.
3. Inspect Git context: `continuity git` (Level 1 state + Level 2 recent commits).
4. For questions about why a file/module exists, run: `continuity history <file>` or `continuity history <file> --symbol <fn>`.
5. Check `.continuity/failures/` to ensure you **DO NOT REPEAT** previously failed approaches.
6. Check `.continuity/decisions/` to adhere to accepted Architecture Decision Records (ADRs).

## 2. While Working
- Work according to the **Current Step** in `.continuity/plans/active/`.
- Update plan steps as they are completed: `continuity plan update <id> --complete-step <n>`.
- Update task progress: `continuity task update --progress <pct>`.
- If an approach fails, document it: `continuity failure record "<title>" --why "..." --do-not-repeat "..." --better "..."`.
- If you make a permanent architectural decision, log it: `continuity decision "<title>" --decision "..." --why "..."`.

## 3. After Completing Work (Session End)
1. Verify work completeness against the active plan and criteria:
   ```bash
   continuity verify
   ```
2. Commit your code changes to Git (`git add`, `git commit`).
3. Package the continuation state with:
   ```bash
   continuity handover
   # or
   continuity done --summary "Completed payment retry refactor"
   ```
4. Record your session summary: `continuity session save`.

**Fundamental Promise**: Every completed task must leave the project in a state where a different AI can continue immediately without asking the previous AI what happened.
