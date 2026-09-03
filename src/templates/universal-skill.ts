export const UNIVERSAL_SKILL_MD = `---
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

export const CURSOR_RULES_MDC = `---
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

export const CLAUDE_CODE_SNIPPET = `# Continuity Protocol (Claude Code)

This repository uses the Continuity work-state system.
Before working on any task:
1. Run \`continuity resume\` to load current project state, active task, and the exact next action.
2. Respect existing Architecture Decision Records in \`.continuity/decisions/\`.
3. Check \`.continuity/failures/\` to avoid previously failed approaches.
4. When finished or handing over, run \`continuity handover\` and save session with \`continuity session save\`.
`;

export const WINDSURF_RULES_SNIPPET = `# Continuity Rules for Windsurf
- On task start: Run \`continuity resume\` and follow Next Action.
- Do not repeat approaches documented in \`.continuity/failures/\`.
- On completion: Run \`continuity handover\`.
`;

export const CLINE_RULES_SNIPPET = `# Continuity Protocol for Cline / Roo-Code
Always check \`.continuity/state.md\` before beginning.
Resume context using \`continuity resume\`.
Record failed attempts into \`.continuity/failures/\`.
Generate handover on completion using \`continuity handover\`.
`;
