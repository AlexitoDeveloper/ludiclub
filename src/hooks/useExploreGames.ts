import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Game } from '../types'
import { USE_MOCKS } from '../lib/config'

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function seedShuffle<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  let m = shuffled.length, t, i;
  while (m) {
    i = Math.floor(pseudoRandom(seed + m) * m--);
    t = shuffled[m];
    shuffled[m] = shuffled[i];
    shuffled[i] = t;
  }
  return shuffled;
}

function getDayOfYearSeed(): number {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = now.getTime() - start.getTime()
  const oneDay = 1000 * 60 * 60 * 24
  return Math.floor(diff / oneDay)
}

// Mock data fallbacks for community rankings
const MOCK_COMMUNITY_RANKINGS = [
  {
    id: 'mock-r1',
    user_id: 'mock-u1',
    title: 'Mis Euros Favoritos',
    mode: 'tier',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      username: 'boardgamer_alex',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'
    }
  },
  {
    id: 'mock-r2',
    user_id: 'mock-u3',
    title: 'Wargames Imprescindibles',
    mode: 'top10',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      username: 'hex_and_counter',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=HexCounter'
    }
  },
  {
    id: 'mock-r3',
    user_id: 'mock-u2',
    title: 'Party Games Divertidos',
    mode: 'tier',
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      username: 'meeple_sara',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sara'
    }
  }
]

const CAROUSEL_FIELDS = 'bgg_id, title, title_es, publisher, es_publisher, has_spanish_edition, year_published, image_url, image_url_es, min_players, max_players, playing_time, is_expansion, bgg_rank, rating_geek, rating_average, complexity'
const EXTENDED_CAROUSEL_FIELDS = `${CAROUSEL_FIELDS}, es_release_date, es_year_published`

interface ExploreCarouselData {
  novedades: Game[];
  upcomingGames: Game[];
  paraDos: Game[];
  classics: Game[];
  fastGames: Game[];
  heavyGames: Game[];
  partyGames: Game[];
  top10: Game[];
  top10Month: Game[];
  communityRankings: any[];
  featuredGame: Game | null;
}

let exploreCache: { timestamp: number; data: ExploreCarouselData } | null = null
const EXPLORE_CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

// Helper function to fetch community rankings
async function fetchCommunityRankings(): Promise<any[]> {
  if (USE_MOCKS) return MOCK_COMMUNITY_RANKINGS
  try {
    const { data, error } = await supabase
      .from('user_rankings')
      .select('id, title, mode, user_id, created_at, user:users (username, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(10)
    if (error) throw error
    return data || []
  } catch (err) {
    console.warn('Could not query user_rankings from DB, falling back to mocks:', err)
    return MOCK_COMMUNITY_RANKINGS
  }
}

// Helper function to fetch user's owned game IDs so daily recommendations prioritize discovery
async function fetchUserOwnedGameIds(): Promise<Set<number>> {
  if (USE_MOCKS) return new Set()
  try {
    const sessionRes = await supabase.auth?.getSession?.()
    const userId = sessionRes?.data?.session?.user?.id
    if (!userId) return new Set()

    const { data, error } = await supabase
      .from('user_collection')
      .select('game_id')
      .eq('user_id', userId)

    if (error || !data) return new Set()
    return new Set(
      data.map((row: { game_id: number }) => Number(row.game_id)).filter(Boolean)
    )
  } catch {
    return new Set()
  }
}

/**
 * Fetches both "Novedades en España" (recent releases, base games + expansions)
 * and "Próximamente en España" (releasing in the next 1-2 months, base games + expansions).
 * Gracefully falls back if `es_release_date` / `es_year_published` migration has not been run yet.
 */
async function fetchSpanishReleasesAndUpcoming(
  currentYear: number,
  daySeed: number
): Promise<{ novedades: Game[]; upcomingGames: Game[] }> {
  const todayIso = new Date().toISOString().slice(0, 10)
  const recentCutoffDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
  const recentCutoffIso = recentCutoffDate.toISOString().slice(0, 10)
  const recentCutoffYear = recentCutoffDate.getFullYear()
  const upcomingCutoffIso = new Date(Date.now() + 65 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const dedupeGames = (list: Game[]): Game[] => {
    const map = new Map<number, Game>()
    for (const g of list) {
      const id = Number(g?.bgg_id)
      if (id && !map.has(id)) map.set(id, g)
    }
    return Array.from(map.values())
  }

  try {
    const [datedNovRes, yearNovRes, datedUpcRes, yearUpcRes] = await Promise.all([
      // 1. Exact recent Spanish releases (rolling 60-day window, base + expansions)
      supabase
        .from('games')
        .select(EXTENDED_CAROUSEL_FIELDS)
        .eq('has_spanish_edition', true)
        .not('es_release_date', 'is', null)
        .gte('year_published', recentCutoffYear)
        .or(`es_year_published.gte.${recentCutoffYear},es_year_published.is.null`)
        .lte('es_release_date', todayIso)
        .gte('es_release_date', recentCutoffIso)
        .order('es_release_date', { ascending: false })
        .limit(25),
      // 2. Active Spanish editions within the rolling cutoff year
      supabase
        .from('games')
        .select(EXTENDED_CAROUSEL_FIELDS)
        .eq('has_spanish_edition', true)
        .gte('year_published', recentCutoffYear)
        .lte('year_published', currentYear)
        .or(`es_year_published.gte.${recentCutoffYear},es_year_published.is.null`)
        .order('es_year_published', { ascending: false, nullsFirst: false })
        .order('rating_average', { ascending: false, nullsFirst: false })
        .limit(50),
      // 3. Exact upcoming Spanish releases (next 1-2 months, base + expansions)
      supabase
        .from('games')
        .select(EXTENDED_CAROUSEL_FIELDS)
        .not('es_release_date', 'is', null)
        .gte('year_published', currentYear)
        .gt('es_release_date', todayIso)
        .lte('es_release_date', upcomingCutoffIso)
        .order('es_release_date', { ascending: true })
        .limit(25),
      // 4. Announced future-year editions (base + expansions)
      supabase
        .from('games')
        .select(EXTENDED_CAROUSEL_FIELDS)
        .or(`es_year_published.gt.${currentYear},year_published.gt.${currentYear}`)
        .gte('year_published', currentYear)
        .order('year_published', { ascending: true, nullsFirst: false })
        .limit(40)
    ])

    // If the new columns exist and succeeded:
    if (!datedNovRes.error && !yearNovRes.error) {
      const exactRecent = (datedNovRes.data || []) as Game[]
      const yearPool = seedShuffle((yearNovRes.data || []) as Game[], daySeed)
      const novedades = dedupeGames([...exactRecent, ...yearPool]).slice(0, 15)

      const exactUpcoming = (datedUpcRes.data || []) as Game[]
      const futureYearPool = seedShuffle((yearUpcRes.data || []) as Game[], daySeed + 7)
      const upcomingGames = dedupeGames([...exactUpcoming, ...futureYearPool]).slice(0, 15)

      if (novedades.length > 0 || upcomingGames.length > 0) {
        return { novedades, upcomingGames }
      }
    }
  } catch {
    // Fall through to pre-migration query below
  }

  // Fallback when `es_release_date` migration has not been applied yet
  const [fallbackNovRes, fallbackUpcRes] = await Promise.all([
    supabase
      .from('games')
      .select(CAROUSEL_FIELDS)
      .eq('has_spanish_edition', true)
      .gte('year_published', recentCutoffYear)
      .lte('year_published', currentYear)
      .order('year_published', { ascending: false, nullsFirst: false })
      .order('rating_average', { ascending: false, nullsFirst: false })
      .limit(50),
    supabase
      .from('games')
      .select(CAROUSEL_FIELDS)
      .gt('year_published', currentYear)
      .order('year_published', { ascending: true, nullsFirst: false })
      .limit(35)
  ])

  let novPool = (fallbackNovRes.data || []) as Game[]
  if (novPool.length === 0) {
    // Ultimate fallback for test mocks that only stub a basic query
    const basicNov = await supabase
      .from('games')
      .select(CAROUSEL_FIELDS)
      .eq('has_spanish_edition', true)
      .order('year_published', { ascending: false })
      .limit(20)
    if (basicNov.error) throw basicNov.error
    novPool = (basicNov.data || []) as Game[]
  }

  const novedades = seedShuffle(novPool, daySeed).slice(0, 15)
  const upcomingGames = seedShuffle((fallbackUpcRes.data || []) as Game[], daySeed + 7).slice(0, 15)

  return { novedades, upcomingGames }
}

// Helper function to fetch most played games with robust fallback mechanism
async function fetchMostPlayedGames(timeLimitIso: string | null): Promise<Game[]> {
  try {
    if (USE_MOCKS) {
      throw new Error('Using mock mode')
    }

    const { data, error } = await supabase.rpc('get_most_played_games', { p_time_limit_iso: timeLimitIso })
    if (error) throw error
    return (data || []) as Game[]
  } catch (err) {
    // Return BGG top rank games as absolute fallback
    try {
      const { data } = await supabase
        .from('games')
        .select(CAROUSEL_FIELDS)
        .not('bgg_rank', 'is', null)
        .order('bgg_rank', { ascending: true })
        .limit(10)
      return (data || []) as Game[]
    } catch {
      return []
    }
  }
}

export function useExploreGames(
  search: string,
  playerFilter: string,
  complexityFilter: string,
  spanishOnly: boolean
) {
  const [loadingCarousels, setLoadingCarousels] = useState(() => {
    // If cache is fresh, don't show skeleton
    return !(exploreCache && Date.now() - exploreCache.timestamp < EXPLORE_CACHE_TTL_MS)
  })
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Carousel categories state (hydrated from cache if available)
  const [novedades, setNovedades] = useState<Game[]>(() => exploreCache?.data.novedades || [])
  const [upcomingGames, setUpcomingGames] = useState<Game[]>(() => exploreCache?.data.upcomingGames || [])
  const [paraDos, setParaDos] = useState<Game[]>(() => exploreCache?.data.paraDos || [])
  const [classics, setClassics] = useState<Game[]>(() => exploreCache?.data.classics || [])
  const [fastGames, setFastGames] = useState<Game[]>(() => exploreCache?.data.fastGames || [])
  const [heavyGames, setHeavyGames] = useState<Game[]>(() => exploreCache?.data.heavyGames || [])
  const [partyGames, setPartyGames] = useState<Game[]>(() => exploreCache?.data.partyGames || [])
  const [top10, setTop10] = useState<Game[]>(() => exploreCache?.data.top10 || [])
  const [top10Month, setTop10Month] = useState<Game[]>(() => exploreCache?.data.top10Month || [])
  const [communityRankings, setCommunityRankings] = useState<any[]>(() => exploreCache?.data.communityRankings || [])
  const [featuredGame, setFeaturedGame] = useState<Game | null>(() => exploreCache?.data.featuredGame || null)
  const [activeMeetups] = useState<any[]>([])

  // Search grid results state
  const [searchResults, setSearchResults] = useState<Game[]>([])

  const isFiltering = !!(search.trim() || playerFilter || complexityFilter || spanishOnly)

  // 1. Fetch idle carousels data once on mount (single parallel round-trip)
  useEffect(() => {
    // If cache is valid, skip network fetch entirely
    if (exploreCache && Date.now() - exploreCache.timestamp < EXPLORE_CACHE_TTL_MS) {
      setLoadingCarousels(false)
      return
    }

    async function fetchCarousels() {
      setLoadingCarousels(true)
      setError(null)
      try {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        const currentYear = new Date().getFullYear()
        const daySeed = getDayOfYearSeed()
        const yearSeed = currentYear

        // Execute all category, ranking & collection queries concurrently in a single network round-trip
        const [
          spanishReleases,
          dosRes,
          claRes,
          fastRes,
          heavyRes,
          partyRes,
          commRankingsData,
          weekRes,
          monthRes,
          ownedGameIds
        ] = await Promise.all([
          // Novedades en España & Próximamente (1-2 months, base games + expansions)
          fetchSpanishReleasesAndUpcoming(currentYear, daySeed),
          // paraDos (strictly 2-player games so 1-4p Euros don't duplicate Classics/Heavy)
          supabase
            .from('games')
            .select(CAROUSEL_FIELDS)
            .eq('is_expansion', false)
            .eq('min_players', 2)
            .eq('max_players', 2)
            .not('rating_geek', 'is', null)
            .order('rating_geek', { ascending: false })
            .limit(60),
          // classics (established base games published at least 3 years ago)
          supabase
            .from('games')
            .select(CAROUSEL_FIELDS)
            .eq('is_expansion', false)
            .lte('year_published', currentYear - 3)
            .not('rating_geek', 'is', null)
            .order('rating_geek', { ascending: false })
            .limit(60),
          // fastGames (<= 30 min & light/medium-light complexity <= 2.5)
          supabase
            .from('games')
            .select(CAROUSEL_FIELDS)
            .eq('is_expansion', false)
            .lte('playing_time', 30)
            .gt('playing_time', 0)
            .lte('complexity', 2.5)
            .not('rating_geek', 'is', null)
            .order('rating_geek', { ascending: false })
            .limit(60),
          // heavyGames (complexity >= 3.2)
          supabase
            .from('games')
            .select(CAROUSEL_FIELDS)
            .eq('is_expansion', false)
            .gte('complexity', 3.2)
            .not('rating_geek', 'is', null)
            .order('rating_geek', { ascending: false })
            .limit(60),
          // partyGames (max_players >= 6, accessible complexity <= 2.3, playing_time <= 60)
          supabase
            .from('games')
            .select(CAROUSEL_FIELDS)
            .eq('is_expansion', false)
            .gte('max_players', 6)
            .lte('complexity', 2.3)
            .lte('playing_time', 60)
            .not('rating_geek', 'is', null)
            .order('rating_geek', { ascending: false })
            .limit(60),
          // community rankings
          fetchCommunityRankings(),
          // top 10 week & month
          fetchMostPlayedGames(oneWeekAgo),
          fetchMostPlayedGames(oneMonthAgo),
          // user owned game IDs (to exclude from daily recommendation)
          fetchUserOwnedGameIds()
        ])

        if (dosRes.error) throw dosRes.error
        if (claRes.error) throw claRes.error

        // 1. Recommended Game of the Day:
        // Build a diverse, deduplicated multi-category pool (excluding expansions),
        // filter out games already in the user's collection, and shuffle by year seed.
        const rawCandidates = [
          ...(claRes.data || []),
          ...(dosRes.data || []),
          ...(fastRes.data || []),
          ...(heavyRes.data || []),
          ...(partyRes.data || []),
          ...spanishReleases.novedades
        ] as Game[]

        const uniqueMap = new Map<number, Game>()
        for (const game of rawCandidates) {
          const id = Number(game.bgg_id)
          if (!id || game.is_expansion) continue
          if (!uniqueMap.has(id)) {
            uniqueMap.set(id, game)
          }
        }

        const allUniqueCandidates = Array.from(uniqueMap.values())
        const unownedCandidates = allUniqueCandidates.filter(
          (g) => !ownedGameIds.has(Number(g.bgg_id))
        )
        const effectivePool = unownedCandidates.length > 0 ? unownedCandidates : allUniqueCandidates
        const shuffledFeaturedPool = seedShuffle(effectivePool, yearSeed)

        const recommendedOfTheDay: Game | null =
          shuffledFeaturedPool.length > 0
            ? shuffledFeaturedPool[daySeed % shuffledFeaturedPool.length]
            : null

        // 2. Top 10 Week & Month (suppress Month if >= 80% identical to Week fallback)
        const weekGames = weekRes || []
        const rawMonthGames = monthRes || []
        const weekIds = new Set(weekGames.map((g) => Number(g.bgg_id)))
        const monthOverlapCount = rawMonthGames.filter((g) => weekIds.has(Number(g.bgg_id))).length
        const monthGames =
          rawMonthGames.length > 0 && monthOverlapCount / rawMonthGames.length >= 0.8
            ? []
            : rawMonthGames

        // 3. Cascading deduplication across carousels so the same game doesn't repeat in multiple rows
        const seenCarouselIds = new Set<number>()
        if (recommendedOfTheDay?.bgg_id) {
          seenCarouselIds.add(Number(recommendedOfTheDay.bgg_id))
        }
        weekGames.forEach((g) => seenCarouselIds.add(Number(g.bgg_id)))

        const pickUniqueCarousel = (pool: Game[], seed: number, limit = 15): Game[] => {
          const shuffled = seedShuffle(pool, seed)
          const unseen: Game[] = []
          const seenFallback: Game[] = []

          for (const g of shuffled) {
            const id = Number(g.bgg_id)
            if (!seenCarouselIds.has(id)) {
              unseen.push(g)
            } else {
              seenFallback.push(g)
            }
          }

          const selected = [...unseen, ...seenFallback].slice(0, limit)
          selected.forEach((g) => seenCarouselIds.add(Number(g.bgg_id)))
          return selected
        }

        const shuffledNovedades = spanishReleases.novedades
        shuffledNovedades.forEach((g) => seenCarouselIds.add(Number(g.bgg_id)))

        const shuffledUpcoming = spanishReleases.upcomingGames.filter(
          (g) => !seenCarouselIds.has(Number(g.bgg_id))
        )
        shuffledUpcoming.forEach((g) => seenCarouselIds.add(Number(g.bgg_id)))

        const shuffledFast = pickUniqueCarousel((fastRes.data || []) as Game[], daySeed + 3, 15)
        const shuffledParaDos = pickUniqueCarousel((dosRes.data || []) as Game[], daySeed + 1, 15)
        const shuffledHeavy = pickUniqueCarousel((heavyRes.data || []) as Game[], daySeed + 4, 15)
        const shuffledParty = pickUniqueCarousel((partyRes.data || []) as Game[], daySeed + 5, 15)
        const shuffledClassics = pickUniqueCarousel((claRes.data || []) as Game[], daySeed + 2, 15)

        const cachePayload: ExploreCarouselData = {
          novedades: shuffledNovedades,
          upcomingGames: shuffledUpcoming,
          paraDos: shuffledParaDos,
          classics: shuffledClassics,
          fastGames: shuffledFast,
          heavyGames: shuffledHeavy,
          partyGames: shuffledParty,
          top10: weekGames,
          top10Month: monthGames,
          communityRankings: commRankingsData,
          featuredGame: recommendedOfTheDay
        }

        // Save to cache
        exploreCache = {
          timestamp: Date.now(),
          data: cachePayload
        }

        setNovedades(shuffledNovedades)
        setUpcomingGames(shuffledUpcoming)
        setParaDos(shuffledParaDos)
        setClassics(shuffledClassics)
        setFastGames(shuffledFast)
        setHeavyGames(shuffledHeavy)
        setPartyGames(shuffledParty)
        setTop10(weekGames)
        setTop10Month(monthGames)
        setCommunityRankings(commRankingsData)
        setFeaturedGame(recommendedOfTheDay)
      } catch (err: any) {
        console.error('Error fetching carousels:', err)
        setError(err.message || 'Error al cargar carruseles')
      } finally {
        setLoadingCarousels(false)
      }
    }

    fetchCarousels()
  }, [])

  // 2. Fetch filtered query with debounce for text search and filter pills
  const fetchFilteredGames = useCallback(async () => {
    setLoadingSearch(true)
    setError(null)
    try {
      let query = supabase.from('games').select('*')

      if (search.trim()) {
        query = query.or(`title.ilike.%${search.trim()}%,title_es.ilike.%${search.trim()}%`)
      }

      if (spanishOnly) {
        query = query.eq('has_spanish_edition', true)
      }

      if (playerFilter) {
        if (playerFilter === '1') {
          query = query.lte('min_players', 1).gte('max_players', 1)
        } else if (playerFilter === '2') {
          query = query.lte('min_players', 2).gte('max_players', 2)
        } else if (playerFilter === '3-4') {
          query = query.or('and(min_players.lte.3,max_players.gte.3),and(min_players.lte.4,max_players.gte.4)')
        } else if (playerFilter === '5+') {
          query = query.gte('max_players', 5)
        }
      }

      if (complexityFilter) {
        if (complexityFilter === 'familiar') {
          query = query.lte('complexity', 2.2)
        } else if (complexityFilter === 'medio') {
          query = query.gt('complexity', 2.2).lte('complexity', 3.5)
        } else if (complexityFilter === 'experto') {
          query = query.gt('complexity', 3.5)
        }
      }

      // Order by rank first, then geek rating
      query = query.order('bgg_rank', { ascending: true, nullsFirst: false }).limit(40)

      const { data, error: fetchErr } = await query
      if (fetchErr) throw fetchErr

      setSearchResults(data || [])
    } catch (err: any) {
      console.error('Error fetching search results:', err)
      setError(err.message || 'Error en la búsqueda')
    } finally {
      setLoadingSearch(false)
    }
  }, [search, playerFilter, complexityFilter, spanishOnly])

  // Track previous search to only debounce when typing text
  const prevSearchRef = useRef(search)

  useEffect(() => {
    if (isFiltering) {
      setLoadingSearch(true)
      const isTextTyping = prevSearchRef.current !== search
      prevSearchRef.current = search

      const delay = isTextTyping ? 300 : 0
      const handler = setTimeout(() => {
        fetchFilteredGames()
      }, delay)
      return () => clearTimeout(handler)
    } else {
      prevSearchRef.current = search
      setSearchResults([])
      setLoadingSearch(false)
    }
  }, [isFiltering, search, fetchFilteredGames])

  return {
    loadingCarousels,
    loadingSearch,
    error,
    novedades,
    upcomingGames,
    paraDos,
    classics,
    fastGames,
    heavyGames,
    partyGames,
    top10,
    top10Month,
    communityRankings,
    searchResults,
    isFiltering,
    featuredGame,
    activeMeetups
  }
}
export default useExploreGames;
