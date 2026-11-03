// Supabase Edge Function for BoardGameGeek Catalog Ingestion
// written for Deno runtime.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { XMLParser } from "https://esm.sh/fast-xml-parser@4.3.4";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_"
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Helper to identify generic Spanish or foreign version titles
 */
function isGenericEditionName(name: string): boolean {
  if (!name) return true;
  const normalized = name.toLowerCase().trim();
  const genericPatterns = [
    /^(spanish|english|french|german|italian|portuguese|polish|russian|dutch|japanese|chinese|korean|multilingual)\s+edition(\s+\d{4})?$/i,
    /^(spanish|english|french|german|italian|portuguese|polish|russian|dutch|japanese|chinese|korean|multilingual)\s+version(\s+\d{4})?$/i,
    /^edici[oó]n\s+en\s+espa[ñn]ol(\s+\d{4})?$/i,
    /^edici[oó]n\s+espa[ñn]ola(\s+\d{4})?$/i,
    /^versió[oó]n\s+en\s+espa[ñn]ol(\s+\d{4})?$/i,
    /^versió[oó]n\s+espa[ñn]ola(\s+\d{4})?$/i,
    /^multilingual\s+edition(\s+\d{4})?$/i,
    /^first\s+edition$/i,
    /^second\s+edition$/i,
    /^third\s+edition$/i,
    /^limited\s+edition$/i,
    /^deluxe\s+edition$/i,
    /^collector's\s+edition$/i,
    /^retail\s+edition$/i,
    /^kickstarter\s+edition$/i,
    /^standard\s+edition$/i
  ];
  return genericPatterns.some(pattern => pattern.test(normalized));
}

async function fetchBggBatch(ids: number[], bggToken?: string): Promise<string> {
  const url = `https://boardgamegeek.com/xmlapi2/thing?id=${ids.join(",")}&versions=1&stats=1`;
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[BGG] Fetching details for IDs: ${ids.join(", ")} (Attempt ${attempt}/${maxRetries})...`);
    
    try {
      const headers: Record<string, string> = {
        "Accept": "application/xml",
        "User-Agent": "LudiClub/1.0 (Contact: admin@example.com)"
      };
      
      if (bggToken) {
        headers["Authorization"] = `Bearer ${bggToken}`;
      }

      const response = await fetch(url, { headers });
      
      if (response.status === 202) {
        console.log("[BGG] Returned 202 (Processing). Retrying in 4 seconds...");
        await sleep(4000);
        continue;
      }
      
      if (!response.ok) {
        throw new Error(`BGG API returned status ${response.status}`);
      }
      
      return await response.text();
    } catch (err: any) {
      console.warn(`[BGG] Attempt ${attempt} failed: ${err.message}`);
      if (attempt === maxRetries) throw err;
      await sleep(2000);
    }
  }
  throw new Error("Failed to fetch from BGG due to retry exhaustion");
}

async function fetchBggCollection(username: string, bggToken?: string): Promise<string> {
  const url = `https://boardgamegeek.com/xmlapi2/collection?username=${encodeURIComponent(username)}&own=1`;
  const maxRetries = 6;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[BGG Collection] Fetching collection for username: "${username}" (Attempt ${attempt}/${maxRetries})...`);
    
    try {
      const headers: Record<string, string> = {
        "Accept": "application/xml",
        "User-Agent": "LudiClub/1.0 (Contact: admin@example.com)"
      };
      
      if (bggToken) {
        headers["Authorization"] = `Bearer ${bggToken}`;
      }

      const response = await fetch(url, { headers });
      
      if (response.status === 202) {
        console.log("[BGG Collection] Returned 202 (Processing). Retrying in 5 seconds...");
        await sleep(5000);
        continue;
      }
      
      if (!response.ok) {
        throw new Error(`BGG API returned status ${response.status}`);
      }
      
      const text = await response.text();
      if (
        text.includes("Please try again later") || 
        text.includes("generating this collection") || 
        text.includes("accepted and will be processed")
      ) {
        console.log("[BGG Collection] Returned 200/202 with queuing/generating message. Retrying in 5 seconds...");
        await sleep(5000);
        continue;
      }
      
      return text;
    } catch (err: any) {
      console.warn(`[BGG Collection] Attempt ${attempt} failed: ${err.message}`);
      if (attempt === maxRetries) throw err;
      await sleep(2000);
    }
  }
  throw new Error("La API de BoardGameGeek está tardando demasiado en procesar tu colección. Por favor, vuelve a intentarlo en unos instantes.");
}

const SPANISH_PUBLISHERS = [
  "tranjis games", "devir", "zacatrus", "ludonova", "gdm games", "gdm",
  "edge entertainment", "asmodee spain", "asmodee ibérica", "asmodee iberica",
  "gen x games", "maldito games", "tcg factory", "arrakis games", "eclipse editorial",
  "doit games", "mont tàber", "mont taber", "brain picnic", "sd games", "dmz games",
  "salt & pepper games", "looping games", "primigenio", "masqueoca", "ediciones masqueoca",
  "ludis hispania", "tiki ediciones", "perro lopo", "drakon ideas", "santiago games",
  "falomir juegos", "cefa toys", "borras", "juegos borras", "diset", "educo", "mercurio",
  "mercurio distribuciones"
];

function sanitizeGameText(text: string | null | undefined): string | null {
  if (!text) return null;
  const cleaned = String(text)
    .replace(/\\+(['"])/g, '$1')
    .replace(/\\+&/g, '&')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&hellip;/g, '…')
    .replace(/&nbsp;/g, ' ')
    .trim();
  return cleaned || null;
}

function getPublisherName(v: any): string | null {
  let links = v.link || [];
  if (!Array.isArray(links)) links = [links];
  const pubLink = links.find((l: any) => l["@_type"] === "boardgamepublisher");
  return pubLink?.["@_value"]?.toLowerCase().trim() || null;
}

function selectBestSpanishVersion(versionItems: any): any | null {
  if (!versionItems) return null;
  const list = Array.isArray(versionItems) ? versionItems : [versionItems];

  const sorted = [...list].sort((a: any, b: any) => {
    const yearA = Number(a.yearpublished?.["@_value"] || 0);
    const yearB = Number(b.yearpublished?.["@_value"] || 0);
    if (yearB !== yearA) {
      return yearB - yearA;
    }

    const pubA = getPublisherName(a);
    const pubB = getPublisherName(b);
    const isPubASpanish = pubA ? SPANISH_PUBLISHERS.some((sp) => pubA.includes(sp)) : false;
    const isPubBSpanish = pubB ? SPANISH_PUBLISHERS.some((sp) => pubB.includes(sp)) : false;

    if (isPubASpanish && !isPubBSpanish) return -1;
    if (!isPubASpanish && isPubBSpanish) return 1;

    return 0;
  });

  return sorted.find((v: any) => {
    let links = v.link;
    if (!links) return false;
    if (!Array.isArray(links)) links = [links];
    return links.some((l: any) => l["@_type"] === "language" && l["@_value"] === "Spanish");
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Initialize Supabase Admin client using internal environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const bggToken = Deno.env.get("BGG_API_KEY");

    if (!supabaseUrl || !supabaseServiceRole) {
      throw new Error("Missing Supabase internal environment variables.");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRole);

    // 2. Validate caller authentication from Authorization header
    const authHeader = request.headers.get("Authorization") || "";
    let callerUser: any = null;

    if (authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, "");
      if (token === supabaseServiceRole) {
        // Internal service role caller
        callerUser = { id: "service-role", role: "service_role" };
      } else if (token) {
        try {
          const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
          if (!authErr && user) {
            callerUser = user;
          }
        } catch (err: any) {
          console.warn("[Auth] Failed to verify caller JWT:", err.message);
        }
      }
    }

    // 3. Parse action and parameters from request body
    let action = null;
    let query = "";
    let bggIds: number[] = [];
    let limit = 10;
    let bggUsername = "";
    let userId = "";

    if (request.method === "POST") {
      try {
        const body = await request.json();
        if (body) {
          action = body.action || null;
          query = body.query || "";
          bggUsername = body.username || "";
          userId = body.userId || "";
          if (Array.isArray(body.bggIds)) {
            bggIds = body.bggIds.map(Number).filter((n) => !isNaN(n));
          } else if (typeof body.bggId === "number") {
            bggIds = [body.bggId];
          }
          if (typeof body.limit === "number") {
            limit = Math.min(Math.max(body.limit, 1), 30); // clamp between 1 and 30
          }
        }
      } catch (err: any) {
        console.warn("Failed to parse POST body JSON:", err.message);
      }
    }

    // Handle Import Collection Action
    if (action === "import-collection") {
      if (!callerUser) {
        return new Response(JSON.stringify({ error: "Unauthorized: You must be logged in to import a collection." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (!bggUsername.trim()) {
        return new Response(JSON.stringify({ error: "Missing username parameter" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Security: Always bind to authenticated caller's ID to prevent IDOR unless service_role
      const targetUserId = (callerUser.role === "service_role" && userId.trim()) ? userId.trim() : callerUser.id;

      console.log(`[BGG Collection] Importing collection for BGG user: "${bggUsername}" to Supabase user: "${targetUserId}"...`);
      
      const xmlText = await fetchBggCollection(bggUsername, bggToken);
      const jsonObj = xmlParser.parse(xmlText);
      
      if (jsonObj.errors?.error?.message) {
        const errorMsg = jsonObj.errors.error.message;
        console.error(`[BGG Collection Error] ${errorMsg}`);
        return new Response(JSON.stringify({ error: `BGG: ${errorMsg}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      let items = jsonObj.items?.item;

      if (!items) {
        console.log(`[BGG Collection] No items found in collection for "${bggUsername}".`);
        return new Response(JSON.stringify({ success: true, imported: 0, message: "La colección de BGG está vacía o no tiene juegos marcados como propios (own=1)." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (!Array.isArray(items)) {
        items = [items];
      }

      console.log(`[BGG Collection] Found ${items.length} items. Processing...`);

      const collectionGames = items.map((item: any) => {
        const bggId = Number(item["@_objectid"]);
        const isExpansion = item["@_subtype"] === "boardgameexpansion";
        
        let title = "Juego Desconocido";
        if (item.name) {
          if (typeof item.name === "object") {
            title = item.name["#text"] || item.name["@_sortindex"] || "Juego Desconocido";
          } else {
            title = String(item.name);
          }
        }

        const yearPublished = Number(item.yearpublished) || null;
        const bggImageUrl = item.image || item.thumbnail || null;

        return {
          bgg_id: bggId,
          title,
          year_published: yearPublished,
          image_url: bggImageUrl,
          is_expansion: isExpansion
        };
      }).filter(g => !isNaN(g.bgg_id));

      if (collectionGames.length === 0) {
        return new Response(JSON.stringify({ success: true, imported: 0 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const bggIds = collectionGames.map(g => g.bgg_id);
      const existingBggIds = new Set<number>();
      const chunkSize = 200;

      for (let i = 0; i < bggIds.length; i += chunkSize) {
        const chunk = bggIds.slice(i, i + chunkSize);
        const { data: existingData, error: existingError } = await supabase
          .from("games")
          .select("bgg_id")
          .in("bgg_id", chunk);

        if (existingError) {
          throw new Error(`Failed to query existing games chunk: ${existingError.message}`);
        }

        if (existingData) {
          existingData.forEach((row: any) => existingBggIds.add(row.bgg_id));
        }
      }

      console.log(`[BGG Collection] Games already in local cache: ${existingBggIds.size} of ${bggIds.length}`);

      const newGamesData = collectionGames
        .filter(g => !existingBggIds.has(g.bgg_id))
        .map(g => ({
          bgg_id: g.bgg_id,
          title: g.title,
          year_published: g.year_published,
          image_url: g.image_url,
          is_expansion: g.is_expansion,
          spanish_checked_at: null
        }));

      if (newGamesData.length > 0) {
        console.log(`[BGG Collection] Inserting ${newGamesData.length} new games to games cache...`);
        for (let i = 0; i < newGamesData.length; i += chunkSize) {
          const chunk = newGamesData.slice(i, i + chunkSize);
          const { error: upsertError } = await supabase
            .from("games")
            .upsert(chunk, { onConflict: "bgg_id" });

          if (upsertError) {
            throw new Error(`Failed to upsert new games chunk: ${upsertError.message}`);
          }
        }
      }

      const collectionInserts = bggIds.map(id => ({
        user_id: targetUserId,
        game_id: id
      }));

      console.log(`[BGG Collection] Saving ${collectionInserts.length} relations to user_collection...`);
      for (let i = 0; i < collectionInserts.length; i += chunkSize) {
        const chunk = collectionInserts.slice(i, i + chunkSize);
        const { error: collInsertError } = await supabase
          .from("user_collection")
          .upsert(chunk, { onConflict: "user_id,game_id" });

        if (collInsertError) {
          throw new Error(`Failed to insert to user_collection: ${collInsertError.message}`);
        }
      }

      console.log(`[BGG Collection] Successfully imported ${bggIds.length} games to user's collection.`);
      return new Response(JSON.stringify({ success: true, imported: bggIds.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Handle Search Action
    if (action === "search") {
      if (!callerUser) {
        return new Response(JSON.stringify({ error: "Unauthorized: Authentication required." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (!query.trim()) {
        return new Response(JSON.stringify({ error: "Missing query parameter" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      console.log(`[BGG Search] Searching for query: "${query}"...`);
      const searchUrl = `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=boardgame,boardgameexpansion`;

      const searchHeaders: Record<string, string> = {
        "Accept": "application/xml",
        "User-Agent": "LudiClub/1.0 (Contact: admin@example.com)"
      };
      if (bggToken) {
        searchHeaders["Authorization"] = `Bearer ${bggToken}`;
      }

      const searchResponse = await fetch(searchUrl, { headers: searchHeaders });
      if (!searchResponse.ok) {
        throw new Error(`BGG Search API returned status ${searchResponse.status}`);
      }

      const searchXmlText = await searchResponse.text();
      const searchJsonObj = xmlParser.parse(searchXmlText);
      let searchItems = searchJsonObj.items?.item;

      if (!searchItems) {
        return new Response(JSON.stringify({ results: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (!Array.isArray(searchItems)) {
        searchItems = [searchItems];
      }

      const searchResults = searchItems.map((item: any) => {
        const bggId = Number(item["@_id"]);
        const isExpansion = item["@_type"] === "boardgameexpansion";

        let title = "Juego Desconocido";
        if (item.name) {
          if (Array.isArray(item.name)) {
            const primaryName = item.name.find((n: any) => n?.["@_type"] === "primary") || item.name[0];
            title = primaryName?.["@_value"] || "Juego Desconocido";
          } else {
            title = item.name["@_value"] || "Juego Desconocido";
          }
        }
        title = sanitizeGameText(title) || "Juego Desconocido";

        const yearPublished = Number(item.yearpublished?.["@_value"]) || null;

        return {
          bgg_id: bggId,
          title,
          year_published: yearPublished,
          is_expansion: isExpansion
        };
      });

      console.log(`[BGG Search] Found ${searchResults.length} results for "${query}".`);
      return new Response(JSON.stringify({ results: searchResults }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Handle Ingest Action
    let idsToFetch: number[] = [];

    if (action === "ingest") {
      if (!callerUser) {
        return new Response(JSON.stringify({ error: "Unauthorized: Authentication required to ingest games." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (bggIds.length === 0) {
        return new Response(JSON.stringify({ error: "Missing bggIds parameter" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      // Clamp to max 30 IDs to prevent abuse and API exhaustion
      idsToFetch = bggIds.slice(0, 30);
      console.log(`[On-Demand Ingest] Preparing to ingest specified IDs: ${idsToFetch.join(", ")}`);
    } else if (action === "batch-ingest") {
      if (callerUser?.role !== "service_role") {
        return new Response(JSON.stringify({ error: "Forbidden: Only service_role can trigger batch ingestion." }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      console.log(`=== Starting Edge Function Ingestion Batch (Limit: ${limit}) ===`);

      // 3. Find MAX(bgg_id) in database
      const { data: maxGame, error: maxError } = await supabase
        .from("games")
        .select("bgg_id")
        .order("bgg_id", { ascending: false })
        .limit(1);

      if (maxError) {
        throw new Error(`Failed to query games table: ${maxError.message}`);
      }

      let startId = 1;
      if (maxGame && maxGame.length > 0) {
        startId = maxGame[0].bgg_id + 1;
        console.log(`[DB] Current MAX bgg_id: ${maxGame[0].bgg_id}. Starting from: ${startId}`);
      } else {
        console.log("[DB] Table is empty. Starting from ID: 1");
      }

      // 4. Prepare batch of IDs
      idsToFetch = Array.from({ length: limit }, (_, i) => startId + i);
    } else {
      return new Response(JSON.stringify({ error: "Invalid action. Supported actions: import-collection, search, ingest, batch-ingest." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 5. Fetch XML from BGG
    const xmlText = await fetchBggBatch(idsToFetch, bggToken);

    // 6. Parse XML
    const jsonObj = xmlParser.parse(xmlText);
    let xmlItems = jsonObj.items?.item;

    if (!xmlItems) {
      console.log("[Parser] No items returned in this batch.");
      return new Response(JSON.stringify({ success: true, processed: 0, reason: "No items returned from BGG" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (!Array.isArray(xmlItems)) {
      xmlItems = [xmlItems];
    }

    console.log(`[Parser] Parsed ${xmlItems.length} valid games.`);

    const results = [];

    // 7. Process each game
    for (const item of xmlItems) {
      const bggId = Number(item["@_id"]);
      
      // Parse names (title = always English/original, NEVER overwritten with Spanish)
      let names = item.name;
      if (!Array.isArray(names)) {
        names = [names];
      }
      const primaryNameObj = names.find((n: any) => n?.["@_type"] === "primary") || names[0];
      const title = sanitizeGameText(primaryNameObj?.["@_value"]) || "Unknown Game";

      // Parse stats
      const yearPublished = Number(item.yearpublished?.["@_value"]) || null;
      const minPlayers = Number(item.minplayers?.["@_value"]) || null;
      const maxPlayers = Number(item.maxplayers?.["@_value"]) || null;
      const playingTime = Number(item.playingtime?.["@_value"]) || null;

      // Parse BGG stats (ratings, rank, complexity)
      const stats = item.statistics?.ratings;
      const ratingGeek = stats?.bayesaverage?.["@_value"] ? Number(stats.bayesaverage["@_value"]) : null;
      const ratingAverage = stats?.average?.["@_value"] ? Number(stats.average["@_value"]) : null;
      const rawComplexity = stats?.averageweight?.["@_value"] ? Number(stats.averageweight["@_value"]) : null;
      const complexity = rawComplexity && rawComplexity > 0 ? Number(rawComplexity.toFixed(2)) : null;
      
      let rank = null;
      if (stats?.ranks?.rank) {
        let ranksList = stats.ranks.rank;
        if (!Array.isArray(ranksList)) {
          ranksList = [ranksList];
        }
        const bgRankObj = ranksList.find((r: any) => r?.["@_name"] === "boardgame");
        const rankVal = bgRankObj?.["@_value"];
        if (rankVal && rankVal !== "Not Ranked") {
          rank = Number(rankVal);
        }
      }

      // Check expansion status
      const isExpansion = item["@_type"] === "boardgameexpansion";
      let bggBaseGameId = null;
      let links = item.link;
      if (!links) {
        links = [];
      } else if (!Array.isArray(links)) {
        links = [links];
      }
      
      if (isExpansion) {
        const baseGameLink = links.find((l: any) => l["@_type"] === "boardgameexpansion" && l["@_inbound"] === "true");
        if (baseGameLink) {
          bggBaseGameId = Number(baseGameLink["@_id"]);
        }
      }

      // Default BGG image (original international cover)
      const bggImageUrl = item.image || item.thumbnail || null;
      let hasSpanishEdition = false;
      let titleEs: string | null = null;       // Spanish title
      let imageUrlEs: string | null = null;    // Spanish cover URL
      let publisher: string | null = null;     // Original publisher
      let esPublisher: string | null = null;   // Spanish publisher
      let esYearPublished: number | null = null; // Spanish edition publication year

      // Extract original publisher from main game links
      const origPubLink = links.find((l: any) => l["@_type"] === "boardgamepublisher");
      if (origPubLink) publisher = sanitizeGameText(origPubLink["@_value"]);

      // Extract Spanish edition version specifics
      if (item.versions && item.versions.item) {
        const spanishVersion = selectBestSpanishVersion(item.versions.item);

        if (spanishVersion) {
          hasSpanishEdition = true;

          // 0. Extract Spanish version yearpublished (fallbacks to original yearPublished)
          const rawEsYear = Number(spanishVersion.yearpublished?.["@_value"]);
          esYearPublished = rawEsYear && rawEsYear > 1900 ? rawEsYear : yearPublished;

          // 1. Extract Spanish title (checks canonicalname first, then name)
          const canonicalTitle = spanishVersion.canonicalname?.["@_value"];
          let candidateTitle = canonicalTitle;

          if (!candidateTitle) {
            let spanishNames = spanishVersion.name;
            if (spanishNames) {
              if (!Array.isArray(spanishNames)) spanishNames = [spanishNames];
              const primaryName = spanishNames.find((n: any) => n?.["@_type"] === "primary") || spanishNames[0];
              candidateTitle = primaryName?.["@_value"];
            }
          }

          const cleanedCandidate = sanitizeGameText(candidateTitle);
          if (cleanedCandidate) {
            if (!isGenericEditionName(cleanedCandidate)) {
              titleEs = cleanedCandidate;
            }
          }

          // 2. Extract Spanish edition box cover
          if (spanishVersion.image || spanishVersion.thumbnail) {
            imageUrlEs = spanishVersion.image || spanishVersion.thumbnail;
          }

          // 3. Extract Spanish publisher
          let vLinks = spanishVersion.link;
          if (!Array.isArray(vLinks)) vLinks = [vLinks];
          const publisherLink = vLinks.find((l: any) => l["@_type"] === "boardgamepublisher");
          if (publisherLink) {
            esPublisher = sanitizeGameText(publisherLink["@_value"]);
          }
        }
      }

      console.log(`[Parser] Processing: "${title}" (BGG ID: ${bggId}). Expansion: ${isExpansion}, Has ES Edition: ${hasSpanishEdition}`);

      // Insert into games table
      const { data: upserted, error: insertError } = await supabase
        .from("games")
        .upsert({
          bgg_id: bggId,
          title,              // English/original — never changes
          title_es: titleEs,  // Spanish title (null if no Spanish edition)
          publisher,          // Original publisher
          year_published: yearPublished,
          es_year_published: esYearPublished,
          image_url: bggImageUrl,      // Original BGG box cover
          image_url_es: imageUrlEs,    // Spanish edition box cover from BGG CDN
          spanish_checked_at: new Date().toISOString(),
          min_players: minPlayers,
          max_players: maxPlayers,
          playing_time: playingTime,
          es_publisher: esPublisher,
          has_spanish_edition: hasSpanishEdition,
          is_expansion: isExpansion,
          bgg_base_game_id: bggBaseGameId,
          bgg_rank: rank,
          rating_geek: ratingGeek,
          rating_average: ratingAverage,
          complexity: complexity
        }, { onConflict: "bgg_id" })
        .select("*");

      if (insertError) {
        console.error(`[DB Error] Failed to save "${title}":`, insertError.message);
      } else {
        console.log(`[DB] Saved "${title}" successfully.`);
        if (upserted && upserted.length > 0) {
          results.push(upserted[0]);
        } else {
          results.push({ bgg_id: bggId, title });
        }
      }
    }

    // 8. Post-process link base game UUIDs for expansions
    console.log("[Link] Resolving base game UUIDs...");
    const { data: expansions, error: selectExpError } = await supabase
      .from("games")
      .select("id, bgg_base_game_id")
      .eq("is_expansion", true)
      .is("base_game_id", null)
      .not("bgg_base_game_id", "is", null);

    if (!selectExpError && expansions && expansions.length > 0) {
      for (const exp of expansions) {
        const { data: baseGames } = await supabase
          .from("games")
          .select("id, title")
          .eq("bgg_id", exp.bgg_base_game_id)
          .limit(1);

        if (baseGames && baseGames.length > 0) {
          await supabase
            .from("games")
            .update({ base_game_id: baseGames[0].id })
            .eq("id", exp.id);
          console.log(`[Link] Linked expansion UUID ${exp.id} to base game "${baseGames[0].title}"`);
          
          const idx = results.findIndex((r: any) => r.id === exp.id);
          if (idx !== -1) {
            results[idx].base_game_id = baseGames[0].id;
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true, processed: results.length, games: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error: any) {
    console.error("[Fatal Error]:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
