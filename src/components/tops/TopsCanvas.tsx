import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Sparkles, ArrowLeftRight } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Game } from '../../types'
import { Tier, ActiveTarget } from '../../hooks/useTops'
import { TopsTierListView } from './TopsTierListView'
import { TopsTop10View } from './TopsTop10View'
import { useTranslation } from 'react-i18next'

interface TopsCanvasProps {
  exportAreaRef: React.RefObject<HTMLDivElement | null>;
  mode: 'tier' | 'top10';
  rankingTitle: string;
  setRankingTitle: (title: string) => void;
  tiers: Tier[];
  top10: (Game | null)[];
  activeTarget: ActiveTarget;
  setActiveTarget: (target: ActiveTarget) => void;
  selectedGameForPlacement: Game | null;
  placeInTier: (tierId: string) => void;
  returnTierGameToPool: (tierId: string, game: Game) => void;
  placeInTop10: (index: number) => void;
  returnTop10GameToPool: (index: number) => void;
  moveTop10Slot: (index: number, direction: 'up' | 'down') => void;
  editTierName: (tierId: string, newName: string) => void;
  handleDragStart: (e: React.DragEvent, gameId: number, source: string) => void;
  handleDropOnTier: (tierId: string, draggedBggId: number, source: string) => void;
  handleDropOnTop10: (targetIdx: number, draggedBggId: number, source: string) => void;
  pool: Game[];
  handleClearAll: () => void;
  showWatermark: boolean;
  customWatermark: string;
  selectedBg: string;
  aspectRatio: 'standard' | 'square' | 'story' | 'landscape';
  isExportingCanvas: boolean;
}

const BACKGROUNDS: Record<string, string> = {
  default: 'from-[#141b29] via-[#0e121b] to-[#0a362e]',
  sunset: 'from-indigo-950 via-purple-950 to-pink-900',
  cyberpunk: 'from-slate-950 via-violet-950 to-indigo-900',
  ocean: 'from-slate-950 via-sky-950 to-cyan-900',
  volcanic: 'from-stone-950 via-stone-900 to-red-950',
  'midnight-gold': 'from-zinc-950 via-zinc-900 to-amber-950',
  minimal: 'from-zinc-950 via-zinc-900 to-zinc-950',
}

const GLOWS: Record<string, { g1: string; g2: string; g3: string }> = {
  default: { g1: 'from-primary/20 to-teal-600/20', g2: 'from-teal-500/20 to-emerald-600/20', g3: 'bg-primary/10' },
  sunset: { g1: 'from-pink-500/10 to-transparent', g2: 'from-purple-500/10 to-transparent', g3: 'bg-pink-500/5' },
  cyberpunk: { g1: 'from-fuchsia-500/10 to-transparent', g2: 'from-violet-500/10 to-transparent', g3: 'bg-fuchsia-500/5' },
  ocean: { g1: 'from-sky-500/15 to-transparent', g2: 'from-blue-500/10 to-transparent', g3: 'bg-cyan-500/5' },
  volcanic: { g1: 'from-red-500/10 to-transparent', g2: 'from-orange-650/10 to-transparent', g3: 'bg-red-500/5' },
  'midnight-gold': { g1: 'from-amber-500/10 to-transparent', g2: 'from-yellow-600/10 to-transparent', g3: 'bg-amber-500/5' },
  minimal: { g1: 'from-white/5 to-transparent', g2: 'from-white/5 to-transparent', g3: 'bg-white/5' },
}

export function TopsCanvas({
  exportAreaRef,
  mode,
  rankingTitle,
  setRankingTitle,
  tiers,
  top10,
  activeTarget,
  setActiveTarget,
  selectedGameForPlacement,
  placeInTier,
  returnTierGameToPool,
  placeInTop10,
  returnTop10GameToPool,
  moveTop10Slot,
  editTierName,
  handleDragStart,
  handleDropOnTier,
  handleDropOnTop10,
  pool,
  handleClearAll,
  showWatermark,
  customWatermark,
  selectedBg,
  aspectRatio,
  isExportingCanvas,
}: TopsCanvasProps) {
  const { t } = useTranslation()
  const hasGames = mode === 'tier' ? tiers.some(t => t.games.length > 0) : top10.some(g => g !== null)
  const canReset = hasGames || pool.length > 0

  const bgClass = BACKGROUNDS[selectedBg] || BACKGROUNDS.default
  const glow = GLOWS[selectedBg] || GLOWS.default
  const effectiveAspectRatio = isExportingCanvas ? aspectRatio : 'standard'
  const isLandscape = effectiveAspectRatio === 'landscape'

  let aspectClass = "min-h-[420px] w-full p-4 sm:p-6"
  if (effectiveAspectRatio === 'square') aspectClass = "w-full max-w-[620px] aspect-square p-6 mx-auto justify-between"
  else if (effectiveAspectRatio === 'story') aspectClass = "w-full max-w-[420px] aspect-[9/16] p-6 sm:p-8 mx-auto justify-between"
  else if (effectiveAspectRatio === 'landscape') aspectClass = "w-full max-w-[950px] aspect-[16/9] p-4 sm:p-5 mx-auto justify-between text-xs"

  return (
    <div className="w-full space-y-3">
      {/* Canvas Top Bar */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <span>{t('tops.designTitle', 'Lienzo de Ranking')}</span>
        </h2>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex text-xs text-muted-foreground items-center gap-1.5 bg-muted/30 px-2.5 py-1 rounded-lg border border-border/40">
            <ArrowLeftRight className="w-3.5 h-3.5 text-primary" />
            <span>{t('tops.dragHintPortrait', 'Arrastra o toca para ordenar')}</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClearAll}
            disabled={!canReset}
            className="cursor-pointer text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            icon={Trash2}
            label={t('tops.reset', 'Reiniciar')}
          />
        </div>
      </div>

      {/* Exportable Graphic Canvas Area */}
      <div
        ref={exportAreaRef}
        id="export-ranking-area"
        className={`border border-white/10 rounded-2xl bg-gradient-to-br ${bgClass} shadow-2xl relative overflow-hidden flex flex-col justify-between ${aspectClass} ${
          isLandscape ? 'space-y-2' : 'space-y-4 sm:space-y-5'
        }`}
      >
        {/* Ambient Gradient Glows */}
        <div className={`absolute top-0 right-0 w-[70%] h-[50%] bg-gradient-to-br ${glow.g1} rounded-full blur-[90px] -z-10 pointer-events-none`} />
        <div className={`absolute bottom-0 left-0 w-[70%] h-[50%] bg-gradient-to-tr ${glow.g2} rounded-full blur-[90px] -z-10 pointer-events-none`} />
        <div className={`absolute top-[30%] left-[20%] w-[40%] h-[40%] ${glow.g3} rounded-full blur-[90px] -z-10 pointer-events-none`} />

        {/* Title Header */}
        <div className={`border-b border-white/10 ${isLandscape ? 'pb-1' : 'pb-2 sm:pb-3'} w-full`}>
          {isExportingCanvas ? (
            <h1 className={`font-black tracking-tight text-white px-1 ${isLandscape ? 'text-sm' : 'text-lg sm:text-2xl'}`}>
              {rankingTitle || t('tops.untitled', 'Mi Ranking')}
            </h1>
          ) : (
            <Input
              type="text"
              value={rankingTitle}
              onChange={(e) => setRankingTitle(e.target.value)}
              placeholder={t('tops.titlePlaceholder', 'Escribe el título de tu ranking...')}
              className={`font-black tracking-tight text-white border-none focus-visible:ring-0 bg-transparent px-1 py-0 shadow-none h-auto w-full transition-colors rounded-none placeholder:text-white/40 ${
                isLandscape ? 'text-xs' : 'text-base sm:text-xl'
              }`}
            />
          )}
        </div>

        {/* Dynamic Mode View */}
        <div className="flex-1 w-full">
          <AnimatePresence mode="wait">
            {mode === 'tier' ? (
              <motion.div
                key="tier-view"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                <TopsTierListView
                  tiers={tiers}
                  activeTarget={activeTarget}
                  setActiveTarget={setActiveTarget}
                  selectedGameForPlacement={selectedGameForPlacement}
                  placeInTier={placeInTier}
                  returnTierGameToPool={returnTierGameToPool}
                  editTierName={editTierName}
                  handleDragStart={handleDragStart}
                  handleDropOnTier={handleDropOnTier}
                  isLandscape={isLandscape}
                  isExportingCanvas={isExportingCanvas}
                />
              </motion.div>
            ) : (
              <motion.div
                key="top10-view"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                <TopsTop10View
                  top10={top10}
                  activeTarget={activeTarget}
                  setActiveTarget={setActiveTarget}
                  selectedGameForPlacement={selectedGameForPlacement}
                  placeInTop10={placeInTop10}
                  returnTop10GameToPool={returnTop10GameToPool}
                  moveTop10Slot={moveTop10Slot}
                  handleDragStart={handleDragStart}
                  handleDropOnTop10={handleDropOnTop10}
                  isLandscape={isLandscape}
                  isExportingCanvas={isExportingCanvas}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Clean Watermark Footer */}
        {showWatermark && (
          <div className="border-t border-white/10 pt-2.5 flex items-center justify-between text-[11px] sm:text-xs text-zinc-400 select-none">
            <span className="font-medium truncate max-w-[70%]">{customWatermark || t('tops.watermarkPlaceholder', 'Hecho con LudiClub')}</span>
            <span className="font-black text-white/90 shrink-0">#LudiClub</span>
          </div>
        )}
      </div>
    </div>
  )
}
export default TopsCanvas;
