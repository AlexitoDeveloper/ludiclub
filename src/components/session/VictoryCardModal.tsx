import { useState, useRef, useEffect, FC } from 'react'
import { motion } from 'framer-motion'
import { toPng } from 'html-to-image'
import { useTranslation } from 'react-i18next'
import { X, Copy, Download, Check, Sparkles, Share2 } from 'lucide-react'
import { Button } from '../ui/button'
import { toast } from '../ui/toast'
import { Meetup, PlayerScore } from '../../types'
import { formatDate, AppLanguage } from '../../lib/dateLocale'
import { getAppBaseUrl } from '../../lib/appUrl'
import { VictoryCardPreview } from './VictoryCardPreview'

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
  const gameTitle =
    isSpanish && game?.title_es
      ? game.title_es
      : game?.title || meetup.game_name || t('victoryCard.defaultGameTitle')
  const rawGameImage =
    isSpanish && game?.image_url_es
      ? game.image_url_es
      : game?.image_url || (meetup as any).game_image || null

  const proxiedGameImage = rawGameImage
    ? rawGameImage.startsWith('http://') || rawGameImage.startsWith('https://')
      ? `https://images.weserv.nl/?url=${encodeURIComponent(rawGameImage)}&w=200&h=200&fit=cover`
      : rawGameImage
    : null

  const proxiedBoardPhoto = meetup.board_photo_url
    ? meetup.board_photo_url.startsWith('http')
      ? `https://images.weserv.nl/?url=${encodeURIComponent(meetup.board_photo_url)}&w=800&fit=cover`
      : meetup.board_photo_url
    : null

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
    const shareUrl = `${getAppBaseUrl()}/meetup/${meetup.id}`
    const textLines = [
      t('victoryCard.shareSummaryTitle', { title: meetup.title }),
      gameTitle ? t('victoryCard.shareGame', { game: gameTitle }) : '',
      winner ? t('victoryCard.shareWinner', { name: winner.name, score: winner.score }) : '',
      '',
      t('victoryCard.shareStandings'),
      ...sortedScores.map((s, idx) => `${idx + 1}. ${s.name} — ${s.score} pts`),
      '',
      t('victoryCard.shareDate', {
        date: formatDate(meetup.date, { day: 'numeric', month: 'short', year: 'numeric' }, language),
      }),
      t('victoryCard.generatedWith'),
    ].filter(Boolean)

    const fullText = textLines.join('\n')
    const shareTitle = t('victoryCard.victoryIn', { title: meetup.title })

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        if (cardRef.current && navigator.canShare) {
          try {
            const dataUrl = await toPng(cardRef.current, {
              quality: 0.95,
              pixelRatio: 2,
              backgroundColor: '#070C18',
              cacheBust: true,
            })
            const res = await fetch(dataUrl)
            const blob = await res.blob()
            const file = new File([blob], `victoria-${meetup.id}.png`, { type: 'image/png' })
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({
                title: shareTitle,
                text: fullText,
                url: shareUrl,
                files: [file],
              })
              return
            }
          } catch {
            // Fallback to text & URL sharing
          }
        }

        await navigator.share({
          title: shareTitle,
          text: fullText,
          url: shareUrl,
        })
        return
      } catch (err: any) {
        if (err?.name === 'AbortError') return
      }
    }

    // Fallback: Clipboard copy + Toast
    try {
      await navigator.clipboard.writeText(`${fullText}\n\n${shareUrl}`)
      toast.success(t('common.copied', '¡Copiado!'), {
        description: t('toast.inviteCopied', 'Enlace copiado al portapapeles.'),
      })
    } catch {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${fullText}\n${shareUrl}`)}`
      window.open(whatsappUrl, '_blank')
    }
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
              <p className="text-xs text-muted-foreground font-medium">{t('victoryCard.modalDesc')}</p>
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
          <VictoryCardPreview
            cardRef={cardRef}
            meetup={meetup}
            gameTitle={gameTitle}
            winner={winner}
            sortedScores={sortedScores}
            language={language}
            proxiedGameImage={proxiedGameImage}
            proxiedBoardPhoto={proxiedBoardPhoto}
            gameImageError={gameImageError}
            boardPhotoError={boardPhotoError}
            setGameImageError={setGameImageError}
            setBoardPhotoError={setBoardPhotoError}
          />
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border/40 bg-slate-950/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopySummary}
            className="gap-1.5 cursor-pointer"
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
              icon={Share2}
              aria-label={t('common.share', 'Compartir')}
              label={t('common.share', 'Compartir')}
            />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
