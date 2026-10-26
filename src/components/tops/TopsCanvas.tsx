import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, ArrowLeftRight, Sparkles, Plus, Loader2, Download, Bookmark, Check, MoreVertical } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { DropdownIconButton } from '../ui/dropdown-icon-button'
import { Game } from '../../types'
import { Tier } from '../../hooks/useTops'
import { useGameLocale } from '../../hooks/useGameLocale'
import { useTranslation } from 'react-i18next'

interface TierGameItemProps {
  game: Game;
  tierId: string;
  handleDragStart: (e: React.DragEvent, gameId: number, source: string) => void;
  returnTierGameToPool: (tierId: string, game: Game) => void;
  isLandscape?: boolean;
}

function TierGameItem({
  game,
  tierId,
  handleDragStart,
  returnTierGameToPool,
  isLandscape = false,
}: TierGameItemProps) {
  const { t } = useTranslation()
  const { getGameTitle } = useGameLocale()
  const [hasError, setHasError] = useState(false)
  const imageSize = isLandscape ? 60 : 150
  const proxiedUrl = game.image_url ? `https://images.weserv.nl/?url=${encodeURIComponent(game.image_url)}&w=${imageSize}&h=${imageSize}&fit=cover` : null

  return (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, game.bgg_id, tierId)}
      onClick={(e) => {
        e.stopPropagation()
        returnTierGameToPool(tierId, game)
      }}
      className={`group relative rounded-lg overflow-hidden border border-white/10 shadow-md bg-zinc-900 hover:border-destructive hover:scale-95 transition-all cursor-grab active:cursor-grabbing shrink-0 ${
        isLandscape ? 'w-10 h-10' : 'w-16 h-16 sm:w-18 sm:h-18'
      }`}
    >
      {proxiedUrl && !hasError ? (
        <img 
          src={proxiedUrl} 
          alt={getGameTitle(game)} 
          className="w-full h-full object-cover group-hover:opacity-35 transition-opacity" 
          crossOrigin="anonymous"
          onError={() => setHasError(true)}
        />
      ) : null}
      
      {/* Falls back to text title if image fails or is missing */}
      {!proxiedUrl || hasError ? (
        <div className={`absolute inset-0 flex items-center justify-center p-1 font-bold text-center text-white bg-black/70 transition-colors line-clamp-3 leading-tight ${
          isLandscape ? 'text-xs' : 'text-xs'
        }`}>
          {getGameTitle(game)}
        </div>
      ) : (
        /* Hover cover showing trash icon and label instead of name covering it */
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <Trash2 className={isLandscape ? 'w-3 h-3 text-white' : 'w-4 h-4 text-white drop-shadow'} />
          {!isLandscape && <span className="text-xs uppercase font-bold text-white tracking-widest mt-0.5">{t('common.remove')}</span>}
        </div>
      )}
    </div>
  )
}

interface Top10GameItemProps {
  game: Game;
  idx: number;
  handleDragStart: (e: React.DragEvent, gameId: number, source: string) => void;
  returnTop10GameToPool: (index: number) => void;
  isLandscape?: boolean;
}

function Top10GameItem({
  game,
  idx,
  handleDragStart,
  returnTop10GameToPool,
  isLandscape = false,
}: Top10GameItemProps) {
  const { t } = useTranslation()
  const { getGameTitle } = useGameLocale()
  const [hasError, setHasError] = useState(false)
  const imageSize = isLandscape ? 32 : 100
  const proxiedUrl = game.image_url ? `https://images.weserv.nl/?url=${encodeURIComponent(game.image_url)}&w=${imageSize}&h=${imageSize}&fit=cover` : null

  return (
    <div 
      draggable
      onDragStart={(e) => handleDragStart(e, game.bgg_id, `top10-${idx}`)}
      onClick={(e) => {
        e.stopPropagation()
        returnTop10GameToPool(idx)
      }}
      className="flex-1 flex items-center justify-between min-w-0 cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className={`rounded overflow-hidden border border-white/10 bg-zinc-900 shrink-0 relative flex items-center justify-center ${isLandscape ? 'w-8 h-8' : 'w-10 h-10'}`}>
          {proxiedUrl && !hasError ? (
            <img 
              src={proxiedUrl} 
              alt={getGameTitle(game)} 
              className="w-full h-full object-cover" 
              crossOrigin="anonymous"
              onError={() => setHasError(true)}
            />
          ) : (
            <span className="text-xs font-bold text-center text-zinc-400 p-0.5 line-clamp-2 leading-tight">
              {getGameTitle(game)}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className={`font-semibold text-zinc-100 truncate ${isLandscape ? 'text-xs' : 'text-sm'}`}>{getGameTitle(game)}</p>
          {!isLandscape && <p className="text-xs text-zinc-500">{game.year_published || t('common.yearUnknown')}</p>}
        </div>
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        className={`p-0 rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-destructive hover:bg-destructive/20 transition-all cursor-pointer ${isLandscape ? 'h-6 w-6' : 'h-7 w-7'}`}
        onClick={(e) => {
          e.stopPropagation()
          returnTop10GameToPool(idx)
        }}
      >
        <Trash2 className={isLandscape ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      </Button>
    </div>
  )
}

interface TopsCanvasProps {
  exportAreaRef: React.RefObject<HTMLDivElement | null>;
  mode: 'tier' | 'top10';
  rankingTitle: string;
  setRankingTitle: (title: string) => void;
  tiers: Tier[];
  top10: (Game | null)[];
  selectedGameForPlacement: Game | null;
  placeInTier: (tierId: string) => void;
  returnTierGameToPool: (tierId: string, game: Game) => void;
  placeInTop10: (index: number) => void;
  returnTop10GameToPool: (index: number) => void;
  editTierName: (tierId: string, newName: string) => void;
  handleDragStart: (e: React.DragEvent, gameId: number, source: string) => void;
  handleDropOnTier: (tierId: string, draggedBggId: number, source: string) => void;
  handleDropOnTop10: (targetIdx: number, draggedBggId: number, source: string) => void;
  handleExportImage: () => void;
  exporting: boolean;
  pool: Game[];
  handleClearAll: () => void;

  // Premium props
  isPremium: boolean;
  showWatermark: boolean;
  customWatermark: string;
  selectedBg: string;
  aspectRatio: 'standard' | 'square' | 'story' | 'landscape';
  isExportingCanvas: boolean;
  saving: boolean;
  saveSuccess: boolean;
  handleSaveToProfile: () => void;
}

const BACKGROUNDS: Record<string, string> = {
  default: 'from-[#141b29] via-[#0e121b] to-[#0a362e]',
  sunset: 'from-indigo-950 via-purple-950 to-pink-900',
  cyberpunk: 'from-slate-950 via-violet-950 to-indigo-900',
  ocean: 'from-slate-950 via-sky-950 to-cyan-900',
  volcanic: 'from-stone-950 via-stone-900 to-red-950',
  'midnight-gold': 'from-zinc-950 via-zinc-900 to-amber-950',
  minimal: 'from-zinc-950 via-zinc-900 to-zinc-950',
};

const GLOWS: Record<string, { g1: string; g2: string; g3: string }> = {
  default: {
    g1: 'from-primary/20 to-teal-600/20',
    g2: 'from-teal-500/20 to-emerald-600/20',
    g3: 'bg-primary/10'
  },
  sunset: {
    g1: 'from-pink-500/10 to-transparent',
    g2: 'from-purple-500/10 to-transparent',
    g3: 'bg-pink-500/5'
  },
  cyberpunk: {
    g1: 'from-fuchsia-500/10 to-transparent',
    g2: 'from-violet-500/10 to-transparent',
    g3: 'bg-fuchsia-500/5'
  },
  ocean: {
    g1: 'from-sky-500/15 to-transparent',
    g2: 'from-blue-500/10 to-transparent',
    g3: 'bg-cyan-500/5'
  },
  volcanic: {
    g1: 'from-red-500/10 to-transparent',
    g2: 'from-orange-650/10 to-transparent',
    g3: 'bg-red-500/5'
  },
  'midnight-gold': {
    g1: 'from-amber-500/10 to-transparent',
    g2: 'from-yellow-600/10 to-transparent',
    g3: 'bg-amber-500/5'
  },
  minimal: {
    g1: 'from-white/5 to-transparent',
    g2: 'from-white/5 to-transparent',
    g3: 'bg-white/5'
  }
};

export function TopsCanvas({
  exportAreaRef,
  mode,
  rankingTitle,
  setRankingTitle,
  tiers,
  top10,
  selectedGameForPlacement,
  placeInTier,
  returnTierGameToPool,
  placeInTop10,
  returnTop10GameToPool,
  editTierName,
  handleDragStart,
  handleDropOnTier,
  handleDropOnTop10,
  handleExportImage,
  exporting,
  pool,
  handleClearAll,
  isPremium,
  showWatermark,
  customWatermark,
  selectedBg,
  aspectRatio,
  isExportingCanvas,
  saving,
  saveSuccess,
  handleSaveToProfile,
}: TopsCanvasProps) {
  const { t } = useTranslation()
  const hasGames = mode === 'tier'
    ? tiers.some(t => t.games.length > 0)
    : top10.some(g => g !== null)

  const canReset = hasGames || pool.length > 0

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-foreground/80 flex items-center gap-1.5">
          <Sparkles className="w-4.5 h-4.5 text-primary animate-pulse" /> {t('tops.designTitle')}
        </h2>
        <div className="flex items-center gap-3 ml-auto sm:ml-0 relative">
          <div className="flex text-xs text-muted-foreground items-center gap-1.5 bg-primary/5 px-2.5 py-1 rounded-lg border border-primary/10">
            <ArrowLeftRight className="w-3.5 h-3.5 text-primary shrink-0 animate-pulse" />
            <span className="hidden sm:inline">{t('tops.dragHintLandscape')}</span>
            <span className="inline sm:hidden">{t('tops.dragHintPortrait')}</span>
          </div>
          
          {/* Desktop buttons (visible on sm and larger screens) */}
          <div className="hidden sm:flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleClearAll}
              disabled={!canReset}
              className="flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('tops.reset')}</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleSaveToProfile}
              disabled={saving || !hasGames}
              className="flex items-center gap-1.5 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{t('tops.saving')}</span>
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                  <span className="text-emerald-500">{t('tops.saveSuccess')}</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{t('tops.saveButton')}</span>
                </>
              )}
            </Button>

            <Button
              size="sm"
              onClick={handleExportImage}
              disabled={exporting || !hasGames}
              className="flex items-center gap-1.5 cursor-pointer"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{t('common.generating')}</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>{t('common.savePhoto')}</span>
                </>
              )}
            </Button>
          </div>

          {/* Mobile responsive buttons layout (hidden on desktop) */}
          <div className="flex sm:hidden items-center gap-1.5">
            <Button
              size="icon-sm"
              onClick={handleExportImage}
              disabled={exporting || !hasGames}
              className="cursor-pointer"
              title={t('common.savePhoto')}
              aria-label={t('common.savePhoto')}
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Download className="w-4 h-4 text-white" />
              )}
            </Button>

            <DropdownIconButton
              variant="outline"
              size="sm"
              icon={MoreVertical}
              items={[
                {
                  label: saving ? t('tops.saving') : saveSuccess ? t('tops.saveSuccess') : t('tops.saveButton'),
                  onClick: handleSaveToProfile,
                  disabled: saving || !hasGames,
                  icon: saving ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  ) : saveSuccess ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Bookmark className="w-4 h-4 text-primary" />
                  ),
                  className: "text-foreground hover:bg-muted/50"
                },
                {
                  label: t('tops.resetCanvas'),
                  onClick: handleClearAll,
                  disabled: !canReset,
                  icon: <Trash2 className="w-4 h-4" />,
                  className: "text-destructive hover:bg-destructive/10"
                }
              ]}
            />
          </div>
        </div>
      </div>

      {/* Exportable Area */}
      {(() => {
        const bgClass = BACKGROUNDS[selectedBg] || BACKGROUNDS.default;
        const glow = GLOWS[selectedBg] || GLOWS.default;

        const effectiveAspectRatio = isExportingCanvas ? aspectRatio : 'standard';
        const isLandscape = isPremium && effectiveAspectRatio === 'landscape';

        let aspectClass = "min-h-[420px] w-full p-6";
        if (isPremium) {
          if (effectiveAspectRatio === 'square') {
            aspectClass = "w-full max-w-[620px] aspect-square p-6 mx-auto justify-between";
          } else if (effectiveAspectRatio === 'story') {
            aspectClass = "w-full max-w-[420px] aspect-[9/16] p-8 mx-auto justify-between";
          } else if (effectiveAspectRatio === 'landscape') {
            aspectClass = "w-full max-w-[950px] aspect-[16/9] p-4 sm:p-5 mx-auto justify-between text-xs";
          }
        }

        const spaceClass = isLandscape ? 'space-y-1.5' : 'space-y-6';

        return (
          <div 
            ref={exportAreaRef} 
            id="export-ranking-area" 
            className={`border border-primary/20 rounded-2xl bg-gradient-to-br ${bgClass} shadow-2xl relative overflow-hidden flex flex-col ${spaceClass} justify-between ${aspectClass}`}
          >
            {/* Ambient Background decoration inside image */}
            <div className={`absolute top-0 right-0 w-[70%] h-[50%] bg-gradient-to-br ${glow.g1} rounded-full blur-[100px] -z-10 pointer-events-none`} />
            <div className={`absolute bottom-0 left-0 w-[70%] h-[50%] bg-gradient-to-tr ${glow.g2} rounded-full blur-[100px] -z-10 pointer-events-none`} />
            <div className={`absolute top-[30%] left-[20%] w-[40%] h-[40%] ${glow.g3} rounded-full blur-[100px] -z-10 pointer-events-none`} />

            {/* Header Branding info inside Image */}
            <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-4 border-b border-white/5 ${isLandscape ? 'pb-1.5' : 'pb-3.5'} w-full`}>
              <div className="flex-1 min-w-0 w-full">
                <Input
                  type="text"
                  value={rankingTitle}
                  onChange={(e) => setRankingTitle(e.target.value)}
                  placeholder={t('tops.titlePlaceholder')}
                  className={`font-extrabold tracking-tight text-white border-t-0 border-x-0 border-b-2 border-transparent hover:border-b-white/10 focus-visible:border-b-primary focus-visible:ring-0 bg-transparent px-2 py-1 shadow-none focus-visible:bg-transparent h-auto w-full transition-colors truncate rounded-none ${isLandscape ? 'text-xs py-0.5' : 'text-base sm:text-xl'}`}
                />
              </div>
            </div>

        {/* Content Renders based on Mode */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {mode === 'tier' ? (
              <motion.div 
                key="tier-view" 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="border border-white/10 rounded-xl overflow-hidden divide-y divide-white/5 bg-zinc-800/90 shadow-2xl"
              >
                {tiers.map((tier) => (
                  <div key={tier.id} className={`flex ${isLandscape ? 'min-h-[52px]' : 'min-h-[96px]'}`}>
                    
                    {/* Tier Label Box */}
                    <div className={`flex flex-col items-center justify-center text-center border-r border-white/10 select-none ${tier.color} shrink-0 ${
                      isLandscape ? 'w-16 p-1' : 'w-24 sm:w-28 p-3'
                    }`}>
                      <Input
                        type="text"
                        value={tier.name}
                        onChange={(e) => editTierName(tier.id, e.target.value)}
                        className={`w-full text-center font-extrabold bg-transparent border-0 focus-visible:border-0 focus-visible:ring-0 focus-visible:bg-transparent shadow-none h-auto p-0 text-inherit placeholder-current/40 uppercase tracking-wider ${isLandscape ? 'text-xs' : 'text-sm sm:text-base'}`}
                      />
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
                      className={`flex-1 flex flex-wrap items-center transition-colors ${
                        isLandscape ? 'p-1 gap-1.5' : 'p-3 gap-2.5'
                      }`}
                    >
                      {tier.games.length === 0 ? (
                        selectedGameForPlacement ? (
                          <Button
                            onClick={() => placeInTier(tier.id)}
                            variant="ghost"
                            className={`rounded-lg border border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10 flex items-center justify-center text-primary cursor-pointer animate-pulse shrink-0 p-0 min-w-0 min-h-0 ${
                              isLandscape ? 'w-10 h-10' : 'w-16 h-16 sm:w-18 sm:h-18'
                            }`}
                          >
                            <Plus className={isLandscape ? 'w-3.5 h-3.5' : 'w-5 h-5'} />
                          </Button>
                        ) : null
                      ) : (
                        <>
                          {tier.games.map((g) => (
                            <TierGameItem
                              key={g.bgg_id}
                              game={g}
                              tierId={tier.id}
                              handleDragStart={handleDragStart}
                              returnTierGameToPool={returnTierGameToPool}
                              isLandscape={isLandscape}
                            />
                          ))}
                          {selectedGameForPlacement && (
                            <Button
                              onClick={() => placeInTier(tier.id)}
                              variant="ghost"
                              className={`rounded-lg border border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10 flex items-center justify-center text-primary cursor-pointer animate-pulse shrink-0 p-0 min-w-0 min-h-0 ${
                                isLandscape ? 'w-10 h-10' : 'w-16 h-16 sm:w-18 sm:h-18'
                              }`}
                            >
                              <Plus className={isLandscape ? 'w-3.5 h-3.5' : 'w-5 h-5'} />
                            </Button>
                          )}
                        </>
                      )}
                    </div>

                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="top10-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`grid gap-2 ${isLandscape ? 'grid-cols-5' : 'grid-cols-1 sm:grid-cols-2'}`}
              >
                {top10.map((game, idx) => {
                  const isPlaceable = !!selectedGameForPlacement
                  return (
                    <div 
                      key={idx}
                      onClick={() => isPlaceable && placeInTop10(idx)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault()
                        const draggedBggId = Number(e.dataTransfer.getData('text/plain'))
                        const source = e.dataTransfer.getData('source')
                        handleDropOnTop10(idx, draggedBggId, source)
                      }}
                      className={`flex items-center transition-all ${
                        isLandscape ? 'gap-1.5 p-1.5' : 'gap-3 p-2.5'
                      } rounded-xl border ${
                        game 
                          ? isPlaceable
                            ? 'bg-emerald-950/25 border-dashed border-primary/50 hover:bg-primary/10 cursor-pointer group animate-pulse'
                            : 'bg-white/5 border-white/10 hover:border-destructive hover:bg-destructive/10 cursor-pointer group' 
                          : isPlaceable
                            ? 'border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10 cursor-pointer animate-pulse'
                            : 'border-white/5 bg-white/5'
                      }`}
                    >
                      {/* Number badge */}
                      <div className={`rounded-lg flex items-center justify-center font-sans font-extrabold border shrink-0 ${
                        isLandscape ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'
                      } ${
                        game 
                          ? 'bg-primary/20 border-primary/30 text-primary' 
                          : isPlaceable 
                            ? 'bg-primary/20 border-primary/30 text-primary' 
                            : 'bg-black/40 border-white/5 text-zinc-400'
                      }`}>
                        {idx + 1}
                      </div>

                      {/* Cover / Placeholder */}
                      {game ? (
                        <div className="flex-1 flex items-center justify-between min-w-0">
                          <Top10GameItem
                            game={game}
                            idx={idx}
                            handleDragStart={handleDragStart}
                            returnTop10GameToPool={returnTop10GameToPool}
                            isLandscape={isLandscape}
                          />
                          {isPlaceable && !isLandscape && (
                            <span className="text-xs font-extrabold text-primary uppercase mr-2 tracking-wider animate-pulse shrink-0">
                              {t('tops.replace')}
                            </span>
                          )}
                        </div>
                      ) : (
                        isPlaceable && (
                          <div className="text-xs font-medium select-none flex items-center gap-2">
                            <Plus className="w-3.5 h-3.5 text-primary shrink-0" />
                          </div>
                        )
                      )}
                    </div>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

            {/* Bottom branding footer */}
            {(!isPremium || showWatermark) && (
              <div className="border-t border-white/10 pt-4 flex items-center justify-between text-xs text-zinc-300 select-none">
                <span>{(isPremium && customWatermark) ? customWatermark : t('tops.watermarkPlaceholder')}</span>
                {(!isPremium || !customWatermark) && <span className="font-extrabold text-white">#LudiClub</span>}
              </div>
            )}

          </div>
        )
      })()}
    </div>
  )
}
