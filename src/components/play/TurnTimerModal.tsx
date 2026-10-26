import { FC, useState, useEffect, useRef } from 'react'
import { Timer, Play, Pause, RotateCcw } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Button } from '../ui/button'
import { FilterChip } from '../ui/chip'
import { tableAudio } from '../../lib/tableAudio'

interface TurnTimerModalProps {
  isOpen: boolean
  onClose: () => void
}

export const TurnTimerModal: FC<TurnTimerModalProps> = ({ isOpen, onClose }) => {
  const [presetSeconds, setPresetSeconds] = useState<number>(60)
  const [timeLeft, setTimeLeft] = useState<number>(60)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<any>(null)

  useEffect(() => {
    setTimeLeft(presetSeconds)
    setIsRunning(false)
  }, [presetSeconds])

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            tableAudio.playTurnBell()
            setIsRunning(false)
            return 0
          }
          if (prev <= 6) {
            tableAudio.playUrgentTick()
          }
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }

    return () => clearInterval(intervalRef.current)
  }, [isRunning, timeLeft])

  const handleReset = () => {
    setIsRunning(false)
    setTimeLeft(presetSeconds)
  }

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6 space-y-5">
        <DialogHeader className="space-y-1 text-center sm:text-left">
          <DialogTitle className="text-xl font-black text-foreground flex items-center justify-center sm:justify-start gap-2">
            <Timer className="w-5 h-5 text-primary" aria-hidden="true" />
            <span>Temporizador Anti-AP</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-medium">
            Controla los turnos en la mesa para evitar que las partidas se alarguen innecesariamente.
          </DialogDescription>
        </DialogHeader>

        {/* Presets */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[30, 45, 60, 90, 120].map((sec) => (
            <FilterChip
              key={sec}
              selected={presetSeconds === sec}
              size="default"
              onClick={() => {
                setPresetSeconds(sec)
                setIsRunning(false)
              }}
              className="flex-1 h-10 font-mono-tabular"
            >
              <span>{sec}s</span>
            </FilterChip>
          ))}
        </div>

        {/* Timer Display */}
        <div className="py-6 rounded-3xl bg-muted/30 border border-border/40 text-center space-y-2">
          <div
            className={`text-5xl sm:text-6xl font-black font-mono-tabular tracking-tight transition-colors ${
              timeLeft <= 5 && timeLeft > 0
                ? 'text-amber dark:text-amber-hover animate-pulse'
                : timeLeft === 0
                ? 'text-primary dark:text-[#FF80B0]'
                : 'text-foreground'
            }`}
          >
            {formatSeconds(timeLeft)}
          </div>
          <p className="text-xs font-bold text-muted-foreground">
            {isRunning ? 'Turno en curso' : timeLeft === 0 ? '¡Tiempo agotado!' : 'En pausa'}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 pt-1">
          <Button
            type="button"
            onClick={() => setIsRunning((prev) => !prev)}
            size="lg"
            className="flex-1"
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isRunning ? 'Pausar' : 'Comenzar Turno'}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            size="lg"
          >
            <RotateCcw className="w-4 h-4 mr-1.5 text-muted-foreground" />
            <span>Reiniciar</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
