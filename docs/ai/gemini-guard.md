# Gemini Sentinel Guard (Autonomous GitHub Security & Triage)

Der **Gemini Sentinel Guard** agiert als autonomer Sicherheits- und Fehlerbehebungs-Agent direkt in den GitHub Workflows.

---

## Funktionsweise

- **Trigger:** Reagiert auf fehlgeschlagene CI/CD-Workflows (`workflow_run: failure`) oder Sicherheitswarnungen (`wizscan[bot]`).
- **Analyse:** Extrahiert Logs, SARIF-Dateien und Fehlermeldungen und analysiert diese via Gemini API.
- **Remediation:** Erstellt selbstständig eine Ursachenanalyse, kommentiert auf Issues/PRs und schlägt konkrete Fixes vor bzw. öffnet autonome Pull Requests.
