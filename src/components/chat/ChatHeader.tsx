import { useState } from 'react'
import { ArrowLeft, Clock, Trash2, ExternalLink, Flag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../lib/authContext'
import { formatDate } from '../../lib/dateLocale'
import { getGameCover, getGameTitle } from '../../lib/gameLocale'
import { Meetup, Game } from '../../types'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { OptimizedImage } from '../ui/OptimizedImage'
import { ReportContentDialog } from '../common/ReportContentDialog'

interface ChatHeaderProps {
  meetup: Meetup
  game: Game | null
  onBack: () => void
  onOpenDeleteDialog: () => void
}

export function ChatHeader({
  meetup,
  game,
  onBack,
  onOpenDeleteDialog
}: ChatHeaderProps) {
  const { t } = useTranslation()
  const { user, language } = useAuth()
  const navigate = useNavigate()
  const [isReportOpen, setIsReportOpen] = useState(false)

  const coverUrl = getGameCover(game, language) || game?.image_url
  const gameTitle = getGameTitle(game, language) || game?.title

  return (
    <header className="sticky top-0 z-20 shrink-0 px-3 sm:px-4 pt-[calc(0.625rem+env(safe-area-inset-top))] sm:pt-3 pb-2.5 sm:pb-3 border-b border-border/30 bg-card/95 backdrop-blur-md flex items-center justify-between gap-2.5 shadow-2xs">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        {/* Mobile Back Button */}
        <Button
          onClick={onBack}
          variant="ghost"
          size="icon-sm"
          aria-label={t('common.back')}
          title={t('common.back')}
          className="md:hidden shrink-0 min-h-[44px] min-w-[44px] -ml-1 text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        {/* Clickable Header Info (Links to Meetup Details) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate(`/mesa/${meetup.id}`)}
          onKeyDown={(e) => e.key === 'Enter' && navigate(`/mesa/${meetup.id}`)}
          className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 cursor-pointer group/header select-none"
          title={t('meetup.viewDetails', 'Ver Ficha de Partida')}
        >
          <div className="w-10 h-10 rounded-xl bg-background border border-border/40 overflow-hidden shrink-0 flex items-center justify-center p-0.5 group-hover/header:border-primary/60 transition-colors shadow-2xs">
            <OptimizedImage
              src={coverUrl}
              fallbackSrc={game?.image_url}
              alt={gameTitle || meetup.title}
              widthSize={80}
              heightSize={80}
              fit="contain"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="min-w-0 text-left flex-1">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm sm:text-base font-black text-foreground truncate group-hover/header:text-primary transition-colors">
                {meetup.title}
              </h2>
              {game && (
                <Badge variant="secondary" className="hidden sm:inline-flex text-xs py-0 px-1.5 font-bold shrink-0">
                  {gameTitle}
                </Badge>
              )}
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/50 opacity-0 group-hover/header:opacity-100 transition-opacity shrink-0" />
            </div>

            <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5 mt-0.5 truncate">
              <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="font-mono-tabular">
                {formatDate(meetup.date, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }, language)}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          onClick={() => setIsReportOpen(true)}
          variant="ghost"
          size="sm"
          aria-label={t('reports.reportChat', 'Reportar')}
          title={t('reports.reportChat', 'Reportar contenido')}
          className="min-h-[44px] px-2 text-muted-foreground hover:text-destructive transition-colors"
        >
          <Flag className="w-4 h-4" />
        </Button>

        <Button
          onClick={onOpenDeleteDialog}
          variant="ghost"
          size="sm"
          aria-label={t('chats.deleteChat')}
          title={t('chats.deleteChat')}
          className="min-h-[44px] px-2.5 sm:px-3 text-muted-foreground hover:text-destructive transition-colors gap-1.5"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline text-xs font-bold">{t('chats.deleteChat')}</span>
        </Button>
      </div>

      <ReportContentDialog
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        contentType="chat_message"
        contentId={meetup.id}
        reportedUserId={meetup.creator_id !== user?.id ? meetup.creator_id : null}
        title={t('reports.reportChat', 'Reportar conversación')}
      />
    </header>
  )
}
