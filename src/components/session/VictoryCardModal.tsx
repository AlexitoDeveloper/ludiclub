import { useState, useRef, useEffect, FC } from 'react'
import { motion } from 'framer-motion'
import { toPng } from 'html-to-image'
import { useTranslation } from 'react-i18next'
import {
  X,
  Copy,
  Download,
  Crown,
  Calendar,
  Check,
  Sparkles,
  MessageCircle,
} from 'lucide-react'
import { Button } from '../ui/button'
import { Meetup, PlayerScore } from '../../types'
import { formatDate, AppLanguage } from '../../lib/dateLocale'
import { cn } from '../../lib/utils'

interface VictoryCardModalProps {
  isOpen: boolean
  onClose: () => void
  meetup: Meetup
  scores?: PlayerScore[] | null
  language?: AppLanguage
}

export const VictoryCardModal: FC<VictoryCardModalProps> = ({
  isOpen,
  onClose,
  meetup,
  scores = [],
  language = 'es',
}) => {
  const { t } = useTranslation()
  const [isExporting, setIsExporting] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [gameImageError, setGameImageError] = useState(false)
  const [boardPhotoError, setBoardPhotoError] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setGameImageError(false)
      setBoardPhotoError(false)
    }
  }, [isOpen])

  const sortedScores = [...(scores || [])].sort((a, b) => b.score - a.score)
  const winner = sortedScores[0]
  const game = meetup.games?.[0]
  const isSpanish = !language || language.startsWith('es')
  const gameTitle = (isSpanish && game?.title_es) ? game.title_es : (game?.title || meetup.game_name || t('victoryCard.defaultGameTitle'))
  const rawGameImage = (isSpanish && game?.image_url_es) ? game.image_url_es : (game?.image_url || (meetup as any).game_image || null)

  const proxiedGameImage = rawGameImage ? (
    rawGameImage.startsWith('http://') || rawGameImage.startsWith('https://')
      ? `https://images.weserv.nl/?url=${encodeURIComponent(rawGameImage)}&w=200&h=200&fit=cover`
      : rawGameImage
  ) : null

  const proxiedBoardPhoto = meetup.board_photo_url ? (
    meetup.board_photo_url.startsWith('http')
      ? `https://images.weserv.nl/?url=${encodeURIComponent(meetup.board_photo_url)}&w=800&fit=cover`
      : meetup.board_photo_url
  ) : null

  const handleDownloadPng = async () => {
    if (!cardRef.current) return
    setIsExporting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 200))
      const dataUrl = await toPng(cardRef.current, {
        quality: 0.95,
        pixelRatio: 3,
        backgroundColor: '#070C18',
        cacheBust: true,
      })

      const filename = `partida-${meetup.title.toLowerCase().replace(/\s+/g, '-') || 'victoria'}.png`
      const link = document.createElement('a')
      link.download = filename
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Error generating card image:', err)
    } finally {
      setIsExporting(false)
    }
  }

  const handleShareNative = async () => {
    const textLines = [
      t('victoryCard.shareSummaryTitle', { title: meetup.title }),
      gameTitle ? t('victoryCard.shareGame', { game: gameTitle }) : '',
      winner ? t('victoryCard.shareWinner', { name: winner.name, score: winner.score }) : '',
      '',
      t('victoryCard.shareStandings'),
      ...sortedScores.map((s, idx) => `${idx + 1}. ${s.name} — ${s.score} pts`),
      '',
      t('victoryCard.shareDate', { date: formatDate(meetup.date, { day: 'numeric', month: 'short', year: 'numeric' }, language) }),
      t('victoryCard.generatedWith'),
    ].filter(Boolean)

    const fullText = textLines.join('\n')

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: t('victoryCard.victoryIn', { title: meetup.title }),
          text: fullText,
          url: window.location.href,
        })
        return
      } catch (err) {
        // User canceled or failed, fallback to whatsapp link
      }
    }

    // Direct WhatsApp link fallback
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(fullText + '\n' + window.location.href)}`
    window.open(whatsappUrl, '_blank')
  }

  const handleCopySummary = async () => {
    const textLines = [
      t('victoryCard.shareSummaryTitle', { title: meetup.title }),
      gameTitle ? t('victoryCard.shareGame', { game: gameTitle }) : '',
      winner ? t('victoryCard.shareWinner', { name: winner.name, score: winner.score }) : '',
      ...sortedScores.map((s, idx) => `${idx + 1}. ${s.name} — ${s.score} pts`),
    ].filter(Boolean)

    await navigator.clipboard.writeText(textLines.join('\n'))
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-border/50 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col my-auto max-h-[92dvh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/40 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-foreground">{t('victoryCard.modalTitle')}</h3>
              <p className="text-xs text-muted-foreground font-medium">
                {t('victoryCard.modalDesc')}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label={t('victoryCard.closeModal')}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Card View Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex items-center justify-center bg-slate-950/40">
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
                    <h5 className="text-sm font-black truncate text-white leading-tight">
                      {gameTitle}
                    </h5>
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
                    <span className="text-lg font-mono font-black text-amber-300">
                      {winner.score}
                    </span>
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
                        <span className="text-xs font-mono font-black text-zinc-400 w-4">
                          #{idx + 1}
                        </span>
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
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border/40 bg-slate-950/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopySummary}
            className="h-9 px-3 rounded-xl text-xs font-bold gap-1.5 cursor-pointer"
            aria-label={copiedLink ? t('common.copied') : t('common.copyText', 'Copiar texto')}
            title={copiedLink ? t('common.copied') : t('common.copyText', 'Copiar texto')}
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? t('common.copied') : t('common.copyText', 'Copiar texto')}</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadPng}
              loading={isExporting}
              icon={Download}
              aria-label={t('common.savePhoto')}
              label={t('common.savePhoto')}
            />

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleShareNative}
              icon={MessageCircle}
              aria-label={t('common.shareWhatsApp', 'WhatsApp')}
              label={t('common.shareWhatsApp', 'WhatsApp')}
            />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
