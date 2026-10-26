import { Link } from 'react-router-dom'
import { Plus, Check, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Game } from '@/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface GameActionsCardProps {
  game: Game
  isInCollection: boolean
  actionLoading: boolean
  toggleCollection: () => void
}

export function GameActionsCard({
  game,
  isInCollection,
  actionLoading,
  toggleCollection
}: GameActionsCardProps) {
  const { t } = useTranslation()

  return (
    <Card variant="default" className="p-5 shadow-lg space-y-4 bg-card border border-border/40">
      <h3 className="text-xs font-bold text-foreground border-b border-border/40 pb-3">
        {t('gameDetail.actionsTitle')}
      </h3>
      
      <div className="flex flex-col gap-3">
        {/* Host Table Button */}
        <Button 
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

        {/* Toggle Personal Collection */}
        <Button
          variant={isInCollection ? 'outline' : 'secondary'}
          size="lg"
          className="w-full"
          onClick={toggleCollection}
          disabled={actionLoading}
        >
          {actionLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : isInCollection ? (
            <>
              <Check className="h-4 w-4 text-emerald-500 shrink-0" />
              {t('gameDetail.inLudoteca')}
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
              {t('gameDetail.addToLudoteca')}
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground font-medium leading-relaxed text-center pt-1">
        {t('gameDetail.collectionTip')}
      </p>
    </Card>
  )
}
