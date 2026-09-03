# Architecture: continuity

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
