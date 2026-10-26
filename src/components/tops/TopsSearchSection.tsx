import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Trash2, Check } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/card'
import { Button } from '../ui/button'
import { Game } from '../../types'
import { Tier } from '../../hooks/useTops'
import { GameSearchBar } from '../GameSearchBar'
import { useGameLocale } from '../../hooks/useGameLocale'
import { cn } from '../../lib/utils'
import { useTranslation } from 'react-i18next'

interface TopsSearchSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Game[];
  setSearchResults: (results: Game[]) => void;
  isSearching: boolean;
  errorMsg: string;
  addToPool: (game: Game) => void;
  pool: Game[];
  selectedGameForPlacement: Game | null;
  selectGame: (game: Game) => void;
  removeFromPool: (bggId: number) => void;
  handleClearPool: () => void;
  tiers: Tier[];
  top10: (Game | null)[];
  placeInTier: (tierId: string) => void;
  placeInTop10: (index: number) => void;
  setSelectedGameForPlacement: (game: Game | null) => void;
  handleDragStart: (e: React.DragEvent, gameId: number, source: string) => void;
  handleDropOnPool: (draggedBggId: number, source: string) => void;
  mode: 'tier' | 'top10';
}

export function TopsSearchSection({
  searchQuery,
  setSearchQuery,
  searchResults,
  setSearchResults,
  isSearching,
  errorMsg,
  addToPool,
  pool,
  selectedGameForPlacement,
  selectGame,
  removeFromPool,
  handleClearPool,
  tiers,
  top10,
  placeInTier,
  placeInTop10,
  setSelectedGameForPlacement,
  handleDragStart,
  handleDropOnPool,
  mode,
}: TopsSearchSectionProps) {
  const { t } = useTranslation()
  const { getGameTitle } = useGameLocale()


  return (
    <Card className="border-border/40 shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-2xl overflow-visible relative z-20">
      <CardHeader className="pb-3">
        <CardTitle className="text-md font-bold flex items-center gap-2">
          <Search className="w-4 h-4 text-primary" /> {t('tops.searchAndShelfTitle')}
        </CardTitle>
        <CardDescription className="text-xs">
          {t('tops.searchAndShelfDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 relative">
        <GameSearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          games={searchResults}
          setGames={setSearchResults}
          isSearching={isSearching}
          placeholder={t('create.searchPlaceholder')}
          onSelectGame={addToPool}
          isGameDisabled={(game) => 
            pool.some(g => g.bgg_id === game.bgg_id) || 
            tiers.some(t => t.games.some(g => g.bgg_id === game.bgg_id)) || 
            top10.some(g => g?.bgg_id === game.bgg_id)
          }
          closeOnSelect={false}
        />

        {/* Show error */}
        {errorMsg && (
          <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 px-2 py-1.5 rounded-lg font-semibold animate-shake">
            {errorMsg}
          </div>
        )}

        {/* Shelf (Bandeja de Preparación) directly below input inside same container */}
        <div className="pt-2 border-t border-border/20 relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold text-foreground/80">{t('create.shelfTitle')} ({pool.length})</span>
            {pool.length > 0 && (
              <Button 
                variant="ghost" 
                size="xs" 
                onClick={handleClearPool}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </Button>
            )}
          </div>

          {pool.length === 0 ? (
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const draggedBggId = Number(e.dataTransfer.getData('text/plain'))
                const source = e.dataTransfer.getData('source')
                handleDropOnPool(draggedBggId, source)
              }}
              className="text-center py-6 border border-dashed border-border/40 rounded-xl bg-background/25 text-muted-foreground text-xs font-semibold"
            >
              {t('create.shelfEmpty')}
            </div>
          ) : (
            <div className="space-y-3">
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const draggedBggId = Number(e.dataTransfer.getData('text/plain'))
                  const source = e.dataTransfer.getData('source')
                  handleDropOnPool(draggedBggId, source)
                }}
                className="flex items-center gap-3 overflow-x-auto py-2 px-1 no-scrollbar min-h-[72px] border border-transparent rounded-lg"
              >
                {pool.map((game) => {
                  const isSelected = selectedGameForPlacement?.bgg_id === game.bgg_id
                  return (
                    <div
                      key={game.bgg_id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, game.bgg_id, 'pool')}
                      onClick={() => selectGame(game)}
                      className={`group relative w-14 h-14 rounded-lg overflow-hidden border cursor-grab active:cursor-grabbing select-none transition-all flex items-center justify-center shrink-0 ${
                        isSelected 
                          ? 'border-primary shadow-md shadow-primary/45 ring-2 ring-primary bg-primary/20 scale-105' 
                          : 'border-border/60 hover:border-primary bg-zinc-900/50 hover:scale-95'
                      }`}
                    >
                      {game.image_url ? (
                        <img src={game.image_url} alt={getGameTitle(game)} className="w-full h-full object-cover pointer-events-none animate-fade-in" />
                      ) : (
                        <div className="absolute inset-0 bg-muted/40 text-xs font-bold text-center flex items-center justify-center p-0.5 line-clamp-2">
                          {getGameTitle(game)}
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center text-primary pointer-events-none">
                          <Check className="w-5 h-5 drop-shadow" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Placement Toolbar for Selected Game */}
              <AnimatePresence>
                {selectedGameForPlacement && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 border border-primary/20 rounded-xl bg-primary/5 flex flex-col gap-2.5 overflow-hidden"
                  >
                    <div className="flex items-center justify-between text-xs border-b border-border/20 pb-2">
                      <span className="font-semibold text-foreground truncate max-w-[200px]">
                        {t('tops.placeHint')} <span className="text-primary font-extrabold">{getGameTitle(selectedGameForPlacement)}</span>
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeFromPool(selectedGameForPlacement.bgg_id)}
                        className="h-6 text-xs text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer px-2"
                      >
                        {t('common.remove')}
                      </Button>
                    </div>
                    
                    <div className="space-y-1.5">
                      <p className="text-xs text-zinc-400 font-semibold">
                        <span className="hidden sm:inline">{t('tops.placementHintLandscape')}</span>
                        <span className="inline sm:hidden">{t('tops.placementHintPortrait')}</span>
                      </p>
                      <div className="flex flex-wrap gap-1.5 sm:gap-1">
                        {mode === 'tier' ? (
                          tiers.map(t => (
                            <Button
                              key={t.id}
                              size="xs"
                              className={cn(
                                "border border-white/10 cursor-pointer text-white",
                                t.color
                              )}
                              onClick={() => placeInTier(t.id)}
                            >
                              {t.name}
                            </Button>
                          ))
                        ) : (
                          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                            <Button
                              key={num}
                              size="icon-xs"
                              variant="secondary"
                              className="font-extrabold hover:bg-primary hover:text-primary-foreground cursor-pointer"
                              onClick={() => placeInTop10(num - 1)}
                            >
                              #{num}
                            </Button>
                          ))
                        )}
                        <Button
                          size="xs"
                          variant="ghost"
                          className="text-muted-foreground hover:bg-muted ml-auto cursor-pointer"
                          onClick={() => setSelectedGameForPlacement(null)}
                        >
                          {t('common.cancel')}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
export default TopsSearchSection;
