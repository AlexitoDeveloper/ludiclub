import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Users, Laptop, Dices, ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { useTranslation } from 'react-i18next'

export interface MeetupCardMediaProps {
  gamesList: any[]
  activeGameIdx: number
  setActiveGameIdx: React.Dispatch<React.SetStateAction<number>>
  isOnline: boolean
  totalAttendees: number
  maxPlayers: number
  isLastSpot: boolean
  isCompleted: boolean
  getGameTitle: (game: any) => string
  getGameCover: (game: any) => string | null | undefined
}

export function MeetupCardMedia({
  gamesList,
  activeGameIdx,
  setActiveGameIdx,
  isOnline,
  totalAttendees,
  maxPlayers,
  isLastSpot,
  isCompleted,
  getGameTitle,
  getGameCover,
}: MeetupCardMediaProps) {
  const { t } = useTranslation()
  const currentGame = gamesList[activeGameIdx] || null
  const currentCover = currentGame ? (getGameCover(currentGame) || currentGame.image_url) : null

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveGameIdx((prev) => (prev - 1 + gamesList.length) % gamesList.length)
  }

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveGameIdx((prev) => (prev + 1) % gamesList.length)
  }

  const handleDotClick = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation()
    setActiveGameIdx(idx)
  }

  return (
    <div className="relative w-full h-44 sm:h-52 overflow-hidden bg-muted/40 border-b border-border/40 flex items-center justify-center">
      {currentCover ? (
        <>
          {/* Ambient blur backdrop */}
          <AnimatePresence mode="wait">
            <motion.img
              key={`bg-${currentGame?.bgg_id || activeGameIdx}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.35 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              src={currentCover}
              alt=""
              className="w-full h-full object-cover filter blur-[32px] scale-150 pointer-events-none select-none absolute inset-0 z-0"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/25 to-transparent z-10 pointer-events-none opacity-85" />

          {/* Centered Poster Cover with Swipe */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`cover-wrapper-${currentGame?.bgg_id || activeGameIdx}`}
              drag={gamesList.length > 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={(_, info) => {
                if (gamesList.length <= 1) return
                const swipeThreshold = 50
                if (info.offset.x < -swipeThreshold) {
                  setActiveGameIdx((prev) => (prev + 1) % gamesList.length)
                } else if (info.offset.x > swipeThreshold) {
                  setActiveGameIdx((prev) => (prev - 1 + gamesList.length) % gamesList.length)
                }
              }}
              initial={{ opacity: 0, scale: 0.92, x: 0 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{
                opacity: { duration: 0.25 },
                scale: { duration: 0.25 },
                x: { type: "spring", stiffness: 300, damping: 30 }
              }}
              className={`absolute inset-0 flex items-center justify-center p-4 z-20 touch-pan-y ${
                gamesList.length > 1 ? "cursor-grab active:cursor-grabbing" : ""
              }`}
            >
              <img
                src={currentCover}
                alt={getGameTitle(currentGame) || t('common.game')}
                className="max-h-full max-w-full object-contain rounded-xl shadow-2xl border border-white/10 group-hover:scale-[1.03] transition-transform duration-300 pointer-events-none select-none"
              />
            </motion.div>
          </AnimatePresence>
        </>
      ) : (
        /* Fallback placeholder */
        <div className="absolute inset-0 bg-surface-void flex flex-col items-center justify-center p-4">
          <div className="w-14 h-14 rounded-2xl bg-surface-elevated border border-border/50 flex items-center justify-center text-primary mb-2 shadow-xs">
            {isOnline ? <Laptop className="w-7 h-7" /> : <Dices className="w-7 h-7" />}
          </div>
          <span className="text-xs font-bold text-muted-foreground">{t('meetup.tableOnBoard')}</span>
        </div>
      )}

      {/* Carousel Navigation */}
      {gamesList.length > 1 && (
        <>
          <Button
            onClick={handlePrev}
            variant="secondary"
            size="icon-xs"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-30 shadow-md backdrop-blur-sm"
            aria-label={t('common.back')}
            icon={ChevronLeft}
          />
          <Button
            onClick={handleNext}
            variant="secondary"
            size="icon-xs"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-30 shadow-md backdrop-blur-sm"
            aria-label={t('common.next')}
            icon={ChevronRight}
          />

          {/* Dots Indicator */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex gap-1.5 px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-sm border border-border/40 shadow-xs">
            {gamesList.map((_, idx) => (
              <Button
                key={idx}
                type="button"
                variant="ghost"
                onClick={(e) => handleDotClick(e, idx)}
                className={`!w-1.5 !h-1.5 !min-w-0 !min-h-0 rounded-full transition-all cursor-pointer !p-0 !border-0 ${
                  idx === activeGameIdx ? "bg-primary scale-125" : "bg-muted-foreground/40 hover:bg-muted-foreground/60"
                }`}
                aria-label={`${t('common.game')} ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Top Left: Modality Badge */}
      <div className="absolute top-3 left-3 z-20 flex gap-1.5">
        <Badge variant="slatenavy" className="shadow-md gap-1.5 text-xs">
          {isOnline ? (
            <>
              <Laptop className="w-3 h-3 text-white" />
              <span>{t('common.online')}</span>
            </>
          ) : (
            <>
              <MapPin className="w-3 h-3 text-white" />
              <span>{t('common.inPerson')}</span>
            </>
          )}
        </Badge>
      </div>

      {/* Top Right: Spots Remaining Badge */}
      <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-1.5">
        <Badge variant="secondary" className="shadow-md gap-1.5 font-mono-tabular text-xs">
          <Users className="w-3 h-3 text-muted-foreground" />
          <span>{totalAttendees} / {maxPlayers} {t('common.spotsText')}</span>
        </Badge>
        {isLastSpot && !isCompleted && (
          <Badge variant="raspberry" className="shadow-md text-xs animate-pulse">
            {t('common.lastSpot')}
          </Badge>
        )}
      </div>
    </div>
  )
}
