const { createClient } = require('@supabase/supabase-js');
const { XMLParser } = require('fast-xml-parser');
const { Jimp } = require('jimp');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');

// Max rank limit to avoid filling database (games above rank 5000 are very obscure)
const MAX_INGEST_RANK = 5000;

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY / VITE_SUPABASE_ANON_KEY in env variables.');
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️ Warning: SUPABASE_SERVICE_ROLE_KEY not set in .env.local. Running with anon key will fail storage uploads and catalog upserts under hardened RLS.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_'
});

// Helper for delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper to identify generic Spanish or foreign version titles
 */
function isGenericEditionName(name) {
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

/**
 * Fetch a batch of game IDs from BoardGameGeek XML API2
 */
async function fetchBggBatch(ids) {
  const url = `https://boardgamegeek.com/xmlapi2/thing?id=${ids.join(',')}&versions=1&stats=1`;
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[BGG] Fetching details for IDs: ${ids.join(', ')} (Attempt ${attempt}/${maxRetries})...`);
    
    try {
      const headers = {
        'Accept': 'application/xml',
        'User-Agent': 'LudiClub/1.0 (Contact: admin@example.com)'
      };
      
      const bggToken = process.env.BGG_API_KEY;
      if (bggToken) {
        headers['Authorization'] = `Bearer ${bggToken}`;
      }

      const response = await fetch(url, { headers });
      
      if (response.status === 202) {
        console.log('[BGG] Returned 202 (Processing). Retrying in 4 seconds...');
        await sleep(4000);
        continue;
      }
      
      if (!response.ok) {
        throw new Error(`BGG API returned status ${response.status}`);
      }
      
      return await response.text();
    } catch (err) {
      console.warn(`[BGG] Attempt ${attempt} failed: ${err.message}`);
      if (attempt === maxRetries) throw err;
      await sleep(2000);
    }
  }
}

/**
 * Download, optimize and upload cover image to Supabase Storage
 */
async function processAndUploadImage(bggId, imageUrl) {
  if (!imageUrl) return null;
  
  try {
    console.log(`[Storage] Downloading cover for game ${bggId} from: ${imageUrl}...`);
    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) {
      throw new Error(`Failed to download image: status ${imgResponse.status}`);
    }
    
    const arrayBuffer = await imgResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(`[Jimp] Processing/optimizing image for game ${bggId}...`);
    const image = await Jimp.read(buffer);
    
    // Resize image to max width of 600px, keeping aspect ratio
    if (image.width > 600) {
      image.resize({ w: 600 });
      console.log(`[Jimp] Resized image to 600px width.`);
    }
    
    const optimizedBuffer = await image.getBuffer('image/jpeg');
    const fileName = `covers/${bggId}.jpg`;
    
    console.log(`[Storage] Uploading optimized image ${fileName} to bucket 'game-covers'...`);
    const { data, error } = await supabase.storage
      .from('game-covers')
      .upload(fileName, optimizedBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });
      
    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('game-covers')
      .getPublicUrl(fileName);
      
    console.log(`[Storage] Upload complete. Public URL: ${publicUrl}`);
    return publicUrl;
  } catch (err) {
    console.error(`[Storage Error] Could not process/upload image for game ${bggId}:`, err.message);
    // Fallback to original URL so we don't lose the cover completely
    return imageUrl;
  }
}

/**
 * Reads ranks CSV and selects the next set of un-ingested board game IDs
 */
async function getNextBggIdsFromCsv(limit) {
  console.log('[DB] Fetching existing BGG IDs from database...');
  const { data: existing, error } = await supabase.from('games').select('bgg_id');
  if (error) {
    throw new Error(`Failed to fetch existing games: ${error.message}`);
  }
  const existingIds = new Set(existing.map(g => g.bgg_id));
  console.log(`[DB] Found ${existingIds.size} existing games in database.`);

  return new Promise((resolve, reject) => {
    const ids = [];
    const csvPath = path.join(__dirname, '../raw-data/boardgames_ranks.csv');
    
    if (!fs.existsSync(csvPath)) {
      reject(new Error(`CSV file not found at ${csvPath}`));
      return;
    }

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        if (ids.length >= limit) return;
        
        const bggId = Number(row.id);
        const rank = Number(row.rank);
        
        // Skip if invalid, already exists, or exceeds rank limit
        if (!bggId || isNaN(bggId) || existingIds.has(bggId)) {
          return;
        }
        
        if (rank && !isNaN(rank) && rank > MAX_INGEST_RANK) {
          return;
        }

        ids.push(bggId);
      })
      .on('end', () => {
        resolve(ids);
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

/**
 * Discover recent popular games from BGG XML API2 Hotness AND incremental ID scan
 */
async function discoverRecentGames(limit = 30) {
  const currentYear = new Date().getFullYear();
  const prevYear = currentYear - 1;
  const bggToken = process.env.BGG_API_KEY;
  const idsToIngest = new Set();

  // Mode 1: BGG Hotness Discover
  const hotnessUrl = 'https://boardgamegeek.com/xmlapi2/hot?type=boardgame';
  console.log(`[BGG Discovery] Fetching hotness list from BGG API: ${hotnessUrl}...`);
  try {
    const headers = {
      'Accept': 'application/xml',
      'User-Agent': 'LudiClub/1.0 (Contact: admin@example.com)'
    };
    if (bggToken) {
      headers['Authorization'] = `Bearer ${bggToken}`;
    }

    const response = await fetch(hotnessUrl, { headers });
    if (!response.ok) throw new Error(`BGG Hotness API status ${response.status}`);
    
    const xmlText = await response.text();
    const jsonObj = xmlParser.parse(xmlText);
    let items = jsonObj.items?.item;
    if (items) {
      if (!Array.isArray(items)) items = [items];
      items.forEach(item => {
        const id = Number(item['@_id']);
        const year = Number(item.yearpublished?.['@_value']);
        if (!isNaN(id) && year >= prevYear) {
          idsToIngest.add(id);
        }
      });
    }
    console.log(`[BGG Discovery] Hotness search found ${idsToIngest.size} games published in ${prevYear}-${currentYear}.`);
  } catch (err) {
    console.warn(`[BGG Discovery Warning] Hotness discover failed:`, err.message);
  }

  // Mode 2: Incremental Chronological Scan starting from MAX(bgg_id)
  console.log('[BGG Discovery] Running incremental chronological scan...');
  try {
    const { data: maxGame, error: maxError } = await supabase
      .from('games')
      .select('bgg_id')
      .order('bgg_id', { ascending: false })
      .limit(1);

    if (maxError) throw maxError;

    let startId = 460000; // fallback start ID
    if (maxGame && maxGame.length > 0) {
      startId = maxGame[0].bgg_id + 1;
    }
    
    // We scan the next 50 IDs in a single batch query
    const scanIds = Array.from({ length: 50 }, (_, i) => startId + i);
    console.log(`[BGG Discovery] Scanning BGG IDs from ${scanIds[0]} to ${scanIds[scanIds.length - 1]}...`);
    
    const xmlText = await fetchBggBatch(scanIds);
    const jsonObj = xmlParser.parse(xmlText);
    let items = jsonObj.items?.item;
    if (items) {
      if (!Array.isArray(items)) items = [items];
      
      let discoveredCount = 0;
      items.forEach(item => {
        const id = Number(item['@_id']);
        const year = Number(item.yearpublished?.['@_value']);
        
        // Check statistics for usersrated
        const stats = item.statistics?.ratings;
        const usersRated = stats?.usersrated?.['@_value'] ? Number(stats.usersrated['@_value']) : 0;
        
        if (!isNaN(id) && year >= prevYear && usersRated >= 5) {
          idsToIngest.add(id);
          discoveredCount++;
        }
      });
      console.log(`[BGG Discovery] Incremental scan found ${discoveredCount} real new games with ratings.`);
    }
  } catch (err) {
    if (err.message && err.message.includes('status 400')) {
      console.log(`[BGG Discovery] Incremental scan reached the BGG ID limit (future IDs not yet created).`);
    } else {
      console.warn(`[BGG Discovery Warning] Incremental scan failed:`, err.message);
    }
  }

  const finalIdsList = Array.from(idsToIngest);
  console.log(`[BGG Discovery] Total unique game IDs to ingest: ${finalIdsList.length}`);
  return finalIdsList.slice(0, limit);
}

async function runIngestion(limit = 10, targetIds = null, useRecent = false) {
  console.log('=== starting boardgamegeek catalog ingestion script ===');
  
  let idsToFetch = [];
  if (useRecent) {
    console.log('[BGG Discovery] Running in recent releases mode...');
    idsToFetch = await discoverRecentGames(limit);
    if (idsToFetch.length === 0) {
      console.log('[Info] No new games discovered via search page.');
      return;
    }
  } else if (targetIds && targetIds.length > 0) {
    idsToFetch = targetIds;
    console.log(`[CLI] Target IDs specified: ${idsToFetch.join(', ')}`);
  } else {
    try {
      console.log('[CSV] Finding next popular games to ingest from ranks CSV...');
      idsToFetch = await getNextBggIdsFromCsv(limit);
      if (idsToFetch.length === 0) {
        console.log('[Info] No new games to fetch (all games in CSV matching criteria are already ingested).');
        return;
      }
    } catch (csvErr) {
      console.warn(`[CSV Warning] Failed to read CSV: ${csvErr.message}. Falling back to sequential ID lookup.`);
      
      // Fallback: Get MAX(bgg_id) from games table
      console.log('[DB] Fetching maximum bgg_id currently in the database...');
      const { data: maxGame, error: maxError } = await supabase
        .from('games')
        .select('bgg_id')
        .order('bgg_id', { ascending: false })
        .limit(1);
        
      if (maxError) {
        console.error('[DB Error] Failed to query games table:', maxError.message);
        process.exit(1);
      }
      
      let startId = 1;
      if (maxGame && maxGame.length > 0) {
        startId = maxGame[0].bgg_id + 1;
        console.log(`[DB] Found max bgg_id: ${maxGame[0].bgg_id}. Ingestion will start from ID: ${startId}`);
      } else {
        console.log('[DB] Table is empty. Ingestion will start from ID: 1');
      }
      
      idsToFetch = Array.from({ length: limit }, (_, i) => startId + i);
    }
  }
  
  console.log(`[Info] Preparing to fetch ${idsToFetch.length} games: ${idsToFetch.join(', ')}`);
  
  // 3. Process in chunks of 20 to avoid HTTP 414 URI Too Long and timing out on BGG API
  const chunkSize = 20;
  for (let i = 0; i < idsToFetch.length; i += chunkSize) {
    const chunk = idsToFetch.slice(i, i + chunkSize);
    console.log(`\n=== Processing chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(idsToFetch.length / chunkSize)} (IDs: ${chunk.join(', ')}) ===`);
    
    let xmlText;
    try {
      xmlText = await fetchBggBatch(chunk);
    } catch (err) {
      console.error(`[Error] Failed to fetch chunk starting with ID ${chunk[0]}:`, err.message);
      await sleep(5000);
      continue;
    }
    
    // 4. Parse XML to JSON
    console.log('[Parser] Parsing XML response...');
    const jsonObj = xmlParser.parse(xmlText);
    let xmlItems = jsonObj.items?.item;
    
    if (!xmlItems) {
      console.log('[Parser] No items returned in this chunk.');
      continue;
    }
    
    if (!Array.isArray(xmlItems)) {
      xmlItems = [xmlItems];
    }
    
    console.log(`[Parser] Parsed ${xmlItems.length} valid games from XML chunk.`);
    
    // 5. Process each game in chunk
    for (const item of xmlItems) {
      const bggId = Number(item['@_id']);
      
      // Parse title (always English/original — NEVER overwrite with Spanish)
      let names = item.name;
      if (!Array.isArray(names)) {
        names = [names];
      }
      const primaryNameObj = names.find(n => n?.['@_type'] === 'primary') || names[0];
      const title = sanitizeGameText(primaryNameObj?.['@_value']) || 'Unknown Game';
      
      // Parse stats
      const yearPublished = Number(item.yearpublished?.['@_value']) || null;
      const minPlayers = Number(item.minplayers?.['@_value']) || null;
      const maxPlayers = Number(item.maxplayers?.['@_value']) || null;
      const playingTime = Number(item.playingtime?.['@_value']) || null;

      // Parse BGG stats (ratings, rank, complexity)
      const stats = item.statistics?.ratings;
      const ratingGeek = stats?.bayesaverage?.['@_value'] ? Number(stats.bayesaverage['@_value']) : null;
      const ratingAverage = stats?.average?.['@_value'] ? Number(stats.average['@_value']) : null;
      const rawComplexity = stats?.averageweight?.['@_value'] ? Number(stats.averageweight['@_value']) : null;
      const complexity = rawComplexity && rawComplexity > 0 ? Number(rawComplexity.toFixed(2)) : null;
      
      let rank = null;
      if (stats?.ranks?.rank) {
        let ranksList = stats.ranks.rank;
        if (!Array.isArray(ranksList)) {
          ranksList = [ranksList];
        }
        const bgRankObj = ranksList.find(r => r?.['@_name'] === 'boardgame');
        const rankVal = bgRankObj?.['@_value'];
        if (rankVal && rankVal !== 'Not Ranked') {
          rank = Number(rankVal);
        }
      }
      
      // BGG Image URLs
      const origImageUrl = item.image || item.thumbnail || null;
      let imageUrlEs = null;
      let hasSpanishEdition = false;
      let titleEs = null;       // Spanish title
      let publisher = null;     // Original publisher
      let esPublisher = null;   // Spanish publisher
      
      // Parse expansion status and base game ID
      const isExpansion = item['@_type'] === 'boardgameexpansion';
      let bggBaseGameId = null;
      let links = item.link;
      if (!links) {
        links = [];
      } else if (!Array.isArray(links)) {
        links = [links];
      }

      // Extract original publisher from main game links
      const publisherLink = links.find(l => l['@_type'] === 'boardgamepublisher');
      if (publisherLink) {
        publisher = sanitizeGameText(publisherLink['@_value']);
      }
      
      if (isExpansion) {
        const baseGameLink = links.find(l => l['@_type'] === 'boardgameexpansion' && l['@_inbound'] === 'true');
        if (baseGameLink) {
          bggBaseGameId = Number(baseGameLink['@_id']);
          console.log(`[Parser] Detected expansion of base game BGG ID: ${bggBaseGameId}`);
        }
      }

      // Check for Spanish version and specific cover/publisher
      let esYearPublished = null;
      if (item.versions && item.versions.item) {
        const spanishVersion = selectBestSpanishVersion(item.versions.item);

        if (spanishVersion) {
          hasSpanishEdition = true;

          const rawEsYear = Number(spanishVersion.yearpublished?.['@_value']);
          esYearPublished = rawEsYear && rawEsYear > 1900 ? rawEsYear : yearPublished;

          // Try to extract Spanish title (does NOT modify title — only sets title_es)
          const canonicalSpanishTitle = spanishVersion.canonicalname?.['@_value'];
          let candidateTitle = canonicalSpanishTitle;
          if (!candidateTitle) {
            let sNames = spanishVersion.name;
            if (sNames) {
              if (!Array.isArray(sNames)) sNames = [sNames];
              const pName = sNames.find(n => n?.['@_type'] === 'primary') || sNames[0];
              candidateTitle = pName?.['@_value'];
            }
          }

          const cleanedCandidate = sanitizeGameText(candidateTitle);
          if (cleanedCandidate) {
            if (!isGenericEditionName(cleanedCandidate)) {
              titleEs = cleanedCandidate;
              console.log(`[Parser] Spanish title (canonical): ${titleEs} (original: ${title})`);
            } else {
              console.log(`[Parser] Spanish version title "${cleanedCandidate}" is generic. Keeping English title: ${title}`);
            }
          }

          if (spanishVersion.image || spanishVersion.thumbnail) {
            imageUrlEs = spanishVersion.image || spanishVersion.thumbnail;
            console.log(`[Parser] Found Spanish version with specific cover: ${imageUrlEs}`);
          }
          
          let links = spanishVersion.link;
          if (!Array.isArray(links)) links = [links];
          const publisherLink = links.find(l => l['@_type'] === 'boardgamepublisher');
          if (publisherLink) {
            esPublisher = sanitizeGameText(publisherLink['@_value']);
            console.log(`[Parser] Spanish publisher: ${esPublisher}`);
          }
        }
      }
      
      console.log(`\n--- Processing game: ${title} (BGG ID: ${bggId}) ---`);
      
      // 6. Insert into Supabase games table (direct BGG CDN URLs to avoid Storage quotas)
      console.log(`[DB] Inserting/Upserting ${title} into games...`);
      const { data: insertedData, error: insertError } = await supabase
        .from('games')
        .upsert({
          bgg_id: bggId,
          title,             // English/original — never changes
          title_es: titleEs, // Spanish title (null if no Spanish edition)
          publisher,         // Original publisher
          year_published: yearPublished,
          es_year_published: esYearPublished,
          image_url: origImageUrl,
          image_url_es: imageUrlEs,
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
        }, { onConflict: 'bgg_id' })
        .select('*');
        
      if (insertError) {
        console.error(`[DB Error] Failed to insert ${title}:`, insertError.message);
      } else {
        console.log(`[DB] Successfully saved ${title}.`);
      }
    }
    
    // Delay between BGG requests to avoid hitting rate limits
    await sleep(2500);
  }
  
  // 7. Resolve base_game_id (UUID) from bgg_base_game_id (integer)
  console.log('\n[Link] Resolving base game UUIDs for expansions...');
  const { data: expansions, error: selectExpError } = await supabase
    .from('games')
    .select('id, bgg_base_game_id')
    .eq('is_expansion', true)
    .is('base_game_id', null)
    .not('bgg_base_game_id', 'is', null);

  if (selectExpError) {
    console.error('[Link Error] Failed to select unlinked expansions:', selectExpError.message);
  } else if (expansions && expansions.length > 0) {
    console.log(`[Link] Found ${expansions.length} unlinked expansions. Processing...`);
    for (const exp of expansions) {
      const { data: baseGames, error: selectBaseError } = await supabase
        .from('games')
        .select('id, title')
        .eq('bgg_id', exp.bgg_base_game_id)
        .limit(1);

      if (selectBaseError) {
        console.error(`[Link Error] Failed to find base game for BGG ID ${exp.bgg_base_game_id}:`, selectBaseError.message);
      } else if (baseGames && baseGames.length > 0) {
        const { error: updateError } = await supabase
          .from('games')
          .update({ base_game_id: baseGames[0].id })
          .eq('id', exp.id);

        if (updateError) {
          console.error(`[Link Error] Failed to link expansion (ID: ${exp.id}):`, updateError.message);
        } else {
          console.log(`[Link] Linked expansion successfully to "${baseGames[0].title}" (UUID: ${baseGames[0].id})`);
        }
      }
    }
  } else {
    console.log('[Link] No unlinked expansions found.');
  }
  
  console.log('\n=== Ingestion batch completed successfully ===');
}

// Read CLI argument for batch size, default to 10
const args = process.argv.slice(2);
const limitArg = args.find(arg => arg.startsWith('--limit='));
const batchLimit = limitArg ? Number(limitArg.split('=')[1]) : 10;

const idsArg = args.find(arg => arg.startsWith('--ids='));
const targetIds = idsArg ? idsArg.split('=')[1].split(',').map(Number) : null;

const useRecent = args.includes('--recent');

runIngestion(batchLimit, targetIds, useRecent).catch(err => {
  console.error('[Fatal Error]:', err);
});
