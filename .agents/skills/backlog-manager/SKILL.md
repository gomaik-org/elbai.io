---
name: backlog-manager
description: Manages task state transitions, milestones, and dual-ledger synchronization between SQLite and local/backlog.md.
model: inherit
version: 3.0.0
tags:
  - backlog
  - tasks
  - dual-ledger
  - sqlite
---

# Backlog Manager Skill

## Invariants
1. **Always Use `bin/blitz backlog` or `bin/mcp-backlog`**: Do not write raw SQL queries directly in agent scripts.
2. **Dual-Ledger Sync**: After updating or creating tasks, run `bin/blitz sync` so `local/backlog.md` is always up to date.
3. **Task Stages**: Keep task lifecycle disciplined: `backlog` ➔ `research` ➔ `tdd` ➔ `verification` ➔ `documentation` ➔ `release` ➔ `completed`.
