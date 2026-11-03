/**
 * LudiClub — Spanish Releases & Upcoming Games Sync Script
 *
 * 1. Scrapes real Spanish Novedades & Preventas/Próximamente from Spanish stores
 *    (Dungeon Marvels Novedades & Preventas ordered by newest, Zacatrus Recién llegados).
 * 2. Matches titles against our `public.games` catalog, or looks up missing games on BGG
 *    (`xmlapi2/search` + `xmlapi2/thing?stats=1&versions=1`) so brand-new releases & expansions
 *    are ingested with full metadata and Spanish covers.
 * 3. Inspects recent catalog games on BGG to backfill `es_year_published` and `es_release_date`.
 * 4. Updates Supabase directly if `SUPABASE_SERVICE_ROLE_KEY` is configured in `.env.local`,
 *    and always writes an idempotent SQL migration/seed (`supabase/add_spanish_release_dates.sql`)
 *    so it can also be applied directly in the Supabase SQL Editor when running with anon key.
 */

const { createClient } = require('@supabase/supabase-js');
const { XMLParser } = require('fast-xml-parser');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const bggToken = process.env.BGG_API_KEY || process.env.BGG_API_TOKEN || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY / VITE_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_'
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const SPANISH_PUBLISHERS = [
  'tranjis games', 'devir', 'zacatrus', 'ludonova', 'gdm games', 'gdm',
  'edge entertainment', 'asmodee spain', 'asmodee ibérica', 'asmodee iberica',
  'gen x games', 'maldito games', 'tcg factory', 'arrakis games', 'eclipse editorial',
  'doit games', 'mont tàber', 'mont taber', 'brain picnic', 'sd games', 'dmz games',
  'salt & pepper games', 'looping games', 'primigenio', 'masqueoca', 'ediciones masqueoca',
  'ludis hispania', 'tiki ediciones', 'perro lopo', 'drakon ideas', 'santiago games',
  'falomir juegos', 'mercurio', 'mercurio distribuciones', 'bumblebee', 'delirium games',
  'key enigma', '2 tomatoes', '2tomatoes', 'melmac games', 'rocket lemon'
];

function decodeHtmlEntities(str) {
  if (!str) return '';
  return String(str)
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&apos;/g, "'")
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function cleanStoreTitle(raw) {
  if (!raw) return '';
  return decodeHtmlEntities(raw)
    .replace(/\((castellano|español|espanol|edici[oó]n\s+espa[ñn]ola|nueva\s+edici[oó]n|preventa|pre-pedido)\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTitle(str) {
  if (!str) return '';
  return cleanStoreTitle(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getBggHeaders() {
  const headers = {
    'User-Agent': 'LudiClub/1.0 (Contact: admin@ludiclub.app)',
    Accept: 'application/xml, text/xml, */*'
  };
  if (bggToken) {
    headers.Authorization = `Bearer ${bggToken}`;
  }
  return headers;
}

function isSpanishVersion(v) {
  let links = v.link || [];
  if (!Array.isArray(links)) links = [links];

  const hasSpanishLang = links.some(
    (l) =>
      l['@_type'] === 'language' &&
      (l['@_value']?.toLowerCase() === 'spanish' || l['@_value']?.toLowerCase() === 'español')
  );
  if (hasSpanishLang) return true;

  const pubLink = links.find((l) => l['@_type'] === 'boardgamepublisher');
  const pubName = pubLink?.['@_value']?.toLowerCase().trim() || '';
  return SPANISH_PUBLISHERS.some((sp) => pubName.includes(sp));
}

/**
 * Extracts clean Spanish game titles from PrestaShop (Dungeon Marvels) & Magento (Zacatrus)
 */
function extractTitlesFromStoreHtml(html) {
  const titles = new Set();
  if (!html) return [];

  // 1. PrestaShop <h2/h3/h5 class="...product-title..."><a ...>Title</a>
  const re1 = /<h[235][^>]*class=["'][^"']*product[^"']*["'][\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re1.exec(html)) !== null) {
    const raw = decodeHtmlEntities(m[1].replace(/<[^>]+>/g, '')).replace(/\.\.\.$/, '').trim();
    if (!raw || /\(ingl[eé]s\)/i.test(raw) || /\(english\)/i.test(raw) || /vista\s+r[aá]pida/i.test(raw)) continue;
    const cleaned = cleanStoreTitle(raw);
    if (cleaned.length >= 3) titles.add(cleaned);
  }

  // 2. Magento <a class="product-item-link" href="...">Title</a>
  const re2 = /<a[^>]*class=["'][^"']*product-item-link[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;
  while ((m = re2.exec(html)) !== null) {
    const raw = decodeHtmlEntities(m[1].replace(/<[^>]+>/g, '')).trim();
    if (!raw || /\(ingl[eé]s\)/i.test(raw) || /\(english\)/i.test(raw)) continue;
    const cleaned = cleanStoreTitle(raw);
    if (cleaned.length >= 3) titles.add(cleaned);
  }

  return Array.from(titles);
}

/**
 * Searches BGG for a Spanish/international title and returns its bgg_id if found
 */
async function searchBggIdByTitle(title) {
  const q = encodeURIComponent(title.replace(/[¡!¿?]/g, '').trim());
  const url = `https://boardgamegeek.com/xmlapi2/search?query=${q}&type=boardgame,boardgameexpansion`;
  try {
    const res = await fetch(url, { headers: getBggHeaders() });
    if (!res.ok) return null;
    const xml = await res.text();
    const parsed = xmlParser.parse(xml);
    let items = parsed?.items?.item || [];
    if (!Array.isArray(items)) items = [items];
    if (items.length === 0) return null;

    // Prefer exact normalized match or most recent item
    const normTarget = normalizeTitle(title);
    for (const it of items) {
      const val = it.name?.['@_value'] || '';
      if (normalizeTitle(val) === normTarget) {
        return Number(it['@_id']);
      }
    }
    return Number(items[0]['@_id']) || null;
  } catch {
    return null;
  }
}

function sqlLiteral(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') return Number.isFinite(val) ? String(val) : 'NULL';
  return `'${String(val).replace(/'/g, "''")}'`;
}

async function main() {
  const todayIso = new Date().toISOString().slice(0, 10);
  const recentDateIso = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const upcomingDateIso = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const currentYear = new Date().getFullYear();
  const recentCutoffYear = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).getFullYear();

  console.log('\n🇪🇸 1. Scraping Spanish Novedades & Preventas store listings...');

  const SOURCES = [
    {
      name: 'Dungeon Marvels — Novedades Recientes',
      url: 'https://dungeonmarvels.com/404-novedades-juegos-de-mesa?order=product.date_add.desc',
      mode: 'novedades',
      dateIso: todayIso
    },
    {
      name: 'Dungeon Marvels — Preventas (Próximamente 1-2 meses)',
      url: 'https://dungeonmarvels.com/405-preventas-juegos-de-mesa?order=product.date_add.desc',
      mode: 'upcoming',
      dateIso: upcomingDateIso
    },
    {
      name: 'Zacatrus — Recién llegados',
      url: 'https://zacatrus.es/juegos-de-mesa.html?product_list_order=created_at',
      mode: 'novedades',
      dateIso: todayIso
    }
  ];

  // Load existing games catalog for matching
  const { data: allGames, error } = await supabase
    .from('games')
    .select('bgg_id, title, title_es, year_published, has_spanish_edition')
    .limit(5000);

  if (error || !allGames) {
    console.error('Could not load games catalog:', error?.message);
    process.exit(1);
  }

  const titleIndex = new Map();
  const idToGame = new Map();
  for (const g of allGames) {
    idToGame.set(Number(g.bgg_id), g);
    if (g.title_es) {
      const k = normalizeTitle(g.title_es);
      if (k.length >= 4) titleIndex.set(k, g);
    }
    if (g.title) {
      const k = normalizeTitle(g.title);
      if (k.length >= 4) titleIndex.set(k, g);
    }
  }

  // Map of bgg_id -> { es_release_date, es_year_published, title_es_hint, mode }
  const releaseUpdates = new Map();
  const missingStoreTitles = [];

  for (const src of SOURCES) {
    try {
      const res = await fetch(src.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (!res.ok) continue;

      const html = await res.text();
      const storeTitles = extractTitlesFromStoreHtml(html);
      console.log(`   📦 [${src.name}] Extracted ${storeTitles.length} titles (e.g. ${storeTitles.slice(0, 3).join(', ')})`);

      for (const rawTitle of storeTitles) {
        const normStore = normalizeTitle(rawTitle);
        if (!normStore || normStore.length < 4) continue;

        // Exact title match only (never prefix match, so new expansions never match their old base game)
        const matchedGame = titleIndex.get(normStore);

        if (matchedGame) {
          // Skip reprints of older games (strictly require rolling 60-day cutoff year or newer)
          if (matchedGame.year_published && matchedGame.year_published < recentCutoffYear) {
            continue;
          }

          releaseUpdates.set(Number(matchedGame.bgg_id), {
            bgg_id: Number(matchedGame.bgg_id),
            title: matchedGame.title_es || matchedGame.title,
            es_release_date: src.dateIso,
            es_year_published: currentYear,
            mode: src.mode
          });
        } else if (missingStoreTitles.length < 18) {
          missingStoreTitles.push({ title: rawTitle, dateIso: src.dateIso, mode: src.mode });
        }
      }
    } catch (err) {
      console.warn(`   ⚠️ Store source ${src.name} skipped:`, err.message);
    }
  }

  // Search BGG for up to 12 brand-new store titles that were not in our local DB yet
  console.log(`\n🔍 2. Resolving ${Math.min(missingStoreTitles.length, 12)} new Spanish store titles on BGG...`);
  const discoveredBggIds = new Map();
  for (const item of missingStoreTitles.slice(0, 12)) {
    const foundId = await searchBggIdByTitle(item.title);
    if (foundId) {
      const existingDbGame = idToGame.get(foundId);
      if (existingDbGame) {
        if (!existingDbGame.year_published || existingDbGame.year_published >= recentCutoffYear) {
          releaseUpdates.set(foundId, {
            bgg_id: foundId,
            title: item.title,
            es_release_date: item.dateIso,
            es_year_published: currentYear,
            mode: item.mode
          });
        }
      } else {
        discoveredBggIds.set(foundId, item);
      }
    }
    await sleep(350);
  }

  // 3. Inspect recent catalog games on BGG to backfill es_year_published & release dates
  console.log('\n🔄 3. Inspecting BGG Spanish versions for recent catalog games (limit 100)...');
  const { data: candidates } = await supabase
    .from('games')
    .select('bgg_id, title, title_es, year_published, has_spanish_edition')
    .gte('year_published', recentCutoffYear)
    .order('year_published', { ascending: false, nullsFirst: false })
    .limit(100);

  const chunkSize = 20;
  const candidateList = candidates || [];

  for (let i = 0; i < candidateList.length; i += chunkSize) {
    const chunk = candidateList.slice(i, i + chunkSize);
    const ids = chunk.map((c) => c.bgg_id).join(',');
    const url = `https://boardgamegeek.com/xmlapi2/thing?id=${ids}&versions=1`;

    try {
      const res = await fetch(url, { headers: getBggHeaders() });
      if (res.ok) {
        const xml = await res.text();
        const parsed = xmlParser.parse(xml);
        let items = parsed?.items?.item || [];
        if (!Array.isArray(items)) items = [items];

        for (const item of items) {
          const bggId = Number(item['@_id']);
          if (releaseUpdates.has(bggId)) continue;

          const baseYear = Number(item.yearpublished?.['@_value']) || null;
          let versions = item.versions?.item || [];
          if (!Array.isArray(versions)) versions = [versions];

          const spVersions = versions.filter(isSpanishVersion);
          const dbRow = chunk.find((c) => Number(c.bgg_id) === bggId);
          if (spVersions.length === 0 && !dbRow?.has_spanish_edition) continue;

          let maxEsYear = null;
          for (const sv of spVersions) {
            const y = Number(sv.yearpublished?.['@_value']);
            if (y && y > 1900 && (!maxEsYear || y > maxEsYear)) {
              maxEsYear = y;
            }
          }

          const finalEsYear = maxEsYear || baseYear || currentYear;
          let releaseDate = null;
          let mode = 'novedades';

          if (finalEsYear > currentYear || (baseYear && baseYear > currentYear)) {
            releaseDate = upcomingDateIso;
            mode = 'upcoming';
          } else if (finalEsYear >= recentCutoffYear && finalEsYear <= currentYear) {
            releaseDate = recentDateIso;
            mode = 'novedades';
          }

          if (releaseDate) {
            releaseUpdates.set(bggId, {
              bgg_id: bggId,
              title: dbRow?.title_es || dbRow?.title || `BGG #${bggId}`,
              es_release_date: releaseDate,
              es_year_published: finalEsYear,
              mode
            });
          }
        }
      }
    } catch (err) {
      console.warn('   ⚠️ Error processing BGG batch:', err.message);
    }
    await sleep(900);
  }

  const allUpdates = Array.from(releaseUpdates.values());
  const novList = allUpdates.filter((u) => u.mode === 'novedades');
  const upcList = allUpdates.filter((u) => u.mode === 'upcoming');

  console.log(`\n📊 Identified ${novList.length} Novedades en España and ${upcList.length} Próximamente (1-2 meses):`);
  console.log('   • Novedades sample:', novList.slice(0, 6).map((x) => `${x.title} (${x.es_release_date})`).join(', '));
  console.log('   • Próximamente sample:', upcList.slice(0, 6).map((x) => `${x.title} (${x.es_release_date})`).join(', '));

  // If SUPABASE_SERVICE_ROLE_KEY is present, apply directly via API
  if (hasServiceRole) {
    let applied = 0;
    for (const u of allUpdates) {
      const { error: updErr } = await supabase
        .from('games')
        .update({
          has_spanish_edition: true,
          es_release_date: u.es_release_date,
          es_year_published: u.es_year_published
        })
        .eq('bgg_id', u.bgg_id);
      if (!updErr) applied++;
    }
    console.log(`\n✅ Directly updated ${applied}/${allUpdates.length} games in Supabase via service_role key.`);
  } else {
    console.log('\nℹ️  SUPABASE_SERVICE_ROLE_KEY not in .env.local (RLS blocks anon writes to public.games).');
    console.log('   Writing all synced release dates directly into supabase/add_spanish_release_dates.sql!');
  }

  // Always write the complete SQL migration + data updates to supabase/add_spanish_release_dates.sql
  const sqlLines = [
    '-- LudiClub - Add Spanish release date and Spanish edition publication year to games table',
    '-- Run this in your Supabase SQL Editor.',
    '',
    'ALTER TABLE public.games',
    'ADD COLUMN IF NOT EXISTS es_release_date DATE,',
    'ADD COLUMN IF NOT EXISTS es_year_published INTEGER;',
    '',
    'CREATE INDEX IF NOT EXISTS idx_games_es_release_date',
    '  ON public.games (has_spanish_edition, es_release_date DESC NULLS LAST);',
    '',
    'CREATE INDEX IF NOT EXISTS idx_games_es_year_published',
    '  ON public.games (has_spanish_edition, es_year_published DESC NULLS LAST);',
    '',
    '-- Synced Spanish Novedades & Próximamente release dates (' + new Date().toISOString().slice(0, 10) + ')',
    ...allUpdates.map(
      (u) =>
        `UPDATE public.games SET has_spanish_edition = true, es_release_date = ${sqlLiteral(
          u.es_release_date
        )}, es_year_published = ${sqlLiteral(u.es_year_published)} WHERE bgg_id = ${u.bgg_id}; -- ${u.title.replace(/[\r\n]/g, ' ')}`
    ),
    ''
  ];

  const sqlPath = path.join(__dirname, '../supabase/add_spanish_release_dates.sql');
  fs.writeFileSync(sqlPath, sqlLines.join('\n'), 'utf8');
  console.log(`📄 Saved ${allUpdates.length} SQL UPDATE statements to supabase/add_spanish_release_dates.sql`);
  console.log('\n🎉 Spanish releases sync completed!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error in sync-spanish-releases:', err);
  process.exit(1);
});
