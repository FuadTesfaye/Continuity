---
id: ADR-001
title: Canonical Markdown with SQLite FTS5 Local Cache
status: accepted
date: '2026-09-03'
author: developer
---
# ADR-001: Canonical Markdown with SQLite FTS5 Local Cache

## Decision
All work-state and knowledge are stored in Git-tracked Markdown. SQLite FTS5 is used exclusively as a throwaway local cache index.

## Why
Portability, human readability, Git versioning, and instant full-text search.

## Alternatives
- Cloud Vector DB
- Local DuckDB
- Pure JSON files

## Rejected Because
Vector DBs require cloud accounts; DuckDB is overkill for context docs; pure JSON lacks markdown readability.

## Date
2026-09-03
