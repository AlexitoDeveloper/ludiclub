import React from 'react'
import { Plus } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Game } from '../../types'
import { Tier, ActiveTarget } from '../../hooks/useTops'
import { TopsGameCover } from './TopsGameCover'

interface TopsTierListViewProps {
  tiers: Tier[];
  activeTarget: ActiveTarget;
  setActiveTarget: (target: ActiveTarget) => void;
  selectedGameForPlacement: Game | null;
  placeInTier: (tierId: string) => void;
  returnTierGameToPool: (tierId: string, game: Game) => void;
  editTierName: (tierId: string, newName: string) => void;
  handleDragStart: (e: React.DragEvent, gameId: number, source: string) => void;
  handleDropOnTier: (tierId: string, draggedBggId: number, source: string) => void;
  isLandscape?: boolean;
  isExportingCanvas?: boolean;
}

export function TopsTierListView({
  tiers,
  activeTarget,
  setActiveTarget,
  selectedGameForPlacement,
  placeInTier,
  returnTierGameToPool,
  editTierName,
  handleDragStart,
  handleDropOnTier,
  isLandscape = false,
  isExportingCanvas = false,
}: TopsTierListViewProps) {
  return (
    <div className="border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/10 bg-zinc-900/90 shadow-2xl backdrop-blur-sm">
      {tiers.map((tier) => {
        const isActiveTarget = !isExportingCanvas && activeTarget?.type === 'tier' && activeTarget.tierId === tier.id

        return (
          <div
            key={tier.id}
            className={`flex transition-colors ${
              isLandscape ? 'min-h-[56px]' : 'min-h-[88px] sm:min-h-[96px]'
            } ${isActiveTarget ? 'bg-primary/5' : ''}`}
          >
            {/* Tier Label Box */}
            <div
              onClick={() => !isExportingCanvas && setActiveTarget({ type: 'tier', tierId: tier.id })}
              className={`flex flex-col items-center justify-center text-center border-r border-white/10 select-none ${tier.color} shrink-0 cursor-pointer relative ${
                isLandscape ? 'w-16 p-1' : 'w-20 sm:w-28 p-2.5'
              } ${isActiveTarget ? 'ring-2 ring-inset ring-white/80' : ''}`}
              title={isExportingCanvas ? undefined : "Toca para fijar como destino de colocación"}
            >
              {isExportingCanvas ? (
                <span className={`font-black uppercase tracking-wider text-inherit ${isLandscape ? 'text-xs' : 'text-base sm:text-lg'}`}>
                  {tier.name}
                </span>
              ) : (
                <Input
                  type="text"
                  value={tier.name}
                  onChange={(e) => editTierName(tier.id, e.target.value)}
                  className={`w-full text-center font-black bg-transparent border-0 focus-visible:border-0 focus-visible:ring-0 focus-visible:bg-transparent shadow-none h-auto p-0 text-inherit placeholder-current/40 uppercase tracking-wider cursor-text ${
                    isLandscape ? 'text-xs' : 'text-sm sm:text-base'
                  }`}
                />
              )}
            </div>

            {/* Tier Content Drop Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const draggedBggId = Number(e.dataTransfer.getData('text/plain'))
                const source = e.dataTransfer.getData('source')
                handleDropOnTier(tier.id, draggedBggId, source)
              }}
              onClick={() => {
                if (!isExportingCanvas && selectedGameForPlacement) {
                  placeInTier(tier.id)
                } else if (!isExportingCanvas) {
                  setActiveTarget({ type: 'tier', tierId: tier.id })
                }
              }}
              className={`flex-1 flex flex-wrap items-center transition-colors ${
                isLandscape ? 'p-1.5 gap-1.5' : 'p-2.5 sm:p-3 gap-2 sm:gap-2.5'
              } ${isActiveTarget && !selectedGameForPlacement ? 'bg-primary/5' : ''}`}
            >
              {tier.games.map((g) => (
                <div
                  key={g.bgg_id}
                  draggable={!isExportingCanvas}
                  onDragStart={(e) => handleDragStart(e, g.bgg_id, tier.id)}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <TopsGameCover
                    game={g}
                    isLandscape={isLandscape}
                    isExportingCanvas={isExportingCanvas}
                    onRemove={() => returnTierGameToPool(tier.id, g)}
                    size="md"
                  />
                </div>
              ))}

              {/* Show "+" placeholder if a game is selected for placement and NOT exporting */}
              {!isExportingCanvas && selectedGameForPlacement && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    placeInTier(tier.id)
                  }}
                  variant="ghost"
                  className={`rounded-lg border border-dashed border-primary/60 bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary cursor-pointer animate-pulse shrink-0 p-0 ${
                    isLandscape ? 'w-10 h-10' : 'w-12 h-12 sm:w-14 sm:h-14'
                  }`}
                  aria-label="Colocar aquí"
                >
                  <Plus className={isLandscape ? 'w-3.5 h-3.5' : 'w-5 h-5'} />
                </Button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
