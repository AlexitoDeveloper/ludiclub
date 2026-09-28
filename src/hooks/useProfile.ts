import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Meetup, UserProfile, Game } from '../types'
import { getMockMeetupsForList } from '../lib/mockData'
import { USE_MOCKS } from '../lib/config'

export interface UserStats {
  played: number;
  won: number;
  winRate: number;
  karma: number;
  missed: number;
}

export interface UseProfileProps {
  profileId: string;
  currentUserId?: string;
}

const MOCK_PROFILES: Record<string, UserProfile> = {
  'mock-u1': { id: 'mock-u1', username: 'boardgamer_alex', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', city: 'Madrid' },
  'mock-u2': { id: 'mock-u2', username: 'meeple_sara', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sara', city: 'Barcelona' },
  'mock-u3': { id: 'mock-u3', username: 'hex_and_counter', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=HexCounter', city: 'Bilbao' },
  'mock-u4': { id: 'mock-u4', username: 'ludo_valen', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Valen', city: 'Valencia' },
}

const MOCK_RANKINGS: Record<string, any[]> = {
  'mock-u1': [
    {
      id: 'mock-r1',
      user_id: 'mock-u1',
      title: 'Mis Euros Favoritos',
      mode: 'tier',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      data: {
        tiers: [
          { id: 'S', name: 'S', color: 'bg-gradient-to-br from-rose-500 to-rose-600 text-white', textColor: 'text-white', games: [
            { bgg_id: 224517, title: 'Brass: Birmingham', year_published: 2018, image_url: 'https://cf.geekdo-images.com/x3zxztFbRYCgssNZ55ZMnw__micro/img/QDuQwi75tL54enp_8_93K3s97d0=/fit-in/64x64/filters:strip_icc()/pic3490053.jpg' }
          ] },
          { id: 'A', name: 'A', color: 'bg-gradient-to-br from-orange-500 to-amber-500 text-white', textColor: 'text-white', games: [
            { bgg_id: 167791, title: 'Terraforming Mars', year_published: 2016, image_url: 'https://cf.geekdo-images.com/yLZJCDgC7y0uJUWSpFd58A__micro/img/z7A4g4dG6NqH2fT0zJc2j6m9V-g=/fit-in/64x64/filters:strip_icc()/pic3536616.png' }
          ] },
          { id: 'B', name: 'B', color: 'bg-gradient-to-br from-amber-400 to-orange-500 text-white', textColor: 'text-white', games: [] },
          { id: 'C', name: 'C', color: 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white', textColor: 'text-white', games: [] },
          { id: 'D', name: 'D', color: 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white', textColor: 'text-white', games: [] },
        ],
        top10: [],
        selectedBg: 'cyberpunk',
        aspectRatio: 'standard'
      }
    }
  ]
}

export function useProfile({ profileId, currentUserId }: UseProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [meetups, setMeetups] = useState<Meetup[]>([])
  const [stats, setStats] = useState<UserStats>({ played: 0, won: 0, winRate: 0, karma: 100, missed: 0 })
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  // Saved Rankings State
  const [savedRankings, setSavedRankings] = useState<any[]>([])
  const [loadingRankings, setLoadingRankings] = useState(true)

  // Collection State
  const [collectionGames, setCollectionGames] = useState<Game[]>([])
  const [loadingCollection, setLoadingCollection] = useState(false)

  // Action States
  const [savingProfile, setSavingProfile] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)

  const [importingCollection, setImportingCollection] = useState(false)
  const [importError, setImportError] = useState('')
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null)

  const isMock = USE_MOCKS && profileId.startsWith('mock-')

  const calculateStats = useCallback((userMeetups: Meetup[], userId: string) => {
    const completed = userMeetups.filter(m => m.completed)
    const attended = completed.filter(m => m.attended_players?.includes(userId))
    const missed = completed.filter(m => !m.attended_players?.includes(userId))

    let totalPlayedGames = 0
    let totalWonGames = 0

    attended.forEach(m => {
      const games = m.games || []
      if (games.length === 0) {
        totalPlayedGames += 1
      } else {
        totalPlayedGames += games.length
        games.forEach(g => {
          if (g.winner_user_id === userId) {
            totalWonGames += 1
          }
        })
      }
    })

    const winRate = totalPlayedGames > 0 ? Math.round((totalWonGames / totalPlayedGames) * 100) : 0
    const karma = completed.length > 0 ? Math.round((attended.length / completed.length) * 100) : 100

    setStats({
      played: totalPlayedGames,
      won: totalWonGames,
      winRate,
      karma,
      missed: missed.length
    })
  }, [])

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  const loadCollectionForUser = useCallback(async (uid: string) => {
    if (!uid) {
      setLoadingCollection(false)
      return
    }

    setLoadingCollection(true)

    if (uid.startsWith('mock-')) {
      const mockCollectionKey = `ludiclub_mock_collection_${uid}`
      const cached = localStorage.getItem(mockCollectionKey)
      if (cached) {
        setCollectionGames(JSON.parse(cached))
      } else {
        if (uid === 'mock-u1') {
          const initialMockGames = [
            { bgg_id: 224517, title: 'Brass: Birmingham', year_published: 2018, image_url: 'https://cf.geekdo-images.com/x3zxztFbRYCgssNZ55ZMnw__micro/img/QDuQwi75tL54enp_8_93K3s97d0=/fit-in/64x64/filters:strip_icc()/pic3490053.jpg' },
            { bgg_id: 167791, title: 'Terraforming Mars', year_published: 2016, image_url: 'https://cf.geekdo-images.com/yLZJCDgC7y0uJUWSpFd58A__micro/img/z7A4g4dG6NqH2fT0zJc2j6m9V-g=/fit-in/64x64/filters:strip_icc()/pic3536616.png' }
          ]
          localStorage.setItem(mockCollectionKey, JSON.stringify(initialMockGames))
          setCollectionGames(initialMockGames as any)
        } else {
          setCollectionGames([])
        }
      }
      setLoadingCollection(false)
      return
    }

    try {
      if (UUID_REGEX.test(uid)) {
        const { data, error } = await supabase
          .from('user_collection')
          .select('game_id, games (*)')
          .eq('user_id', uid)

        if (!error && data) {
          const games = data
            .map((row: any) => row.games)
            .filter(Boolean) as Game[]
          setCollectionGames(games)
        } else {
          setCollectionGames([])
        }
      } else {
        setCollectionGames([])
      }
    } catch (err) {
      console.warn('Error loading collection:', err)
      setCollectionGames([])
    } finally {
      setLoadingCollection(false)
    }
  }, [])

  const loadCollection = useCallback(async () => {
    const uid = profile?.id || (UUID_REGEX.test(profileId) ? profileId : currentUserId) || ''
    if (uid) {
      await loadCollectionForUser(uid)
    }
  }, [profile?.id, profileId, currentUserId, loadCollectionForUser])

  const loadProfileData = useCallback(async () => {
    if (!profileId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setErrorMsg('')

    const isMock = profileId.startsWith('mock-')

    if (isMock) {
      const localMockStr = localStorage.getItem(`ludiclub_mock_profile_${profileId}`)
      const mockProf = localMockStr ? JSON.parse(localMockStr) : MOCK_PROFILES[profileId]
      if (!mockProf) {
        setErrorMsg('No se encontró el perfil de demostración.')
        setLoading(false)
        return
      }

      setProfile(mockProf)
      setSavedRankings(MOCK_RANKINGS[profileId] || [])
      setLoadingRankings(false)
      loadCollectionForUser(profileId)

      const allMocks = getMockMeetupsForList()
      const completedMockKey = 'ludiclub_mock_completed_meetups'
      const completedMockStr = localStorage.getItem(completedMockKey)
      const completedMockData = completedMockStr ? JSON.parse(completedMockStr) : {}

      const userMockMeetups = allMocks
        .map(m => {
          const completedInfo = completedMockData[m.id]
          if (completedInfo) {
            return {
              ...m,
              completed: completedInfo.completed,
              winner_user_id: completedInfo.winner_user_id,
              winner_guest_id: completedInfo.winner_guest_id,
              attended_players: completedInfo.attended_players,
              attended_guests: completedInfo.attended_guests
            }
          }
          return m
        })
        .filter(m => m.joined_players?.includes(profileId))
        .sort((a, b) => new Date(b.date || (b as any).created_at || 0).getTime() - new Date(a.date || (a as any).created_at || 0).getTime())

      setMeetups(userMockMeetups)
      calculateStats(userMockMeetups, profileId)
      setLoading(false)
      return
    }

    try {
      // Step 1: Resolve user by UUID or by username
      let profData: UserProfile | null = null

      if (UUID_REGEX.test(profileId)) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', profileId)
          .maybeSingle()

        if (!error && data) {
          profData = data as UserProfile
        }
      }

      if (!profData) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .ilike('username', profileId)
          .maybeSingle()

        if (!error && data) {
          profData = data as UserProfile
        }
      }

      // Check fallback in MOCK_PROFILES
      if (!profData && MOCK_PROFILES[profileId]) {
        profData = MOCK_PROFILES[profileId]
      }

      if (!profData) {
        setErrorMsg('No se encontró el perfil de usuario.')
        setLoading(false)
        return
      }

      setProfile(profData)
      const targetUserId = profData.id

      // Step 2: Fetch Rankings for targetUserId
      setLoadingRankings(true)
      if (UUID_REGEX.test(targetUserId)) {
        try {
          const { data: rankData, error: rankError } = await supabase
            .from('user_rankings')
            .select('*')
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false })

          if (!rankError && rankData) {
            setSavedRankings(rankData)
          } else {
            setSavedRankings([])
          }
        } catch (err) {
          console.warn("Error querying user_rankings from Supabase, loading from localStorage:", err)
          const localKey = `ludiclub_saved_rankings_${targetUserId}`
          const localStr = localStorage.getItem(localKey)
          if (localStr) {
            try {
              setSavedRankings(JSON.parse(localStr))
            } catch {
              setSavedRankings([])
            }
          } else {
            setSavedRankings([])
          }
        } finally {
          setLoadingRankings(false)
        }
      } else {
        setSavedRankings([])
        setLoadingRankings(false)
      }

      // Step 3: Fetch Collection for targetUserId
      loadCollectionForUser(targetUserId)

      // Step 4: Fetch Meetups for targetUserId (both created and joined)
      let formatted: Meetup[] = []
      if (UUID_REGEX.test(targetUserId)) {
        try {
          const { data: meetupsData, error: meetupsError } = await supabase
            .from('meetups')
            .select('*, meetup_games(game_id, winner_user_id, winner_guest_id, games(*)), users:users!meetups_creator_id_fkey(*)')
            .or(`creator_id.eq.${targetUserId},joined_players.cs.{${targetUserId}}`)
            .order('date', { ascending: false })

          if (meetupsError) {
            console.warn("Could not query meetups for user:", meetupsError)
          } else if (meetupsData) {
            formatted = (meetupsData || []).map((m: any) => {
              const mg = m.meetup_games || []
              const mGames = mg.map((item: any) => {
                if (!item.games) return null
                return {
                  ...item.games,
                  winner_user_id: item.winner_user_id,
                  winner_guest_id: item.winner_guest_id
                }
              }).filter(Boolean) as Game[]
              return {
                ...m,
                games: mGames
              }
            })
          }
        } catch (err) {
          console.warn("Error querying meetups for user:", err)
        }
      }
      setMeetups(formatted)

      // Step 5: Fetch Stats for targetUserId
      let statsLoaded = false
      if (UUID_REGEX.test(targetUserId)) {
        try {
          const { data: statsData, error: statsError } = await supabase
            .rpc('get_user_stats', { p_user_id: targetUserId })

          if (!statsError && statsData && statsData.length > 0) {
            const s = statsData[0]
            setStats({
              played: s.played || 0,
              won: s.won || 0,
              winRate: s.win_rate || 0,
              karma: s.karma !== undefined && s.karma !== null ? s.karma : 100,
              missed: s.missed || 0
            })
            statsLoaded = true
          }
        } catch (err) {
          console.warn("RPC get_user_stats failed, using fallback:", err)
        }
      }

      if (!statsLoaded) {
        calculateStats(formatted, targetUserId)
      }
    } catch (err: any) {
      console.error("Error loading profile:", err)
      setErrorMsg(err.message || 'Error al obtener el perfil de usuario.')
    } finally {
      setLoading(false)
    }
  }, [profileId, calculateStats, loadCollectionForUser])

  useEffect(() => {
    loadProfileData()
    loadCollection()

    const handleProfileUpdate = () => {
      loadProfileData()
      loadCollection()
    }
    window.addEventListener('profile_update', handleProfileUpdate)
    window.addEventListener('collection_update', handleProfileUpdate)
    return () => {
      window.removeEventListener('profile_update', handleProfileUpdate)
      window.removeEventListener('collection_update', handleProfileUpdate)
    }
  }, [loadProfileData, loadCollection])

  const saveProfile = async (username: string, city: string, avatarUrl: string) => {
    if (!username.trim() || !profile) return
    setSavingProfile(true)

    if (isMock) {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const updated: UserProfile = {
            ...profile,
            username: username.trim(),
            city: city.trim() || null,
            avatar_url: avatarUrl.trim() || null
          }
          setProfile(updated)
          localStorage.setItem(`ludiclub_mock_profile_${profileId}`, JSON.stringify(updated))
          MOCK_PROFILES[profileId] = updated
          window.dispatchEvent(new Event('profile_update'))
          setSavingProfile(false)
          resolve()
        }, 600)
      })
    } else {
      try {
        if (!currentUserId) throw new Error('Usuario no autenticado.')

        const { error: dbError } = await supabase
          .from('users')
          .update({
            username: username.trim(),
            city: city.trim() || null,
            avatar_url: avatarUrl.trim() || null
          })
          .eq('id', currentUserId)

        if (dbError) throw dbError

        const { error: authError } = await supabase.auth.updateUser({
          data: {
            username: username.trim(),
            avatar_url: avatarUrl.trim() || null
          }
        })

        if (authError) throw authError

        const updated: UserProfile = {
          ...profile,
          username: username.trim(),
          city: city.trim() || null,
          avatar_url: avatarUrl.trim() || null
        }
        setProfile(updated)
        window.dispatchEvent(new Event('profile_update'))
      } catch (err: any) {
        console.error('Error updating profile:', err)
        throw err;
      } finally {
        setSavingProfile(false)
      }
    }
  }

  const importBggCollection = async (bggUsername: string) => {
    if (!bggUsername.trim()) return
    setImportingCollection(true)
    setImportError('')
    setImportSuccessCount(null)

    if (isMock) {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const dixitGame = { bgg_id: 37111, title: 'Dixit', year_published: 2008, image_url: 'https://cf.geekdo-images.com/39A865b4-B6BE-4b82-9022-7935E5B9FE6C.png' }
          const catanGame = { bgg_id: 13, title: 'Catan', year_published: 1995, image_url: 'https://cf.geekdo-images.com/40B7E05C-CC71-460B-A5DF-F2803CE10599.png' }
          
          setCollectionGames(prev => {
            const updated = [...prev]
            if (!updated.some(g => g.bgg_id === dixitGame.bgg_id)) updated.push(dixitGame as any)
            if (!updated.some(g => g.bgg_id === catanGame.bgg_id)) updated.push(catanGame as any)
            localStorage.setItem(`ludiclub_mock_collection_${profileId}`, JSON.stringify(updated))
            localStorage.setItem(`bgg_onboarded_${profileId}`, 'true')
            return updated
          })
          setImportSuccessCount(2)
          setImportingCollection(false)
          resolve()
        }, 1500)
      })
    }

    try {
      const { data, error } = await supabase.functions.invoke('bgg-ingest', {
        body: {
          action: 'import-collection',
          username: bggUsername.trim(),
          userId: currentUserId
        }
      })

      if (error) throw error

      if (data && data.success) {
        if (currentUserId) {
          localStorage.setItem(`bgg_onboarded_${currentUserId}`, 'true')
        }
        setImportSuccessCount(data.imported || 0)
        await loadCollection()
      } else {
        throw new Error(data?.error || 'No se pudo completar la importación.')
      }
    } catch (err: any) {
      console.error('Error importing collection from BGG:', err)
      setImportError(err.message || 'Error al conectar con la API de BoardGameGeek.')
      throw err;
    } finally {
      setImportingCollection(false)
    }
  }

  const addToCollection = async (game: Game) => {
    if (isMock) {
      setCollectionGames(prev => {
        if (prev.some(g => g.bgg_id === game.bgg_id)) return prev
        const updated = [...prev, game]
        localStorage.setItem(`ludiclub_mock_collection_${profileId}`, JSON.stringify(updated))
        return updated
      })
      window.dispatchEvent(new Event('collection_update'))
      return
    }

    try {
      if (!currentUserId) throw new Error('Usuario no autenticado.')

      // 1. Ensure game exists in games table
      const { data: existingGame } = await supabase
        .from('games')
        .select('bgg_id')
        .eq('bgg_id', game.bgg_id)
        .maybeSingle()

      if (!existingGame) {
        if (game.isFromBgg) {
          await supabase.functions.invoke('bgg-ingest', {
            body: { action: 'ingest', bggIds: [game.bgg_id] }
          })
        } else {
          await supabase.from('games').insert({
            bgg_id: game.bgg_id,
            title: game.title,
            title_es: game.title_es || null,
            image_url: game.image_url || null,
            min_players: game.min_players || 2,
            max_players: game.max_players || 5,
            playing_time: game.playing_time || 45,
            year_published: game.year_published || new Date().getFullYear()
          })
        }
      }

      // 2. Insert into user_collection
      const { error } = await supabase
        .from('user_collection')
        .insert({
          user_id: currentUserId,
          game_id: game.bgg_id
        })

      if (error && error.code !== '23505') {
        throw error
      }

      setCollectionGames(prev => {
        if (prev.some(g => g.bgg_id === game.bgg_id)) return prev
        return [...prev, game]
      })
      window.dispatchEvent(new Event('collection_update'))
    } catch (err: any) {
      console.error('Error adding game to collection:', err)
      throw err
    }
  }

  const removeFromCollection = async (bggId: number) => {
    if (isMock) {
      setCollectionGames(prev => {
        const updated = prev.filter(g => g.bgg_id !== bggId)
        localStorage.setItem(`ludiclub_mock_collection_${profileId}`, JSON.stringify(updated))
        return updated
      })
      return
    }

    try {
      const { error } = await supabase
        .from('user_collection')
        .delete()
        .eq('user_id', currentUserId)
        .eq('game_id', bggId)

      if (error) throw error
      setCollectionGames(prev => prev.filter(g => g.bgg_id !== bggId))
    } catch (err) {
      console.error('Error removing game from collection:', err)
      throw err;
    }
  }

  const deleteRanking = async (rankingId: string) => {
    try {
      const { error } = await supabase
        .from('user_rankings')
        .delete()
        .eq('id', rankingId)

      if (error) console.warn("Supabase delete failed, relying on localStorage fallback delete:", error)

      const localKey = `ludiclub_saved_rankings_${profileId}`
      const localStr = localStorage.getItem(localKey)
      if (localStr) {
        try {
          const list = JSON.parse(localStr) as any[]
          const updated = list.filter(item => item.id !== rankingId)
          localStorage.setItem(localKey, JSON.stringify(updated))
        } catch (err) {
          console.error("Error updating localStorage list:", err)
        }
      }

      setSavedRankings(prev => prev.filter(r => r.id !== rankingId))
    } catch (err) {
      console.error("Error deleting ranking:", err)
      throw err;
    }
  }

  return {
    profile,
    setProfile,
    meetups,
    stats,
    loading,
    errorMsg,
    savedRankings,
    loadingRankings,
    collectionGames,
    loadingCollection,
    savingProfile,
    uploadingFile,
    setUploadingFile,
    saveProfile,
    importingCollection,
    importError,
    setImportError,
    importSuccessCount,
    setImportSuccessCount,
    importBggCollection,
    addToCollection,
    removeFromCollection,
    deleteRanking,
    refresh: loadProfileData
  }
}
