import { memo } from 'react'
import { Link } from 'react-router-dom'
import { ListOrdered, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Game } from '../../types'
import { FeaturedGameHero } from '../FeaturedGameHero'
import { GameCarousel } from '../GameCarousel'
import { CommunityRankingCard } from '../CommunityRankingCard'
import { Button } from '../ui/button'

type CommunityRankingItem = Parameters<typeof CommunityRankingCard>[0]['ranking']

interface ExploreCarouselsProps {
  featuredGame: Game | null;
  top10: Game[];
  novedades: Game[];
  fastGames: Game[];
  paraDos: Game[];
  heavyGames: Game[];
  top10Month: Game[];
  partyGames: Game[];
  communityRankings: CommunityRankingItem[];
  classics: Game[];
}

export const ExploreCarousels = memo(function ExploreCarousels({
  featuredGame,
  top10,
  novedades,
  fastGames,
  paraDos,
  heavyGames,
  top10Month,
  partyGames,
  communityRankings,
  classics,
}: ExploreCarouselsProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      {/* Juego Recomendado del Día */}
      {featuredGame && (
        <FeaturedGameHero game={featuredGame} />
      )}

      {/* Top 10 Weekly (Played count based) */}
      <GameCarousel 
        games={top10} 
        title={t('explore.top10Week')} 
        variant="top10" 
      />

      {/* Novedades */}
      <GameCarousel 
        games={novedades} 
        title={t('explore.newSpain')} 
      />

      {/* Partidas Rápidas */}
      {fastGames.length > 0 && (
        <GameCarousel 
          games={fastGames} 
          title={t('explore.fastGames')} 
        />
      )}

      {/* Juegos para 2 */}
      <GameCarousel 
        games={paraDos} 
        title={t('explore.for2Players')} 
      />

      {/* Euros y Estrategia Pesada */}
      {heavyGames.length > 0 && (
        <GameCarousel 
          games={heavyGames} 
          title={t('explore.heavyGames')} 
        />
      )}

      {/* Top 10 Monthly (Played count based) */}
      <GameCarousel 
        games={top10Month} 
        title={t('explore.top10Month')} 
        variant="top10" 
      />

      {/* Fiesta y Grupos Grandes */}
      {partyGames.length > 0 && (
        <GameCarousel 
          games={partyGames} 
          title={t('explore.partyGames')} 
        />
      )}

      {/* Community Rankings & Tops Spotlight */}
      <div className="space-y-3 py-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-lg font-black font-display tracking-tight text-foreground">
            {t('explore.communityRankingsTitle', 'Rankings de la Comunidad')}
          </h3>
          <Button
            asChild
            size="sm"
            variant="outline"
          >
            <Link to="/tops">
              <Plus className="w-3.5 h-3.5" />
              <span>{t('common.create', 'Crear')}</span>
            </Link>
          </Button>
        </div>

        {communityRankings.length > 0 ? (
          <div className="w-full max-w-full min-w-0 flex gap-4 overflow-x-auto pb-4 pt-1 px-1.5 snap-x snap-proximity md:snap-none scroll-smooth no-scrollbar overscroll-x-contain">
            {communityRankings.map((ranking) => (
              <div 
                key={ranking.id}
                className="snap-start shrink-0 w-[220px] sm:w-[260px] md:w-[280px]"
              >
                <CommunityRankingCard ranking={ranking} />
              </div>
            ))}
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-primary/10 via-card to-card border border-border/40 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1 max-w-md">
              <h4 className="text-sm font-bold text-foreground">
                {t('tops.exploreBannerTitle', '¿Cuáles son tus juegos favoritos?')}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('tops.exploreBannerDesc', 'Diseña y exporta tu propia Tier List o Top 10 para compartir con tu grupo.')}
              </p>
            </div>
            <Button
              asChild
              variant="default"
              size="sm"
              className="shrink-0"
            >
              <Link to="/tops">
                <ListOrdered className="w-3.5 h-3.5 mr-1" />
                <span>{t('common.create', 'Crear')}</span>
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Classics */}
      <GameCarousel 
        games={classics} 
        title={t('explore.classicsBgg')} 
      />
    </div>
  )
})

export default ExploreCarousels;
