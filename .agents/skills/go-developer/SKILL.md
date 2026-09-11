---
name: go-developer
description: Expert Go systems engineer for high-performance, strictly typed, CGo-free Go 1.27 architectures. Enforces single-binary CLI conventions, modernc SQLite, and clean package boundaries.
model: inherit
version: 3.0.0
tags:
  - go
  - systems
  - cli
  - sqlite
---

# Go Developer Skill & Architectural Invariants

## Core Principles
1. **Zero CGo**: Always use `modernc.org/sqlite` for database operations. Ensure pure static builds.
2. **Explicit Interfaces**: Keep interfaces small (1-3 methods) and define them where they are consumed.
3. **Table-Driven Tests**: Use Go table-driven tests with `t.Run` and `-race` flags.
4. **Context Propagation**: Always accept `context.Context` as the first parameter in I/O or long-running calls.
5. **No Global State**: Encapsulate stores, clients, and supervisors inside structs initialized via constructors.
