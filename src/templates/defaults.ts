export const DEFAULT_CONTINUITY_MD = `# Continuity Protocol

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

export const DEFAULT_PROJECT_MD = (projectName: string, description = '', stack: string[] = []) => `# Project

## Name
${projectName}

## Purpose
${description || 'Describe the core mission and purpose of this project.'}

## Stack
${stack.length > 0 ? stack.map((s) => `- ${s}`).join('\n') : '- Node.js\n- TypeScript'}

## Architecture
Modular architecture with clean separation of concerns.

## Database
SQLite / PostgreSQL

## Infrastructure
Docker / Local
`;

export const DEFAULT_STATE_MD = (projectName: string, branch = 'main') => `# Current State

## Project
${projectName}

## Current Branch
${branch}

## Current Task
Project setup & initialization

## Status
Ready — 100%

## Progress
100%

## Completed
✓ Continuity system initialized

## Remaining
□ Define initial feature task

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

export const DEFAULT_ARCHITECTURE_MD = (projectName: string) => `# Architecture: ${projectName}

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

export const DEFAULT_ROADMAP_MD = `# Product & Technical Roadmap

## Phase 1: Core Functionality
- [x] Repository initialization and continuity setup
- [ ] Core feature implementation
- [ ] Automated testing suite

## Phase 2: Refinement & Scale
- [ ] Integration and performance testing
- [ ] Production deployment
`;

export const DEFAULT_INDEX_MD = `# Continuity Index

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

export const DEFAULT_CONFIG_YML = `# Continuity Configuration

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
