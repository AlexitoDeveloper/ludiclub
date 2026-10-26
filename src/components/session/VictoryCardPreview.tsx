import { FC, RefObject } from 'react'
import { Calendar, Crown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Meetup, PlayerScore } from '../../types'
import { formatDate, AppLanguage } from '../../lib/dateLocale'
import { cn } from '../../lib/utils'

interface VictoryCardPreviewProps {
  cardRef: RefObject<HTMLDivElement | null>
  meetup: Meetup
  gameTitle: string | null
  winner?: PlayerScore
  sortedScores: PlayerScore[]
  language?: AppLanguage
  proxiedGameImage: string | null
  proxiedBoardPhoto: string | null
  gameImageError: boolean
  boardPhotoError: boolean
  setGameImageError: (err: boolean) => void
  setBoardPhotoError: (err: boolean) => void
}

export const VictoryCardPreview: FC<VictoryCardPreviewProps> = ({
  cardRef,
  meetup,
  gameTitle,
  winner,
  sortedScores,
  language = 'es',
  proxiedGameImage,
  proxiedBoardPhoto,
  gameImageError,
  boardPhotoError,
  setGameImageError,
  setBoardPhotoError,
}) => {
  const { t } = useTranslation()

  return (
    <div
      ref={cardRef}
      className="w-full max-w-sm rounded-3xl p-5 sm:p-6 bg-gradient-to-b from-[#0F172A] via-[#090E1A] to-[#040812] border border-emerald-500/30 shadow-2xl relative overflow-hidden text-white"
    >
      {/* Ambient emerald & amber glows */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header info */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3 mb-4 relative z-10">
        <div className="min-w-0 flex-1">
          <span className="text-xs uppercase font-black tracking-widest text-emerald-400 block">
            {t('victoryCard.matchReport')}
          </span>
          <h4 className="text-base font-black truncate text-white">{meetup.title}</h4>
        </div>
        <span className="text-xs text-zinc-400 font-bold flex items-center gap-1 shrink-0">
          <Calendar className="w-3 h-3 text-emerald-400" />
          {formatDate(meetup.date, { day: 'numeric', month: 'short' }, language)}
        </span>
      </div>

      {/* Game & Winner Spotlight */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 relative z-10 mb-4 backdrop-blur-md">
        {gameTitle && (
          <div className="flex items-center gap-3">
            {proxiedGameImage && !gameImageError ? (
              <img
                src={proxiedGameImage}
                alt={gameTitle}
                crossOrigin="anonymous"
                onError={() => setGameImageError(true)}
                className="w-12 h-12 rounded-xl object-cover border border-white/20 shrink-0 shadow-sm"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-sm font-black text-emerald-400 shrink-0 border border-white/10">
                🎲
              </div>
            )}
            <div className="min-w-0">
              <span className="text-xs uppercase font-bold text-zinc-400">{t('victoryCard.game')}</span>
              <h5 className="text-sm font-black truncate text-white leading-tight">{gameTitle}</h5>
            </div>
          </div>
        )}

        {winner && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-emerald-500/15 border border-amber-400/30">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400 animate-pulse shrink-0" />
              <div>
                <span className="text-xs uppercase font-black tracking-wider text-amber-400 block">
                  {t('victoryCard.champion')}
                </span>
                <span className="text-xs font-black text-white">{winner.name}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-mono font-black text-amber-300">{winner.score}</span>
              <span className="text-xs font-bold text-zinc-400 ml-1">pts</span>
            </div>
          </div>
        )}
      </div>

      {/* Classification ranking */}
      {sortedScores.length > 0 && (
        <div className="space-y-1.5 relative z-10 mb-4">
          <span className="text-xs uppercase font-black tracking-widest text-zinc-400 block px-1">
            {t('victoryCard.classification')}
          </span>
          <div className="space-y-1">
            {sortedScores.map((player, idx) => (
              <div
                key={player.userId || player.guestId || idx}
                className={cn(
                  'flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold border backdrop-blur-sm',
                  idx === 0
                    ? 'bg-amber-500/10 border-amber-400/30 text-amber-200'
                    : 'bg-white/5 border-white/5 text-zinc-300'
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-mono font-black text-zinc-400 w-4">#{idx + 1}</span>
                  <span className="truncate font-bold text-white">{player.name}</span>
                </div>
                <div className="font-mono font-black text-emerald-400">
                  {player.score} <span className="text-xs text-zinc-400">pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Board Photo Thumbnail (if uploaded) */}
      {proxiedBoardPhoto && !boardPhotoError && (
        <div className="rounded-2xl overflow-hidden border border-white/10 aspect-video relative z-10 mb-3 bg-black">
          <img
            src={proxiedBoardPhoto}
            alt={t('victoryCard.finalBoard')}
            crossOrigin="anonymous"
            onError={() => setBoardPhotoError(true)}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Watermark */}
      <div className="text-center pt-2 text-xs text-zinc-500 font-bold uppercase tracking-widest border-t border-white/10 relative z-10">
        {t('victoryCard.watermark')}
      </div>
    </div>
  )
}
