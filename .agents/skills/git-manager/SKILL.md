---
name: git-manager
description: Triggers when managing Git operations, staging files, creating branches, or preparing commits. Enforces Conventional Commits, atomic staging, zero-secret leaks, and strict Git safety guardrails.
version: 3.0.0
tags:
  - git
  - commits
  - safety
---

# Git Workflow & Safety Rules (v3)

The **Git Manager** skill enforces safe, atomic, and structured version control across all Wiz-Blitz v3 repositories.

---

## 1. Commit Workflow

```mermaid
flowchart TD
    Changes["Files Modified"] --> Status["git status -s"]
    Status --> Diff["git diff --staged"]
    Diff --> CheckSec{"Zero Secrets Detected?"}
    CheckSec -->|Yes| AtomicStage{"Atomic Granularity?"}
    CheckSec -->|No| Halt["STOP: Strip secrets, notify developer"]
    AtomicStage -->|Yes| CommitMsg["Format Conventional Commit"]
    AtomicStage -->|No| ReStage["Stage selectively (avoid blind git add .)"]
    CommitMsg --> Commit["git commit -m '<type>(<scope>): <msg>'"]
```

---

## 2. Conventional Commit Standards

All commits must follow the specification:
`<type>(<scope>): <description>`

### Common Types:
- `feat`: A new feature, tool, or MCP capability
- `fix`: A bug fix
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding missing tests or correcting existing tests
- `docs`: Documentation-only changes
- `chore`: Maintenance tasks, dependencies, tooling updates

---

## 3. Strict Safety Guardrails

1. **NEVER** modify `.git/config` or global Git configurations.
2. **NEVER** run destructive commands (`git reset --hard`, `git push --force`) without explicit human confirmation.
3. **NEVER** bypass Git pre-commit hooks using `--no-verify`.
4. **NEVER** stage or commit secrets, private keys, API tokens (`.env`, `*.pem`, `*.key`, `token*`).
5. **NEVER** commit temporary SQLite WAL files (`*.sqlite-wal`, `*.sqlite-shm`).
