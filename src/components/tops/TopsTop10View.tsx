import React from 'react'
import { Trophy, Medal, ChevronUp, ChevronDown, Trash2, Plus } from 'lucide-react'
import { Button } from '../ui/button'
import { Game } from '../../types'
import { ActiveTarget } from '../../hooks/useTops'
import { TopsGameCover } from './TopsGameCover'
import { useGameLocale } from '../../hooks/useGameLocale'

interface TopsTop10ViewProps {
  top10: (Game | null)[];
  activeTarget: ActiveTarget;
  setActiveTarget: (target: ActiveTarget) => void;
  selectedGameForPlacement: Game | null;
  placeInTop10: (index: number) => void;
  returnTop10GameToPool: (index: number) => void;
  moveTop10Slot: (index: number, direction: 'up' | 'down') => void;
  handleDragStart: (e: React.DragEvent, gameId: number, source: string) => void;
  handleDropOnTop10: (targetIdx: number, draggedBggId: number, source: string) => void;
  isLandscape?: boolean;
  isExportingCanvas?: boolean;
}

export function TopsTop10View({
  top10,
  activeTarget,
  setActiveTarget,
  selectedGameForPlacement,
  placeInTop10,
  returnTop10GameToPool,
  moveTop10Slot,
  handleDragStart,
  handleDropOnTop10,
  isLandscape = false,
  isExportingCanvas = false,
}: TopsTop10ViewProps) {
  const { getGameTitle } = useGameLocale()

  return (
    <div className={`grid gap-2 sm:gap-2.5 ${isLandscape ? 'grid-cols-5' : 'grid-cols-1 sm:grid-cols-2'}`}>
      {top10.map((game, idx) => {
        const isPodium = idx < 3
        const isFirst = idx === 0
        const isSecond = idx === 1
        const isThird = idx === 2
        const isActiveTarget = !isExportingCanvas && activeTarget?.type === 'top10' && activeTarget.index === idx

        return (
          <div
            key={idx}
            onClick={() => {
              if (isExportingCanvas) return
              if (selectedGameForPlacement) {
                placeInTop10(idx)
              } else {
                setActiveTarget({ type: 'top10', index: idx })
              }
            }}
            onDragOver={(e) => !isExportingCanvas && e.preventDefault()}
            onDrop={(e) => {
              if (isExportingCanvas) return
              e.preventDefault()
              const draggedBggId = Number(e.dataTransfer.getData('text/plain'))
              const source = e.dataTransfer.getData('source')
              handleDropOnTop10(idx, draggedBggId, source)
            }}
            className={`group relative flex items-center justify-between rounded-xl transition-all border ${
              isLandscape ? 'p-1.5 gap-2' : 'p-2 sm:p-2.5 gap-2.5'
            } ${
              isExportingCanvas
                ? isFirst
                  ? 'bg-amber-950/30 border-amber-400/40'
                  : isSecond
                  ? 'bg-slate-900/40 border-slate-300/30'
                  : isThird
                  ? 'bg-amber-950/20 border-amber-700/30'
                  : 'bg-zinc-900/60 border-white/10'
                : isActiveTarget
                ? 'ring-2 ring-primary border-primary bg-primary/10 shadow-md shadow-primary/20 cursor-pointer'
                : game
                ? 'bg-zinc-900/70 border-white/10 hover:border-white/20 cursor-pointer'
                : 'bg-zinc-900/40 border-dashed border-white/15 hover:border-white/30 cursor-pointer'
            }`}
          >
            {/* Left: Rank Badge + Cover + Name */}
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
              <div
                className={`flex items-center justify-center shrink-0 rounded-lg font-black transition-transform ${
                  isLandscape ? 'w-6 h-6 text-xs' : 'w-7 h-7 sm:w-8 sm:h-8 text-xs sm:text-sm'
                } ${
                  isFirst
                    ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-zinc-950 shadow-md shadow-amber-500/30'
                    : isSecond
                    ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-zinc-950 shadow-md shadow-slate-400/20'
                    : isThird
                    ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-md shadow-amber-800/20'
                    : 'bg-zinc-800 text-zinc-300 border border-white/10'
                }`}
              >
                {isFirst ? <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : isPodium ? <Medal className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : `#${idx + 1}`}
              </div>

              {game ? (
                <div
                  draggable={!isExportingCanvas}
                  onDragStart={(e) => handleDragStart(e, game.bgg_id, `top10-${idx}`)}
                  className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 cursor-grab active:cursor-grabbing"
                >
                  <TopsGameCover
                    game={game}
                    isLandscape={isLandscape}
                    isExportingCanvas={isExportingCanvas}
                    onRemove={() => returnTop10GameToPool(idx)}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1 text-left">
                    <p className={`font-bold text-zinc-100 truncate ${isLandscape ? 'text-xs' : 'text-xs sm:text-sm'}`}>
                      {getGameTitle(game)}
                    </p>
                    {game.year_published && !isLandscape && (
                      <p className="text-[11px] text-zinc-400 font-medium">{game.year_published}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-between text-left">
                  <span className="text-xs font-semibold text-zinc-500 truncate">
                    {!isExportingCanvas && isActiveTarget ? 'Siguiente juego aquí' : `Puesto #${idx + 1}`}
                  </span>
                  {!isExportingCanvas && selectedGameForPlacement && (
                    <Plus className="w-4 h-4 text-primary animate-pulse" />
                  )}
                </div>
              )}
            </div>

            {/* Right: Tactile Reorder & Delete actions (COMPLETELY HIDDEN ON EXPORT) */}
            {!isExportingCanvas && game && (
              <div className="flex items-center gap-0.5 shrink-0 ml-1">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    moveTop10Slot(idx, 'up')
                  }}
                  disabled={idx === 0}
                  className="cursor-pointer text-zinc-400 hover:text-foreground"
                  aria-label="Subir puesto"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    moveTop10Slot(idx, 'down')
                  }}
                  disabled={idx === 9}
                  className="cursor-pointer text-zinc-400 hover:text-foreground"
                  aria-label="Bajar puesto"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    returnTop10GameToPool(idx)
                  }}
                  className="cursor-pointer text-zinc-400 hover:text-destructive hover:bg-destructive/10"
                  aria-label="Quitar de top 10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
