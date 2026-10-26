import { useState, FC, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Plus, Minus, UserPlus, Trash2, Crown, Save, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { PlayerScore, MeepleColor } from '../../types'
import { cn } from '../../lib/utils'

interface LiveScoreTrackerProps {
  initialScores?: PlayerScore[] | null
  attendees?: { id: string; name: string; avatarUrl?: string | null; isGuest?: boolean }[]
  isEditable?: boolean
  onSaveScores?: (scores: PlayerScore[]) => Promise<void>
}

const AVAILABLE_COLORS: MeepleColor[] = ['red', 'blue', 'yellow', 'green', 'purple', 'orange']

const COLOR_BADGES: Record<MeepleColor, { bg: string; text: string; border: string }> = {
  red: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
  blue: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
  yellow: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  green: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  purple: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
  orange: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
}

/**
 * Normalizes and deduplicates an array of PlayerScore entries.
 * Ensures each participant appears at most once by matching either
 * identical non-empty IDs (userId or guestId) or normalized names.
 * When merging duplicates, it preserves higher scores, winner status,
 * and user/guest identifiers.
 */
function deduplicatePlayerScores(list: PlayerScore[]): PlayerScore[] {
  if (!list || list.length === 0) return []
  const result: PlayerScore[] = []

  for (const item of list) {
    const normName = item.name ? item.name.toLowerCase().trim() : ''
    const itemUserId = item.userId?.trim()
    const itemGuestId = item.guestId?.trim()

    const existingIdx = result.findIndex((r) => {
      // 1. Direct ID match
      if (itemUserId && r.userId && itemUserId === r.userId) return true
      if (itemGuestId && r.guestId && itemGuestId === r.guestId) return true
      // 2. Cross ID match (e.g. attendee id was stored in userId vs guestId)
      if (itemGuestId && r.userId && itemGuestId === r.userId) return true
      if (itemUserId && r.guestId && itemUserId === r.guestId) return true
      // 3. Name match (case and whitespace normalized)
      if (normName && r.name && r.name.toLowerCase().trim() === normName) return true
      return false
    })

    if (existingIdx !== -1) {
      const existing = result[existingIdx]
      const preferredScore = Math.max(existing.score || 0, item.score || 0)
      const isWinner = existing.isWinner || item.isWinner
      result[existingIdx] = {
        ...existing,
        ...item,
        score: preferredScore,
        isWinner,
        userId: existing.userId || item.userId,
        guestId: existing.guestId || item.guestId,
      }
    } else {
      result.push({ ...item })
    }
  }

  return result
}

export const LiveScoreTracker: FC<LiveScoreTrackerProps> = ({
  initialScores,
  attendees = [],
  isEditable = true,
  onSaveScores,
}) => {
  const { t } = useTranslation()
  const [scores, setScores] = useState<PlayerScore[]>([])
  const [newGuestName, setNewGuestName] = useState('')
  const [showAddGuest, setShowAddGuest] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const isInitializedRef = useRef(false)
  const lastInitialScoresStrRef = useRef<string>('')

  // Initialize scores from props or registered attendees safely
  useEffect(() => {
    const sanitizedInitial = deduplicatePlayerScores(initialScores || [])
    const currentInitialStr = JSON.stringify(sanitizedInitial)

    // Case 1: Initial scores changed externally (e.g. initial DB fetch)
    if (sanitizedInitial.length > 0 && currentInitialStr !== lastInitialScoresStrRef.current) {
      lastInitialScoresStrRef.current = currentInitialStr
      setScores(sanitizedInitial)
      isInitializedRef.current = true
      return
    }

    // Case 2: Not yet initialized, and attendees exist
    if (!isInitializedRef.current && attendees.length > 0) {
      const generated: PlayerScore[] = attendees.map((a, idx) => ({
        userId: a.isGuest ? undefined : a.id,
        guestId: a.isGuest ? a.id : undefined,
        name: a.name,
        score: 0,
        meepleColor: AVAILABLE_COLORS[idx % AVAILABLE_COLORS.length],
      }))
      const deduplicated = deduplicatePlayerScores(generated)
      setScores(deduplicated)
      isInitializedRef.current = true
      return
    }

    // Case 3: Already initialized, but new attendees joined who are not in scores
    if (isInitializedRef.current && attendees.length > 0) {
      setScores((prev) => {
        const cleanedPrev = deduplicatePlayerScores(prev)

        const missing = attendees.filter((a) => {
          const aNameNorm = a.name.toLowerCase().trim()
          return !cleanedPrev.some((p) => {
            const pNameNorm = p.name ? p.name.toLowerCase().trim() : ''
            const idMatches = p.userId === a.id || p.guestId === a.id
            const nameMatches = pNameNorm === aNameNorm
            return idMatches || nameMatches
          })
        })

        if (missing.length === 0) {
          return cleanedPrev.length !== prev.length ? cleanedPrev : prev
        }

        const additions: PlayerScore[] = missing.map((a, idx) => ({
          userId: a.isGuest ? undefined : a.id,
          guestId: a.isGuest ? a.id : undefined,
          name: a.name,
          score: 0,
          meepleColor: AVAILABLE_COLORS[(cleanedPrev.length + idx) % AVAILABLE_COLORS.length],
        }))

        return deduplicatePlayerScores([...cleanedPrev, ...additions])
      })
    }
  }, [initialScores, attendees])

  // Compute leader and ranks
  const maxScore = scores.length > 0 ? Math.max(...scores.map((s) => s.score)) : 0
  const hasLeader = maxScore > 0

  const handleAdjustScore = (index: number, delta: number) => {
    if (!isEditable) return
    setScores((prev) => {
      const updated = [...prev]
      const current = updated[index]?.score || 0
      updated[index] = { ...updated[index], score: Math.max(0, current + delta) }
      return updated
    })
    setSaveSuccess(false)
  }

  const handleSetExactScore = (index: number, value: number) => {
    if (!isEditable) return
    setScores((prev) => {
      const updated = [...prev]
      if (!updated[index]) return prev
      updated[index] = { ...updated[index], score: Math.max(0, value) }
      return updated
    })
    setSaveSuccess(false)
  }

  const handleAddGuest = () => {
    const trimmed = newGuestName.trim()
    if (!trimmed) return

    const alreadyExists = scores.some(
      (s) => s.name?.toLowerCase().trim() === trimmed.toLowerCase().trim()
    )
    if (alreadyExists) {
      setNewGuestName('')
      setShowAddGuest(false)
      return
    }

    const newGuest: PlayerScore = {
      guestId: `guest-${Date.now()}`,
      name: trimmed,
      score: 0,
      meepleColor: AVAILABLE_COLORS[scores.length % AVAILABLE_COLORS.length],
    }

    setScores((prev) => deduplicatePlayerScores([...prev, newGuest]))
    setNewGuestName('')
    setShowAddGuest(false)
    setSaveSuccess(false)
  }

  const handleRemovePlayer = (index: number) => {
    if (!isEditable) return
    setScores((prev) => prev.filter((_, idx) => idx !== index))
    setSaveSuccess(false)
  }

  const handleSave = async () => {
    if (!onSaveScores) return
    setIsSaving(true)
    try {
      // Sort and assign ranks and winner flag
      const sorted = [...scores].sort((a, b) => b.score - a.score)
      const ranked: PlayerScore[] = deduplicatePlayerScores(sorted).map((item, idx) => ({
        ...item,
        rank: idx + 1,
        isWinner: idx === 0 && item.score > 0,
      }))

      await onSaveScores(ranked)
      setScores(ranked)
      lastInitialScoresStrRef.current = JSON.stringify(ranked)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2500)
    } catch (err) {
      console.error('Error saving player scores:', err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-card border border-border/40 rounded-3xl p-5 md:p-6 shadow-sm space-y-5">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 border-b border-border/30 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm md:text-base text-foreground tracking-tight">
              {t('session.liveScore.title')}
            </h3>
            <p className="text-xs text-muted-foreground font-medium">
              {t('session.liveScore.desc')}
            </p>
          </div>
        </div>

        {isEditable && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddGuest(true)}
              className="gap-1 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('session.liveScore.guest')}</span>
            </Button>

            {onSaveScores && (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{t('session.liveScore.saved')}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>{t('common.save')}</span>
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Add guest inline form */}
      {showAddGuest && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-muted/40 rounded-2xl border border-border/40 flex items-center gap-2"
        >
          <Input
            value={newGuestName}
            onChange={(e) => setNewGuestName(e.target.value)}
            placeholder={t('session.liveScore.guestPlaceholder')}
            className="h-9 text-xs rounded-xl bg-background"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddGuest()
              }
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowAddGuest(false)}
            className="shrink-0"
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleAddGuest}
            disabled={!newGuestName.trim()}
            className="shrink-0"
          >
            {t('session.liveScore.add')}
          </Button>
        </motion.div>
      )}

      {/* Players Score Cards Grid */}
      {scores.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-xs font-medium bg-muted/20 rounded-2xl border border-dashed border-border/40">
          {t('session.liveScore.noPlayers')}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {scores.map((player, idx) => {
            const isLeader = hasLeader && player.score === maxScore
            const badge = COLOR_BADGES[player.meepleColor] || COLOR_BADGES.green

            return (
              <div
                key={player.userId || player.guestId || idx}
                className={cn(
                  'p-4 rounded-2xl border transition-all duration-200 bg-card/60 backdrop-blur-md flex flex-col justify-between gap-3 relative overflow-hidden',
                  isLeader
                    ? 'border-amber-400/50 shadow-md shadow-amber-500/5 bg-amber-500/[0.03]'
                    : 'border-border/40 hover:border-border/60'
                )}
              >
                {/* Player identity & Rank badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={cn(
                        'w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-black uppercase shrink-0',
                        badge.bg,
                        badge.text,
                        badge.border
                      )}
                    >
                      {player.name.substring(0, 2)}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-xs md:text-sm text-foreground truncate block">
                          {player.name}
                        </span>
                        {isLeader && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      </div>
                      {player.guestId && (
                        <span className="text-xs text-muted-foreground font-medium block">
                          {t('session.liveScore.guest')}
                        </span>
                      )}
                    </div>
                  </div>

                  {isEditable && player.guestId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleRemovePlayer(idx)}
                      className="text-muted-foreground hover:text-destructive"
                      title={t('session.liveScore.removeGuest')}
                      aria-label={t('session.liveScore.removeGuest')}
                      icon={Trash2}
                    />
                  )}
                </div>

                {/* Score display & Adjust buttons */}
                <div className="flex items-center justify-between gap-3 pt-1 border-t border-border/20">
                  {/* Score big number */}
                  <div className="flex items-baseline gap-1">
                    <Input
                      type="number"
                      value={player.score}
                      disabled={!isEditable}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === '') {
                          handleSetExactScore(idx, 0)
                        } else {
                          const parsed = parseInt(val, 10)
                          if (!isNaN(parsed)) {
                            handleSetExactScore(idx, Math.max(0, parsed))
                          }
                        }
                      }}
                      className="w-20 h-10 font-mono font-black text-xl text-foreground text-center rounded-xl bg-background/50 border-border/40 focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                    <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                      pts
                    </span>
                  </div>

                  {/* Increment / Decrement buttons */}
                  {isEditable && (
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => handleAdjustScore(idx, -5)}
                        className="text-muted-foreground hover:text-foreground"
                        title={t('session.liveScore.minus5')}
                      >
                        -5
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-xs"
                        onClick={() => handleAdjustScore(idx, -1)}
                        className="text-muted-foreground hover:text-foreground"
                        title={t('session.liveScore.minus1')}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-xs"
                        onClick={() => handleAdjustScore(idx, 1)}
                        className="text-primary hover:bg-primary/10 border-primary/30"
                        title={t('session.liveScore.plus1')}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => handleAdjustScore(idx, 5)}
                        className="text-primary hover:bg-primary/10 border-primary/30"
                        title={t('session.liveScore.plus5')}
                      >
                        +5
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
