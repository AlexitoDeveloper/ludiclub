/**
 * scripts/backfill-spanish-titles.cjs
 *
 * Backfills title_es (Spanish title) and publisher data for games that don't
 * have it yet. Runs from your local machine (which BGG/Cloudflare allows)
 * rather than from a cloud server.
 *
 * Usage:
 *   node scripts/backfill-spanish-titles.cjs              # processes 300 games
 *   node scripts/backfill-spanish-titles.cjs --limit=100  # custom batch size
 *
 * Schedule daily with Windows Task Scheduler:
 *   Program: node
 *   Arguments: scripts/backfill-spanish-titles.cjs --limit=300
 *   Start in: C:\path\to\ludiclub
 */

const { createClient } = require('@supabase/supabase-js');
const { XMLParser } = require('fast-xml-parser');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });         // base vars
dotenv.config({ path: path.join(__dirname, '../.env.local') });   // local overrides

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY / VITE_SUPABASE_ANON_KEY in environment.');
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️ Warning: SUPABASE_SERVICE_ROLE_KEY not set in .env.local. Running with anon key may fail due to catalog RLS policies.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: () => false
});

const BGG_API = 'https://boardgamegeek.com/xmlapi2';
const GAMES_PER_REQUEST = 20;  // IDs per BGG API call
const REQUEST_DELAY_MS = 2000; // delay between BGG calls (respectful)
const RETRY_DELAY_MS = 5000;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
function sanitizeGameText(text) {
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

function isGenericEditionName(name) {
  if (!name) return true;
  const lower = name.toLowerCase().trim();
  return (
    // Pure language/edition patterns: "Spanish edition", "Multilingual edition 2024"
    /^(spanish|english|french|german|italian|portuguese|polish|russian|dutch|japanese|chinese|korean|multilingual)\s+edition(\s+\d{4})?$/i.test(lower) ||
    /^(spanish|english|french)\s+version(\s+\d{4})?$/i.test(lower) ||
    /^edici[oó]n\s+en\s+espa[\u00f1n]ol(\s+\d{4})?$/i.test(lower) ||
    /^edici[oó]n\s+espa[\u00f1n]ola(\s+\d{4})?$/i.test(lower) ||
    /^versi[oó]n\s+espa[\u00f1n]ola(\s+\d{4})?$/i.test(lower) ||
    // Publisher-prefixed generic names: "Bisonte Spanish edition", "Asmodee multilingual edition"
    /\b(spanish|multilingual|english|french|german)\s+edition(\s+\d{4})?$/.test(lower) ||
    /\b(spanish|multilingual|english|french|german)\s+version(\s+\d{4})?$/.test(lower) ||
    // Named publisher editions: "Bisonte red edition", "Borras red edition"
    /\b(red|blue|black|white|classic|standard|retail|deluxe|collector|kickstarter|first|second|third|limited)\s+edition(\s+\d{4})?$/.test(lower) ||
    // Purely descriptive names
    /^(first|second|third|limited|deluxe|collector's|retail|kickstarter|standard)\s+edition$/i.test(lower)
  );
}

const SPANISH_PUBLISHERS = [
  'tranjis games', 'devir', 'zacatrus', 'ludonova', 'gdm games', 'gdm',
  'edge entertainment', 'asmodee spain', 'asmodee ibérica', 'asmodee iberica',
  'gen x games', 'maldito games', 'tcg factory', 'arrakis games', 'eclipse editorial',
  'doit games', 'mont tàber', 'mont taber', 'brain picnic', 'sd games', 'dmz games',
  'salt & pepper games', 'looping games', 'primigenio', 'masqueoca', 'ediciones masqueoca',
  'ludis hispania', 'tiki ediciones', 'perro lopo', 'drakon ideas', 'santiago games',
  'falomir juegos', 'cefa toys', 'borras', 'juegos borras', 'diset', 'educo', 'mercurio',
  'mercurio distribuciones'
];

function getPublisherName(v) {
  let links = v.link || [];
  if (!Array.isArray(links)) links = [links];
  const pubLink = links.find(l => l['@_type'] === 'boardgamepublisher');
  return pubLink?.['@_value']?.toLowerCase().trim() || null;
}

function selectBestSpanishVersion(versionItems) {
  if (!versionItems) return null;
  const list = Array.isArray(versionItems) ? versionItems : [versionItems];

  // 1. Sort all versions by:
  //    - Year published (descending)
  //    - Spanish publisher priority (to resolve ties)
  const sorted = [...list].sort((a, b) => {
    const yearA = Number(a.yearpublished?.['@_value'] || 0);
    const yearB = Number(b.yearpublished?.['@_value'] || 0);
    if (yearB !== yearA) {
      return yearB - yearA;
    }

    const pubA = getPublisherName(a);
    const pubB = getPublisherName(b);
    const isPubASpanish = pubA ? SPANISH_PUBLISHERS.some(sp => pubA.includes(sp)) : false;
    const isPubBSpanish = pubB ? SPANISH_PUBLISHERS.some(sp => pubB.includes(sp)) : false;

    if (isPubASpanish && !isPubBSpanish) return -1;
    if (!isPubASpanish && isPubBSpanish) return 1;

    return 0;
  });

  // 2. Find the first version in the sorted list that has Spanish language
  return sorted.find(v => {
    let links = v.link;
    if (!links) return false;
    if (!Array.isArray(links)) links = [links];
    return links.some(l => l['@_type'] === 'language' && l['@_value'] === 'Spanish');
  });
}

async function fetchBggBatch(bggIds) {
  const url = `${BGG_API}/thing?id=${bggIds.join(',')}&versions=1`;
  const bggToken = process.env.BGG_API_KEY;
  for (let attempt = 1; attempt <= 3; attempt++) {
    console.log(`  [BGG] Fetching ${bggIds.length} games (attempt ${attempt})…`);
    try {
      const headers = {
        'User-Agent': 'LudiClub/1.0 (Contact: admin@example.com)',
        'Accept': 'application/xml'
      };
      if (bggToken) {
        headers['Authorization'] = `Bearer ${bggToken}`;
      }
      const res = await fetch(url, { headers });
      if (res.status === 202) {
        console.log('  [BGG] 202 – retrying in 5s…');
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      if (!res.ok) throw new Error(`BGG returned ${res.status}`);
      return await res.text();
    } catch (err) {
      console.warn(`  [BGG] Attempt ${attempt} failed: ${err.message}`);
      if (attempt === 3) throw err;
      await sleep(RETRY_DELAY_MS);
    }
  }
  throw new Error('BGG API exhausted retries');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function runBackfill(batchSize) {
  console.log(`\n=== BGG Spanish Title Backfill ===`);
  console.log(`Batch size: ${batchSize} games`);

  // 1. Fetch games pending Spanish check (spanish_checked_at is null)
  const { data: games, error: fetchErr } = await supabase
    .from('games')
    .select('bgg_id, title')
    .is('spanish_checked_at', null)
    .order('has_spanish_edition', { ascending: false, nullsFirst: false })
    .order('bgg_id', { ascending: true })
    .limit(batchSize);

  if (fetchErr) {
    console.error('❌ DB error fetching games:', fetchErr.message);
    process.exit(1);
  }

  if (!games || games.length === 0) {
    console.log('🎉 All games have already been checked for Spanish edition data. Nothing to do!');
    return;
  }

  // 2. Count remaining for progress display
  const { count: totalPending } = await supabase
    .from('games')
    .select('bgg_id', { count: 'exact', head: true })
    .is('spanish_checked_at', null);

  console.log(`Found ${games.length} games to process (${totalPending} total pending)\n`);

  const bggIds = games.map(g => g.bgg_id);
  let processed = 0;
  let withSpanish = 0;
  let errors = 0;

  // 3. Process in sub-batches of GAMES_PER_REQUEST
  for (let i = 0; i < bggIds.length; i += GAMES_PER_REQUEST) {
    const chunk = bggIds.slice(i, i + GAMES_PER_REQUEST);
    const batchNum = Math.floor(i / GAMES_PER_REQUEST) + 1;
    const totalBatches = Math.ceil(bggIds.length / GAMES_PER_REQUEST);

    console.log(`[Batch ${batchNum}/${totalBatches}] IDs ${chunk[0]}…${chunk[chunk.length - 1]}`);

    let xml;
    try {
      xml = await fetchBggBatch(chunk);
    } catch (err) {
      console.error(`  ❌ BGG fetch failed: ${err.message}`);
      errors += chunk.length;
      processed += chunk.length;
      continue;
    }

    const parsed = xmlParser.parse(xml);
    let rawItems = parsed?.items?.item;
    let items = [];
    if (rawItems) {
      items = Array.isArray(rawItems) ? rawItems : [rawItems];
    }

    const returnedBggIds = new Set(items.map(item => Number(item['@_id'])));

    // Mark any IDs in this chunk not found on BGG (deleted/retired items) as checked
    for (const bggId of chunk) {
      if (!returnedBggIds.has(bggId)) {
        console.log(`ℹ️ [BGG] Game ID ${bggId} not found on BGG (retired/merged). Marking as checked.`);
        const { error: orphanErr } = await supabase
          .from('games')
          .update({
            spanish_checked_at: new Date().toISOString(),
            has_spanish_edition: false
          })
          .eq('bgg_id', bggId);

        if (orphanErr) {
          console.warn(`  ⚠️ Could not mark orphan ID ${bggId}: ${orphanErr.message}`);
          errors++;
        } else {
          processed++;
        }
      }
    }

    if (items.length === 0) {
      continue;
    }

    for (const item of items) {
      try {
        const bggId = Number(item['@_id']);

        // Original English title
        let names = item.name;
        if (!names) { processed++; continue; }
        if (!Array.isArray(names)) names = [names];
        const primaryName = names.find(n => n?.['@_type'] === 'primary') || names[0];
        const titleEnglish = primaryName?.['@_value'];
        if (!titleEnglish) { processed++; continue; }

        // Original publisher from main game links
        let mainLinks = item.link || [];
        if (!Array.isArray(mainLinks)) mainLinks = [mainLinks];
        const origPubLink = mainLinks.find(l => l?.['@_type'] === 'boardgamepublisher');
        const publisher = origPubLink?.['@_value'] ?? null;

        // Spanish version data
        let titleEs = null;
        let esPublisher = null;
        let hasSpanishEdition = false;
        let imageUrlEs = null;

        const versions = item.versions?.item;
        if (versions) {
          const spanishVersion = selectBestSpanishVersion(versions);

          if (spanishVersion) {
            hasSpanishEdition = true;

            // 1. Spanish title (checks canonicalname first, then name)
            const canonicalSpanishTitle = spanishVersion.canonicalname?.['@_value'];
            let candidateTitle = canonicalSpanishTitle;

            if (!candidateTitle) {
              let spanishNames = spanishVersion.name;
              if (spanishNames) {
                if (!Array.isArray(spanishNames)) spanishNames = [spanishNames];
                const primaryName = spanishNames.find(n => n?.['@_type'] === 'primary') || spanishNames[0];
                candidateTitle = primaryName?.['@_value'];
              }
            }

            const cleanedCandidate = sanitizeGameText(candidateTitle);
            if (cleanedCandidate) {
              if (!isGenericEditionName(cleanedCandidate)) {
                titleEs = cleanedCandidate;
                withSpanish++;
                console.log(`🇪🇸 ${sanitizeGameText(titleEnglish)} → ${titleEs}`);
              }
            }

            // 2. Spanish publisher
            let vLinks = spanishVersion.link || [];
            if (!Array.isArray(vLinks)) vLinks = [vLinks];
            const pubLink = vLinks.find(l => l?.['@_type'] === 'boardgamepublisher');
            if (pubLink) esPublisher = sanitizeGameText(pubLink['@_value']);

            // 3. Spanish cover image from BGG CDN
            if (spanishVersion.image || spanishVersion.thumbnail) {
              imageUrlEs = spanishVersion.image || spanishVersion.thumbnail;
              console.log(`🖼️ Portada ES encontrada para ${sanitizeGameText(titleEnglish)}`);
            }
          }
        }

        // Update DB — original image_url and title stay untouched
        const updatePayload = {
          title_es: titleEs,
          publisher: sanitizeGameText(publisher),
          es_publisher: esPublisher,
          has_spanish_edition: hasSpanishEdition,
          spanish_checked_at: new Date().toISOString()
        };

        if (imageUrlEs) {
          updatePayload.image_url_es = imageUrlEs;
        }

        const { error: updateErr } = await supabase
          .from('games')
          .update(updatePayload)
          .eq('bgg_id', bggId);

        if (updateErr) {
          console.error(`  ❌ DB update failed for ${bggId}: ${updateErr.message}`);
          errors++;
        }
        processed++;
      } catch (err) {
        console.error(`  ❌ Error processing item: ${err.message}`);
        errors++;
        processed++;
      }
    }

    // Delay between BGG requests
    if (i + GAMES_PER_REQUEST < bggIds.length) {
      await sleep(REQUEST_DELAY_MS);
    }
  }

  // 4. Summary
  const { count: remaining } = await supabase
    .from('games')
    .select('bgg_id', { count: 'exact', head: true })
    .is('spanish_checked_at', null);

  console.log('\n=== Backfill batch complete ===');
  console.log(`  Processed:          ${processed}`);
  console.log(`  With Spanish title: ${withSpanish}`);
  console.log(`  Errors:             ${errors}`);
  console.log(`  Remaining in DB:    ${remaining ?? '?'}`);
  if (remaining > 0) {
    const daysLeft = Math.ceil(remaining / batchSize);
    console.log(`  Est. days to finish (at ${batchSize}/day): ${daysLeft}`);
  } else {
    console.log('  🎉 All games enriched!');
  }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const limitArg = args.find(a => a.startsWith('--limit='));
const batchSize = limitArg ? Number(limitArg.split('=')[1]) : 300;

runBackfill(batchSize).catch(err => {
  console.error('[Fatal]', err);
  process.exit(1);
});
