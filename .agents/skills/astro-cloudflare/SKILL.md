---
name: astro-cloudflare
description: Design, build, and test high-performance Astro web applications on Cloudflare Pages with Tailwind CSS v4, Edge Functions, and LLM discoverability.
---

# Astro on Cloudflare Pages Skill (`astro-cloudflare`)

The **Astro on Cloudflare Pages** skill provides architectural guidelines, edge routing patterns, and operational automation for building blazingly fast content-driven websites, web applications, and documentation portals using Astro 7 and Cloudflare Pages.

---

## 1. Core Architecture & Stack Invariants

Astro on Cloudflare Pages combines static site generation with edge serverless execution:

- **Framework**: Modern Astro (v7+) in static (`output: 'static'`) or hybrid SSR mode.
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite` plugin for zero-config build performance.
- **Edge Runtime**: Cloudflare Pages (`pages_build_output_dir = "dist"`).
- **Edge Functions**: Cloudflare Pages `functions/` directory for API endpoints and security middleware (`_middleware.ts`).
- **AI Readiness**: Standardized `llms.txt` endpoint for LLM discoverability.

---

## 2. Configuration Standards

### Astro Configuration (`astro.config.mjs`)

```javascript
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  compressHTML: true,
  devToolbar: { enabled: false },
  vite: {
    plugins: [tailwindcss()],
    build: {
      target: 'es2022',
      minify: 'esbuild',
      cssMinify: 'esbuild',
      assetsInlineLimit: 20480, // Inline assets < 20KB
    },
  },
});
```

### Cloudflare Pages Configuration (`wrangler.toml`)

```toml
name = "my-astro-site"
compatibility_date = "2026-09-08"
pages_build_output_dir = "dist"
```

---

## 3. Security Headers Middleware (`functions/_middleware.ts`)

```typescript
export const onRequest = async (context: any) => {
  const response = await context.next();
  const headers = new Headers(response.headers);

  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};
```

---

## 4. Build & Validation Lifecycle

```bash
npm install                   # Install dependencies
npm run dev                   # Start Astro local dev server
npm run check                 # Type-check templates & TypeScript
npm run test                  # Run unit & component tests (Vitest)
npm run build                 # Build production bundle to dist/
npx wrangler pages dev dist   # Preview with Cloudflare Pages emulation
```
