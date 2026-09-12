# elbai.io Cloudflare Edge Hardening & Security

Die Domain `elbai.io` wurde vor dem Launch mit dem `cloudflare-optimiser` auditiert und umfassend gehärtet.

---

## Audit-Vergleich (Vorher vs. Nachher)

| Dimension | Vorher (Standard) | Nachher (Gehärtet) | Status |
|---|---|---|---|
| **Gesamt-Gesundheits-Score** | **28/100 (Grade F)** | **89/100 (Grade B)** | 🚀 **+61 Punkte Steigerung** |
| 🔒 **SSL/TLS & Verschlüsselung** | 55/100 | **100/100** | ✔ Perfekt |
| ⚡ **Performance & Edge Protocols** | 98/100 | **100/100** | ✔ Perfekt |
| 🌐 **DNS Hygiene & Perimeter** | 100/100 | **100/100** | ✔ Perfekt |
| ✉️ **Email Security & Spoofing Defense** | 65/100 | **98/100** | ✔ Perfekt |
| 🛡️ **Web Security & WAF** | 88/100 | **88/100** | ✔ Bot-Schutz aktiv |

---

## Sicherheitsmaßnahmen

- **Minimum TLS Version:** Von veraltetem TLS 1.0 auf **TLS 1.2** angehoben; **TLS 1.3** und **HTTP/3** sind aktiv forciert.
- **SSL-Modus:** Auf **Full (Strict)** gesetzt (kryptografische Validierung der Origin-Zertifikate).
- **HSTS:** Aktiviert mit 1 Jahr Laufzeit (`max-age=31536000`), `include_subdomains=true`, `preload=true` und `nosniff=true`.
- **Edge Security Level & Browser Check:** Security Level auf `High` gesetzt, Browser Integrity Check (`browser_check: on`) aktiv zur Abwehr von Botnetzen und Headless Scannern.
- **Zero Trust Access Guardrail:**
  - `https://elbai.io` (Root): Öffentlich ohne Authentifizierung für Besucher und Tester erreichbar.
  - `https://alpha.elbai.io` & `https://elbai.io/docs/`: Vollständig durch Cloudflare Zero Trust Access (Einmal-PIN via E-Mail OTP für autorisierte Teammitglieder) geschützt.
- **Defensive Email Authentication:**
  - Null-SPF: `TXT elbai.io` ➔ `"v=spf1 -all"`
  - DMARC Reject: `TXT _dmarc.elbai.io` ➔ `"v=DMARC1; p=reject; sp=reject; aspf=s; adkim=s;"`
  - Keine E-Mail-Dienste gebunden (reiner Web-Testbetrieb).
