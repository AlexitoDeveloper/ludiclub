import { useState } from 'react'
import { Dices, RotateCcw, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody } from '../ui/dialog'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { FilterChip } from '../ui/chip'
import { ThreeDiceCanvas } from './ThreeDiceCanvas'

interface DiceRollerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type DiceCount = 1 | 2

export function DiceRollerModal({ open, onOpenChange }: DiceRollerModalProps) {
  const { t } = useTranslation()
  const [diceCount, setDiceCount] = useState<DiceCount>(2)
  const [targetValues, setTargetValues] = useState<number[]>([4, 6])
  const [displayedValues, setDisplayedValues] = useState<number[]>([4, 6])
  const [isRolling, setIsRolling] = useState(false)
  const [history, setHistory] = useState<{ count: number; values: number[]; sum: number }[]>([])

  const rollDice = () => {
    if (isRolling) return
    const newValues = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1)
    setTargetValues(newValues)
    setIsRolling(true)
  }

  const handleRollComplete = () => {
    setIsRolling(false)
    setDisplayedValues(targetValues)
    const sum = targetValues.reduce((a, b) => a + b, 0)
    setHistory(prev => [{ count: diceCount, values: [...targetValues], sum }, ...prev.slice(0, 4)])
  }

  const handleSetDiceCount = (count: DiceCount) => {
    if (isRolling) return
    setDiceCount(count)
    const initial = count === 1 ? [Math.floor(Math.random() * 6) + 1] : [3, 5]
    setTargetValues(initial)
    setDisplayedValues(initial)
  }

  const displayedSum = displayedValues.reduce((a, b) => a + b, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            <Dices className="w-5 h-5 text-primary" />
            {t('tableHub.diceRoller.title')}
          </DialogTitle>
          <DialogDescription>
            {t('tableHub.diceRoller.desc')}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {/* Dice Count Selector */}
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {t('tableHub.diceRoller.diceCount')}
            </span>
            <div className="flex items-center justify-center gap-2">
              <FilterChip
                selected={diceCount === 1}
                onClick={() => handleSetDiceCount(1)}
                variant={diceCount === 1 ? 'primary' : 'default'}
                size="sm"
                className="font-black px-4"
              >
                {t('tableHub.diceRoller.oneDie')}
              </FilterChip>
              <FilterChip
                selected={diceCount === 2}
                onClick={() => handleSetDiceCount(2)}
                variant={diceCount === 2 ? 'primary' : 'default'}
                size="sm"
                className="font-black px-4"
              >
                {t('tableHub.diceRoller.twoDice')}
              </FilterChip>
            </div>
          </div>

          {/* Three.js 3D Dice Canvas Area */}
          <div
            onClick={rollDice}
            className="relative rounded-3xl border border-primary/20 bg-gradient-to-b from-slate-950/60 to-slate-900/80 backdrop-blur-xl overflow-hidden shadow-inner flex flex-col items-center justify-center cursor-pointer"
          >
            <ThreeDiceCanvas
              diceCount={diceCount}
              diceValues={targetValues}
              isRolling={isRolling}
              onRollComplete={handleRollComplete}
            />

            <div className="absolute bottom-2 inset-x-0 text-center pointer-events-none">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
                {isRolling ? t('tableHub.diceRoller.rollingOnTable') : t('tableHub.diceRoller.tapHint')}
              </span>
            </div>
          </div>

          {/* Result Banner (Only shown once dice settle) */}
          <div className="text-center py-1">
            <div className="flex items-center justify-center gap-2 min-h-[36px]">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                {t('tableHub.diceRoller.result')}
              </span>
              {isRolling ? (
                <span className="text-xs font-black text-amber-400 animate-pulse uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 animate-spin" /> {t('tableHub.diceRoller.rollingOnTable')}
                </span>
              ) : (
                <>
                  <span className="text-2xl font-black text-foreground">
                    {displayedValues.join(' + ')}
                  </span>
                  {diceCount > 1 && (
                    <span className="text-2xl font-black text-primary ml-1">
                      = {displayedSum}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Roll Button */}
          <Button
            onClick={rollDice}
            disabled={isRolling}
            size="lg"
            className="w-full"
          >
            <RotateCcw className={`w-4 h-4 mr-2 ${isRolling ? 'animate-spin' : ''}`} />
            {isRolling ? t('tableHub.diceRoller.rollingButton') : t('tableHub.diceRoller.rollButton')}
          </Button>

          {/* Recent Rolls History */}
          {history.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                {t('tableHub.diceRoller.previousRolls')}
              </span>
              <div className="flex flex-wrap gap-2">
                {history.map((h, i) => (
                  <Badge key={i} variant="outline" className="text-xs bg-muted/40 font-bold py-0.5">
                    {h.values.join('+')} = <span className="text-primary font-black ml-1">{h.sum}</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
