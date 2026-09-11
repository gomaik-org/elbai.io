---
name: feature-lifecycle
description: Master orchestrator skill for end-to-end feature development in Wiz-Blitz v3. Enforces the 6-phase engineering lifecycle (Backlog -> Research -> TDD -> Verification -> Documentation -> Release), single-task discipline, zero-CGo portability, dual-ledger sync, and binary recompilation.
version: 3.0.0
tags:
  - lifecycle
  - release
  - orchestration
  - tdd
  - governance
---

# Feature Engineering Lifecycle & Release Orchestrator (v3)

The **Feature Lifecycle** skill governs disciplined, reproducible, and verifiable engineering workflows across all Wiz-Blitz v3 repositories and scaffolded workspaces.

---

## 1. 6-Phase Lifecycle State Machine

```mermaid
flowchart LR
    P1["1. Backlog"] --> P2["2. Research"]
    P2 --> P3["3. TDD"]
    P3 --> P4["4. Verification"]
    P4 --> P5["5. Documentation"]
    P5 --> P6["6. Release & Sync"]
```

Every feature, bug fix, or architectural enhancement transitions deterministically through these 6 phases:

1. **Backlog**: Capture requirement in SQLite task store (`./bin/blitz backlog add`). Set stage to `backlog`.
2. **Research**: Analyze decoupled boundaries, query indices (`./bin/blitz index search`), evaluate trade-offs. Stage: `research`.
3. **TDD**: Write failing unit or integration tests before implementing production code. Stage: `tdd`.
4. **Verification**: Implement minimum viable solution and verify 100% test pass (`go test -v ./...`). Stage: `verification`.
5. **Documentation**: Update code documentation, update `local/SESSION_MEMORY.md`, and sync markdown (`./bin/blitz sync`). Stage: `documentation`.
6. **Release & Sync**: Recompile binaries to `bin/`, mark task completed in backlog (`./bin/blitz backlog update`), and commit atomically with Conventional Commits. Stage: `release`.

> [!NOTE]
> For complete phase details, consult [6-Phase Engineering Lifecycle](references/lifecycle-phases.md).

---

## 2. Core Operational Invariants

1. **MCP-First Protocol**: Never execute raw `sqlite3` commands against the database. Use `./bin/blitz backlog` or stdio MCP tools (`mcp-backlog`).
2. **Single-Task Discipline**: Exactly **ONE** task in `in_progress` status at any time. Any mid-stream request must be captured as `pending` before switching context.
3. **Zero-CGo Portability**: All packages must build with `CGO_ENABLED=0` using `modernc.org/sqlite`.
4. **Binary Recompilation Invariant**: Whenever core CLI or MCP server code is updated, recompile the respective binary in `bin/` immediately.
5. **Dual-Ledger Synchronization**: Always run `./bin/blitz sync` upon completing or updating a task to ensure `local/backlog.md` mirrors `local/backlog.sqlite`.
6. **Zero-Pollution Scaffolding**: Projects materialized from recipes (`clean-web`, `clean-go`) must remain 100% decoupled and free of unrelated vendor schemas.

> [!IMPORTANT]
> Detailed rules and invariants are maintained in [Release & Engineering Invariants](references/release-invariants.md).

---

## 3. Verification & Validation Checklist

Always execute before concluding a release or feature cycle:

```bash
# 1. Run all unit and integration tests
go test -v ./...

# 2. Recompile updated framework binaries
go build -o bin/blitz ./cmd/blitz
go build -o bin/mcp-backlog ./cmd/mcp-backlog
go build -o bin/mcp-wiz ./cmd/mcp-wiz
go build -o bin/mcp-ollama ./cmd/mcp-ollama
go build -o bin/mcp-cloudflare ./cmd/mcp-cloudflare

# 3. Verify plugin readiness via MCP supervisor
./bin/blitz plugins

# 4. Sync dual-ledger backlog to markdown
./bin/blitz sync

# 5. Review git status and commit atomically
git status -s
git commit -m "<type>(<scope>): <summary>"
```
