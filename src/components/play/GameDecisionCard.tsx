import { FC } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dices, Users, Clock, RotateCw, PackageCheck, Brain, Trophy, RotateCcw, Zap } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Skeleton } from '../ui/skeleton'
import { useTranslation } from 'react-i18next'
import { SimpleGame } from '../../hooks/usePlayDecisionEngine'

interface GameDecisionCardProps {
  suggestedGame: SimpleGame | null
  spinningGame?: SimpleGame | null
  isSpinning: boolean
  loadingGames: boolean
  filteredCount: number
  spinError: string | null
  availableExpansions: SimpleGame[]
  onSpin: () => void
  onResetFilters: () => void
  onQuickLog?: (game: SimpleGame) => void
}

export const GameDecisionCard: FC<GameDecisionCardProps> = ({
  suggestedGame,
  spinningGame,
  isSpinning,
  loadingGames,
  filteredCount,
  spinError,
  availableExpansions,
  onSpin,
  onResetFilters,
  onQuickLog,
}) => {
  const { t, i18n } = useTranslation()

  if (loadingGames) {
    return (
      <div className="p-6 rounded-3xl bg-card/60 border border-border/40 space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Skeleton className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-2.5 w-full">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-7 w-3/4 rounded-lg" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (filteredCount === 0) {
    return (
      <div className="p-8 rounded-3xl bg-card/50 border border-dashed border-border/60 text-center space-y-4 animate-in fade-in">
        <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
          <Dices className="w-7 h-7" aria-hidden="true" />
        </div>
        <h3 className="text-base font-bold text-foreground max-w-md mx-auto">{t('play.noGamesFound')}</h3>
        <Button type="button" variant="outline" size="default" onClick={onResetFilters}>
          <RotateCcw className="w-4 h-4 mr-2 text-primary" aria-hidden="true" />
          <span>{t('play.filters.reset')}</span>
        </Button>
      </div>
    )
  }

  // Active Spinning State: Fast ticker without mounting/unmounting Framer Motion key loops
  if (isSpinning && spinningGame) {
    const spinningTitle = i18n.language === 'es' && spinningGame.title_es ? spinningGame.title_es : spinningGame.title

    return (
      <div className="p-6 rounded-3xl bg-primary/10 border-2 border-primary/40 shadow-xl space-y-5 text-center sm:text-left relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-card/80 flex items-center justify-center border border-primary/40 shrink-0 relative overflow-hidden shadow-md">
            {(spinningGame.image_url_es || spinningGame.image_url) ? (
              <img src={(spinningGame.image_url_es || spinningGame.image_url) || undefined} alt={spinningTitle} className="w-full h-full object-cover filter blur-[1px] transition-[filter,opacity] duration-100" />
            ) : (
              <Dices className="w-10 h-10 text-primary" aria-hidden="true" />
            )}
            <div className="absolute inset-0 bg-primary/10 backdrop-blur-[0.5px] flex items-center justify-center">
              <Dices className="w-7 h-7 text-primary/70" aria-hidden="true" />
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/20 text-primary font-black text-xs uppercase tracking-wider">
              <RotateCw className="w-3 h-3 animate-fast-spin" aria-hidden="true" />
              <span>{t('play.spinningRoulette')}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-foreground truncate font-display">
              {spinningTitle}
            </h3>
            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-mono-tabular text-muted-foreground font-semibold">
              <span>{spinningGame.min_players || 2}-{spinningGame.max_players || 5} {t('common.playersAbbr')}</span>
              <span>•</span>
              <span>{spinningGame.playing_time || 45} min</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 relative z-10">
      <AnimatePresence mode="wait">
        {suggestedGame ? (
          <motion.div
            key={`winner-${suggestedGame.bgg_id}`}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="p-5 sm:p-6 rounded-3xl bg-primary/10 border-2 border-primary/30 shadow-xl space-y-5"
          >
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              {(suggestedGame.image_url_es || suggestedGame.image_url) ? (
                <img src={(suggestedGame.image_url_es || suggestedGame.image_url) || undefined} alt={suggestedGame.title} className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover shadow-md shrink-0 border border-border/30" />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-card flex items-center justify-center border border-border/30 shrink-0 text-muted-foreground">
                  <Dices className="w-10 h-10" aria-hidden="true" />
                </div>
              )}

              <div className="flex-1 text-center sm:text-left space-y-1.5 min-w-0">
                <span className="text-xs font-bold uppercase text-primary tracking-wider flex items-center justify-center sm:justify-start gap-1">
                  <Trophy className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                  <span>{t('play.winnerBadge')}</span>
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-foreground truncate font-display">
                  {i18n.language === 'es' && suggestedGame.title_es ? suggestedGame.title_es : suggestedGame.title}
                  {suggestedGame.year_published ? <span className="text-sm font-semibold text-muted-foreground ml-2">({suggestedGame.year_published})</span> : null}
                </h3>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
                  <Badge variant="secondary" size="sm" className="font-mono-tabular">
                    <Users className="w-3.5 h-3.5 mr-1 text-muted-foreground" aria-hidden="true" />
                    {suggestedGame.min_players || 2}-{suggestedGame.max_players || 5} {t('common.playersAbbr')}
                  </Badge>
                  <Badge variant="secondary" size="sm" className="font-mono-tabular">
                    <Clock className="w-3.5 h-3.5 mr-1 text-muted-foreground" aria-hidden="true" />
                    {suggestedGame.playing_time || 45} min
                  </Badge>
                  {typeof suggestedGame.complexity === 'number' && suggestedGame.complexity > 0 && (
                    <Badge variant="secondary" size="sm" className="font-mono-tabular">
                      <Brain className="w-3.5 h-3.5 mr-1 text-muted-foreground" aria-hidden="true" />
                      {suggestedGame.complexity.toFixed(1)}/5
                    </Badge>
                  )}
                  {suggestedGame.is_unplayed && (
                    <Badge variant="secondary" size="sm">
                      <PackageCheck className="w-3.5 h-3.5 mr-1 text-muted-foreground" aria-hidden="true" />
                      {t('play.unplayedBadge')}
                    </Badge>
                  )}
                  {availableExpansions.length > 0 && (
                    <Badge variant="primary-soft" size="sm">
                      +{availableExpansions.length} {t('play.expansionsShort')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2 sm:gap-2.5">
              {onQuickLog && (
                <Button
                  type="button"
                  onClick={() => onQuickLog(suggestedGame)}
                  size="lg"
                  className="w-full sm:w-auto font-black shadow-md shadow-primary/20 text-xs sm:text-sm px-4 sm:px-6"
                >
                  <Zap className="w-4 h-4 text-white shrink-0" aria-hidden="true" />
                  <span className="truncate">{t('play.roulette.logMatch', 'Registrar partida')}</span>
                </Button>
              )}
              <Button
                type="button"
                variant="secondary"
                onClick={onSpin}
                disabled={isSpinning}
                size="lg"
                className="w-full sm:w-auto font-bold text-xs sm:text-sm px-3 sm:px-4"
              >
                <RotateCw className={`w-4 h-4 mr-1.5 sm:mr-2 shrink-0 ${isSpinning ? 'animate-spin' : ''}`} aria-hidden="true" />
                <span className="truncate">{t('play.spinAgain')}</span>
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="p-6 rounded-3xl bg-card/60 border border-border/40 text-center space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button type="button" onClick={onSpin} disabled={isSpinning} size="lg" className="w-full sm:w-auto">
                <RotateCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} aria-hidden="true" />
                <span>{t('play.spinRoulette')}</span>
              </Button>
            </div>
            {spinError && <p className="text-xs font-semibold text-destructive animate-in fade-in">{spinError}</p>}
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
