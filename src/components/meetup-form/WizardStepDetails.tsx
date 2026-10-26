import { motion } from 'framer-motion'
import { Users, Minus, Plus, FileText, CheckCircle2, Calendar, MapPin, Laptop } from 'lucide-react'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { OptimizedImage } from '../ui/OptimizedImage'
import { Game } from '@/types'
import { useTranslation } from 'react-i18next'
import { useGameLocale } from '../../hooks/useGameLocale'
import { formatDate } from '../../lib/dateLocale'

const MotionDiv = motion.div

interface WizardStepDetailsProps {
  title: string
  setTitle: (title: string) => void
  description: string
  setDescription: (desc: string) => void
  maxPlayers: string
  setMaxPlayers: (players: string) => void
  incrementPlayers: () => void
  decrementPlayers: () => void
  selectedGames: Game[]
  isOnline: boolean
  city: string
  platform: string
  date: string
}

export function WizardStepDetails({
  title,
  setTitle,
  description,
  setDescription,
  maxPlayers,
  setMaxPlayers,
  incrementPlayers,
  decrementPlayers,
  selectedGames,
  isOnline,
  city,
  platform,
  date
}: WizardStepDetailsProps) {
  const { t } = useTranslation()
  const { getGameTitle, getGameCover, language } = useGameLocale()
  const playerCount = parseInt(maxPlayers, 10) || 4
  const PRESET_CAPACITIES = [2, 3, 4, 5, 6, 7, 8]
  const isCustomCapacity = !PRESET_CAPACITIES.includes(playerCount)

  return (
    <MotionDiv
      key="step-details"
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* Step Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
          <Users className="w-5 h-5 text-primary shrink-0" />
          <span>{t('create.stepDetails')}</span>
        </h2>
        <p className="text-xs text-muted-foreground font-medium leading-relaxed">
          {t('create.playerCount')} &amp; {t('create.meetupDetailsStep')}
        </p>
      </div>

      {/* Interactive Player Stepper */}
      <div className="p-4 border border-border/40 rounded-2xl bg-card/40 backdrop-blur-md shadow-sm space-y-3">
        <Label className="text-xs font-bold text-muted-foreground block text-center">
          {t('create.playerCount')}
        </Label>
        
        <div className="flex items-center justify-center gap-4">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={decrementPlayers}
            disabled={playerCount <= 2}
            className="w-12 h-12 rounded-xl border-border/60 hover:border-primary/40 disabled:opacity-40 cursor-pointer text-foreground"
            aria-label={t('create.decreasePlayers')}
          >
            <Minus className="w-5 h-5" />
          </Button>

          <div className="text-center min-w-[100px]">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-foreground font-mono-tabular">
              {playerCount}
            </span>
            <span className="block text-xs font-bold text-muted-foreground">
              {t('create.playersUnit')}
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={incrementPlayers}
            disabled={playerCount >= 50}
            className="w-12 h-12 rounded-xl border-border/60 hover:border-primary/40 disabled:opacity-40 cursor-pointer text-foreground"
            aria-label={t('create.increasePlayers')}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* Preset chips */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
          {PRESET_CAPACITIES.map((val) => (
            <Button
              key={val}
              type="button"
              variant={playerCount === val ? "default" : "outline"}
              size="xs"
              onClick={() => setMaxPlayers(String(val))}
              className="cursor-pointer"
            >
              <span className="font-mono-tabular">{val}</span> {t('common.playersAbbr')}
            </Button>
          ))}
          {isCustomCapacity && (
            <Button
              type="button"
              variant="default"
              size="xs"
              className="cursor-default"
            >
              <span className="font-mono-tabular">{playerCount}</span> {t('common.playersAbbr')}
            </Button>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title" className="font-bold text-xs flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-primary" />
          <span>{t('create.meetupTitleLabel')}</span>
        </Label>
        <Input
          id="title"
          placeholder={t('create.meetupTitlePlaceholder')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={80}
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description" className="font-bold text-xs">
          {t('create.descLabel')}
        </Label>
        <Textarea
          id="description"
          placeholder={t('create.descPlaceholder')}
          className="min-h-[90px] resize-none"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={600}
        />
      </div>

      {/* Meetup Summary Card */}
      <div className="p-3.5 rounded-2xl border border-primary/20 bg-primary/5 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-primary">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            {t('create.summaryReview')}
          </span>
          <Badge variant="primary-soft" className="text-xs">
            {playerCount} {t('common.playersAbbr')}
          </Badge>
        </div>

        <div className="flex items-center gap-3 bg-background/60 p-2.5 rounded-xl border border-border/30 text-xs">
          {selectedGames.length > 0 && (getGameCover(selectedGames[0]) || selectedGames[0].image_url) ? (
            <OptimizedImage
              src={getGameCover(selectedGames[0]) || selectedGames[0].image_url!}
              alt={getGameTitle(selectedGames[0])}
              widthSize={50}
              heightSize={50}
              className="w-9 h-9 rounded-lg object-cover shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xs shrink-0">
              🎲
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-bold text-foreground truncate">
              {selectedGames.length > 0 ? getGameTitle(selectedGames[0]) : t('create.noGamesSelected')}
            </p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-muted-foreground text-xs mt-0.5">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-primary" />
                {date ? formatDate(date, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }, language) : '—'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                {isOnline ? <Laptop className="w-3 h-3 text-primary" /> : <MapPin className="w-3 h-3 text-primary" />}
                {isOnline ? (platform || 'Online') : (city || 'Presencial')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </MotionDiv>
  )
}
