import { useState, useEffect, useMemo, FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/authContext'
import { USE_MOCKS } from '../lib/config'
import { MOCK_MEETUPS, MOCK_BGG_GAMES } from '../lib/mockData'
import { ESP_CITIES } from '../components/meetup-form/CityAutocomplete'
import { Game } from '@/types'

export type WizardStep = 1 | 2 | 3

export function useCreateMeetup() {
  const { id } = useParams<{ id: string }>()
  const isEditMode = Boolean(id)
  const { user } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const gameIdParam = searchParams.get('gameId') || searchParams.get('game_id')
  const groupIdParam = searchParams.get('groupId') || searchParams.get('group_id')

  // Step State (1: Game & Expansions, 2: Logistics & Date, 3: Capacity & Details)
  const [currentStep, setCurrentStep] = useState<WizardStep>(1)

  // Step 1: Game & Expansions State
  const [searchQuery, setSearchQuery] = useState('')
  const [games, setGames] = useState<Game[]>([])
  const [selectedGames, setSelectedGames] = useState<Game[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isShowingBggResults, setIsShowingBggResults] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [availableExpansions, setAvailableExpansions] = useState<Game[]>([])
  const [showExpansions, setShowExpansions] = useState(false)

  // Step 2: Date & Logistics State
  const [isOnline, setIsOnline] = useState(false)
  const [city, setCity] = useState('')
  const [location, setLocation] = useState('')
  const [platform, setPlatform] = useState('')
  const [voiceLink, setVoiceLink] = useState('')
  const [date, setDate] = useState('')
  const [allCities, setAllCities] = useState<string[]>(ESP_CITIES)

  // Step 3: Capacity & Details State
  const [title, setTitle] = useState(searchParams.get('title') || '')
  const [description, setDescription] = useState(searchParams.get('description') || '')
  const [maxPlayers, setMaxPlayers] = useState('4')

  // Submission & Error State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')


  const isGameDependent = (g: Game) => Boolean(g.is_expansion || g.base_game_id || g.bgg_base_game_id)
  const hasOnlyExpansions = selectedGames.length > 0 && selectedGames.every(isGameDependent)

  // Step 1 Validation
  const step1Error = useMemo(() => {
    if (hasOnlyExpansions) {
      return t('create.onlyExpansionsWarning')
    }
    return null
  }, [hasOnlyExpansions, t])

  // Step 2 Validation
  const step2Error = useMemo(() => {
    if (!isOnline && !city.trim()) {
      return t('create.validationCityRequired')
    }
    if (isOnline && !platform.trim()) {
      return t('create.validationPlatformRequired')
    }
    if (!date) {
      return t('create.validationDateRequired')
    }
    const selectedDate = new Date(date)
    if (isNaN(selectedDate.getTime()) || selectedDate.getTime() <= Date.now()) {
      return t('create.validationFutureDateRequired')
    }
    return null
  }, [isOnline, city, platform, date, t])

  // Step 3 & Overall Form Validation
  const formValidationError = useMemo(() => {
    if (step1Error) return step1Error
    if (step2Error) return step2Error
    if (!title.trim()) {
      return t('create.validationTitleRequired')
    }
    const players = Number(maxPlayers)
    if (isNaN(players) || players < 2 || players > 50) {
      return t('create.validationPlayersRange')
    }
    return null
  }, [step1Error, step2Error, title, maxPlayers, t])

  const isFormValid = formValidationError === null
  const canProceedStep1 = step1Error === null
  const canProceedStep2 = step2Error === null

  // Pre-fill user city if available
  useEffect(() => {
    async function loadUserCity() {
      if (!user || isEditMode || city) return
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('city')
          .eq('id', user.id)
          .single()

        if (userError) throw userError
        if (userData?.city && !city) {
          setCity(userData.city)
        }
      } catch (err) {
        console.warn("Could not load user city:", err)
      }
    }

    loadUserCity()
  }, [user, isEditMode, city])

  // Fetch unique cities from current database
  useEffect(() => {
    async function loadCities() {
      try {
        const { data, error } = await supabase.from('meetups').select('city')
        if (data && !error) {
          const dbCities = data.map((m: any) => m.city).filter(Boolean) as string[]
          const merged = [...new Set([...dbCities, ...ESP_CITIES])].sort()
          setAllCities(merged)
        }
      } catch (err) {
        console.error("Error loading cities suggestions:", err)
      }
    }
    loadCities()
  }, [])

  // Fetch expansions for selected base games
  useEffect(() => {
    async function fetchExpansions() {
      const baseGames = selectedGames.filter(g => !g.is_expansion)
      if (baseGames.length === 0) {
        setAvailableExpansions([])
        return
      }
      try {
        const baseGameIds = baseGames.map(bg => bg.id).filter(Boolean)
        if (baseGameIds.length > 0) {
          const { data, error } = await supabase
            .from('games')
            .select('*')
            .in('base_game_id', baseGameIds)
          if (data && !error) {
            setAvailableExpansions(data as Game[])
          }
        }
      } catch (err) {
        console.error("Error fetching expansions:", err)
      }
    }
    fetchExpansions()
  }, [selectedGames])

  // Debounced game search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch()
      } else {
        setGames([])
      }
    }, 300)
    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  // Load pre-populated game from search params
  useEffect(() => {
    if (!gameIdParam || isEditMode) return
    async function loadGameFromParam() {
      const bggId = parseInt(gameIdParam!, 10)
      if (isNaN(bggId)) return
      setIsImporting(true)
      setErrorMsg('')
      try {
        const { data, error } = await supabase.from('games').select('*').eq('bgg_id', bggId).maybeSingle()
        if (error) throw error
        if (data) {
          setSelectedGames([data as Game])
        } else {
          const { data: ingestData, error: ingestError } = await supabase.functions.invoke('bgg-ingest', {
            body: { action: 'ingest', bggIds: [bggId] }
          })
          if (ingestError) throw ingestError
          if (ingestData?.success && ingestData.games?.length > 0) {
            setSelectedGames([ingestData.games[0] as Game])
          }
        }
      } catch (err: any) {
        console.error("Error loading pre-populated game:", err)
        setErrorMsg(`Error al precargar el juego: ${err.message || err}`)
      } finally {
        setIsImporting(false)
      }
    }
    loadGameFromParam()
  }, [gameIdParam, isEditMode])

  // Load existing meetup in edit mode
  useEffect(() => {
    if (!id) return
    async function loadMeetupForEdit() {
      if (!id) return
      setErrorMsg('')
      const isMock = USE_MOCKS && id.startsWith('mock-')
      if (isMock) {
        const foundMock = MOCK_MEETUPS.find(m => m.id === id)
        if (foundMock) {
          setTitle(foundMock.title || '')
          setDescription(foundMock.description || '')
          const isOnlineMock = foundMock.is_online || false
          setIsOnline(isOnlineMock)
          if (isOnlineMock) {
            setPlatform(foundMock.platform || '')
            setVoiceLink(foundMock.voice_link || '')
            setCity('')
            setLocation('')
          } else {
            setCity('Madrid')
            setLocation(foundMock.location || '')
          }
          setDate(foundMock.date || '')
          setMaxPlayers('4')
          const foundGame = MOCK_BGG_GAMES.find(g => g.name === foundMock.game_name)
          if (foundGame) {
            setSelectedGames([{
              bgg_id: Number(foundGame.bgg_id),
              title: foundGame.name,
              year_published: foundGame.year,
              image_url: foundGame.image_url
            }])
          }
        }
      } else {
        try {
          const { data, error } = await supabase
            .from('meetups')
            .select('*, meetup_games(game_id, winner_user_id, winner_guest_id, games(*))')
            .eq('id', id)
            .single()

          if (error) throw error
          if (data) {
            setTitle(data.title)
            setDescription(data.description || '')
            const isOnlineVal = data.is_online || false
            setIsOnline(isOnlineVal)
            if (isOnlineVal) {
              setPlatform(data.platform || '')
              setVoiceLink(data.voice_link || '')
              setCity('')
              setLocation('')
            } else {
              setCity(data.city || '')
              setLocation(data.location || '')
            }
            setDate(data.date)
            setMaxPlayers(String(data.max_players))
            const mg = data.meetup_games || []
            const mGames = mg.map((item: any) => item.games).filter(Boolean) as Game[]
            setSelectedGames(mGames)
          }
        } catch (err) {
          console.error("Error loading meetup for edit:", err)
          setErrorMsg('No se pudo cargar la mesa de juego para editar.')
        }
      }
    }
    loadMeetupForEdit()
  }, [id])

  const handleSearch = async (e?: FormEvent) => {
    if (e) e.preventDefault()
    if (!searchQuery.trim()) return
    setErrorMsg('')
    setIsSearching(true)
    setGames([])
    setIsShowingBggResults(false)

    const { data, error } = await supabase
      .from('games')
      .select('*')
      .or(`title.ilike.%${searchQuery}%,title_es.ilike.%${searchQuery}%`)
      .order('year_published', { ascending: false, nullsFirst: false })
      .limit(30)

    setIsSearching(false)
    if (error) {
      setErrorMsg('Error buscando juegos en el catálogo.')
    } else {
      setGames((data as Game[]) || [])
    }
  }

  const handleSearchBgg = async () => {
    if (!searchQuery.trim()) return
    setErrorMsg('')
    setIsSearching(true)
    setGames([])
    try {
      const { data, error } = await supabase.functions.invoke('bgg-ingest', {
        body: { action: 'search', query: searchQuery.trim() }
      })
      if (error) throw error
      if (data?.results) {
        const bggGames: Game[] = data.results.map((item: any) => ({
          bgg_id: item.bgg_id,
          title: item.title,
          year_published: item.year_published,
          is_expansion: item.is_expansion,
          image_url: null,
          isFromBgg: true
        }))
        setGames(bggGames)
        setIsShowingBggResults(true)
      }
    } catch (err: any) {
      console.error('Error searching BGG:', err)
      setErrorMsg('No se pudo buscar en BoardGameGeek.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectGame = async (game: Game) => {
    if (game.isFromBgg) {
      setIsImporting(true)
      setErrorMsg('')
      try {
        const { data, error } = await supabase.functions.invoke('bgg-ingest', {
          body: { action: 'ingest', bggIds: [game.bgg_id] }
        })
        if (error) throw error
        if (data?.success && data.games?.length > 0) {
          const fullyIngestedGame = data.games[0] as Game
          setSelectedGames(prev => {
            if (prev.some(g => g.bgg_id === fullyIngestedGame.bgg_id)) return prev
            return [...prev, fullyIngestedGame]
          })
          setSearchQuery('')
          setGames([])
        }
      } catch (err: any) {
        setErrorMsg(`Error al importar "${game.title}": ${err.message || err}`)
      } finally {
        setIsImporting(false)
      }
    } else {
      setSelectedGames(prev => {
        if (prev.some(g => g.bgg_id === game.bgg_id)) return prev
        return [...prev, game]
      })
      setSearchQuery('')
      setGames([])
    }
  }

  const handleToggleExpansion = (exp: Game) => {
    setSelectedGames(prev => {
      if (prev.some(g => g.bgg_id === exp.bgg_id)) {
        return prev.filter(g => g.bgg_id !== exp.bgg_id)
      }
      return [...prev, exp]
    })
  }

  const handleRemoveGame = (bggId: number) => {
    setSelectedGames(prev => prev.filter(g => g.bgg_id !== bggId))
  }

  const incrementPlayers = () => {
    setMaxPlayers(prev => {
      const current = parseInt(prev, 10) || 4
      return String(Math.min(50, current + 1))
    })
  }

  const decrementPlayers = () => {
    setMaxPlayers(prev => {
      const current = parseInt(prev, 10) || 4
      return String(Math.max(2, current - 1))
    })
  }

  const nextStep = () => {
    if (currentStep === 1) {
      if (!canProceedStep1) {
        setErrorMsg(step1Error || '')
        return
      }
      setErrorMsg('')
      setCurrentStep(2)
    } else if (currentStep === 2) {
      if (!canProceedStep2) {
        setErrorMsg(step2Error || '')
        return
      }
      setErrorMsg('')
      setCurrentStep(3)
    }
  }

  const prevStep = () => {
    setErrorMsg('')
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as WizardStep)
    }
  }

  const goToStep = (step: WizardStep) => {
    if (step === 2 && !canProceedStep1) return
    if (step === 3 && (!canProceedStep1 || !canProceedStep2)) return
    setErrorMsg('')
    setCurrentStep(step)
  }

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault()
    if (!isFormValid) {
      setErrorMsg(formValidationError || '')
      return
    }

    setIsSubmitting(true)
    setErrorMsg('')
    const sanitizedLocation = isOnline ? null : (location.trim() || 'Por acordar')

    try {
      const userId = user?.id
      if (!userId) throw new Error('Debes iniciar sesión para abrir una mesa.')

      if (isEditMode && id) {
        const isMock = USE_MOCKS && id.startsWith('mock-')
        if (isMock) {
          await new Promise(resolve => setTimeout(resolve, 500))
        } else {
          const { error: updateError } = await supabase
            .from('meetups')
            .update({
              title: title.trim(),
              description: description.trim() || null,
              is_online: isOnline,
              city: isOnline ? null : city.trim(),
              location: sanitizedLocation,
              platform: isOnline ? platform.trim() : null,
              voice_link: isOnline ? voiceLink.trim() : null,
              date: new Date(date).toISOString(),
              max_players: Number(maxPlayers)
            })
            .eq('id', id)

          if (updateError) throw updateError

          await supabase.from('meetup_games').delete().eq('meetup_id', id)

          if (selectedGames.length > 0) {
            const relationRows = selectedGames.map(g => ({
              meetup_id: id,
              game_id: g.bgg_id
            }))
            const { error: relError } = await supabase.from('meetup_games').insert(relationRows)
            if (relError) throw relError
          }
        }
        navigate(`/mesa/${id}`)
      } else {
        const { data: insertData, error: insertError } = await supabase
          .from('meetups')
          .insert({
            creator_id: userId,
            title: title.trim(),
            description: description.trim() || null,
            is_online: isOnline,
            city: isOnline ? null : city.trim(),
            location: sanitizedLocation,
            platform: isOnline ? platform.trim() : null,
            voice_link: isOnline ? voiceLink.trim() : null,
            date: new Date(date).toISOString(),
            max_players: Number(maxPlayers),
            joined_players: [userId],
            group_id: groupIdParam || null
          })
          .select('id')
          .single()

        if (insertError) throw insertError

        if (insertData && selectedGames.length > 0) {
          const relationRows = selectedGames.map(g => ({
            meetup_id: insertData.id,
            game_id: g.bgg_id
          }))
          const { error: relError } = await supabase.from('meetup_games').insert(relationRows)
          if (relError) throw relError
        }

        navigate(`/mesa/${insertData.id}`)
      }
    } catch (err: any) {
      console.error("Error submitting meetup:", err)
      setErrorMsg(err.message || 'Ocurrió un error inesperado al guardar la partida.')
    } finally {
      setIsSubmitting(false)
    }
  }


  return {
    isEditMode,
    id,
    currentStep,
    goToStep,
    nextStep,
    prevStep,
    canProceedStep1,
    canProceedStep2,
    // Step 1
    searchQuery,
    setSearchQuery,
    games,
    setGames,
    selectedGames,
    setSelectedGames,
    isSearching,
    isShowingBggResults,
    isImporting,
    availableExpansions,
    showExpansions,
    setShowExpansions,
    hasOnlyExpansions,
    handleSearch,
    handleSearchBgg,
    handleSelectGame,
    handleToggleExpansion,
    handleRemoveGame,
    // Step 2
    isOnline,
    setIsOnline,
    city,
    setCity,
    location,
    setLocation,
    platform,
    setPlatform,
    voiceLink,
    setVoiceLink,
    date,
    setDate,
    allCities,
    // Step 3
    title,
    setTitle,
    description,
    setDescription,
    maxPlayers,
    setMaxPlayers,
    incrementPlayers,
    decrementPlayers,
    // Submission & Validation
    isSubmitting,
    errorMsg,
    setErrorMsg,
    formValidationError,
    isFormValid,
    handleSubmit
  }
}
