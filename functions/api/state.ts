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
      "SELECT id, author, summary, created_at FROM snapshots ORDER BY created_at DESC LIMIT 20"
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
      const { snapshot_id } = body;
      if (!snapshot_id) {
        return new Response(JSON.stringify({ error: "snapshot_id required" }), { status: 400 });
      }

      const snap = await env.DB.prepare(
        "SELECT state_json, summary FROM snapshots WHERE id = ?"
      ).bind(snapshot_id).first<{ state_json: string; summary: string }>();

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
      const { prompt, current_state } = body;
      if (!prompt) {
        return new Response(JSON.stringify({ error: "Prompt erforderlich" }), { status: 400 });
      }

      // Fetch active state
      const stateRow = await env.DB.prepare(
        "SELECT content_json FROM site_state WHERE id = 'active_config'"
      ).first<{ content_json: string }>();
      
      const activeState = stateRow ? JSON.parse(stateRow.content_json) : (current_state || {});

      // Apply simple, intuitive natural language interpretations or direct keys
      const p = prompt.toLowerCase();
      const newState = { ...activeState };
      let changeSummary = "";

      if (p.includes("titel") || p.includes("überschrift") || p.includes("headline")) {
        const match = prompt.match(/(?:zu|in|auf)\s*["„']?([^"„']+)["„']?$/i) || prompt.match(/:\s*["„']?([^"„']+)["„']?$/i);
        const newTitle = match ? match[1].trim() : prompt.replace(/.*(?:titel|überschrift|headline)\s*(?:zu|auf|in)?\s*/i, "").trim();
        newState.hero_title = newTitle || "ELBI – Freude am Lernen & Lehren";
        changeSummary = `Haupttitel geändert: "${newState.hero_title}"`;
      } else if (p.includes("untertitel") || p.includes("subtitle")) {
        const match = prompt.match(/(?:zu|in|auf)\s*["„']?([^"„']+)["„']?$/i) || prompt.match(/:\s*["„']?([^"„']+)["„']?$/i);
        const newSub = match ? match[1].trim() : prompt.replace(/.*(?:untertitel|subtitle)\s*(?:zu|auf|in)?\s*/i, "").trim();
        newState.hero_subtitle = newSub || "Modernste Lehr- und Lernmittel für Schulen, Kitas und Therapeuten.";
        changeSummary = `Untertitel angepasst: "${newState.hero_subtitle}"`;
      } else if (p.includes("badge") || p.includes("hinweis") || p.includes("banner")) {
        const match = prompt.match(/(?:zu|in|auf)\s*["„']?([^"„']+)["„']?$/i) || prompt.match(/:\s*["„']?([^"„']+)["„']?$/i);
        const newBadge = match ? match[1].trim() : prompt.replace(/.*(?:badge|banner|hinweis)\s*(?:zu|auf|in)?\s*/i, "").trim();
        newState.notice_banner = newBadge || "✨ Jetzt neu: Schulen & Behörden bestellen bequem auf Rechnung.";
        changeSummary = `Banner aktualisiert: "${newState.notice_banner}"`;
      } else {
        // General text update: update hero_subtitle with prompt
        newState.hero_subtitle = prompt;
        changeSummary = `Text auf der Startseite aktualisiert: "${prompt}"`;
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
