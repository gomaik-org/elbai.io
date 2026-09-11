# Cloudflare Edge // Architektur & Übersicht

Das ELBI-Web-Ökosystem setzt auf eine dezentrale, serverlose Edge-Architektur auf Basis von Cloudflare.

---

## Komponenten im Überblick

| Komponente | Rolle & Funktion | Domain / Scope |
|---|---|---|
| **Cloudflare Pages** | Hosting statischer Builds (Astro Zero-JS SSG, MkDocs) | `dev.elbi.de`, `elbai.io` |
| **Cloudflare Workers** | Edge-API, Checkout, Sessions, D1-Anbindung | `api.elbi.de` / Serverless Functions |
| **Cloudflare D1** | Georeplizierte SQLite-Datenbank am Edge | `elbi-store-eu` |
| **Cloudflare R2** | S3-kompatibler Objektspeicher für Produktbilder & Medien | Zero-Egress Media Store |
| **Cloudflare Zero Trust** | Identitätsbasierte Zugriffskontrolle (Access Policies) | `/docs*`, Staging |

---

## Edge Caching & Purge-Invariante

Jedes Deployment invalidiert den globalen Cache über die Cloudflare API (`purge_everything: true`), um sicherzustellen, dass Besucher stets die neuesten Assets erhalten.  
Für Entwicklungs- und Staging-Umgebungen (`dev.elbi.de/*`) greift eine Page Rule mit `Cache Level: Bypass`.
