import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/authContext'
import { Game } from '../types'
import { toast } from '../components/ui/toast'
import i18n from '../lib/i18n'

export interface SavedRankingItem {
  id: string;
  user_id: string;
  title: string;
  mode: 'tier' | 'top10';
  created_at?: string;
  data: {
    tiers?: any[];
    top10?: any[];
    selectedBg?: string;
    aspectRatio?: 'standard' | 'square' | 'story' | 'landscape';
  };
}

export function useTopsCollection() {
  const { user } = useAuth()
  const [collectionGames, setCollectionGames] = useState<Game[]>([])
  const [loadingCollection, setLoadingCollection] = useState(false)
  
  const [savedRankings, setSavedRankings] = useState<SavedRankingItem[]>([])
  const [loadingRankings, setLoadingRankings] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // 1. Fetch personal collection
  const fetchCollection = useCallback(async () => {
    if (!user) {
      setCollectionGames([])
      return
    }

    setLoadingCollection(true)
    try {
      const { data, error } = await supabase
        .from('user_collection')
        .select('game_id, bgg_id, games (*)')
        .eq('user_id', user.id)

      if (!error && data) {
        const gamesList = data
          .map((row: any) => (Array.isArray(row.games) ? row.games[0] : row.games))
          .filter(Boolean) as Game[]

        setCollectionGames(gamesList)
      } else {
        // Fallback: check localStorage for cached collection
        const localKey = `ludiclub_collection_${user.id}`
        const cached = localStorage.getItem(localKey)
        if (cached) {
          try {
            setCollectionGames(JSON.parse(cached))
          } catch {
            setCollectionGames([])
          }
        }
      }
    } catch (err) {
      console.warn('Could not load user collection for Tops:', err)
      setCollectionGames([])
    } finally {
      setLoadingCollection(false)
    }
  }, [user])

  // 2. Fetch saved rankings
  const fetchSavedRankings = useCallback(async () => {
    if (!user) {
      setSavedRankings([])
      return
    }

    setLoadingRankings(true)
    const localKey = `ludiclub_saved_rankings_${user.id}`
    const legacyKey = `boardgame_social_saved_rankings_${user.id}`
    const localStr = localStorage.getItem(localKey) || localStorage.getItem(legacyKey)
    let localItems: SavedRankingItem[] = []
    if (localStr) {
      try {
        localItems = JSON.parse(localStr)
      } catch {
        localItems = []
      }
    }

    try {
      const { data, error } = await supabase
        .from('user_rankings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!error && data && data.length > 0) {
        // Merge Supabase + local items (deduplicating by id)
        const combined = [...data] as SavedRankingItem[]
        localItems.forEach(item => {
          if (!combined.some(c => c.id === item.id)) {
            combined.push(item)
          }
        })
        setSavedRankings(combined)
      } else {
        setSavedRankings(localItems)
      }
    } catch (err) {
      console.warn('Could not query user_rankings from Supabase, using localStorage:', err)
      setSavedRankings(localItems)
    } finally {
      setLoadingRankings(false)
    }
  }, [user])

  useEffect(() => {
    fetchCollection()
    fetchSavedRankings()
  }, [fetchCollection, fetchSavedRankings])

  // Save or update ranking
  const saveRanking = useCallback(async (
    rankingPayload: {
      id?: string | null;
      title: string;
      mode: 'tier' | 'top10';
      tiers: any[];
      top10: any[];
      selectedBg: string;
      aspectRatio: 'standard' | 'square' | 'story' | 'landscape';
    }
  ) => {
    if (!user) {
      toast.error(i18n.t('auth.loginRequired', 'Inicia sesión para guardar rankings en tu perfil.'))
      return null
    }

    setSaving(true)
    setSaveSuccess(false)

    const payload = {
      user_id: user.id,
      title: rankingPayload.title.trim() || i18n.t('tops.untitled', 'Mi Ranking'),
      mode: rankingPayload.mode,
      data: {
        tiers: rankingPayload.mode === 'tier' ? rankingPayload.tiers : [],
        top10: rankingPayload.mode === 'top10' ? rankingPayload.top10 : [],
        selectedBg: rankingPayload.selectedBg,
        aspectRatio: rankingPayload.aspectRatio,
      }
    }

    let savedId = rankingPayload.id || Math.random().toString(36).substring(2, 9)

    try {
      if (rankingPayload.id) {
        // Update existing
        await supabase
          .from('user_rankings')
          .update(payload)
          .eq('id', rankingPayload.id)
          .eq('user_id', user.id)
      } else {
        // Insert new
        const { data } = await supabase
          .from('user_rankings')
          .insert(payload)
          .select('id')
          .single()

        if (data?.id) savedId = data.id
      }

      // Update local storage
      const localKey = `ludiclub_saved_rankings_${user.id}`
      const existingStr = localStorage.getItem(localKey)
      const existing: SavedRankingItem[] = existingStr ? JSON.parse(existingStr) : []
      const nextItem: SavedRankingItem = {
        id: savedId,
        ...payload,
        created_at: new Date().toISOString(),
      }
      const updatedList = [nextItem, ...existing.filter(i => i.id !== savedId)]
      localStorage.setItem(localKey, JSON.stringify(updatedList))
      setSavedRankings(updatedList)

      setSaveSuccess(true)
      toast.success(i18n.t('tops.saveSuccess', '¡Ranking guardado en tu perfil!'))
      setTimeout(() => setSaveSuccess(false), 3000)
      return savedId
    } catch (err) {
      console.error('Error saving ranking:', err)
      toast.error(i18n.t('tops.saveError', 'No se pudo guardar el ranking.'))
      return null
    } finally {
      setSaving(false)
    }
  }, [user])

  return {
    collectionGames,
    loadingCollection,
    savedRankings,
    loadingRankings,
    saving,
    saveSuccess,
    saveRanking,
    fetchSavedRankings,
  }
}
