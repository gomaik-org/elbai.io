---
name: local-orchestrator
description: Coordinates multi-agent workflows and task delegation using local Ollama models (Qwen2.5-Coder, Llama 3.2).
model: inherit
version: 3.0.0
tags:
  - ollama
  - multi-agent
  - orchestration
  - local-first
---

# Local Orchestrator Skill

## Multi-Agent Topologies
- **Single Agent Mode**: Direct execution of prompts via specialized personas (`coder`, `reviewer`).
- **Sequential Pipeline**: Chain agents using `ExecutePipeline` where each agent refines or audits the previous output.
- **Offline Invariant**: All inference occurs locally on `http://localhost:11434` without network transit or quota consumption.
