# Agent Base Guidelines & Guardrails

## Core Execution Invariants
1. **Single-Task Focus**: Execute the immediate task thoroughly. Verify with unit tests before declaring done.
2. **Zero Hallucination / Grounding**: Always inspect existing schemas, files, and outputs rather than assuming APIs.
3. **Decoupled Architecture**: Do not introduce compile-time imports across plugins. Communicate through typed interfaces or MCP JSON-RPC.
4. **Git Hygiene**: Conventional commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`). Never commit unformatted code or failed tests.
5. **No Bloat**: Keep dependencies strictly lean. Reject unneeded multi-cloud or multi-runtime dependencies.
