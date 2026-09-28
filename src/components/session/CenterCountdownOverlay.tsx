import { useEffect, useState, FC, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { tableAudio } from '../../lib/tableAudio'

interface CenterCountdownOverlayProps {
  isCountingDown: boolean
  touchCount?: number
  durationMs?: number
  isDesktopSimulating?: boolean
}

export const CenterCountdownOverlay: FC<CenterCountdownOverlayProps> = ({
  isCountingDown,
  touchCount = 0,
  durationMs = 2200,
  isDesktopSimulating = false,
}) => {
  const { t } = useTranslation()
  const [secondsRemaining, setSecondsRemaining] = useState(3)
  const timersRef = useRef<number[]>([])

  useEffect(() => {
    // Clear any previous timers
    timersRef.current.forEach((id) => window.clearTimeout(id))
    timersRef.current = []

    if (!isCountingDown) {
      setSecondsRemaining(3)
      return
    }

    // Phase 1: Initiation - lock-in audio & tactile pulse
    setSecondsRemaining(3)
    try {
      tableAudio.playCountdownStart()
    } catch {}

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([40, 30, 40])
      } catch {}
    }

    const stepInterval = durationMs / 3

    // Step 2: Numeral 2
    const timer1 = window.setTimeout(() => {
      setSecondsRemaining(2)
      try {
        tableAudio.playCountdownTick()
      } catch {}
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(15)
        } catch {}
      }
    }, stepInterval)

    // Step 3: Numeral 1
    const timer2 = window.setTimeout(() => {
      setSecondsRemaining(1)
      try {
        tableAudio.playCountdownTick()
      } catch {}
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(15)
        } catch {}
      }
    }, stepInterval * 2)

    timersRef.current = [timer1, timer2]

    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id))
      timersRef.current = []
    }
  }, [isCountingDown, durationMs])

  if (!isCountingDown || (!isDesktopSimulating && touchCount < 2)) {
    return null
  }

  // SVG dimensions
  const size = 152
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2

  return (
    <motion.div
      key="countdown-overlay"
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.85, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="fixed inset-0 flex flex-col items-center justify-center pointer-events-none z-30 select-none"
    >
      <div className="relative flex items-center justify-center">
        {/* Glowing backdrop aura */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{
            scale: [0.95, 1.15, 0.95],
            opacity: [0.25, 0.5, 0.25],
          }}
          transition={{
            duration: 1.1,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute w-44 h-44 rounded-full bg-emerald-500/25 blur-2xl pointer-events-none"
        />

        {/* Circular Progress Ring */}
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background track circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated remaining path */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#10B981"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="rgba(10, 15, 29, 0.85)"
            initial={{ pathLength: 1 }}
            animate={{ pathLength: 0 }}
            transition={{
              duration: durationMs / 1000,
              ease: 'linear',
            }}
          />
        </svg>

        {/* Big Animated Tabular Monospace Number */}
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={secondsRemaining}
              initial={{ scale: 0.4, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 1.35, opacity: 0, y: -8 }}
              transition={{ type: 'spring', stiffness: 500, damping: 18 }}
              className="text-6xl font-black text-emerald-400 font-mono-tabular drop-shadow-[0_0_16px_rgba(16,185,129,0.6)]"
            >
              {secondsRemaining}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* Dynamic reassurance pill */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xs font-extrabold uppercase tracking-wider text-emerald-300 mt-4 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 backdrop-blur-md shadow-lg"
      >
        {isDesktopSimulating
          ? t('tableHub.firstPlayer.drawing', 'Eligiendo primer jugador...')
          : t('tableHub.firstPlayer.holdFingers', '¡Mantened los dedos en la pantalla!')}
      </motion.p>
    </motion.div>
  )
}
