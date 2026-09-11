---
name: edge-webmaster
description: Edge security headers optimization, live HTTP header rating (A+ to F), Cloudflare Pages header rules, and web security posture auditing.
model: pro
thinking-mode: enabled
thinking-budget: 4096
temperature: 0.1
version: 3.0.0
tags:
  - webmaster
  - security-headers
  - hsts
  - csp
  - rating
  - cloudflare
  - edge
---

# Edge Webmaster & HTTP Security Headers Skill

## 0. Model Selection & Guidelines
- **Primary Model:** `gemini-3.8-pro` (`pro`) for Content Security Policy (CSP) synthesis, Nonce/Hash evaluation, and edge worker routing.
- **Secondary Model:** `gemini-3.8-flash` (`flash`) for rapid header inspection, rating score checks, and CLI probing.
- **Temperature:** `0.1` (strict syntax, valid HTTP header directives).

---

## 1. Authoritative Edge Security Headers Baseline (Target Grade: A+)

To achieve an **A+** security rating (score >= 90) on modern evaluation benchmarks, edge properties MUST return all 6 critical response headers:

| Header | Minimum Required Directive | Recommended Production Value | Score Impact |
| :--- | :--- | :--- | :--- |
| **Strict-Transport-Security** (HSTS) | `max-age=31536000` | `max-age=31536000; includeSubDomains; preload` | +25 pts |
| **Content-Security-Policy** (CSP) | Valid directive set | `default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none';` | +25 pts |
| **X-Content-Type-Options** | `nosniff` | `nosniff` | +15 pts |
| **X-Frame-Options** | `DENY` or `SAMEORIGIN` | `DENY` | +15 pts |
| **Referrer-Policy** | `strict-origin-when-cross-origin` | `strict-origin-when-cross-origin` | +10 pts |
| **Permissions-Policy** | Restricts camera/mic/geo | `camera=(), microphone=(), geolocation=(), payment=()` | +10 pts |

### Grading Thresholds:
- **A+ (>= 90):** All 6 headers present and strictly configured with HTTPS enforceability.
- **A (80 - 89):** Major headers present; minor non-critical warnings.
- **B (70 - 79):** Missing 1-2 headers (e.g. Permissions-Policy or Referrer-Policy).
- **C (50 - 69):** Missing CSP or HSTS misconfigured.
- **D (30 - 49):** Missing both CSP and HSTS.
- **F (< 30):** Insecure transport or no security headers.

---

## 2. Header Injection via Cloudflare Pages `_headers`

For Cloudflare Pages, inject response headers via `public/_headers`:

```http
/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none';
```

---

## 3. Auditing via Native MCP Server
Use the standalone Go `mcp-cloudflare` server (`cf_audit_dns`) or probe public endpoints using `curl -IL https://<domain>`.
