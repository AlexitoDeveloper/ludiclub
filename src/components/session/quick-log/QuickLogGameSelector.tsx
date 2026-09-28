import { FC } from 'react'
import { Search, X, Dices, Users, Clock, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input } from '../../ui/input'
import { Button } from '../../ui/button'
import { Card } from '../../ui/card'
import { Game } from '../../../types'
import { useGameLocale } from '../../../hooks/useGameLocale'

interface QuickLogGameSelectorProps {
  selectedGame: Game | null
  setSelectedGame: (game: Game | null) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  groupGames: Game[]
  catalogResults: Game[]
  isSearchingCatalog: boolean
}

export const QuickLogGameSelector: FC<QuickLogGameSelectorProps> = ({
  selectedGame,
  setSelectedGame,
  searchQuery,
  setSearchQuery,
  groupGames,
  catalogResults,
  isSearchingCatalog,
}) => {
  const { t } = useTranslation()
  const { getGameTitle, getGameCover } = useGameLocale()

  if (selectedGame) {
    const title = getGameTitle(selectedGame) || selectedGame.title_es || selectedGame.title
    const cover = getGameCover(selectedGame) || selectedGame.image_url

    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            {t('quickLog.selectedGame')}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSelectedGame(null)}
            className="h-7 px-2 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="w-3.5 h-3.5 mr-1" />
            {t('quickLog.changeGame')}
          </Button>
        </div>

        <Card className="p-3 rounded-2xl border border-primary/30 bg-primary/5 flex items-center gap-3">
          {cover ? (
            <img
              src={cover}
              alt={title}
              className="w-12 h-12 rounded-xl object-cover border border-primary/20 shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Dices className="w-6 h-6" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-sm text-foreground truncate">{title}</h4>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 font-semibold">
              {selectedGame.min_players && selectedGame.max_players && (
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-primary" />
                  {selectedGame.min_players}-{selectedGame.max_players}p
                </span>
              )}
              {selectedGame.playing_time && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-primary" />
                  {selectedGame.playing_time} min
                </span>
              )}
            </div>
          </div>

          <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
            <Check className="w-4 h-4" />
          </div>
        </Card>
      </div>
    )
  }

  // Combine group games & catalog results (deduplicating by bgg_id)
  const seenIds = new Set<number>()
  const combinedResults: { game: Game; isGroup: boolean }[] = []

  groupGames.forEach((g) => {
    if (!seenIds.has(g.bgg_id)) {
      seenIds.add(g.bgg_id)
      combinedResults.push({ game: g, isGroup: true })
    }
  })

  catalogResults.forEach((g) => {
    if (!seenIds.has(g.bgg_id)) {
      seenIds.add(g.bgg_id)
      combinedResults.push({ game: g, isGroup: false })
    }
  })

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
          {t('quickLog.gameSection')}
        </span>
        {isSearchingCatalog && (
          <span className="text-xs font-bold text-primary animate-pulse">{t('quickLog.searching')}</span>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder={t('quickLog.searchPlaceholder')}
          aria-label={t('quickLog.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-10 text-xs rounded-xl"
        />
      </div>

      {combinedResults.length > 0 && (
        <div className="max-h-48 overflow-y-auto rounded-2xl border border-border/40 bg-card/60 p-1.5 space-y-1 divide-y divide-border/20 shadow-sm">
          {combinedResults.map(({ game, isGroup }) => {
            const title = getGameTitle(game) || game.title_es || game.title
            const cover = getGameCover(game) || game.image_url
            return (
              <Button
                key={game.bgg_id}
                type="button"
                variant="ghost"
                onClick={() => {
                  setSelectedGame(game)
                  setSearchQuery('')
                }}
                className="w-full justify-start p-2 h-auto text-left rounded-xl hover:bg-muted/70 gap-2.5 cursor-pointer"
              >
                {cover ? (
                  <img
                    src={cover}
                    alt={title}
                    className="w-8 h-8 rounded-lg object-cover shrink-0 border border-border/30"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Dices className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-foreground truncate">{title}</span>
                    {isGroup && (
                      <span className="text-xs font-black uppercase px-1.5 py-0.2 rounded-md bg-primary/15 text-primary border border-primary/20 shrink-0">
                        {t('quickLog.ludotecaBadge')}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    {game.min_players && <span>{game.min_players}-{game.max_players} {t('quickLog.playersAbbr')}</span>}
                    {game.year_published && <span>({game.year_published})</span>}
                  </div>
                </div>
              </Button>
            )
          })}
        </div>
      )}
    </div>
  )
}
