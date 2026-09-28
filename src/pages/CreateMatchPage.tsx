import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Zap, Users, AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Skeleton } from '../components/ui/skeleton'
import { useAuth } from '../lib/authContext'
import { supabase } from '../lib/supabaseClient'
import { fetchPlayGamesPool } from '../lib/playLibraryService'
import { useGroupDetail } from '../hooks/useGroupDetail'
import { useQuickLogMatch } from '../hooks/useQuickLogMatch'
import { QuickLogGameSelector } from '../components/session/quick-log/QuickLogGameSelector'
import { QuickLogAttendeesSection } from '../components/session/quick-log/QuickLogAttendeesSection'
import { QuickLogWinnerSection } from '../components/session/quick-log/QuickLogWinnerSection'
import { BoardPhotoUploader } from '../components/session/BoardPhotoUploader'
import { VictoryCardModal } from '../components/session/VictoryCardModal'
import { Meetup, PlayerScore, Game } from '../types'

export function CreateMatchPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const groupId = searchParams.get('groupId') || undefined

  const { group, members, guests, mergedCollection, loading: groupLoading } = useGroupDetail(groupId)

  const [personalGames, setPersonalGames] = useState<Game[]>([])
  const [victoryMeetup, setVictoryMeetup] = useState<Meetup | null>(null)
  const [victoryScores, setVictoryScores] = useState<PlayerScore[]>([])

  useEffect(() => {
    if (groupId) return
    let isCancelled = false
    const loadPersonalGames = async () => {
      try {
        const pool = await fetchPlayGamesPool(user?.id, 'personal')
        if (!isCancelled && pool) {
          setPersonalGames(pool as any)
        }
      } catch (err) {
        console.error('Error fetching personal games in CreateMatchPage:', err)
      }
    }
    loadPersonalGames()
    return () => { isCancelled = true }
  }, [groupId, user?.id])

  const handleMatchSaved = (savedMeetup: Meetup, scores: PlayerScore[]) => {
    setVictoryMeetup(savedMeetup)
    setVictoryScores(scores)
  }

  const groupMembersInput = useMemo(
    () =>
      members.map((m) => ({
        user_id: m.user_id,
        username: m.username,
        avatar_url: m.avatar_url,
      })),
    [members]
  )

  const groupGuestsInput = useMemo(
    () =>
      guests.map((g) => ({
        id: g.id,
        name: g.name,
        avatarUrl: g.avatar_url,
      })),
    [guests]
  )

  const groupGames = useMemo(() => mergedCollection.map((mc) => mc.game), [mergedCollection])
  const availableGames = useMemo(
    () => (groupId ? groupGames : personalGames),
    [groupId, groupGames, personalGames]
  )

  const {
    meetupId,
    selectedGame,
    setSelectedGame,
    gameSearchQuery,
    setGameSearchQuery,
    filteredGroupGames,
    catalogSearchResults,
    isSearchingCatalog,
    attendees,
    selectedAttendeeIds,
    toggleAttendee,
    activeAttendees,
    newGuestName,
    setNewGuestName,
    addGuest,
    removeGuest,
    winnerMode,
    setWinnerMode,
    winnerId,
    setWinnerId,
    scores,
    setPlayerScore,
    boardPhotoUrl,
    setBoardPhotoUrl,
    isSubmitting,
    submitError,
    handleSaveMatch,
  } = useQuickLogMatch({
    groupId,
    groupMembers: groupMembersInput,
    groupGuests: groupGuestsInput,
    groupGames: availableGames,
    isOpen: !groupLoading,
    onSuccess: handleMatchSaved,
  })

  // Pre-select game if gameId is passed in searchParams (e.g. from roulette or Ludoteca)
  const gameIdParam = searchParams.get('gameId')
  useEffect(() => {
    if (!gameIdParam || selectedGame) return

    // 1. Check in already loaded games
    const match = availableGames.find(
      (g) => String(g.bgg_id) === String(gameIdParam) || String(g.id) === String(gameIdParam)
    )
    if (match) {
      setSelectedGame(match)
      return
    }

    // 2. Fetch directly from catalog if not in local list
    let isCancelled = false
    const fetchGameDirectly = async () => {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(gameIdParam)
        const query = isUuid
          ? supabase.from('games').select('*').eq('id', gameIdParam).maybeSingle()
          : supabase.from('games').select('*').eq('bgg_id', Number(gameIdParam)).maybeSingle()
        const { data, error } = await query
        if (!error && data && !isCancelled) {
          setSelectedGame(data as Game)
        }
      } catch (err) {
        console.error('Error resolving gameId in CreateMatchPage:', err)
      }
    }
    fetchGameDirectly()
    return () => { isCancelled = true }
  }, [gameIdParam, selectedGame, availableGames, setSelectedGame])

  const isGroupMode = Boolean(groupId && group)
  const winnerAttendee = activeAttendees.find((a) => a.id === winnerId)

  if (groupId && groupLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-24 animate-in fade-in duration-200">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-28 animate-in fade-in duration-200">
      {/* Sticky App Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between py-3 -mx-4 px-4 bg-background/90 backdrop-blur-md border-b border-border/30">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => (groupId ? navigate(`/grupos/${groupId}`) : navigate(-1))}
          className="rounded-xl flex items-center gap-1.5 h-10 text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{groupId && group ? group.name : t('common.back', 'Volver')}</span>
        </Button>

        <div className="flex items-center gap-2">
          {isGroupMode && (
            <Badge variant="secondary" className="text-xs font-bold gap-1 py-1">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span className="truncate max-w-[120px]">{group?.name}</span>
            </Badge>
          )}
        </div>
      </div>

      {/* Page Title & Intro */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black font-display tracking-tight text-foreground flex items-center gap-2">
          <Zap className="w-6 h-6 text-primary" />
          <span>{t('quickLog.title', 'Registrar Partida')}</span>
        </h1>
        <p className="text-xs text-muted-foreground font-semibold">
          {isGroupMode ? t('quickLog.descGroup') : t('quickLog.descCasual')}
        </p>
      </div>

      {submitError && (
        <div className="flex items-center gap-2 p-3 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* 1. Game Autocomplete Section */}
      <Card className="p-4 sm:p-5 rounded-2xl bg-card/75 border-border/40 shadow-xs space-y-3">
        <QuickLogGameSelector
          selectedGame={selectedGame}
          setSelectedGame={setSelectedGame}
          searchQuery={gameSearchQuery}
          setSearchQuery={setGameSearchQuery}
          groupGames={filteredGroupGames}
          catalogResults={catalogSearchResults}
          isSearchingCatalog={isSearchingCatalog}
        />
      </Card>

      {/* 2. Players & Guests Section */}
      <Card className="p-4 sm:p-5 rounded-2xl bg-card/75 border-border/40 shadow-xs space-y-3">
        <QuickLogAttendeesSection
          attendees={attendees}
          selectedAttendeeIds={selectedAttendeeIds}
          toggleAttendee={toggleAttendee}
          newGuestName={newGuestName}
          setNewGuestName={setNewGuestName}
          addGuest={addGuest}
          removeGuest={removeGuest}
          isGroupMode={isGroupMode}
        />
      </Card>

      {/* 3. Winner & Scores Section */}
      {activeAttendees.length > 0 && (
        <Card className="p-4 sm:p-5 rounded-2xl bg-card/75 border-border/40 shadow-xs space-y-3">
          <QuickLogWinnerSection
            activeAttendees={activeAttendees}
            winnerMode={winnerMode}
            setWinnerMode={setWinnerMode}
            winnerId={winnerId}
            setWinnerId={setWinnerId}
            scores={scores}
            setPlayerScore={setPlayerScore}
          />
        </Card>
      )}

      {/* 4. Board Photo Section */}
      <Card className="p-4 sm:p-5 rounded-2xl bg-card/75 border-border/40 shadow-xs space-y-2">
        <span className="text-xs font-black uppercase tracking-wider text-muted-foreground block">
          {t('quickLog.photosSection', 'Foto de la Partida')}
        </span>
        <BoardPhotoUploader
          meetupId={meetupId}
          currentPhotoUrl={boardPhotoUrl}
          onPhotoUploaded={async (url) => setBoardPhotoUrl(url)}
        />
      </Card>

      {/* Sticky Bottom Action Dock */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-3 sm:p-4 bg-background/95 backdrop-blur-lg border-t border-border/30">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0 hidden sm:block">
            <p className="text-xs font-bold text-foreground truncate">
              {selectedGame ? selectedGame.title_es || selectedGame.title : t('quickLog.selectGameHint', 'Selecciona un juego')}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {activeAttendees.length} {t('common.players', 'jugadores')}
              {winnerAttendee && ` • Ganador: ${winnerAttendee.name}`}
            </p>
          </div>

          <Button
            type="button"
            size="lg"
            onClick={handleSaveMatch}
            disabled={!selectedGame || activeAttendees.length === 0 || isSubmitting}
            loading={isSubmitting}
            icon={Zap}
            className="w-full sm:w-auto ml-auto"
          >
            <span>{isSubmitting ? t('quickLog.savingBtn', 'Guardando...') : t('quickLog.saveBtn', 'Registrar partida')}</span>
          </Button>
        </div>
      </div>

      {/* Victory Card Celebration upon completion */}
      {victoryMeetup && (
        <VictoryCardModal
          isOpen={Boolean(victoryMeetup)}
          onClose={() => {
            setVictoryMeetup(null)
            if (groupId) {
              navigate(`/grupos/${groupId}`)
            } else {
              navigate(-1)
            }
          }}
          meetup={victoryMeetup}
          scores={victoryScores}
        />
      )}
    </div>
  )
}
export default CreateMatchPage
