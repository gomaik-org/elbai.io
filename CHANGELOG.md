# Changelog — ELBI Ecosystem & elbAI.io

All notable technical changes, architectural decisions, and milestones across the **ELBI** and **elbAI.io** ecosystem are documented here.  
This project adheres to [Semantic Versioning](https://semver.org/) and follows [Conventional Commits](https://www.conventionalcommits.org/).

---

## [0.1.0] — 2026-09-11

### 🚀 elbAI.io Edge Foundation & Workstation
- **feat(landing):** Launched interactive SVG Cyberdeck Workstation inspired by `emaik.io` with 3-monitor CRT architecture, animated mechanical arms, pulsating neural core, and live handwriting curve.
- **feat(docs):** Initialized living documentation engine using **MkDocs for Material** under `elbai.io/docs` with Mermaid diagrams, code highlighting, and structured pillars.
- **sec(cloudflare):** Audited and hardened Cloudflare Zone `elbai.io` via `cloudflare-optimiser` (Health Score jumped from **28/100 Grade F** to **89/100 Grade B**):
  - Enforced TLS 1.2+ minimum, Strict SSL, HSTS Preload (`max-age=31536000`), Bot Fight Mode, and Early Hints.
  - Published defensive email authentication: Null-SPF (`v=spf1 -all`) and strict DMARC Reject (`p=reject; sp=reject; aspf=s; adkim=s;`).
- **feat(skills):** Imported modular framework skills from `wiz-blitz` into `.agents/skills/` (`astro-cloudflare`, `edge-webmaster`, `feature-lifecycle`, `git-manager`, `threat-modeling`, `wiz-graphql`).

---

## [0.0.3] — 2026-09-11 (`elbi.de`)

### 📦 Automated PG-Verlag Inventory Synchronization
- **feat(inventory):** Built automated daily cron job ([`.github/workflows/inventory-sync.yml`](file:///Users/binary/Documents/code/websites/elbi.de/.github/workflows/inventory-sync.yml)) syncing live warehouse inventory from PG-Verlag to Cloudflare D1 (`elbi-store-eu`).
- **feat(inventory):** Engineered 6-stage fail-safe validation gates in [`scripts/sync-pg-inventory.py`](file:///Users/binary/Documents/code/websites/elbi.de/scripts/sync-pg-inventory.py):
  1. HTML Table structural integrity check
  2. Minimum item count gate (>= 40 items)
  3. Anchor SKU presence check (`H10`, `H12`, `H2`, `H3`, `H4`, `H5`, `S88`)
  4. Catalog match rate threshold (>= 90%)
  5. Zero-stock blackout circuit breaker (aborts if > 20% reporting zero)
  6. Sudden stock drop guard (aborts if total inventory drops > 50% overnight)
- **feat(catalog):** Added responsive red/green real-time stock availability indicators to product cards and PDPs.
- **docs:** Released comprehensive `docs/bugfix-v3.md` with daily 03:00 AM UTC reset notices and unredacted Cloudflare security audit report.

---

## [0.0.2] — 2026-09-10 (`elbi.de`)

### 🛒 Storefront Polish & Admin Operations
- **feat(admin):** Implemented interactive product ordering, sort index persistence in D1 SQLite, and inline stock management.
- **feat(seo):** Added Google BreadcrumbList and structured JSON-LD schemas.
- **feat(compliance):** German e-commerce compliance verification (§ 356a BGB, § 312j BGB Button-Lösung, PAngV pricing, GPSR safety disclosures, BFSG accessibility).
- **feat(infra):** Enforced autonomous Cloudflare Pages deployment to `dev.elbi.de` with automated global cache purge (`purge_everything: true`).

---

## [0.0.1] — 2026-09-09 (`elbi.de`)

### 🏗️ Monolith to Cloudflare Edge Architecture Overhaul
- **feat(storefront):** Migrated from legacy PHP monolith to **Astro 7+ Zero-JS SSG** + **React 19 Islands** + **Tailwind CSS v4**.
- **feat(edge):** Cloudflare Pages Functions + Cloudflare D1 SQLite database + Cloudflare R2 media bucket.
- **feat(ci):** End-to-end automated testing with Vitest (167 tests total: 80 storefront + 87 edge worker tests).
