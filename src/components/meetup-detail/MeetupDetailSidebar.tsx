import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useGameLocale } from '../../hooks/useGameLocale'
import { useTranslation } from 'react-i18next'
import { OptimizedImage } from '../ui/OptimizedImage'
import { 
  Clock, 
  Crown, 
  Edit3, 
  Trash2, 
  Loader2,
  MessageSquare,
  NotebookPen,
  CalendarCheck2,
  CheckSquare,
  Square,
  Share2,
  Dices,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { ExpansionBadge } from '../ui/expansion-badge'
import { Form } from '../ui/form'
import { DeleteTableConfirmDialog } from './DeleteTableConfirmDialog'
import { User } from '@supabase/supabase-js'
import { Meetup, UserProfile } from '../../types'

interface MeetupDetailSidebarProps {
  meetup: Meetup;
  attendees: UserProfile[];
  isPast: boolean;
  isCreator: boolean;
  isJoined: boolean;
  isFull: boolean;
  joining: boolean;
  canceling: boolean;
  timeLeft: string;
  user: User | null;
  handleJoinLeave: () => void;
  handleCancelMeetup: () => void;
  guestReservation: { id: string, name: string } | null;
  handleJoinAsGuest: (name: string) => void;
  handleLeaveAsGuest: () => void;
  handleCompleteMeetup: (gameWinners: Record<number, string | null>, gameWinnersScores: Record<number, string | null>, attendedPlayerIds: string[], attendedGuestIds: string[]) => void;
  onExportClick?: () => void;
  onFirstPlayerClick?: () => void;
  onVictoryCardClick?: () => void;
}

export function MeetupDetailSidebar({ 
  meetup, 
  attendees, 
  isPast, 
  isCreator, 
  isJoined, 
  isFull, 
  joining, 
  canceling, 
  timeLeft, 
  user, 
  handleJoinLeave, 
  handleCancelMeetup,
  guestReservation,
  handleJoinAsGuest,
  handleLeaveAsGuest,
  handleCompleteMeetup,
  onExportClick,
  onFirstPlayerClick,
  onVictoryCardClick
}: MeetupDetailSidebarProps) {
  const { t } = useTranslation()
  const { getGameTitle, getGamePublisher, getGameCover } = useGameLocale()
  const navigate = useNavigate()
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [guestName, setGuestName] = useState('')
  const gamesList = meetup.games || []

  // Stats and Completion State
  const [isCompleting, setIsCompleting] = useState(false)
  const [gameWinners, setGameWinners] = useState<Record<number, string | null>>({})
  const [gameWinnersScores, setGameWinnersScores] = useState<Record<number, string | null>>({})
  const [attendedPlayers, setAttendedPlayers] = useState<string[]>([])
  const [attendedGuests, setAttendedGuests] = useState<string[]>([])

  const openCompleteForm = () => {
    if (meetup.completed) {
      setAttendedPlayers(meetup.attended_players || [])
      setAttendedGuests(meetup.attended_guests || [])
      
      const initialWinners: Record<number, string | null> = {}
      const initialScores: Record<number, string | null> = {}
      gamesList.forEach(g => {
        if (!g.is_expansion) {
          initialWinners[g.bgg_id] = g.winner_user_id || g.winner_guest_id || null
          initialScores[g.bgg_id] = g.winner_score || null
        } else {
          initialWinners[g.bgg_id] = null
          initialScores[g.bgg_id] = null
        }
      })
      setGameWinners(initialWinners)
      setGameWinnersScores(initialScores)
    } else {
      const registeredIds = attendees.filter(a => !a.is_guest).map(a => a.id)
      const guestIds = attendees.filter(a => a.is_guest).map(a => a.id)
      setAttendedPlayers(registeredIds)
      setAttendedGuests(guestIds)
      
      const initialWinners: Record<number, string | null> = {}
      const initialScores: Record<number, string | null> = {}
      gamesList.forEach(g => {
        initialWinners[g.bgg_id] = null
        initialScores[g.bgg_id] = null
      })
      setGameWinners(initialWinners)
      setGameWinnersScores(initialScores)
    }
    setIsCompleting(true)
  }

  const selectGameWinner = (bggId: number, winnerId: string | null) => {
    setGameWinners(prev => ({
      ...prev,
      [bggId]: winnerId
    }))
  }

  const togglePlayerAttendance = (playerId: string) => {
    setAttendedPlayers(prev => {
      const isAttended = prev.includes(playerId)
      let next = []
      if (isAttended) {
        next = prev.filter(id => id !== playerId)
        setGameWinners(wPrev => {
          const wNext = { ...wPrev }
          Object.keys(wNext).forEach(key => {
            const numKey = Number(key)
            if (wNext[numKey] === playerId) {
              wNext[numKey] = null
            }
          })
          return wNext
        })
      } else {
        next = [...prev, playerId]
      }
      return next
    })
  }

  const toggleGuestAttendance = (guestId: string) => {
    setAttendedGuests(prev => {
      const isAttended = prev.includes(guestId)
      let next = []
      if (isAttended) {
        next = prev.filter(id => id !== guestId)
        setGameWinners(wPrev => {
          const wNext = { ...wPrev }
          Object.keys(wNext).forEach(key => {
            const numKey = Number(key)
            if (wNext[numKey] === guestId) {
              wNext[numKey] = null
            }
          })
          return wNext
        })
      } else {
        next = [...prev, guestId]
      }
      return next
    })
  }

  const handleSubmitComplete = () => {
    const sanitizedWinners = { ...gameWinners }
    const sanitizedScores = { ...gameWinnersScores }
    gamesList.forEach(g => {
      if (g.is_expansion) {
        sanitizedWinners[g.bgg_id] = null
        sanitizedScores[g.bgg_id] = null
      }
    })
    handleCompleteMeetup(sanitizedWinners, sanitizedScores, attendedPlayers, attendedGuests)
    setIsCompleting(false)
  }

  const renderCompletedSection = () => {
    const attendedList = attendees.filter(a => {
      if (a.is_guest) {
        return meetup.attended_guests?.includes(a.id)
      } else {
        return meetup.attended_players?.includes(a.id)
      }
    })

    return (
      <div className="space-y-4">
        <div className="text-center p-2.5 bg-muted/60 border border-border/50 rounded-xl text-foreground/80 font-bold text-xs flex items-center justify-center gap-1.5 uppercase tracking-wider">
          <CalendarCheck2 className="w-4 h-4 text-primary" />
          {t('meetup.tableClosed')}
        </div>

        {/* Game results cards */}
        <div className="space-y-2.5">
          <p className="text-xs font-bold text-muted-foreground block">{t('meetup.resultsTitle')}</p>
          {gamesList.map((game) => {
            const winningId = game.winner_user_id || game.winner_guest_id
            const winner = winningId ? attendees.find(a => a.id === winningId) : null
            
            return (
              <div key={game.bgg_id} className="p-3 rounded-2xl border border-border/40 bg-muted/20 backdrop-blur-sm flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-2.5 min-w-0">
                  <OptimizedImage
                    src={getGameCover(game) || game.image_url}
                    alt={getGameTitle(game)}
                    widthSize={80}
                    heightSize={80}
                    className="w-10 h-10 rounded-lg object-cover border border-border/20 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-black text-foreground truncate">{getGameTitle(game)}</p>
                    <p className="text-xs text-muted-foreground font-semibold">
                      {game.is_expansion ? t('meetup.expansionModuleNotice', 'Expansión / módulo de partida') : t('meetup.winner')}
                    </p>
                  </div>
                </div>
                
                <div className="shrink-0 flex flex-col items-end gap-1 max-w-[140px]">
                  {game.is_expansion ? (
                    <ExpansionBadge size="xs" />
                  ) : winner ? (
                    <>
                      <Badge variant="tag-amber" className="flex items-center gap-1 px-2 py-0.5 text-xs font-bold">
                        <Crown className="w-3.5 h-3.5 fill-amber text-amber shrink-0" />
                        <span className="truncate max-w-[85px]">{winner.username}</span>
                      </Badge>
                      {game.winner_score && (
                        <span className="text-xs font-extrabold text-primary tracking-wide bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-md truncate max-w-[120px] font-mono-tabular">
                          {game.winner_score}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="px-2 py-0.5 rounded-xl border border-border/50 bg-background/50 text-muted-foreground text-xs font-bold text-center">
                        {t('meetup.draw')}
                      </div>
                      {game.winner_score && (
                        <span className="text-xs font-semibold text-muted-foreground tracking-wide truncate max-w-[120px] font-mono-tabular">
                          {game.winner_score}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="space-y-2 pt-2 border-t border-border/20">
          <p className="text-xs font-bold text-muted-foreground">{t('meetup.attendedTitle')} ({attendedList.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {attendedList.map(a => (
              <div key={a.id} className="px-2.5 py-1 rounded-lg bg-background/50 border border-border/40 text-xs font-medium text-foreground flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-full overflow-hidden">
                  <img src={a.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(a.username)}`} alt={a.username} className="w-full h-full object-cover" />
                </div>
                {a.username}
              </div>
            ))}
          </div>
        </div>

        {/* Export summary button */}
        <div className="pt-2 flex flex-col gap-2">
          <Button
            onClick={onExportClick}
            variant="premium"
            className="w-full flex items-center justify-center gap-2 cursor-pointer text-white font-extrabold hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] transition-all duration-300"
            icon={Share2}
            label={t('meetup.exportSummary')}
          />
        </div>

        {/* Options for master/creator on completed meetup */}
        {isCreator && (
          <div className="pt-2 flex items-center justify-center gap-2 border-t border-border/20">
            <Button
              onClick={openCompleteForm}
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground hover:text-primary gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" /> {t('meetup.editResults')}
            </Button>
            <Button
              onClick={() => setConfirmCancel(true)}
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5 text-muted-foreground" /> {t('meetup.deleteTable', 'Eliminar Mesa')}
            </Button>
          </div>
        )}
      </div>
    )
  }

  const renderCompleteForm = () => {
    return (
      <div className="space-y-4 pt-1 flex flex-col max-h-[520px]">
        <div className="text-xs font-bold text-foreground flex items-center gap-1.5 border-b border-border/20 pb-2 shrink-0">
          <NotebookPen className="w-4 h-4 text-primary" />
          {t('meetup.closeGame')}
        </div>

        {/* Scrollable container for choices (the only scrollbar) */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
          {/* 1. Who attended */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground block">{t('meetup.whoAttended')}</label>
            <div className="space-y-1.5">
              {attendees.map(a => {
                const isUser = !a.is_guest
                const isChecked = isUser ? attendedPlayers.includes(a.id) : attendedGuests.includes(a.id)
                
                return (
                  <div 
                    key={a.id} 
                    onClick={() => isUser ? togglePlayerAttendance(a.id) : toggleGuestAttendance(a.id)}
                    className="flex items-center justify-between p-2 rounded-lg border border-border/40 bg-background/20 hover:bg-muted/30 cursor-pointer select-none text-xs font-semibold"
                  >
                    <div className="flex items-center gap-2">
                      <img src={a.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(a.username)}`} alt={a.username} className="w-5 h-5 rounded-full" />
                      <span>{a.username} {a.is_guest && <span className="text-xs text-muted-foreground">({t('common.guest').toLowerCase()})</span>}</span>
                    </div>
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-primary" />
                    ) : (
                      <Square className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* 2. Winners per game */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground block">{t('meetup.winnersPerGame')}</label>
            <div className="space-y-4">
              {gamesList.map((game) => {
                const gameWinnerId = gameWinners[game.bgg_id] || null
                
                return (
                  <div key={game.bgg_id} className="p-3 rounded-2xl border border-border/40 bg-muted/20 backdrop-blur-sm space-y-2">
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <OptimizedImage
                          src={getGameCover(game) || game.image_url}
                          alt={getGameTitle(game)}
                          widthSize={60}
                          heightSize={60}
                          className="w-8 h-8 rounded object-cover border border-border/20 shrink-0"
                        />
                        <span className="text-xs font-black text-foreground truncate">{getGameTitle(game)}</span>
                      </div>
                      {game.is_expansion && <ExpansionBadge size="xs" />}
                    </div>
                    
                    {game.is_expansion ? (
                      <div className="p-2.5 rounded-xl border border-border/30 bg-background/30 text-xs text-muted-foreground font-medium flex items-center gap-2">
                        <ExpansionBadge size="xs" />
                        <span>{t('meetup.expansionModuleNotice', 'Expansión / módulo de partida')}</span>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 gap-1">
                          <div 
                            onClick={() => selectGameWinner(game.bgg_id, null)}
                            className={`flex items-center p-2 rounded-lg border cursor-pointer select-none text-xs font-bold transition-colors ${
                              gameWinnerId === null 
                                ? 'border-primary bg-primary/5 text-primary' 
                                : 'border-border/30 bg-background/20 hover:bg-muted/30 text-foreground'
                            }`}
                          >
                            <span>{t('meetup.coopDraw')}</span>
                          </div>

                          {attendees
                            .filter(a => a.is_guest ? attendedGuests.includes(a.id) : attendedPlayers.includes(a.id))
                            .map(a => (
                              <div 
                                key={a.id} 
                                onClick={() => selectGameWinner(game.bgg_id, a.id)}
                                className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer select-none text-xs font-semibold transition-colors ${
                                  gameWinnerId === a.id 
                                    ? 'border-primary bg-primary/5 text-primary font-bold' 
                                    : 'border-border/30 bg-background/20 hover:bg-muted/30 text-foreground'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <img src={a.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(a.username)}`} alt={a.username} className="w-5 h-5 rounded-full" />
                                  <span>{a.username} {a.is_guest && <span className="text-xs text-muted-foreground">({t('common.guest').toLowerCase()})</span>}</span>
                                </div>
                                {gameWinnerId === a.id && <Crown className="w-3.5 h-3.5 text-primary fill-current shrink-0 animate-pulse" />}
                              </div>
                            ))}
                        </div>

                        {/* Winner score input */}
                        <div className="mt-2 text-left space-y-1">
                          <label className="text-xs font-bold text-muted-foreground block">{t('meetup.scorePlaceholder')}</label>
                          <Input
                            type="text"
                            placeholder="Ej. 104 pts, 15-12, Coop Win..."
                            value={gameWinnersScores[game.bgg_id] || ''}
                            onChange={(e) => setGameWinnersScores(prev => ({
                              ...prev,
                              [game.bgg_id]: e.target.value
                            }))}
                            className="h-8 text-xs bg-background/40 border-border/30 rounded-lg text-foreground focus:ring-1 focus:ring-primary"
                            maxLength={35}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-row gap-2 pt-3 border-t border-border/20 shrink-0">
          <Button 
            onClick={() => setIsCompleting(false)}
            variant="outline" 
            className="flex-1 h-9"
          >
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleSubmitComplete}
            variant="default"
            className="flex-1 h-9"
          >
            {t('common.confirmSave')}
          </Button>
        </div>
      </div>
    )
  }

  const handleGuestJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!guestName.trim()) return
    handleJoinAsGuest(guestName.trim())
  }

  const renderGuestSection = () => {
    if (isPast) {
      return (
        <Button disabled variant="outline" className="w-full select-none">
          {t('meetup.tableClosed')}
        </Button>
      )
    }

    if (guestReservation) {
      return (
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 text-center text-xs font-bold text-foreground">
            {t('meetup.guestFeedback')} <span className="text-primary font-extrabold">{guestReservation.name}</span>
          </div>
          <Button
            onClick={() => navigate(`/chats?id=${meetup.id}`)}
            variant="outline"
            className="w-full flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <MessageSquare className="w-4 h-4" /> {t('meetup.chatTitle')}
          </Button>
          <Button
            onClick={handleLeaveAsGuest}
            variant="destructive"
            className="w-full h-11"
          >
            {joining ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t('meetup.guestLeave')}
          </Button>
          <p className="text-xs text-muted-foreground text-center font-medium leading-normal mt-2">
            {t('meetup.guestRegisterWarning')}
          </p>
        </div>
      )
    }

    if (isFull) {
      return (
        <div className="space-y-3">
          <Button
            disabled
            variant="outline"
            className="w-full select-none"
          >
            {t('meetup.tableFull')}
          </Button>
          <p className="text-xs text-muted-foreground text-center font-semibold pt-1">
            {t('meetup.guestLoginToJoin')}
          </p>
        </div>
      )
    }

    return (
      <Form onSubmit={handleGuestJoinSubmit} className="space-y-3 pt-1">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">{t('meetup.guestTitle')}</label>
          <div className="flex gap-2 flex-col">
            <Input
              type="text"
              placeholder={t('meetup.guestPlaceholder')}
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              maxLength={25}
              className="flex-1"
              required
            />
            <Button
              type="submit"
              disabled={joining || !guestName.trim()}
              className="px-4 h-9 shrink-0"
            >
              {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : t('meetup.guestSubmit')}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center font-semibold pt-1">
          {t('meetup.guestRegisterWarning')}
        </p>
      </Form>
    )
  }

  // Render the Join/Leave/Full button
  const renderActionButton = () => {
    if (isPast) {
      return (
        <Button disabled variant="outline" className="w-full select-none">
          {t('meetup.tableClosed')}
        </Button>
      )
    }

    if (joining) {
      return (
        <Button disabled className="w-full h-11">
          <Loader2 className="w-4 h-4 animate-spin" />
        </Button>
      )
    }

    if (isJoined) {
      return (
        <div className="space-y-3">
          <Button
            onClick={() => navigate(`/chats?id=${meetup.id}`)}
            variant="outline"
            className="w-full flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <MessageSquare className="w-4 h-4" /> {t('meetup.chatTitle')}
          </Button>
          <Button
            onClick={handleJoinLeave}
            variant="destructive"
            className="w-full h-11"
          >
            {t('meetup.leaveTable')}
          </Button>
        </div>
      )
    }

    if (isFull) {
      return (
        <Button
          disabled
          variant="outline"
          className="w-full select-none"
        >
          {t('meetup.tableFull')}
        </Button>
      )
    }

    return (
      <Button
        onClick={handleJoinLeave}
        variant="default"
        className="w-full h-11"
      >
        <span className="flex items-center gap-1.5 justify-center">
          <CalendarCheck2 className="w-4 h-4" /> {t('meetup.joinTable')}
        </span>
      </Button>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Action Card / Reservation & Admin Actions */}
      <Card className="border-border/30 bg-card/60 backdrop-blur-2xl shadow-xl overflow-hidden">
        <CardContent className="p-4 pt-5 sm:p-6 sm:pt-5 space-y-5">
          {isCompleting ? (
            renderCompleteForm()
          ) : meetup.completed ? (
            renderCompletedSection()
          ) : (
            <>
              {/* Countdown panel with extra padding */}
              {!isPast && (
                <div className="p-5 rounded-2xl border border-primary/15 bg-primary/5 text-center space-y-2">
                  <Clock className="w-5 h-5 mx-auto text-primary" />
                  <p className="text-xs font-extrabold text-primary uppercase tracking-widest">{t('meetup.countdown')}</p>
                  <p className="text-sm font-extrabold text-foreground tracking-tight">{timeLeft}</p>
                </div>
              )}

              {/* Spots Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-muted-foreground">
                  <span>{t('meetup.spotsOccupied')}</span>
                  <span className="text-foreground">{attendees.length} / {meetup.max_players}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden border border-border/30">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-amber-500' : 'bg-primary'}`} 
                    style={{ width: `${(attendees.length / meetup.max_players) * 100}%` }}
                  />
                </div>
              </div>

              {/* Table Companion Quick Tools */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/20">
                {onFirstPlayerClick && (
                  <Button
                    type="button"
                    onClick={onFirstPlayerClick}
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs font-bold gap-1.5 border-border/40 bg-card hover:bg-muted/50 text-foreground rounded-xl cursor-pointer"
                  >
                    <Dices className="w-3.5 h-3.5 text-primary" />
                    <span>1er Jugador</span>
                  </Button>
                )}

                {onVictoryCardClick && (
                  <Button
                    type="button"
                    onClick={onVictoryCardClick}
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs font-bold gap-1.5 border-border/40 bg-card hover:bg-muted/50 text-foreground rounded-xl cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Tarjeta WA</span>
                  </Button>
                )}
              </div>

              {/* Main Join / Leave / Full Buttons (For normal users) */}
              {!isCreator && (
                user ? renderActionButton() : renderGuestSection()
              )}

              {/* Admin panel for the creator (Edit / Cancel / Complete options) */}
              {isCreator && (
                <div className="space-y-3 pt-1 border-t border-border/20">
                  <div className="text-center pb-1 text-xs font-bold text-primary flex items-center justify-center gap-1.5 bg-primary/5 p-2 rounded-lg border border-primary/10">
                    <Crown className="w-4 h-4 text-primary fill-current" />
                    {t('meetup.manageMaster')}
                  </div>

                  <Button 
                    onClick={() => navigate(`/chats?id=${meetup.id}`)}
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <MessageSquare className="w-4 h-4" /> {t('meetup.chatTitle')}
                  </Button>

                  <Button 
                    onClick={openCompleteForm}
                    variant="default"
                    className="w-full h-11 flex items-center justify-center gap-2 mb-1"
                  >
                    <CheckSquare className="w-4 h-4" /> {t('meetup.closeGame')}
                  </Button>

                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={() => navigate(`/mesa/${meetup.id}/edit`)}
                      variant="outline" 
                      size="sm"
                      className="h-10 flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> {t('common.edit')}
                    </Button>
                    
                    <Button 
                      onClick={() => setConfirmCancel(true)}
                      variant="outline" 
                      size="sm"
                      className="h-10 text-destructive border-destructive/30 hover:bg-destructive/10 flex items-center gap-1.5"
                      aria-label={t('meetup.cancelTable', 'Cancelar Mesa')}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> {t('meetup.cancelTable', 'Cancelar Mesa')}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Delete Table Dialog rendered at CardContent root for both active and completed meetups */}
          {isCreator && (
            <DeleteTableConfirmDialog
              isOpen={confirmCancel}
              onClose={() => setConfirmCancel(false)}
              onConfirmDelete={handleCancelMeetup}
              isDeleting={canceling}
              tableTitle={meetup.title}
            />
          )}
        </CardContent>
      </Card>

      {/* Boardgame Info Cards */}
      {gamesList.length === 0 ? (
        <Card className="border-border/30 bg-card/65 backdrop-blur-2xl shadow-xl overflow-hidden rounded-2xl hover:border-primary/30 transition-all">
          <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2 border-b border-border/20">
            <CardTitle className="text-sm font-extrabold tracking-tight uppercase text-foreground">{t('meetup.freeGameTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="p-5 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-muted-foreground">
              <MessageSquare className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <p className="font-extrabold text-xs text-foreground">{t('common.toDecide')}</p>
              <p className="text-xs text-muted-foreground leading-normal">
                {t('meetup.freeGameDesc')}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {gamesList.map((game) => {
            const cover = getGameCover(game) || game.image_url
            const title = getGameTitle(game)
            return (
              <Card key={game.bgg_id} className="border-border/30 bg-card/60 backdrop-blur-2xl shadow-xl overflow-hidden rounded-2xl group/card hover:border-primary/40 transition-colors">
                <CardHeader className="p-4 pb-3 sm:p-5 sm:pb-3 border-b border-border/20 flex flex-row items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {game.bgg_id ? (
                      <Link 
                        to={`/juegos/${game.bgg_id}`}
                        className="text-xs font-black tracking-tight uppercase text-primary truncate hover:underline flex-1 min-w-0"
                        title={title}
                      >
                        <CardTitle className="text-xs font-black tracking-tight uppercase text-primary truncate">
                          {title}
                        </CardTitle>
                      </Link>
                    ) : (
                      <CardTitle className="text-xs font-black tracking-tight uppercase text-primary truncate">
                        {title}
                      </CardTitle>
                    )}
                    {game.is_expansion && (
                      <ExpansionBadge size="xs" className="shadow-sm" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-4 sm:p-5 sm:pt-4 space-y-3.5">
                  {/* Cover image in card */}
                  {cover && (
                    game.bgg_id ? (
                      <Link
                        to={`/juegos/${game.bgg_id}`}
                        className="block w-full h-32 overflow-hidden rounded-xl border border-border/30 bg-background/50 p-1.5 flex items-center justify-center shadow-inner group/cover cursor-pointer hover:border-primary/40 transition-colors"
                        title={title}
                      >
                        <OptimizedImage
                          src={cover}
                          alt={title}
                          widthSize={250}
                          fit="contain"
                          className="w-full h-full bg-transparent border-0 shadow-none"
                          imgClassName="max-h-full max-w-full w-auto h-auto object-contain rounded-lg group-hover/cover:scale-105 transition-transform duration-200"
                        />
                      </Link>
                    ) : (
                      <div className="w-full h-32 overflow-hidden rounded-xl border border-border/30 bg-background/50 p-1.5 flex items-center justify-center shadow-inner">
                        <OptimizedImage
                          src={cover}
                          alt={title}
                          widthSize={250}
                          fit="contain"
                          className="w-full h-full bg-transparent border-0 shadow-none"
                          imgClassName="max-h-full max-w-full w-auto h-auto object-contain rounded-lg"
                        />
                      </div>
                    )
                  )}

                {/* Specs */}
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-muted/30 border border-border/20">
                    <p className="text-xs font-bold text-muted-foreground uppercase">{t('common.players')}</p>
                    <p className="text-xs font-extrabold text-primary mt-0.5">
                      {game.min_players === game.max_players 
                        ? `${game.min_players}` 
                        : `${game.min_players}-${game.max_players}`}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/30 border border-border/20">
                    <p className="text-xs font-bold text-muted-foreground uppercase">{t('explore.duration')}</p>
                    <p className="text-xs font-extrabold text-primary mt-0.5">
                      {game.playing_time ? `${game.playing_time} ${t('explore.minutes')}` : 'N/D'}
                    </p>
                  </div>
                </div>

                {/* Editorial Info */}
                {getGamePublisher(game) && (
                  <div className="px-3 py-2 rounded-xl bg-muted/20 border border-border/15 text-center">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('common.publisher')}</p>
                    <p className="text-xs font-extrabold text-foreground mt-0.5">{getGamePublisher(game)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )})}
        </div>
      )}

    </div>
  )
}
