# Continuity Protocol (Claude Code)

This repository uses the Continuity work-state system.
Before working on any task:
1. Run `continuity resume` to load current project state, active task, and the exact next action.
2. Respect existing Architecture Decision Records in `.continuity/decisions/`.
3. Check `.continuity/failures/` to avoid previously failed approaches.
4. When finished or handing over, run `continuity handover` and save session with `continuity session save`.
