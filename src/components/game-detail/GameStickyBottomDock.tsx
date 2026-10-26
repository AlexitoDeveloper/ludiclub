import { Link } from 'react-router-dom'
import { Plus, Check, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Game } from '@/types'
import { Button } from '@/components/ui/button'

interface GameStickyBottomDockProps {
  game: Game
  isInCollection: boolean
  actionLoading: boolean
  onToggleCollection: () => void
}

export function GameStickyBottomDock({
  game,
  isInCollection,
  actionLoading,
  onToggleCollection,
}: GameStickyBottomDockProps) {
  const { t } = useTranslation()

  return (
    <aside
      aria-label={t('gameDetail.actionsTitle')}
      className="fixed bottom-0 inset-x-0 z-50 lg:hidden bg-card/90 dark:bg-[#0A0F1D]/90 backdrop-blur-xl border-t border-border/50 p-3 pb-[max(0.75rem,calc(env(safe-area-inset-bottom)+0.5rem))] shadow-[0_-8px_24px_rgba(0,0,0,0.15)]"
    >
      <div className="max-w-md mx-auto grid grid-cols-2 gap-3 items-center">
        {/* Collection Toggle Button */}
        <Button
          type="button"
          variant={isInCollection ? 'outline' : 'secondary'}
          size="lg"
          onClick={onToggleCollection}
          disabled={actionLoading}
          className="w-full"
        >
          {actionLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : isInCollection ? (
            <>
              <Check className="h-4 w-4 text-emerald-500 shrink-0" />
              <span className="truncate">{t('gameDetail.inLudoteca')}</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="truncate">{t('gameDetail.addToLudoteca')}</span>
            </>
          )}
        </Button>

        {/* Host Meetup Primary Button */}
        <Button
          type="button"
          asChild
          variant="default"
          size="lg"
          className="w-full"
        >
          <Link to={`/mesa/nueva?gameId=${game.bgg_id}`}>
            <Plus className="w-4 h-4" />
            <span>{t('common.hostTable')}</span>
          </Link>
        </Button>
      </div>
    </aside>
  )
}
