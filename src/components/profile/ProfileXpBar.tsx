import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/button'

interface ProfileXpBarProps {
  totalXp: number;
  xpCurrent: number;
  xpRange: number;
  xpProgress: number;
}

export function ProfileXpBar({
  totalXp,
  xpCurrent,
  xpRange,
  xpProgress,
}: ProfileXpBarProps) {
  const { t } = useTranslation()
  const [showXpHelp, setShowXpHelp] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className="space-y-1.5 w-full bg-muted/40 p-2.5 rounded-xl border border-border/20 relative">
      <div className="flex justify-between items-center text-xs font-bold text-muted-foreground">
        <span className="flex items-center gap-1.5">
          {t('profile.xpTitle')}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => setShowXpHelp((prev) => !prev)}
            aria-label={t('profile.xpHelpTitle')}
            aria-expanded={showXpHelp}
            aria-controls="xp-rules-accordion"
            className="text-primary hover:text-primary/80 hover:bg-transparent cursor-pointer focus-visible:ring-1 focus-visible:ring-primary"
          >
            <Info className="w-3.5 h-3.5 shrink-0" />
          </Button>
        </span>
        <span className="text-foreground font-black font-mono-tabular">
          {xpCurrent} / {xpRange} XP
        </span>
      </div>

      {/* Hardware-accelerated scaleX progress bar */}
      <div className="w-full h-2 rounded-full bg-background border border-border/30 overflow-hidden relative">
        <div
          className="h-full w-full rounded-full bg-gradient-to-r from-primary via-violet-500 to-indigo-500 origin-left transition-transform duration-300 ease-out motion-reduce:transition-none"
          style={{ transform: `scaleX(${Math.max(0, Math.min(100, xpProgress)) / 100})` }}
        />
      </div>

      <span className="text-xs text-muted-foreground/80 block leading-none font-semibold">
        {t('profile.xpTotalDesc', { count: totalXp })}
      </span>

      <AnimatePresence>
        {showXpHelp && (
          <motion.div
            id="xp-rules-accordion"
            role="region"
            aria-label={t('profile.xpHelpTitle')}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={
              showXpHelp
                ? { duration: 0.18, ease: [0.23, 1, 0.32, 1] }
                : { duration: 0.12, ease: [0.77, 0, 0.175, 1] }
            }
            className="overflow-hidden border-t border-border/10 mt-2 pt-2"
          >
            <div className="flex flex-col gap-1.5 text-xs select-none">
              <div className="flex items-center justify-between bg-background/50 px-3 py-1.5 rounded-lg border border-border/20">
                <span className="flex items-center gap-2 text-foreground/90 font-medium">
                  <span className="text-base leading-none shrink-0">🎲</span>
                  <span>{t('profile.xpRules.meetup')}</span>
                </span>
                <span className="text-emerald-700 dark:text-emerald-300 font-black font-mono-tabular text-xs whitespace-nowrap ml-2">
                  +100 XP
                </span>
              </div>

              <div className="flex items-center justify-between bg-background/50 px-3 py-1.5 rounded-lg border border-border/20">
                <span className="flex items-center gap-2 text-foreground/90 font-medium">
                  <span className="text-base leading-none shrink-0">⚔️</span>
                  <span>{t('profile.xpRules.win')}</span>
                </span>
                <span className="text-primary dark:text-[#FF80B0] font-black font-mono-tabular text-xs whitespace-nowrap ml-2">
                  +250 XP
                </span>
              </div>

              <div className="flex items-center justify-between bg-background/50 px-3 py-1.5 rounded-lg border border-border/20">
                <span className="flex items-center gap-2 text-foreground/90 font-medium">
                  <span className="text-base leading-none shrink-0">👑</span>
                  <span>{t('profile.xpRules.master')}</span>
                </span>
                <span className="text-amber dark:text-amber-hover font-black font-mono-tabular text-xs whitespace-nowrap ml-2">
                  +150 XP
                </span>
              </div>

              <div className="flex items-center justify-between bg-background/50 px-3 py-1.5 rounded-lg border border-border/20">
                <span className="flex items-center gap-2 text-foreground/90 font-medium">
                  <span className="text-base leading-none shrink-0">✨</span>
                  <span>{t('profile.xpRules.ranking')}</span>
                </span>
                <span className="text-azure dark:text-[#60A5FA] font-black font-mono-tabular text-xs whitespace-nowrap ml-2">
                  +200 XP
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
