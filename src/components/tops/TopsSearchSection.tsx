import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Trash2, Library } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Tabs } from '../ui/tabs'
import { Game } from '../../types'
import { Tier } from '../../hooks/useTops'
import { GameSearchBar } from '../GameSearchBar'
import { TopsCollectionPicker } from './TopsCollectionPicker'
import { TopsGameCover } from './TopsGameCover'
import { useTranslation } from 'react-i18next'

interface TopsSearchSectionProps {
  collectionGames: Game[];
  loadingCollection: boolean;
  quickPlaceGame: (game: Game) => void;
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
  collectionGames,
  loadingCollection,
  quickPlaceGame,
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
  handleDragStart,
  handleDropOnPool,
}: TopsSearchSectionProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'collection' | 'catalog'>('collection')

  const isGameDisabled = (game: Game) => {
    return (
      pool.some(g => g.bgg_id === game.bgg_id) ||
      tiers.some(t => t.games.some(g => g.bgg_id === game.bgg_id)) ||
      top10.some(g => g?.bgg_id === game.bgg_id)
    )
  }

  return (
    <Card className="border-border/40 shadow-xl bg-card/70 backdrop-blur-2xl">
      <CardHeader className="pb-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <CardTitle className="text-sm font-black flex items-center gap-2">
            {activeTab === 'collection' ? (
              <Library className="w-4 h-4 text-primary" />
            ) : (
              <Search className="w-4 h-4 text-primary" />
            )}
            <span>{t('tops.addGamesTitle', 'Añadir Juegos al Ranking')}</span>
          </CardTitle>

          <div className="w-full sm:w-auto">
            <Tabs
              options={[
                {
                  id: 'collection',
                  label: `${t('profile.collection', 'Mi Ludoteca')} (${collectionGames.length})`,
                  icon: Library,
                },
                {
                  id: 'catalog',
                  label: t('tops.catalogSearch', 'Buscar en Catálogo'),
                  icon: Search,
                },
              ]}
              activeTab={activeTab}
              onChange={setActiveTab}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {activeTab === 'collection' ? (
          <TopsCollectionPicker
            collectionGames={collectionGames}
            loadingCollection={loadingCollection}
            quickPlaceGame={quickPlaceGame}
            tiers={tiers}
            top10={top10}
            pool={pool}
          />
        ) : (
          <div className="space-y-3">
            <GameSearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              games={searchResults}
              setGames={setSearchResults}
              isSearching={isSearching}
              placeholder={t('create.searchPlaceholder', 'Buscar juegos por título...')}
              onSelectGame={(game) => {
                quickPlaceGame(game)
                addToPool(game)
              }}
              isGameDisabled={isGameDisabled}
              closeOnSelect={false}
            />

            {errorMsg && (
              <p className="text-xs text-destructive font-semibold">{errorMsg}</p>
            )}

            {/* Preparation Shelf (Bandeja) */}
            <div className="pt-2 border-t border-border/20">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                  {t('create.shelfTitle', 'Bandeja de Preparación')} ({pool.length})
                </span>
                {pool.length > 0 && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={handleClearPool}
                    className="cursor-pointer text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    icon={Trash2}
                    label={t('common.clear', 'Limpiar')}
                  />
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
                  className="text-center py-4 border border-dashed border-border/40 rounded-xl bg-background/25 text-muted-foreground text-xs font-medium"
                >
                  {t('create.shelfEmpty', 'Los juegos buscados o retirados se colocarán aquí.')}
                </div>
              ) : (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const draggedBggId = Number(e.dataTransfer.getData('text/plain'))
                    const source = e.dataTransfer.getData('source')
                    handleDropOnPool(draggedBggId, source)
                  }}
                  className="flex items-center gap-2 overflow-x-auto py-1 px-1 no-scrollbar min-h-[64px]"
                >
                  <AnimatePresence>
                    {pool.map((game) => {
                      const isSelected = selectedGameForPlacement?.bgg_id === game.bgg_id
                      return (
                        <motion.div
                          key={game.bgg_id}
                          draggable
                          onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, game.bgg_id, 'pool')}
                          onClick={() => selectGame(game)}
                          className={`cursor-grab active:cursor-grabbing rounded-lg transition-transform ${
                            isSelected ? 'ring-2 ring-primary scale-105' : 'hover:scale-95'
                          }`}
                        >
                          <TopsGameCover
                            game={game}
                            size="sm"
                            onRemove={() => removeFromPool(game.bgg_id)}
                          />
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
export default TopsSearchSection;
