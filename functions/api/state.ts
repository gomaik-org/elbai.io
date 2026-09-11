// Cloudflare Pages Function: /api/state
// Handles state retrieval, updates, snapshots and 1-click rollbacks for the testing sandbox

interface Env {
  DB: D1Database;
}

export async function onRequestGet(context: { env: Env; request: Request }) {
  try {
    const { env } = context;
    if (!env.DB) {
      return new Response(JSON.stringify({ error: "D1 database not bound" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const stateRow = await env.DB.prepare(
      "SELECT content_json, updated_at FROM site_state WHERE id = 'active_config'"
    ).first<{ content_json: string; updated_at: string }>();

    const snapshotsResult = await env.DB.prepare(
      "SELECT id, author, summary, created_at FROM snapshots ORDER BY created_at DESC LIMIT 25"
    ).all<{ id: string; author: string; summary: string; created_at: string }>();

    let content = {};
    if (stateRow && stateRow.content_json) {
      try {
        content = JSON.parse(stateRow.content_json);
      } catch (e) {
        content = {};
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        state: content,
        updated_at: stateRow?.updated_at || null,
        snapshots: snapshotsResult.results || []
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate"
        }
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function onRequestPost(context: { env: Env; request: Request }) {
  try {
    const { env, request } = context;
    if (!env.DB) {
      return new Response(JSON.stringify({ error: "D1 database not bound" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Determine user email from Zero Trust headers or fallback
    const userEmail = request.headers.get("cf-access-authenticated-user-email") || "Tester (Gast)";
    const body = await request.json() as any;
    const { action } = body;

    const now = new Date().toISOString();

    if (action === "rollback") {
      const snapshot_id = body.snapshot_id || body.snapshotId;
      if (!snapshot_id) {
        return new Response(JSON.stringify({ error: "snapshot_id erforderlich" }), { status: 400 });
      }

      const snap = await env.DB.prepare(
        "SELECT state_json, summary FROM snapshots WHERE id = ?"
      ).bind(String(snapshot_id)).first<{ state_json: string; summary: string }>();

      if (!snap) {
        return new Response(JSON.stringify({ error: "Snapshot nicht gefunden" }), { status: 404 });
      }

      // Update current state to this snapshot
      await env.DB.prepare(
        "UPDATE site_state SET content_json = ?, updated_at = ? WHERE id = 'active_config'"
      ).bind(snap.state_json, now).run();

      // Record a new snapshot marking the rollback
      const rollbackSnapId = "snap_" + Date.now();
      await env.DB.prepare(
        "INSERT INTO snapshots (id, author, summary, created_at, state_json) VALUES (?, ?, ?, ?, ?)"
      ).bind(
        rollbackSnapId,
        userEmail,
        `⏳ Rollback auf: "${snap.summary}"`,
        now,
        snap.state_json
      ).run();

      return new Response(
        JSON.stringify({
          success: true,
          message: `Erfolgreich zurückgesetzt auf Stand "${snap.summary}"`,
          state: JSON.parse(snap.state_json)
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    if (action === "update") {
      const { prompt, current_state, pathname } = body;
      if (!prompt) {
        return new Response(JSON.stringify({ error: "Prompt erforderlich" }), { status: 400 });
      }

      // Check page context (Home vs. Product Detail Page)
      const isProductPage = pathname && pathname.includes("/products/");
      const productSlugMatch = pathname ? pathname.match(/\/products\/([^\/\?#]+)/) : null;
      const productSlug = productSlugMatch ? productSlugMatch[1] : null;

      // Fetch active state
      const stateRow = await env.DB.prepare(
        "SELECT content_json FROM site_state WHERE id = 'active_config'"
      ).first<{ content_json: string }>();
      
      const activeState = stateRow ? JSON.parse(stateRow.content_json) : (current_state || {});
      const newState = { ...activeState };
      if (!newState.products) newState.products = {};

      const p = prompt.toLowerCase();
      let changeSummary = "";

      // 1. Color / Styling Request
      const colorMatch = prompt.match(/\b(pink|rosa|blau|rot|grün|gelb|lila|orange|schwarz|gold|türkis|violett|cyan)\b/i);
      const isColorChange = p.includes("farbe") || p.includes("färbe") || p.includes("color") || !!colorMatch;

      if (isColorChange && colorMatch) {
        const colorName = colorMatch[1].toLowerCase();
        const colorMap: Record<string, string> = {
          pink: "#ec4899",
          rosa: "#f472b6",
          blau: "#0b57d0",
          rot: "#ef4444",
          grün: "#10b981",
          gelb: "#eab308",
          lila: "#8b5cf6",
          violett: "#8b5cf6",
          orange: "#f97316",
          schwarz: "#0f172a",
          gold: "#d97706",
          türkis: "#06b6d4",
          cyan: "#06b6d4"
        };
        const hex = colorMap[colorName] || "#ec4899";

        if (isProductPage && productSlug) {
          if (!newState.products[productSlug]) newState.products[productSlug] = {};
          newState.products[productSlug].title_color = hex;
          changeSummary = `Farbe des Produkttitels auf ${colorName} geändert (${hex})`;
        } else {
          newState.hero_title_color = hex;
          changeSummary = `Farbe der Startseiten-Überschrift auf ${colorName} geändert (${hex})`;
        }
      } 
      // 2. Banner Request
      else if (p.includes("banner") || p.includes("hinweis") || p.includes("leiste")) {
        const match = prompt.match(/(?:zu|in|auf|mit dem text|lautet)\s*["„']?([^"„']+)["„']?$/i) || prompt.match(/:\s*["„']?([^"„']+)["„']?$/i);
        const newBanner = match ? match[1].trim() : prompt.replace(/.*(?:banner|hinweis|leiste)\s*(?:zu|auf|in|mit dem text)?\s*/i, "").trim();
        newState.banner_text = newBanner || "📢 Jetzt neu: Bequemer Kauf auf Rechnung für Schulen & Lehrkräfte!";
        newState.banner_visible = true;
        changeSummary = `Hinweis-Banner aktiviert: "${newState.banner_text}"`;
      } 
      // 3. Subtitle Request
      else if (p.includes("untertitel") || p.includes("subtitle")) {
        const match = prompt.match(/(?:zu|in|auf|mit dem text|lautet)\s*["„']?([^"„']+)["„']?$/i) || prompt.match(/:\s*["„']?([^"„']+)["„']?$/i);
        const newSub = match ? match[1].trim() : prompt.replace(/.*(?:untertitel|subtitle)\s*(?:zu|auf|in)?\s*/i, "").trim();
        newState.hero_subtitle = newSub || "Praxiserprobte Schreibhefte und Stempel direkt vom Schulbuchverlag.";
        changeSummary = `Untertitel angepasst: "${newState.hero_subtitle}"`;
      } 
      // 4. Headline / Title Request
      else if (p.includes("titel") || p.includes("überschrift") || p.includes("headline")) {
        const match = prompt.match(/(?:zu|in|auf|mit dem text|lautet)\s*["„']?([^"„']+)["„']?$/i) || prompt.match(/:\s*["„']?([^"„']+)["„']?$/i);
        const newTitle = match ? match[1].trim() : prompt.replace(/.*(?:titel|überschrift|headline)\s*(?:zu|auf|in)?\s*/i, "").trim();
        
        if (isProductPage && productSlug) {
          if (!newState.products[productSlug]) newState.products[productSlug] = {};
          newState.products[productSlug].title = newTitle;
          changeSummary = `Produkttitel geändert: "${newTitle}"`;
        } else {
          newState.hero_title = newTitle || "ELBI – Freude am Schreibenlernen";
          changeSummary = `Startseiten-Überschrift geändert: "${newState.hero_title}"`;
        }
      } 
      // 5. General fallback text
      else {
        const cleaned = prompt.replace(/^(ändere|mache|setze|aktualisiere)\s+/i, "");
        if (isProductPage && productSlug) {
          if (!newState.products[productSlug]) newState.products[productSlug] = {};
          newState.products[productSlug].title = cleaned;
          changeSummary = `Produkttitel aktualisiert: "${cleaned}"`;
        } else {
          newState.hero_title = cleaned;
          changeSummary = `Überschrift aktualisiert: "${newState.hero_title}"`;
        }
      }

      const stateJson = JSON.stringify(newState);

      // Save new state
      await env.DB.prepare(
        "UPDATE site_state SET content_json = ?, updated_at = ? WHERE id = 'active_config'"
      ).bind(stateJson, now).run();

      // Create snapshot for rollback
      const newSnapId = "snap_" + Date.now();
      await env.DB.prepare(
        "INSERT INTO snapshots (id, author, summary, created_at, state_json) VALUES (?, ?, ?, ?, ?)"
      ).bind(
        newSnapId,
        userEmail,
        changeSummary,
        now,
        stateJson
      ).run();

      return new Response(
        JSON.stringify({
          success: true,
          message: changeSummary,
          state: newState
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Unbekannte Aktion" }), { status: 400 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
