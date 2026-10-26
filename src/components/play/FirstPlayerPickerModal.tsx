import { FC, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, RotateCw, Crown } from 'lucide-react'
import confetti from 'canvas-confetti'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Button } from '../ui/button'
import { FilterChip } from '../ui/chip'
import { tableAudio } from '../../lib/tableAudio'

interface FirstPlayerPickerModalProps {
  isOpen: boolean
  onClose: () => void
}

const PLAYER_COLORS = [
  { id: 1, name: 'Rojo', bg: 'bg-rose-500', border: 'border-rose-400' },
  { id: 2, name: 'Azul', bg: 'bg-blue-500', border: 'border-blue-400' },
  { id: 3, name: 'Verde', bg: 'bg-emerald-500', border: 'border-emerald-400' },
  { id: 4, name: 'Amarillo', bg: 'bg-amber-500', border: 'border-amber-400' },
  { id: 5, name: 'Morado', bg: 'bg-purple-500', border: 'border-purple-400' },
  { id: 6, name: 'Naranja', bg: 'bg-orange-500', border: 'border-orange-400' },
]

export const FirstPlayerPickerModal: FC<FirstPlayerPickerModalProps> = ({ isOpen, onClose }) => {
  const [playerCount, setPlayerCount] = useState<number>(4)
  const [selectedWinner, setSelectedWinner] = useState<number | null>(null)
  const [isPicking, setIsPicking] = useState(false)

  const activePlayers = PLAYER_COLORS.slice(0, playerCount)

  const handlePickWinner = () => {
    setIsPicking(true)
    setSelectedWinner(null)
    tableAudio.playDiceRoll()

    const delays = [40, 50, 65, 85, 110, 140, 180, 230, 290, 370]
    let step = 0

    const executeStep = () => {
      const randomIdx = Math.floor(Math.random() * activePlayers.length)
      setSelectedWinner(activePlayers[randomIdx].id)

      step++
      if (step < delays.length) {
        setTimeout(executeStep, delays[step])
      } else {
        setIsPicking(false)
        tableAudio.playTurnBell()
        try {
          confetti({
            particleCount: 35,
            spread: 50,
            origin: { y: 0.6 },
            colors: ['#10B981', '#F59E0B', '#3B82F6', '#EC4899'],
          })
        } catch {}
      }
    }

    setTimeout(executeStep, delays[0])
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6 space-y-5">
        <DialogHeader className="space-y-1 text-center sm:text-left">
          <DialogTitle className="text-xl font-black text-foreground flex items-center justify-center sm:justify-start gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" aria-hidden="true" />
            <span>¿Quién empieza la partida?</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-medium">
            Elige el número de jugadores y gira para resolver quién será el primer jugador en la mesa.
          </DialogDescription>
        </DialogHeader>

        {/* Player Count Select */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            Número de jugadores
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[2, 3, 4, 5, 6].map((num) => (
              <FilterChip
                key={num}
                selected={playerCount === num}
                size="default"
                onClick={() => {
                  setPlayerCount(num)
                  setSelectedWinner(null)
                }}
                className="flex-1 h-10 font-mono-tabular"
              >
                <span>{num}</span>
              </FilterChip>
            ))}
          </div>
        </div>

        {/* Players Wheel Display */}
        <div className="grid grid-cols-3 gap-3 py-2">
          {activePlayers.map((player) => {
            const isWinner = selectedWinner === player.id
            return (
              <motion.div
                key={player.id}
                animate={{
                  scale: isWinner ? [1, 1.08, 1] : 1,
                  borderColor: isWinner ? 'rgba(245, 158, 11, 1)' : 'rgba(255, 255, 255, 0.1)',
                }}
                transition={{ duration: 0.3 }}
                className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                  isWinner ? 'bg-amber-500/20 border-amber-500 shadow-md ring-2 ring-amber-500/50' : 'bg-muted/30'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl ${player.bg} flex items-center justify-center text-white shadow-sm`}>
                  {isWinner ? <Crown className="w-5 h-5" /> : <span className="font-black text-sm">{player.id}</span>}
                </div>
                <span className="text-xs font-bold text-foreground truncate">{player.name}</span>
              </motion.div>
            )
          })}
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Button
            type="button"
            onClick={handlePickWinner}
            disabled={isPicking}
            size="lg"
            className="w-full"
          >
            <RotateCw className={`w-4 h-4 ${isPicking ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>{isPicking ? 'Eligiendo...' : 'Elegir 1er Jugador'}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
