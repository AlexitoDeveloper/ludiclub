import { useState, useRef, useEffect, FC } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { X, Dices, RotateCcw, Trophy, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/button'
import { MeepleColor } from '../../types'
import { CenterCountdownOverlay } from './CenterCountdownOverlay'
import { tableAudio } from '../../lib/tableAudio'

interface TouchPoint {
  id: number
  x: number
  y: number
  color: MeepleColor
}

interface PlayerOption {
  id: string
  name: string
  avatarUrl?: string | null
}

interface FirstPlayerSelectorProps {
  isOpen: boolean
  onClose: () => void
  attendees?: PlayerOption[]
  onSelectFirstPlayer?: (playerId: string | null, playerName: string) => void
}

const PALETTE_COLORS: MeepleColor[] = ['red', 'blue', 'yellow', 'green', 'purple', 'orange']

const COLOR_MAP: Record<MeepleColor, { bg: string; border: string; hex: string }> = {
  red: { bg: 'bg-red-500', border: 'border-red-400', hex: '#EF4444' },
  blue: { bg: 'bg-blue-500', border: 'border-blue-400', hex: '#3B82F6' },
  yellow: { bg: 'bg-amber-400', border: 'border-amber-300', hex: '#F59E0B' },
  green: { bg: 'bg-emerald-500', border: 'border-emerald-400', hex: '#10B981' },
  purple: { bg: 'bg-purple-500', border: 'border-purple-400', hex: '#A855F7' },
  orange: { bg: 'bg-orange-500', border: 'border-orange-400', hex: '#F97316' },
}

const MeepleSvg: FC<{ className?: string; fill?: string; stroke?: string; strokeWidth?: number }> = ({
  className = 'w-full h-full',
  fill = 'currentColor',
  stroke = 'rgba(255,255,255,0.4)',
  strokeWidth = 12,
}) => (
  <svg viewBox="0 0 512 512" className={className} fill={fill}>
    <path
      d="M256 54.99c-27 0-46.418 14.287-57.633 32.23-10.03 16.047-14.203 34.66-15.017 50.962-30.608 15.135-64.515 30.394-91.815 45.994-14.32 8.183-26.805 16.414-36.203 25.26C45.934 218.28 39 228.24 39 239.99c0 5 2.44 9.075 5.19 12.065 2.754 2.99 6.054 5.312 9.812 7.48 7.515 4.336 16.99 7.95 27.412 11.076 15.483 4.646 32.823 8.1 47.9 9.577-14.996 25.84-34.953 49.574-52.447 72.315C56.65 378.785 39 403.99 39 431.99c0 4-.044 7.123.31 10.26.355 3.137 1.256 7.053 4.41 10.156 3.155 3.104 7.017 3.938 10.163 4.28 3.146.345 6.315.304 10.38.304h111.542c8.097 0 14.026.492 20.125-3.43 6.1-3.92 8.324-9.275 12.67-17.275l.088-.16.08-.166s9.723-19.77 21.324-39.388c5.8-9.808 12.097-19.576 17.574-26.498 2.74-3.46 5.304-6.204 7.15-7.754.564-.472.82-.56 1.184-.76.363.2.62.288 1.184.76 1.846 1.55 4.41 4.294 7.15 7.754 5.477 6.922 11.774 16.69 17.574 26.498 11.6 19.618 21.324 39.387 21.324 39.387l.08.165.088.16c4.346 8 6.55 13.323 12.61 17.254 6.058 3.93 11.974 3.45 19.957 3.45H448c4 0 7.12.043 10.244-.304 3.123-.347 6.998-1.21 10.12-4.332 3.12-3.122 3.984-6.997 4.33-10.12.348-3.122.306-6.244.306-10.244 0-28-17.65-53.205-37.867-79.488-17.493-22.74-37.45-46.474-52.447-72.315 15.077-1.478 32.417-4.93 47.9-9.576 10.422-3.125 19.897-6.74 27.412-11.075 3.758-2.168 7.058-4.49 9.81-7.48 2.753-2.99 5.192-7.065 5.192-12.065 0-11.75-6.934-21.71-16.332-30.554-9.398-8.846-21.883-17.077-36.203-25.26-27.3-15.6-61.207-30.86-91.815-45.994-.814-16.3-4.988-34.915-15.017-50.96C302.418 69.276 283 54.99 256 54.99z"
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  </svg>
)

export const FirstPlayerSelector: FC<FirstPlayerSelectorProps> = ({
  isOpen,
  onClose,
  attendees = [],
  onSelectFirstPlayer,
}) => {
  const { t } = useTranslation()
  const [touches, setTouches] = useState<TouchPoint[]>([])
  const [isCountingDown, setIsCountingDown] = useState(false)
  const [isDesktopRolling, setIsDesktopRolling] = useState(false)
  const [winnerTouch, setWinnerTouch] = useState<TouchPoint | null>(null)
  const [winnerPlayer, setWinnerPlayer] = useState<PlayerOption | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const countdownTimeoutRef = useRef<number | null>(null)
  const desktopRollTimeoutRef = useRef<number | null>(null)

  // Reset state on open/close
  useEffect(() => {
    if (!isOpen) {
      setTouches([])
      setIsCountingDown(false)
      setIsDesktopRolling(false)
      setWinnerTouch(null)
      setWinnerPlayer(null)
      if (countdownTimeoutRef.current) {
        window.clearTimeout(countdownTimeoutRef.current)
      }
      if (desktopRollTimeoutRef.current) {
        window.clearTimeout(desktopRollTimeoutRef.current)
      }
    }
  }, [isOpen])

  // Allow closing via Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Handle countdown when touches are active
  useEffect(() => {
    if (winnerTouch || winnerPlayer || isDesktopRolling) return

    if (touches.length >= 2) {
      setIsCountingDown(true)

      if (countdownTimeoutRef.current) {
        window.clearTimeout(countdownTimeoutRef.current)
      }

      countdownTimeoutRef.current = window.setTimeout(() => {
        // Pick winner touch
        setTouches((currentTouches) => {
          if (currentTouches.length === 0) return currentTouches
          const winnerIdx = Math.floor(Math.random() * currentTouches.length)
          const chosen = currentTouches[winnerIdx]
          setWinnerTouch(chosen)

          try {
            tableAudio.playTurnBell()
          } catch {}

          // Vibrate if available on mobile
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([60, 40, 120])
          }

          confetti({
            particleCount: 50,
            spread: 60,
            origin: { x: chosen.x / window.innerWidth, y: chosen.y / window.innerHeight },
            colors: ['#10B981', '#3B82F6', '#EF4444', '#F59E0B'],
          })

          onSelectFirstPlayer?.(null, t('tableHub.firstPlayer.meepleNamed', { color: t(`tableHub.firstPlayer.colors.${chosen.color}`) }))
          return currentTouches
        })
        setIsCountingDown(false)
      }, 2200)
    } else {
      setIsCountingDown(false)
      if (countdownTimeoutRef.current) {
        window.clearTimeout(countdownTimeoutRef.current)
      }
    }

    return () => {
      if (countdownTimeoutRef.current) {
        window.clearTimeout(countdownTimeoutRef.current)
      }
    }
  }, [touches.length, winnerTouch, winnerPlayer, onSelectFirstPlayer, t])

  // Multitouch handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (winnerTouch || winnerPlayer) return
    
    // Ignore touches on interactive elements (buttons, close icon, etc.)
    const target = e.target as HTMLElement | null
    if (target && target.closest('button, a, input, [role="button"]')) {
      return
    }

    e.preventDefault()

    const newTouches: TouchPoint[] = []
    for (let i = 0; i < e.touches.length; i++) {
      const t = e.touches[i]
      const color = PALETTE_COLORS[i % PALETTE_COLORS.length]
      newTouches.push({
        id: t.identifier,
        x: t.clientX,
        y: t.clientY,
        color,
      })
    }
    setTouches(newTouches)
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (winnerTouch || winnerPlayer) return
    e.preventDefault()

    setTouches((prev) => {
      return prev.map((item) => {
        for (let i = 0; i < e.touches.length; i++) {
          const t = e.touches[i]
          if (t.identifier === item.id) {
            return { ...item, x: t.clientX, y: t.clientY }
          }
        }
        return item
      })
    })
  }

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (winnerTouch || winnerPlayer) return
    e.preventDefault()

    const activeIds = new Set<number>()
    for (let i = 0; i < e.touches.length; i++) {
      activeIds.add(e.touches[i].identifier)
    }
    setTouches((prev) => prev.filter((item) => activeIds.has(item.id)))
  }

  // Desktop / Accessible Random Roll with anticipatory countdown
  const handleRandomAttendee = () => {
    if (attendees.length === 0 || isDesktopRolling || isCountingDown) return
    setIsDesktopRolling(true)

    if (desktopRollTimeoutRef.current) {
      window.clearTimeout(desktopRollTimeoutRef.current)
    }

    desktopRollTimeoutRef.current = window.setTimeout(() => {
      const chosen = attendees[Math.floor(Math.random() * attendees.length)]
      setWinnerPlayer(chosen)
      setIsDesktopRolling(false)

      try {
        tableAudio.playTurnBell()
      } catch {}

      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([60, 40, 120])
      }

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10B981', '#3B82F6', '#EF4444', '#F59E0B'],
      })

      onSelectFirstPlayer?.(chosen.id, chosen.name)
    }, 2200)
  }

  // Desktop simulated roll when no attendees are present
  const handleSimulatedRoll = () => {
    if (isDesktopRolling || isCountingDown) return
    setIsDesktopRolling(true)

    if (desktopRollTimeoutRef.current) {
      window.clearTimeout(desktopRollTimeoutRef.current)
    }

    desktopRollTimeoutRef.current = window.setTimeout(() => {
      const randomColor = PALETTE_COLORS[Math.floor(Math.random() * PALETTE_COLORS.length)]
      const simulatedTouch: TouchPoint = {
        id: 9999,
        x: typeof window !== 'undefined' ? window.innerWidth / 2 : 200,
        y: typeof window !== 'undefined' ? window.innerHeight / 2 : 300,
        color: randomColor,
      }
      setWinnerTouch(simulatedTouch)
      setIsDesktopRolling(false)

      try {
        tableAudio.playTurnBell()
      } catch {}

      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([60, 40, 120])
      }

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10B981', '#3B82F6', '#EF4444', '#F59E0B'],
      })

      onSelectFirstPlayer?.(
        null,
        t('tableHub.firstPlayer.meepleNamed', {
          color: t(`tableHub.firstPlayer.colors.${randomColor}`),
        })
      )
    }, 2200)
  }

  const resetSelection = () => {
    setWinnerTouch(null)
    setWinnerPlayer(null)
    setTouches([])
    setIsCountingDown(false)
    setIsDesktopRolling(false)
    if (countdownTimeoutRef.current) {
      window.clearTimeout(countdownTimeoutRef.current)
    }
    if (desktopRollTimeoutRef.current) {
      window.clearTimeout(desktopRollTimeoutRef.current)
    }
  }

  if (!isOpen) return null

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className="fixed inset-0 z-50 bg-slate-950/95 text-white flex flex-col justify-between overflow-hidden touch-none select-none backdrop-blur-xl"
    >
      {/* Top Header Controls */}
      <div
        className="flex items-center justify-between p-4 z-20"
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onTouchCancel={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Dices className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight">{t('tableHub.firstPlayer.title')}</h2>
            <p className="text-xs text-muted-foreground font-medium">
              {touches.length === 0 ? t('tableHub.firstPlayer.touchHint') : t('tableHub.firstPlayer.touchCount', { count: touches.length })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(winnerTouch || winnerPlayer) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetSelection}
              className="h-8 text-xs font-bold gap-1 rounded-xl bg-slate-900 border-white/20 text-white hover:bg-slate-800 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('tableHub.firstPlayer.repeat')}</span>
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            aria-label={t('tableHub.firstPlayer.closeAria')}
            className="h-9 w-9 p-0 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Touch Meeples Rendering Area */}
      <div className="absolute inset-0 pointer-events-none">
        {touches.map((t) => {
          const isWinner = winnerTouch?.id === t.id
          const styling = COLOR_MAP[t.color]

          return (
            <div
              key={t.id}
              style={{ left: `${t.x}px`, top: `${t.y}px` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-40 h-40 flex items-center justify-center pointer-events-none"
            >
              {/* Pulsing outer aura Meeple */}
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{
                  scale: isWinner ? [1, 1.3, 1.15] : isCountingDown ? [1, 1.2, 1] : [1, 1.12, 1],
                  opacity: isWinner ? 0.85 : isCountingDown ? [0.35, 0.7, 0.35] : [0.2, 0.45, 0.2],
                }}
                transition={{
                  repeat: isWinner ? 0 : Infinity,
                  duration: isCountingDown ? 0.5 : 1.4,
                  ease: 'easeInOut',
                }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <MeepleSvg
                  fill={styling.hex}
                  stroke={styling.hex}
                  strokeWidth={20}
                  className="w-32 h-32 opacity-30 blur-[2.5px]"
                />
              </motion.div>

              {/* Main solid Meeple - 96px (w-24 h-24): optimal multi-touch visibility without overlap */}
              <motion.div
                initial={{ scale: 0.2, rotate: -15 }}
                animate={{
                  scale: isWinner ? 1.3 : 1,
                  rotate: isWinner ? [0, -10, 10, -5, 5, 0] : 0,
                }}
                transition={{
                  rotate: isWinner ? { duration: 0.6, ease: 'easeOut' } : undefined,
                  scale: { type: 'spring', damping: 15, stiffness: 260 },
                }}
                className="relative z-10 w-28 h-28 flex items-center justify-center pointer-events-none filter drop-shadow-xl"
              >
                <MeepleSvg
                  fill={styling.hex}
                  stroke="rgba(255,255,255,0.85)"
                  strokeWidth={16}
                  className="w-24 h-24"
                />

                {/* Fingertip contact point anchor ring */}
                <div className="absolute w-9 h-9 rounded-full border border-white/60 bg-white/15 backdrop-blur-xs flex items-center justify-center shadow-inner pointer-events-none">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/80 animate-ping opacity-50" />
                </div>

                {/* Winner Trophy badge placed directly above the Meeple head */}
                {isWinner && (
                  <motion.div
                    initial={{ scale: 0, y: -5 }}
                    animate={{ scale: 1, y: -22 }}
                    transition={{ delay: 0.1, type: 'spring', damping: 12 }}
                    className="absolute -top-2 left-1/2 -translate-x-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-amber-400 text-slate-950 shadow-xl border-2 border-white"
                  >
                    <Trophy className="w-4 h-4 text-slate-950 fill-slate-950" />
                  </motion.div>
                )}
              </motion.div>
            </div>
          )
        })}
      </div>

      {/* Center Guidance / Countdown / Winner Card */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10 pointer-events-none">
        <AnimatePresence mode="wait">
          {winnerPlayer ? (
            <motion.div
              key="player-winner"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
              className="bg-slate-900/90 border border-emerald-500/40 p-6 rounded-3xl max-w-xs w-full shadow-2xl backdrop-blur-md pointer-events-auto space-y-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 mx-auto flex items-center justify-center text-emerald-400">
                <Trophy className="w-8 h-8 animate-bounce" />
              </div>
              <div className="space-y-1">
                <span className="text-xs uppercase font-black tracking-widest text-emerald-400">{t('tableHub.firstPlayer.title')}</span>
                <h3 className="text-xl font-black text-white">{winnerPlayer.name}</h3>
                <p className="text-xs text-muted-foreground font-medium">{t('tableHub.firstPlayer.gameBegins')}</p>
              </div>
              <Button
                type="button"
                variant="default"
                onClick={(e) => {
                  e.stopPropagation()
                  onClose()
                }}
                className="w-full"
                label={t('tableHub.firstPlayer.confirm')}
              />
            </motion.div>
          ) : winnerTouch ? (
            <motion.div
              key="touch-winner"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
              className="bg-slate-900/90 border border-emerald-500/40 p-6 rounded-3xl max-w-xs w-full shadow-2xl backdrop-blur-md pointer-events-auto space-y-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 mx-auto flex items-center justify-center text-emerald-400">
                <MeepleSvg fill={COLOR_MAP[winnerTouch.color].hex} className="w-10 h-10 drop-shadow" />
              </div>
              <div className="space-y-1">
                <span className="text-xs uppercase font-black tracking-widest text-emerald-400">{t('tableHub.firstPlayer.title')}</span>
                <h3 className="text-lg font-black text-white">
                  {t('tableHub.firstPlayer.meepleNamed', { color: t(`tableHub.firstPlayer.colors.${winnerTouch.color}`) })}
                </h3>
                <p className="text-xs text-muted-foreground font-medium">{t('tableHub.firstPlayer.yourTurnToOpen')}</p>
              </div>
              <Button
                type="button"
                variant="default"
                onClick={(e) => {
                  e.stopPropagation()
                  onClose()
                }}
                className="w-full"
                label={t('tableHub.firstPlayer.confirm')}
              />
            </motion.div>
          ) : (isCountingDown || isDesktopRolling) ? (
            <CenterCountdownOverlay
              key="countdown"
              isCountingDown={isCountingDown || isDesktopRolling}
              touchCount={touches.length}
              durationMs={2200}
              isDesktopSimulating={isDesktopRolling}
            />
          ) : touches.length === 1 ? (
            <motion.div
              key="one-touch"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-muted-foreground text-xs font-semibold"
            >
              {t('tableHub.firstPlayer.needAnother')}
            </motion.div>
          ) : (
            <motion.div
              key="instruction"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2 max-w-xs"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-white/40">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-white">{t('tableHub.firstPlayer.instructionsTitle')}</p>
              <p className="text-xs text-muted-foreground">
                {t('tableHub.firstPlayer.instructionsDesc')}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Accessible / Desktop Bar */}
      <div
        className="p-4 z-20 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10 bg-slate-950/80 backdrop-blur-md"
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onTouchCancel={(e) => e.stopPropagation()}
      >
        <span className="text-xs text-muted-foreground font-medium">
          {t('tableHub.firstPlayer.desktopHint')}
        </span>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {attendees.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={Dices}
              onClick={handleRandomAttendee}
              disabled={isDesktopRolling || isCountingDown}
              className="flex-1 sm:flex-initial"
            >
              <span>{t('tableHub.firstPlayer.randomRoll', { count: attendees.length })}</span>
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={Dices}
              onClick={handleSimulatedRoll}
              disabled={isDesktopRolling || isCountingDown}
              className="flex-1 sm:flex-initial"
            >
              <span>{t('tableHub.firstPlayer.simulatedRoll', 'Simular sorteo de prueba')}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
