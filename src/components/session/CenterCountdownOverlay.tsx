import { FC } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'

interface CenterCountdownOverlayProps {
  countdown: number // 3, 2, 1
  isDesktopSimulating?: boolean
}

export const CenterCountdownOverlay: FC<CenterCountdownOverlayProps> = ({
  countdown,
  isDesktopSimulating = false,
}) => {
  const { t } = useTranslation()

  // SVG dimensions
  const size = 160
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  
  // Progress fraction (3 -> 100%, 2 -> 66%, 1 -> 33%)
  const progressRatio = countdown / 3
  const strokeDashoffset = circumference * (1 - progressRatio)

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center pointer-events-none z-40 select-none">
      <div className="relative flex items-center justify-center">
        {/* Glowing backdrop aura */}
        <motion.div
          animate={{
            scale: [0.95, 1.25, 0.95],
            opacity: [0.35, 0.65, 0.35],
          }}
          transition={{
            duration: 1.0,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute w-52 h-52 rounded-full bg-emerald-500/30 blur-3xl pointer-events-none"
        />

        {/* Circular Countdown Ring */}
        <svg width={size} height={size} className="transform -rotate-90 drop-shadow-[0_0_20px_rgba(16,185,129,0.4)]">
          {/* Background track circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth={strokeWidth}
            fill="rgba(15, 23, 42, 0.85)"
          />
          {/* Animated remaining path */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#10B981"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Big Animated Monospace Numeral (3, 2, 1) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={countdown}
              initial={{ scale: 0.3, opacity: 0, y: 10 }}
              animate={{ scale: [0.3, 1.2, 1], opacity: 1, y: 0 }}
              exit={{ scale: 1.4, opacity: 0, y: -10 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              className="text-7xl font-black text-emerald-400 font-mono-tabular drop-shadow-[0_0_24px_rgba(16,185,129,0.8)]"
            >
              {countdown}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* Reassurance text */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xs font-black uppercase tracking-wider text-emerald-300 mt-5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/50 backdrop-blur-md shadow-2xl"
      >
        {isDesktopSimulating
          ? t('tableHub.firstPlayer.drawing', 'Eligiendo primer jugador...')
          : t('tableHub.firstPlayer.holdFingers', '¡Mantened los dedos en la pantalla!')}
      </motion.p>
    </div>
  )
}
