# Wiz-Blitz v3 Release & Engineering Invariants

## Invariant 1: MCP-First Operations
Never run raw `sqlite3` CLI commands directly against production databases. Always interact with SQLite state via `./bin/blitz backlog` or dedicated MCP tools over stdio.

## Invariant 2: Single-Task Discipline
Exactly **ONE** task may be in `in_progress` status at any given time. Mid-stream user requests or discovered bugs must be captured in the backlog as `pending` before switching context.

## Invariant 3: Zero-Pollution Scaffolding
Scaffolded projects must never contain monolithic cruft or unneeded schema definitions. Projects created from recipes (such as `clean-web` or `clean-go`) must only contain the fragments, skills, and configuration declared in their recipe.

## Invariant 4: Standalone Binary Recompilation
Whenever core commands (`cmd/blitz`) or MCP servers (`cmd/mcp-*`) are modified or added, their binaries in `bin/` must be recompiled immediately:
```bash
go build -o bin/blitz ./cmd/blitz
go build -o bin/mcp-backlog ./cmd/mcp-backlog
go build -o bin/mcp-wiz ./cmd/mcp-wiz
go build -o bin/mcp-ollama ./cmd/mcp-ollama
go build -o bin/mcp-cloudflare ./cmd/mcp-cloudflare
```

## Invariant 5: Zero-CGo Portability
All Go packages must remain strictly CGo-free (`CGO_ENABLED=0` compatible) across Darwin, Linux, and Windows. Use `modernc.org/sqlite` instead of `mattn/go-sqlite3`.

## Invariant 6: Dual-Ledger Markdown Synchronization
The canonical state of backlog tasks resides in SQLite (`local/backlog.sqlite`), but must always be projected into human-readable markdown (`local/backlog.md`) upon task state transitions using `./bin/blitz sync`.

## Invariant 7: Conventional Commits
All Git commit messages must strictly adhere to Conventional Commits:
`feat(...)`, `fix(...)`, `refactor(...)`, `docs(...)`, `test(...)`, `chore(...)`.
Never commit raw API keys, secrets, or temporary SQLite WAL files.
