import { motion } from 'framer-motion'
import { Plus, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { OptimizedImage } from './ui/OptimizedImage'
import { ExpansionBadge } from './ui/expansion-badge'
import { Game } from '../types'
import { useGameLocale } from '../hooks/useGameLocale'
import { useTranslation } from 'react-i18next'
import { FeaturedGameStats } from './FeaturedGameStats'
import { FeaturedGameHeroSkeleton } from './FeaturedGameHeroSkeleton'

export { FeaturedGameHeroSkeleton }

interface FeaturedGameHeroProps {
  game: Game | null;
}

import { memo } from 'react'

export const FeaturedGameHero = memo(function FeaturedGameHero({ game }: FeaturedGameHeroProps) {
  const { t } = useTranslation()
  const { getGameTitle, getGamePublisher, getGameCover } = useGameLocale()
  if (!game) return null

  const displayTitle = getGameTitle(game)
  const coverUrl = getGameCover(game)
  const isSpanish = game.has_spanish_edition || !!game.title_es
  
  // Format complexity (averageweight) to 1 decimal place or show placeholder
  const hasComplexity = game.complexity != null && Number(game.complexity) > 0
  const formattedComplexity = hasComplexity 
    ? Number(game.complexity).toFixed(1) 
    : null

  // Format rating (average) to 1 decimal place
  const formattedRating = game.rating_average 
    ? Number(game.rating_average).toFixed(1) 
    : (game.rating_geek ? Number(game.rating_geek).toFixed(1) : 'N/A')

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.35, type: 'spring', damping: 25, stiffness: 300 }}
      className="w-full relative rounded-3xl overflow-hidden border border-border/50 bg-card p-6 sm:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-center shadow-lg hover:border-primary/40 hover:shadow-xl transition-[border-color,box-shadow] duration-200 group"
    >
      {/* Full-card accessible overlay link */}
      <Link 
        to={`/juegos/${game.bgg_id}`} 
        className="absolute inset-0 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-3xl"
        aria-label={displayTitle}
      />

      {/* Game Cover on Left */}
      <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-44 md:h-44 shrink-0 rounded-2xl overflow-hidden border border-border/40 bg-muted shadow-md relative flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.03] pointer-events-none">
        <OptimizedImage
          src={coverUrl}
          alt={displayTitle}
          widthSize={350}
          fit="cover"
          loading="eager"
          className="w-full h-full"
        />
      </div>

      {/* Info on Right */}
      <div className="flex-1 min-w-0 text-center md:text-left flex flex-col justify-between h-full space-y-4">
        <div className="space-y-2">
          {/* Badge */}
          <Badge variant="raspberry" className="gap-1.5 px-3 py-1 text-xs relative z-20">
            <Star className="w-3.5 h-3.5 fill-white text-white" strokeWidth={2} aria-hidden="true" />
            <span>{t('explore.recommendedTitle')}</span>
          </Badge>

          {/* Title */}
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black font-display tracking-tight text-foreground leading-tight break-words text-pretty">
            {displayTitle}
            {game.year_published && (
              <span className="text-muted-foreground/60 text-sm sm:text-base md:text-lg font-normal ml-2">
                ({game.year_published})
              </span>
            )}
          </h2>

          {/* Subtitle / Edition */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs font-semibold text-muted-foreground">
            {isSpanish && (
              <Badge variant="tag-emerald">
                {t('explore.spanishEdition')}
              </Badge>
            )}
            {game.is_expansion && (
              <ExpansionBadge size="sm" />
            )}
            {getGamePublisher(game) && (
              <span className="text-muted-foreground/70">{t('explore.editedBy', { publisher: getGamePublisher(game) })}</span>
            )}
          </div>
        </div>

        {/* Quick Stats Grid */}
        <FeaturedGameStats
          game={game}
          formattedRating={formattedRating}
          formattedComplexity={formattedComplexity}
          hasComplexity={hasComplexity}
        />

        {/* Actions (elevated above overlay link) */}
        <div className="relative z-20 flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
          <Button 
            asChild 
            size="default" 
          >
            <Link to={`/mesa/nueva?gameId=${game.bgg_id}`}>
              <Plus className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
              <span>{t('common.hostTable')}</span>
            </Link>
          </Button>
          <Button 
            asChild 
            size="default" 
            variant="outline" 
          >
            <Link to={`/juegos/${game.bgg_id}`}>
              {t('common.details')}
            </Link>
          </Button>
        </div>
      </div>
    </motion.div>
  )
})

export default FeaturedGameHero;
