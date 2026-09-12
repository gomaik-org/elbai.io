# 📋 Projekt-Changelog: ELBI & elbAI

Hier dokumentieren wir alle Neuerungen, Fehlerbehebungen, Performance-Optimierungen und Architektur-Entscheidungen für das **ELBI** E-Commerce-Ökosystem ([`elbi.de`](https://elbi.de)) und die Innovationsplattform **elbAI** ([`elbai.io`](https://elbai.io)).

---

## 🚀 Aktuelle Meilensteine (September 2026)

### 1. Qualitätssicherung & Test-Automatisierung (Autonomous Self-Verification)
- **Headless Browser Test-Suite (`scripts/verify-web.py`)**:
  - Implementierung einer vollautomatisierten Playwright-basierten Headless-Browser-Suite für `elbai.io` und `elbi.de`.
  - Überprüft DOM-Rendering, Navigation, interaktive Komponenten (Diagramm-Lightbox, Zoom-Modals, Warenkorb-Drawer) und erzwingt **0 unhandled Console Errors** vor jedem Deployment.
  - Verankerung des Web-Verifikations-Gates in allen relevanten Agenten-Skills (`astro-cloudflare`, `ecommerce-storefront`, `typescript-developer`, `dev-docs`, `doc-standards`).
- **MkDocs Diagramm-Lightbox & Zoom**:
  - Behebung des Anzeige-Fehlers bei vergrößerten Architektur-Diagrammen: MkDocs Material kapselt gerenderte Mermaid-SVGs in einem `closed` Shadow DOM. Ein gezielter Hook in `extra.js` fängt diese nun sauber ab und rendert sie gestochen scharf im responsiven Vollbild-Modal mit Schließen-Funktion (`ESC`, Klick außerhalb, Close-Button).

### 2. CI/CD Stabilität, FinOps & GitHub Actions Härtung
- **20-Minuten-Timeout-Regel & Concurrency-Schutz**:
  - Alle GitHub Workflows in `gomaik-org/elbi.de` und `gomaik-org/elbai.io` wurden mit strikten `timeout-minutes: 20` (auf Job-Ebene) und `concurrency: cancel-in-progress: true` gehärtet, um Runner-Minuten zu schonen und Budgetüberläufe zu verhindern.
- **Node 24 Upgrade & SHA-Pinning**:
  - Vollständige Umstellung auf GitHub Actions mit Node 24 Laufzeit und unveränderlichen SHA-Hashes (`actions/checkout@v7.0.1`, `actions/setup-go@v7.0.0`, `actions/cache@v6.1.0`), um Deprecation-Warnungen vor der Abschaltung von Node 20 auszuschließen.
- **CI-Fix für Container-Dateisysteme**:
  - Korrektur von `TestGetFreeDiskSpaceGB` in `pkg/tokens`: OverlayFS-Mounts in CI-Containern melden teils `0 GB` frei; der Test toleriert nun isolierte Containerumgebungen (`>= 0`).
- **Dashboard-Bereinigung**:
  - Alle historischen, fehlgeschlagenen CI-Läufe wurden via GitHub API bereinigt – das Actions-Dashboard beider Repositories ist zu 100 % grün.

### 3. KI-Copilot, Point-and-Click Inspector & Zeitmaschine (`alpha.elbai.io`)
- **Modulare Entkopplung des KI-Assistenten**:
  - Der AI Copilot wurde als isoliertes, einbettbares Web-Widget (`AlphaSandboxWidget.tsx`) entkoppelt, sodass die Produktions-Storefront (`dev.elbi.de`) schlank und manipulationssicher bleibt.
- **Visueller Point-and-Click Inspector-Modus**:
  - Tester können jedes Seitenelement (Header, Banner, Buttons, Kacheln) anklicken. Das ausgewählte Element wird mit einem pulsierenden bernsteinfarbenen Rahmen hervorgehoben und kann gezielt per Freitextbefehl geändert werden.
- **1-Klick-Reset & Zeitmaschine (Rollback)**:
  - Vollständige Historie aller Änderungen mit Vorher/Nachher-Vergleich und 1-Klick-Wiederherstellung des Ausgangszustands oder eines früheren Snapshots.
- **Authentisches Shop-Design im Alpha-Modus**:
  - Vollständige Nachbildung des offiziellen Elbi-Designs (Lernstufensystem, kreisförmige Warenkorb-Buttons, interaktive Produktdetails, Slide-Over Cart Drawer).

### 4. Edge-Architektur & Zero-Trust Sicherheit
- **Cloudflare Edge Storefront (`dev.elbi.de`)**:
  - Modernste Astro 7+ Zero-JS SSG Architektur mit Sub-50ms TTFB weltweit.
  - Automatisierter Edge-Cache-Purge (`purge_everything: true` für Zone `elbi.de`) nach jedem Storefront-Build, damit Tester stets frische Assets sehen.
- **Zero-Trust Perimeter**:
  - Schutz von internen Werkzeugen und Preview-Staging (`alpha.elbai.io` und geschützte Dokumentationsbereiche) über Cloudflare Zero Trust Access mit E-Mail-Einmalpasswort (OTP).
- **DNS & E-Mail-Hardening**:
  - RFC-konformes Null-SPF (`v=spf1 -all`) und DMARC-Reject (`p=reject; sp=reject; aspf=s`) zur Abwehr von Domain-Spoofing.

### 5. Backend, Datenbank & Bestandsautomatisierung
- **Automatisierter PG-Verlag Inventar-Sync**:
  - Täglicher Cron-Workflow (`inventory-sync.yml`) gleicht die Echtzeit-Lagerbestände aus dem PG-Kundenportal ab und aktualisiert Cloudflare D1.
  - Strikte Vorab-Validierung und Anomalie-Erkennung (Blackout Protection): Verhindert das versehentliche Überschreiben von Beständen bei Portal-Ausfällen oder HTML-Strukturänderungen.
- **Admin-Bereich & Produktkatalog**:
  - Manuelle Sortierung (`sort_order`) und flexible Reihenfolge im Katalog.
  - Inline-Bearbeitung von Beständen, Steuersätzen (7 % Bücher / 19 % Non-Books) und automatische D1-Schema-Migrationen.
  - Schneller Dev-Login mit vorausgefülltem Passwort zur Beschleunigung von manuellen Tests.

---

## 📅 Chronologische Versionshistorie

### Version 0.1.2 — 11.–12. September 2026
- `fix(ci)`: OverlayFS-Kompatibilität für Runner-Disk-Space-Checks in `pkg/tokens`.
- `feat(ci)`: Automatisierte Playwright Headless Browser Testsuite für Astro Storefront und MkDocs Doku.
- `fix(docs)`: Shadow-DOM Hook für Mermaid Diagramm-SVGs zur Behebung des Lightbox-Zoomfehlers.
- `feat(storefront)`: Pluggables AI-Copilot Widget mit Point-and-Click Inspector und Rollback-Zeitmaschine.
- `perf(ci)`: Strikte 20-Minuten-Timeouts und Concurrency-Cancelling für alle GitHub Action Jobs.
- `feat(inventory)`: Täglicher PG-Verlag Bestandsabgleich mit Anomalie- und Blackout-Schutz.
- `docs(onboarding)`: Bereitstellung des vereinfachten Tester-Leitfadens für Redakteure und Versender.

### Version 0.1.1 — 9.–10. September 2026
- `feat(storefront)`: Finalisierung des Markendesigns (Merriweather & Outfit Schriftarten, Elbi-Blau/Orange Farbpalette).
- `feat(catalog)`: 3D-Lernstufen Quick-Jump (Vorschule, 1. Klasse, 2. Klasse, Klasse 2–4).
- `feat(search)`: Optimierung von Kontrast und Elevation der Sofortsuche.
- `feat(ai)`: Integration von Google Cloud Vertex AI (Pay-as-you-go Metering auf GCP Projekt `elbi-webshop`).
- `feat(dx)`: CLI-Erweiterungen (`ai-factory`, High-Velocity Aliase `agy`, `agh`, `agq`).

### Version 0.1.0 — 9. September 2026
- Initiales Fundament der Microservices, Cloudflare D1/R2 Anbindung und automatisierter Wiz-Sicherheitsgates.
