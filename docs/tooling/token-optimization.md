# Token-Optimierung & Developer Toolchain (Wiz-Blitz Standard)

Architektur und Setup der Token-Reduktions-Toolchain zur Vermeidung von Context Depletion und Pricing Cliffs bei KI-Coding-Agenten.

---

## 1. Das Problem: Context Window Depletion & Pricing Cliffs

Autonome KI-Agenten, Subagents und automatisierte Workflows verbrauchen enorme Context-Mengen. Unkomprimierte Terminalausgaben, Diffs und vollständige Dateidumps führen zu:
1. **Pricing Cliffs:** Verdoppelung der API-Tokenpreise ab Überschreiten der Schwellenwerte.
2. **"Lost in the Middle"-Phänomen:** Relevante Instruktionen gehen in langen Logs unter.
3. **Latenz-Spitzen:** 15s+ Rundenzeiten statt sub-sekündlichen Antworten.

---

## 2. Die Toolchain-Komponenten

Wiz-Blitz und elbAI nutzen ein Set aus performanten Rust-, Go- und Python-Werkzeugen, die Terminal-Outputs und Repositories um **60% bis 90%** komprimieren:

| Tool | Sprache | Zweck |
|---|---|---|
| **`rtk`** | Rust | Token-Killer CLI: Komprimiert Git Diffs, Logs und Code-Snippets |
| **`repomix`** | Node/TS | Packt Repositories intelligent mit AST-Strukturierung |
| **`ast-grep`** | Rust | Syntax-Tree basierte Suche und Refactorings |
| **`fd` / `rg`** | Rust | Schnelle, speicherschonende Datei- und Textsuche |
| **`files-to-prompt`** | Python | Chirurgische Token-Extraktion für Prompt-Contexts |

---

## 3. Installation

```bash
brew install rtk repomix ast-grep fd bat fzf tree-sitter-cli code2prompt jq ripgrep
uv tool install files-to-prompt
```
