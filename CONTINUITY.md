# Continuity Protocol

This project uses the **Continuity** persistent context and work-state system.
Continuity is the portable, machine-readable and human-readable source of truth about the work.

## Before Working (Session Start)
1. Run `continuity resume` (or inspect `.continuity/state.md`).
2. Read `.continuity/project.md` and `.continuity/architecture.md` to understand system boundaries.
3. Inspect Git status: `git status` to check for any uncommitted changes or current branch.
4. Read the **Next Action** recorded in `.continuity/state.md` and continue directly from it.
5. Check `.continuity/failures/` to make sure you do NOT attempt previously failed approaches.

## While Working
- Respect existing architectural decisions recorded in `.continuity/decisions/`.
- If an approach fails, record it with `continuity failure record`.
- If you make a significant architectural or design decision, log it with `continuity decision`.
- Update task progress as you complete checklist items: `continuity task update`.

## After Completing Work (Session End)
1. Run `continuity handover` or `continuity done` to capture:
   - What was completed
   - What remains
   - Files changed
   - Known blockers or bugs
   - Concrete, actionable **Next Action** (file, problem, expected solution, and constraints)
2. Save your session record: `continuity session save`.

Do not make the next AI or developer ask "What were we doing?". Leave the project ready to continue.
