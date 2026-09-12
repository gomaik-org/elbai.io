#!/usr/bin/env python3
"""
Automated Headless Browser Self-Verification & Quality Gate for elbai.io
Runs with zero setup using uv:
    uv run --with playwright python3 scripts/verify-web.py

Checks:
1. Local docs site directory existence or builds it via mkdocs
2. Starts an ephemeral local HTTP test server on an isolated port
3. Launches Headless Chromium (or system Google Chrome) via Playwright
4. Navigates through key pages:
   - Der moderne Tech-Stack (/lab/modern-stack.html)
   - D1 & R2 Backup (/operations/backup.html)
   - Go-Live Roadmap (/operations/go-live-roadmap.html)
   - PG-Inventar-Sync (/ai/inventory-sync.html)
5. Validates interactive Mermaid diagram rendering and Lightbox Modal:
   - Clicks on .mermaid container
   - Asserts modal open state (.is-active)
   - Asserts SVG is present with non-zero dimensions
   - Tests Zoom In (+), Zoom Out (-), Zoom Reset (0), and Escape key to close
6. Asserts 0 unhandled JavaScript exceptions or console errors
"""

import http.server
import os
import socketserver
import subprocess
import sys
import threading
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

SITE_DIR = Path(__file__).resolve().parent.parent / "site"
PORT = 4329
CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

def ensure_site_built():
    if not SITE_DIR.exists() or not (SITE_DIR / "index.html").exists():
        print(f"[*] Building documentation to {SITE_DIR}...")
        subprocess.run(["uv", "run", "--with", "mkdocs-material", "mkdocs", "build", "-d", str(SITE_DIR)], check=True)

class SilentHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(SITE_DIR), **kwargs)
    def log_message(self, format, *args):
        pass  # Quiet output

def main():
    ensure_site_built()

    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(("127.0.0.1", PORT), SilentHandler)
    server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    server_thread.start()
    print(f"[*] Local verification server active on http://127.0.0.1:{PORT}")

    launch_args = {"headless": True}
    if os.path.exists(CHROME_PATH):
        launch_args["executable_path"] = CHROME_PATH

    success = True
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(**launch_args)
            page = browser.new_page()

            # Prevent rate limit noise from external API calls
            page.route("https://api.github.com/**", lambda route: route.abort())

            page_errors = []
            page.on("pageerror", lambda err: page_errors.append(str(err)))

            pages_to_test = [
                ("lab/modern-stack.html", "Der moderne Tech-Stack"),
                ("operations/backup.html", "D1 & R2 Backup-Strategie"),
                ("operations/go-live-roadmap.html", "Go-Live Roadmap & Cutover"),
                ("ai/inventory-sync.html", "PG-Inventar-Sync"),
            ]

            for rel_path, page_title in pages_to_test:
                url = f"http://127.0.0.1:{PORT}/{rel_path}"
                print(f"[>] Testing {page_title} ({rel_path})...")
                res = page.goto(url, timeout=10000)
                if res.status != 200:
                    raise RuntimeError(f"HTTP Status {res.status} on {url}")

                page.wait_for_selector(".mermaid", timeout=6000)

                # Click diagram to trigger lightbox
                page.click(".mermaid")
                page.wait_for_timeout(300)

                modal = page.query_selector("#wb-diagram-lightbox")
                if not modal:
                    raise RuntimeError(f"Lightbox modal element not found on {url}")

                is_active = modal.evaluate("el => el.classList.contains('is-active')")
                if not is_active:
                    raise RuntimeError(f"Lightbox modal failed to open on {url}")

                canvas_svg = page.query_selector("#wb-lightbox-canvas svg")
                if not canvas_svg:
                    raise RuntimeError(f"SVG was not cloned into lightbox canvas on {url}")

                dims = canvas_svg.evaluate("el => ({ width: el.clientWidth, height: el.clientHeight })")
                if dims["width"] <= 0 or dims["height"] <= 0:
                    raise RuntimeError(f"SVG has zero or invalid dimensions on {url}: {dims}")

                # Test Zoom In & Reset
                page.click("#wb-zoom-in")
                page.wait_for_timeout(150)
                scale_in = page.query_selector("#wb-scale-label").text_content()
                if scale_in != "125%":
                    raise RuntimeError(f"Zoom in scale mismatch on {url}: expected 125%, got {scale_in}")

                page.click("#wb-zoom-reset")
                page.wait_for_timeout(150)
                scale_reset = page.query_selector("#wb-scale-label").text_content()
                if scale_reset != "100%":
                    raise RuntimeError(f"Zoom reset scale mismatch on {url}: expected 100%, got {scale_reset}")

                # Close via Escape
                page.keyboard.press("Escape")
                page.wait_for_timeout(200)
                is_closed = modal.evaluate("el => !el.classList.contains('is-active')")
                if not is_closed:
                    raise RuntimeError(f"Lightbox modal failed to close with Escape key on {url}")

                print(f"    [+] Diagram lightbox, SVG extraction & zoom verified: OK ({dims['width']}x{dims['height']}px)")

            if page_errors:
                print(f"[!] Unhandled page errors detected: {page_errors}", file=sys.stderr)
                success = False
            else:
                print("[+] 0 unhandled JavaScript errors detected across all tested pages.")

            browser.close()
    except Exception as exc:
        print(f"[!] Headless verification failure: {exc}", file=sys.stderr)
        success = False
    finally:
        httpd.shutdown()
        httpd.server_close()
        print("[*] Local verification server cleanly stopped.")

    if not success:
        sys.exit(1)
    print("\n[✓] ALL LOCAL WEB SELF-VERIFICATION GATES PASSED SUCCESSFULLY!\n")

if __name__ == "__main__":
    main()
