import { useState, useMemo } from 'react'
import {
  Search,
  Plus,
  Dices,
  X,
  LayoutGrid,
  ListFilter,
  Sparkles,
  BookmarkCheck,
  RotateCcw,
} from 'lucide-react'
import { Input } from '../../ui/input'
import { Button } from '../../ui/button'
import { FilterChip } from '../../ui/chip'
import { Card } from '../../ui/card'
import { MergedGame } from '../../../hooks/useGroupDetail'
import { User } from '@supabase/supabase-js'
import { useTranslation } from 'react-i18next'
import { LudotecaGameCard } from './LudotecaGameCard'
import { LudotecaLedgerRow } from './LudotecaLedgerRow'
import { LudotecaGameDrawer } from './LudotecaGameDrawer'

interface LudotecaTabProps {
  filteredMerged: MergedGame[]
  user: User | null
  collectionSearch: string
  setCollectionSearch: (search: string) => void
  onOpenAddGame?: () => void
  onLogMatch?: (bggId: number) => void
}

export function LudotecaTab({
  filteredMerged,
  user,
  collectionSearch,
  setCollectionSearch,
  onOpenAddGame,
  onLogMatch,
}: LudotecaTabProps) {
  const { t } = useTranslation()
  const [playerFilter, setPlayerFilter] = useState<'all' | 2 | 3 | 4 | '5+'>('all')
  const [onlyMyGames, setOnlyMyGames] = useState<boolean>(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedGame, setSelectedGame] = useState<MergedGame | null>(null)
  const [highlightedBggId, setHighlightedBggId] = useState<number | null>(null)

  const handleClearFilters = () => {
    setCollectionSearch('')
    setPlayerFilter('all')
    setOnlyMyGames(false)
  }

  // Filtered games based on player count and ownership toggle
  const displayedGames = useMemo(() => {
    return filteredMerged.filter((item) => {
      if (onlyMyGames && !item.owners.some((o) => o.user_id === user?.id)) {
        return false
      }
      if (playerFilter === 'all') return true
      const min = item.game.min_players ?? 1
      const max = item.game.max_players ?? 99
      if (playerFilter === '5+') return max >= 5
      return min <= playerFilter && max >= playerFilter
    })
  }, [filteredMerged, playerFilter, onlyMyGames, user?.id])


  const handleRandomPick = () => {
    if (displayedGames.length === 0) return
    const randomIndex = Math.floor(Math.random() * displayedGames.length)
    const picked = displayedGames[randomIndex]
    setHighlightedBggId(picked.game.bgg_id)
    setSelectedGame(picked)
    setTimeout(() => setHighlightedBggId(null), 3000)
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Tabletop Command Deck: Search, Layout Switch & Primary CTAs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder={t('groups.searchPlaceholder', 'Buscar por título, mecánica o autor...')}
            value={collectionSearch}
            onChange={(e) => setCollectionSearch(e.target.value)}
            className="pl-9 pr-8 h-9 sm:h-10 text-xs rounded-xl bg-card/60 border-border/40"
          />
          {collectionSearch && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => setCollectionSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* View Mode Toggle */}
          <div className="flex items-center p-0.5 rounded-xl bg-muted/40 border border-border/30">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setViewMode('grid')}
              className={`h-8 w-8 rounded-lg cursor-pointer ${
                viewMode === 'grid' ? 'bg-background shadow-2xs text-primary' : 'text-muted-foreground'
              }`}
              title="Vista Galería"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setViewMode('list')}
              className={`h-8 w-8 rounded-lg cursor-pointer ${
                viewMode === 'list' ? 'bg-background shadow-2xs text-primary' : 'text-muted-foreground'
              }`}
              title="Vista Lista Compacta"
            >
              <ListFilter className="w-4 h-4" />
            </Button>
          </div>

          {/* Random Roulette Picker */}
          {displayedGames.length > 1 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRandomPick}
              className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
              title={t('quickLog.randomPick', 'Elegir juego al azar')}
            >
              <Dices className="w-4 h-4 text-primary" />
              <span className="hidden md:inline">Ruleta</span>
            </Button>
          )}

          {/* Add Game CTA */}
          {onOpenAddGame && (
            <Button
              size="sm"
              onClick={onOpenAddGame}
              className="gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Aportar Juego</span>
            </Button>
          )}
        </div>
      </div>

      {/* Interactive Matchmaker Strip: "¿Quiénes jugamos hoy?" */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Mesa:
          </span>

          {(
            [
              { id: 'all', label: 'Todos' },
              { id: 2, label: '2 jugadores' },
              { id: 3, label: '3 jugadores' },
              { id: 4, label: '4 jugadores' },
              { id: '5+', label: '5+ jugadores' },
            ] as const
          ).map((filter) => (
            <FilterChip
              key={filter.id}
              onClick={() => setPlayerFilter(filter.id)}
              selected={playerFilter === filter.id}
              size="sm"
            >
              {filter.label}
            </FilterChip>
          ))}
        </div>

        {/* Ownership Filter Toggle */}
        {user && (
          <div className="shrink-0">
            <Button
              variant={onlyMyGames ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setOnlyMyGames(!onlyMyGames)}
              className={`h-7 px-2.5 rounded-lg text-xs font-bold gap-1 cursor-pointer ${
                onlyMyGames ? 'bg-primary/10 text-primary border border-primary/30 font-black' : 'text-muted-foreground'
              }`}
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              <span>Solo mis aportaciones</span>
            </Button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {displayedGames.length === 0 ? (
        <Card className="p-10 text-center border-dashed border-border/50 bg-card/30 rounded-3xl max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-muted/50 border border-border/30 mx-auto flex items-center justify-center text-muted-foreground">
            <Dices className="w-6 h-6" />
          </div>
          <p className="text-sm font-black text-foreground">
            {filteredMerged.length === 0
              ? 'Ludoteca colectiva vacía'
              : 'Ningún juego coincide con los filtros'}
          </p>
          <p className="text-xs text-muted-foreground leading-normal max-w-xs mx-auto">
            {filteredMerged.length === 0
              ? 'Cada miembro puede sincronizar o aportar sus juegos para ver el catálogo unido del grupo.'
              : 'Prueba a cambiar el número de jugadores o limpiar el buscador.'}
          </p>
          {filteredMerged.length > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="gap-1.5 mt-2 cursor-pointer border-primary/30 text-primary hover:bg-primary/10"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar filtros</span>
            </Button>
          ) : onOpenAddGame ? (
            <Button
              size="sm"
              onClick={onOpenAddGame}
              className="gap-1.5 mt-2 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Aportar Primer Juego</span>
            </Button>
          ) : null}
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {displayedGames.map((item) => (
            <LudotecaGameCard
              key={item.game.bgg_id}
              item={item}
              user={user}
              isHighlighted={highlightedBggId === item.game.bgg_id}
              onClick={() => setSelectedGame(item)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-1.5">
          {displayedGames.map((item) => (
            <LudotecaLedgerRow
              key={item.game.bgg_id}
              item={item}
              user={user}
              isHighlighted={highlightedBggId === item.game.bgg_id}
              onClick={() => setSelectedGame(item)}
            />
          ))}
        </div>
      )}

      {/* Fluid Game Detail Slide-Over Drawer */}
      <LudotecaGameDrawer
        item={selectedGame}
        open={Boolean(selectedGame)}
        onOpenChange={(open) => !open && setSelectedGame(null)}
        currentUser={user}
        onLogMatch={onLogMatch}
      />
    </div>
  )
}
export default LudotecaTab
