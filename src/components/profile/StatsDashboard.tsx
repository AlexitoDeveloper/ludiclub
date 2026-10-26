import { useMemo } from 'react'
import { Trophy, Dices, Sparkles, Layers, HelpCircle } from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover'
import { UserStats } from '../../hooks/useProfile'
import { Meetup } from '../../types'
import { useTranslation } from 'react-i18next'

interface StatsDashboardProps {
  stats: UserStats;
  meetups?: Meetup[];
  profileId?: string;
}

export function StatsDashboard({ stats, meetups = [], profileId }: StatsDashboardProps) {
  const { t } = useTranslation()

  // Calculate Unique Games Played and Top Category/Mechanic
  const { uniqueGamesCount, topCategory } = useMemo(() => {
    const completedAttended = meetups.filter(
      m => m.completed && (!profileId || m.attended_players?.includes(profileId))
    )

    const uniqueGameKeys = new Set<string>()
    const categoryCounts: Record<string, number> = {}

    completedAttended.forEach(m => {
      (m.games || []).forEach(g => {
        const key = g.bgg_id ? String(g.bgg_id) : (g.title || '')
        if (key) {
          uniqueGameKeys.add(key)
        }

        if (g.categories && Array.isArray(g.categories)) {
          g.categories.forEach(c => {
            categoryCounts[c] = (categoryCounts[c] || 0) + 1
          })
        } else if (g.mechanics && Array.isArray(g.mechanics)) {
          g.mechanics.forEach(mc => {
            categoryCounts[mc] = (categoryCounts[mc] || 0) + 1
          })
        }
      })
    })

    const topCategoryEntry = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]
    const favCat = topCategoryEntry
      ? topCategoryEntry[0]
      : (stats.played > 0 ? 'Estrategia' : 'En exploración')

    return { 
      uniqueGamesCount: uniqueGameKeys.size > 0 ? uniqueGameKeys.size : (stats.played > 0 ? 1 : 0), 
      topCategory: favCat 
    }
  }, [meetups, profileId, stats.played])

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 select-none">
      {/* 1. Total Plays Card - Emerald Mint */}
      <Card className="glass-panel border-border/30 shadow-md relative overflow-hidden group rounded-2xl hover:border-emerald-500/40 transition-all duration-300">
        <div className="absolute -right-2 -bottom-2 opacity-5 dark:opacity-[0.04] group-hover:scale-110 transition-transform pointer-events-none">
          <Dices className="w-20 h-20 text-emerald-500" />
        </div>
        <CardContent className="p-3.5 sm:p-4 text-left space-y-1 relative z-10">
          <div className="flex items-center gap-1.5 text-emerald-500">
            <Dices className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs font-black uppercase tracking-wider truncate">
              {t('profile.statsTotalPlays', 'Total Partidas')}
            </span>
          </div>
          <div className="flex items-baseline gap-1 pt-0.5">
            <span className="text-2xl sm:text-3xl font-black font-mono-tabular tracking-tight text-foreground">
              {stats.played}
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-semibold truncate leading-tight">
            {stats.played === 1 ? 'Partida completada' : 'Partidas completadas'}
          </p>
        </CardContent>
      </Card>

      {/* 2. Win Rate Card - Amber Gold */}
      <Card className="glass-panel border-border/30 shadow-md relative overflow-hidden group rounded-2xl hover:border-amber-500/40 transition-all duration-300">
        <div className="absolute -right-2 -bottom-2 opacity-5 dark:opacity-[0.04] group-hover:scale-110 transition-transform pointer-events-none">
          <Trophy className="w-20 h-20 text-amber-500" />
        </div>
        <CardContent className="p-3.5 sm:p-4 text-left space-y-1 relative z-10">
          <div className="flex items-center gap-1.5 text-amber-500 dark:text-amber-400">
            <Trophy className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs font-black uppercase tracking-wider truncate">
              {t('profile.winRate', '% Victoria')}
            </span>
          </div>
          <div className="flex items-baseline gap-1 pt-0.5">
            <span className="text-2xl sm:text-3xl font-black font-mono-tabular tracking-tight text-amber-500 dark:text-amber-400">
              {stats.winRate}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-semibold truncate leading-tight">
            {stats.won} {stats.won === 1 ? 'victoria' : 'victorias'}
          </p>
        </CardContent>
      </Card>

      {/* 3. Unique Games Card - Sky Blue (Replaces H-Index) */}
      <Card className="glass-panel border-border/30 shadow-md relative overflow-hidden group rounded-2xl hover:border-sky-500/40 transition-all duration-300">
        <div className="absolute -right-2 -bottom-2 opacity-5 dark:opacity-[0.04] group-hover:scale-110 transition-transform pointer-events-none">
          <Sparkles className="w-20 h-20 text-sky-500" />
        </div>
        <CardContent className="p-3.5 sm:p-4 text-left space-y-1 relative z-10">
          <div className="flex items-center justify-between gap-1 text-sky-500 dark:text-sky-400">
            <div className="flex items-center gap-1.5 min-w-0">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className="text-xs font-black uppercase tracking-wider truncate">
                {t('profile.statsUniqueGames', 'Títulos Únicos')}
              </span>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Información sobre Títulos Únicos"
                  className="text-muted-foreground/60 hover:text-sky-500 hover:bg-transparent cursor-pointer shrink-0"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 text-left p-3.5 bg-card/95 backdrop-blur-xl border border-border/40 shadow-xl rounded-2xl space-y-1.5 z-50">
                <h4 className="text-xs font-black text-sky-500 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> {t('profile.statsUniqueGames', 'Títulos Únicos')}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('profile.statsUniqueGamesHelp', 'Mide tu catálogo probado: cuenta cada juego de mesa diferente al que has jugado en las mesas registradas.')}
                </p>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-baseline gap-1 pt-0.5">
            <span className="text-2xl sm:text-3xl font-black font-mono-tabular tracking-tight text-sky-500 dark:text-sky-400">
              {uniqueGamesCount}
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-semibold truncate leading-tight">
            {uniqueGamesCount === 1 ? '1 juego explorado' : `${uniqueGamesCount} juegos explorados`}
          </p>
        </CardContent>
      </Card>

      {/* 4. Favorite Category / Mechanic Card - Royal Purple */}
      <Card className="glass-panel border-border/30 shadow-md relative overflow-hidden group rounded-2xl hover:border-purple-500/40 transition-all duration-300">
        <div className="absolute -right-2 -bottom-2 opacity-5 dark:opacity-[0.04] group-hover:scale-110 transition-transform pointer-events-none">
          <Layers className="w-20 h-20 text-purple-500" />
        </div>
        <CardContent className="p-3.5 sm:p-4 text-left space-y-1 relative z-10">
          <div className="flex items-center gap-1.5 text-purple-500 dark:text-purple-400">
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs font-black uppercase tracking-wider truncate">
              {t('profile.statsFavoriteFaction', 'Mecánica Top')}
            </span>
          </div>
          <div className="pt-1">
            <span className="text-sm sm:text-base font-black text-purple-600 dark:text-purple-300 truncate block leading-tight">
              {topCategory}
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-semibold truncate leading-tight">
            {stats.played > 0 ? t('profile.statsFavoriteFactionDesc', 'Mecánica más jugada') : 'Sin datos de juego'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
