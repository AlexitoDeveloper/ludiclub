import { useState } from 'react'
import { Crown, RotateCw } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'

interface FirstPlayerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FirstPlayerModal({ open, onOpenChange }: FirstPlayerModalProps) {
  const { t } = useTranslation()
  const [players, setPlayers] = useState<string[]>(() => [
    t('tableHub.firstPlayerModal.playerPlaceholder', { index: 1 }),
    t('tableHub.firstPlayerModal.playerPlaceholder', { index: 2 }),
    t('tableHub.firstPlayerModal.playerPlaceholder', { index: 3 }),
    t('tableHub.firstPlayerModal.playerPlaceholder', { index: 4 }),
  ])
  const [chosenPlayer, setChosenPlayer] = useState<string | null>(null)
  const [isSpinning, setIsSpinning] = useState(false)

  const handleUpdateName = (index: number, name: string) => {
    const updated = [...players]
    updated[index] = name
    setPlayers(updated)
  }

  const handleAddPlayer = () => {
    if (players.length < 8) {
      setPlayers([...players, t('tableHub.firstPlayerModal.playerPlaceholder', { index: players.length + 1 })])
    }
  }

  const handleRemovePlayer = (index: number) => {
    if (players.length > 2) {
      setPlayers(players.filter((_, i) => i !== index))
    }
  }

  const handlePickFirstPlayer = () => {
    setIsSpinning(true)
    setChosenPlayer(null)

    let counter = 0
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * players.length)
      setChosenPlayer(players[randomIndex])
      counter++

      if (counter > 15) {
        clearInterval(interval)
        const finalWinner = players[Math.floor(Math.random() * players.length)]
        setChosenPlayer(finalWinner)
        setIsSpinning(false)
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        })
      }
    }, 80)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-black">
            <Crown className="w-5 h-5 text-amber-500" />
            {t('tableHub.firstPlayerModal.title')}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {t('tableHub.firstPlayerModal.desc')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Winner Banner */}
          {chosenPlayer && (
            <div className={`p-4 rounded-2xl border text-center transition-all ${
              isSpinning 
                ? 'bg-muted/40 border-border/40 opacity-70 scale-95' 
                : 'bg-amber-500/15 border-amber-500/30 scale-100 shadow-xl'
            }`}>
              <span className="text-xs font-black uppercase tracking-wider text-amber-500">
                {isSpinning ? t('tableHub.firstPlayerModal.drawing') : t('tableHub.firstPlayerModal.turnBegins')}
              </span>
              <h3 className="text-2xl font-black text-foreground mt-0.5">
                {chosenPlayer}
              </h3>
            </div>
          )}

          {/* Players Input List */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {players.map((name, i) => (
              <div key={i} className="flex items-center gap-2">
                <Badge variant="outline" className="w-7 h-7 flex items-center justify-center font-bold text-xs shrink-0">
                  {i + 1}
                </Badge>
                <Input
                  value={name}
                  onChange={(e) => handleUpdateName(i, e.target.value)}
                  className="h-8 text-xs font-semibold"
                  placeholder={t('tableHub.firstPlayerModal.playerPlaceholder', { index: i + 1 })}
                />
                {players.length > 2 && (
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    onClick={() => handleRemovePlayer(i)}
                    className="text-muted-foreground hover:text-destructive shrink-0"
                  >
                    ✕
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddPlayer}
              disabled={players.length >= 8}
            >
              {t('tableHub.firstPlayerModal.addPlayer')}
            </Button>

            <Button
              size="sm"
              onClick={handlePickFirstPlayer}
              disabled={isSpinning}
            >
              <RotateCw className={`w-3.5 h-3.5 mr-1.5 ${isSpinning ? 'animate-spin' : ''}`} />
              {isSpinning ? t('tableHub.firstPlayerModal.spinning') : t('tableHub.firstPlayerModal.pickButton')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
