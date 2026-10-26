import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { Game } from '../types'
import { MOCK_BGG_GAMES } from '../lib/mockData'
import { USE_MOCKS } from '../lib/config'
import { useTopsPlacement, DEFAULT_TIERS, Tier } from './useTopsPlacement'
import { useTopsExport } from './useTopsExport'
import { useTopsCollection, SavedRankingItem } from './useTopsCollection'

export type { Tier, SavedRankingItem }
export type { ActiveTarget } from './useTopsPlacement'

export function useTops() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [mode, setModeState] = useState<'tier' | 'top10'>('tier')
  const [rankingTitle, setRankingTitle] = useState('Mi Ranking de Juegos')
  const [activeRankingId, setActiveRankingId] = useState<string | null>(null)

  // Appearance & watermark options
  const [showWatermark, setShowWatermark] = useState(true)
  const [customWatermark, setCustomWatermark] = useState('')
  const [selectedBg, setSelectedBg] = useState('default')
  const [aspectRatio, setAspectRatio] = useState<'standard' | 'square' | 'story' | 'landscape'>('standard')

  // Search catalog state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Game[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Sub-hooks
  const placement = useTopsPlacement(mode)
  const collection = useTopsCollection()
  const exporter = useTopsExport(rankingTitle)

  // Switch mode wrapper ensuring active target stays consistent
  const setMode = useCallback((newMode: 'tier' | 'top10') => {
    setModeState(newMode)
    placement.setSelectedGameForPlacement(null)
    placement.setActiveTarget(newMode === 'tier' ? { type: 'tier', tierId: 'S' } : { type: 'top10', index: 0 })
  }, [placement])

  // Load a saved ranking into the studio
  const loadRanking = useCallback((ranking: SavedRankingItem) => {
    setActiveRankingId(ranking.id)
    setRankingTitle(ranking.title || 'Mi Ranking')
    setModeState(ranking.mode || 'tier')
    
    if (ranking.data?.tiers && ranking.mode === 'tier') {
      placement.setTiers(ranking.data.tiers)
    } else if (ranking.mode === 'tier') {
      placement.setTiers(DEFAULT_TIERS)
    }

    if (ranking.data?.top10 && ranking.mode === 'top10') {
      placement.setTop10(ranking.data.top10)
    } else if (ranking.mode === 'top10') {
      placement.setTop10(Array(10).fill(null))
    }

    if (ranking.data?.selectedBg) setSelectedBg(ranking.data.selectedBg)
    if (ranking.data?.aspectRatio) setAspectRatio(ranking.data.aspectRatio)

    placement.setActiveTarget(ranking.mode === 'top10' ? { type: 'top10', index: 0 } : { type: 'tier', tierId: 'S' })
    setSearchParams({ load: ranking.id }, { replace: true })
  }, [placement, setSearchParams])

  // Start fresh ranking
  const startNewRanking = useCallback(() => {
    setActiveRankingId(null)
    setRankingTitle('Mi Ranking de Juegos')
    placement.handleClearAll()
    placement.setActiveTarget(mode === 'tier' ? { type: 'tier', tierId: 'S' } : { type: 'top10', index: 0 })
    setSearchParams({}, { replace: true })
  }, [mode, placement, setSearchParams])

  // Check URL ?load= on initial load
  const hasLoadedUrlParam = useRef(false)
  useEffect(() => {
    const loadId = searchParams.get('load')
    if (!loadId || hasLoadedUrlParam.current) return

    if (collection.savedRankings.length > 0) {
      const match = collection.savedRankings.find(r => r.id === loadId)
      if (match) {
        loadRanking(match)
        hasLoadedUrlParam.current = true
      }
    }
  }, [searchParams, collection.savedRankings, loadRanking])

  // Debounced search on type
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim()) {
        executeSearch(searchQuery.trim())
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  const executeSearch = async (query: string) => {
    setIsSearching(true)
    setErrorMsg('')
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .ilike('title', `%${query}%`)
        .order('year_published', { ascending: false, nullsFirst: false })
        .limit(15)

      if (error) throw error

      if (data && data.length > 0) {
        setSearchResults(data as Game[])
      } else if (USE_MOCKS) {
        const filtered = MOCK_BGG_GAMES.filter(g =>
          g.name.toLowerCase().includes(query.toLowerCase())
        ).map(g => ({
          bgg_id: Number(g.bgg_id),
          title: g.name,
          year_published: g.year,
          image_url: g.image_url.startsWith('/') ? null : g.image_url
        }))
        setSearchResults(filtered)
        if (filtered.length === 0) setErrorMsg('No se encontraron juegos con ese título.')
      } else {
        setErrorMsg('No se encontraron juegos con ese título.')
      }
    } catch {
      setErrorMsg('Error al buscar juegos.')
    } finally {
      setIsSearching(false)
    }
  }

  // Save current studio design
  const handleSaveToProfile = async () => {
    const savedId = await collection.saveRanking({
      id: activeRankingId,
      title: rankingTitle,
      mode,
      tiers: placement.tiers,
      top10: placement.top10,
      selectedBg,
      aspectRatio,
    })
    if (savedId) {
      setActiveRankingId(savedId)
      setSearchParams({ load: savedId }, { replace: true })
    }
  }

  return {
    mode,
    setMode,
    rankingTitle,
    setRankingTitle,
    activeRankingId,
    loadRanking,
    startNewRanking,
    // Collection & Saved rankings
    collectionGames: collection.collectionGames,
    loadingCollection: collection.loadingCollection,
    savedRankings: collection.savedRankings,
    loadingRankings: collection.loadingRankings,
    saving: collection.saving,
    saveSuccess: collection.saveSuccess,
    handleSaveToProfile,
    // Search
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    isSearching,
    errorMsg,
    setErrorMsg,
    // Placement & layout
    pool: placement.pool,
    selectedGameForPlacement: placement.selectedGameForPlacement,
    setSelectedGameForPlacement: placement.setSelectedGameForPlacement,
    activeTarget: placement.activeTarget,
    setActiveTarget: placement.setActiveTarget,
    tiers: placement.tiers,
    top10: placement.top10,
    addToPool: placement.addToPool,
    removeFromPool: placement.removeFromPool,
    selectGame: placement.selectGame,
    placeInTier: placement.placeInTier,
    placeInTop10: placement.placeInTop10,
    quickPlaceGame: placement.quickPlaceGame,
    moveTop10Slot: placement.moveTop10Slot,
    moveTierGame: placement.moveTierGame,
    returnTierGameToPool: placement.returnTierGameToPool,
    returnTop10GameToPool: placement.returnTop10GameToPool,
    editTierName: placement.editTierName,
    handleClearAll: placement.handleClearAll,
    handleClearPool: placement.handleClearPool,
    handleDragStart: placement.handleDragStart,
    handleDropOnTier: placement.handleDropOnTier,
    handleDropOnTop10: placement.handleDropOnTop10,
    handleDropOnPool: placement.handleDropOnPool,
    // Export & Appearance
    exporting: exporter.exporting,
    isExportingCanvas: exporter.isExportingCanvas,
    exportAreaRef: exporter.exportAreaRef,
    handleExportImage: exporter.handleExportImage,
    showWatermark,
    setShowWatermark,
    customWatermark,
    setCustomWatermark,
    selectedBg,
    setSelectedBg,
    aspectRatio,
    setAspectRatio,
  }
}
