import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarDays, Clock, ChevronRight, Plus, Crown } from 'lucide-react'
import { Badge } from '../../ui/badge'
import { Button } from '../../ui/button'
import { Meetup } from '../../../types'
import { useGameLocale } from '../../../hooks/useGameLocale'
import { useTranslation } from 'react-i18next'
import { formatDate } from '../../../lib/dateLocale'

interface MeetupsTabProps {
  meetups: Meetup[];
  type: 'upcoming' | 'completed';
  isOwnProfile: boolean;
  currentUserId?: string;
}

export function MeetupsTab({
  meetups,
  type,
  isOwnProfile,
  currentUserId
}: MeetupsTabProps) {
  const { t } = useTranslation()
  const { getGameTitle, getGameCover, language } = useGameLocale()

  const sortedMeetups = useMemo(() => {
    return [...meetups].sort((a, b) => {
      const timeA = new Date(a.date || (a as any).created_at || 0).getTime()
      const timeB = new Date(b.date || (b as any).created_at || 0).getTime()
      return type === 'completed' ? timeB - timeA : timeA - timeB
    })
  }, [meetups, type])

  return (
    <div className="space-y-2.5">
      {sortedMeetups.length === 0 ? (
        <div className="text-center py-12 px-4 bg-card/40 rounded-2xl border border-dashed border-border/40 select-none space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-bold text-muted-foreground">
              {type === 'upcoming' ? t('profile.upcomingEmpty') : t('profile.historyEmpty')}
            </p>
            {isOwnProfile && type === 'upcoming' && (
              <p className="text-xs text-muted-foreground/80">{t('profile.upcomingEmptyDesc')}</p>
            )}
          </div>
          {isOwnProfile && type === 'upcoming' && (
            <div className="pt-1">
              <Button asChild size="sm" variant="outline" className="gap-1.5 cursor-pointer">
                <Link to="/mesa/nueva">
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{t('quickActions.createMeetup', 'Abrir Mesa')}</span>
                </Link>
              </Button>
            </div>
          )}
        </div>
      ) : (
        sortedMeetups.map((meetup, idx) => {
          const gamesList = Array.isArray(meetup.games) ? meetup.games : (meetup.games ? [meetup.games] : [])
          const mainGame = gamesList[0] || null
          const isWinner = type === 'completed' && currentUserId && (
            gamesList.some(g => g.winner_user_id === currentUserId) ||
            meetup.player_scores?.some(ps => ps.userId === currentUserId && ps.isWinner)
          )
          const didAttend = meetup.attended_players?.includes(currentUserId || '')

          const coverUrl = mainGame ? (getGameCover(mainGame) || mainGame.image_url) : null

          return (
            <motion.div
              key={meetup.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link to={`/mesa/${meetup.id}`}>
                <div className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl glass-panel hover:border-primary/30 hover:shadow-md transition-all group border-border/30 ${
                  type === 'completed' && isWinner ? 'border-amber/30 bg-amber/5' : ''
                }`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-12 h-12 shrink-0">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-background/60 border border-border/20 p-1 flex items-center justify-center group-hover:border-primary/30 transition-colors">
                        {coverUrl ? (
                          <img src={coverUrl} alt={getGameTitle(mainGame)} className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full rounded-lg bg-muted flex items-center justify-center text-xs font-black text-muted-foreground">?</div>
                        )}
                      </div>
                      {gamesList.length > 1 && (
                        <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs font-black px-1.5 py-0.5 rounded-md border border-background shadow-xs font-mono-tabular">
                          +{gamesList.length - 1}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 text-left space-y-1">
                      <span className="font-extrabold text-sm block text-foreground truncate group-hover:text-primary transition-colors">
                        {meetup.title}
                      </span>
                      <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                        <span className="text-xs text-muted-foreground font-bold flex items-center gap-1 font-mono-tabular">
                          {type === 'upcoming' ? (
                            <>
                              <CalendarDays className="w-3.5 h-3.5 text-primary shrink-0" />
                              {formatDate(meetup.date, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }, language)}
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                              {formatDate(meetup.date, { day: 'numeric', month: 'short', year: 'numeric' }, language)}
                            </>
                          )}
                        </span>

                        {type === 'completed' && isWinner && (
                          <Badge variant="tag-amber" size="sm" className="flex items-center gap-1 shrink-0 font-bold font-mono-tabular">
                            <Crown className="w-3 h-3 fill-amber text-amber shrink-0" /> {t('common.won')}
                          </Badge>
                        )}

                        {type === 'completed' && !didAttend && (
                          <Badge variant="secondary" size="sm" className="shrink-0 font-bold">
                            {t('profile.absent')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                </div>
              </Link>
            </motion.div>
          )
        })
      )}
    </div>
  )
}
