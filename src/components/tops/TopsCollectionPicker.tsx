import { Check, Library, Sparkles } from 'lucide-react'
import { Game } from '../../types'
import { Tier } from '../../hooks/useTops'
import { TopsGameCover } from './TopsGameCover'
import { useGameLocale } from '../../hooks/useGameLocale'
import { useTranslation } from 'react-i18next'

interface TopsCollectionPickerProps {
  collectionGames: Game[];
  loadingCollection: boolean;
  quickPlaceGame: (game: Game) => void;
  tiers: Tier[];
  top10: (Game | null)[];
  pool: Game[];
}

export function TopsCollectionPicker({
  collectionGames,
  loadingCollection,
  quickPlaceGame,
  tiers,
  top10,
  pool,
}: TopsCollectionPickerProps) {
  const { t } = useTranslation()
  const { getGameTitle } = useGameLocale()

  const isGamePlaced = (bggId: number) => {
    return (
      pool.some(g => g.bgg_id === bggId) ||
      tiers.some(t => t.games.some(g => g.bgg_id === bggId)) ||
      top10.some(g => g?.bgg_id === bggId)
    )
  }

  if (loadingCollection) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 py-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 bg-muted/20 border border-border/30 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (collectionGames.length === 0) {
    return (
      <div className="text-center py-8 px-4 bg-card/30 rounded-xl border border-dashed border-border/40 select-none">
        <Library className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
        <p className="text-xs font-bold text-foreground">
          {t('tops.noGamesInCollection', 'Aún no tienes juegos en tu ludoteca.')}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {t('tops.useSearchTabHint', 'Usa la pestaña de búsqueda para encontrar cualquier juego de mesa.')}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span className="flex items-center gap-1 font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          {t('tops.quickPlaceHint', 'Toca un juego para colocarlo automáticamente')}
        </span>
        <span className="font-mono-tabular font-bold">{collectionGames.length} {t('common.games', 'juegos')}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[300px] overflow-y-auto no-scrollbar p-1">
        {collectionGames.map((game) => {
          const placed = isGamePlaced(game.bgg_id)
          const title = getGameTitle(game)

          return (
            <div
              key={game.bgg_id}
              onClick={() => !placed && quickPlaceGame(game)}
              className={`p-2 rounded-xl border transition-all flex items-center gap-2 select-none ${
                placed
                  ? 'opacity-40 bg-zinc-950/40 border-border/20 cursor-not-allowed'
                  : 'bg-card/60 hover:bg-card border-border/40 hover:border-primary/50 cursor-pointer active:scale-[0.97] hover:shadow-md'
              }`}
            >
              <TopsGameCover game={game} size="sm" />
              <div className="min-w-0 flex-1 text-left">
                <p className="font-bold text-xs truncate text-foreground">{title}</p>
                {placed ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded-md mt-0.5">
                    <Check className="w-2.5 h-2.5" /> {t('tops.placed', 'En lista')}
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground block truncate">
                    {game.year_published || t('common.yearUnknown', 'Año desc.')}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
