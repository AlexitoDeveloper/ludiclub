import React from 'react'
import { Link } from 'react-router-dom'
import { Plus, ListOrdered, Calendar, Trash2, Edit, ChevronRight } from 'lucide-react'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { useTranslation } from 'react-i18next'
import { useGameLocale } from '../../hooks/useGameLocale'
import { formatDate } from '../../lib/dateLocale'

export interface SavedRankingsSectionProps {
  savedRankings: any[];
  loadingRankings: boolean;
  isOwnProfile: boolean;
  setSelectedRanking: (ranking: any) => void;
  handleDeleteRanking: (e: React.MouseEvent, rankingId: string) => void;
}

export function SavedRankingsSection({
  savedRankings,
  loadingRankings,
  isOwnProfile,
  setSelectedRanking,
  handleDeleteRanking,
}: SavedRankingsSectionProps) {
  const { t } = useTranslation()
  const { language } = useGameLocale()

  return (
    <div className="space-y-3 pt-2 text-left">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-muted-foreground">
          <ListOrdered className="w-4 h-4 text-primary shrink-0" />
          <span>{t('profile.stats.rankings', 'Rankings y Tier Lists')}</span>
          <span className="font-mono-tabular bg-muted px-1.5 py-0.5 rounded-full text-xs text-foreground">
            {savedRankings.length}
          </span>
        </div>

        {isOwnProfile && (
          <Button
            asChild
            size="sm"
            className="cursor-pointer"
          >
            <Link to="/tops">
              <Plus className="w-3.5 h-3.5" />
              <span>{t('common.create', 'Crear')}</span>
            </Link>
          </Button>
        )}
      </div>

      {loadingRankings ? (
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-14 w-full bg-muted/20 border border-border/30 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : savedRankings.length === 0 ? (
        <div className="text-center py-8 px-4 bg-card/40 rounded-xl border border-dashed border-border/40 select-none">
          <p className="text-sm font-bold text-muted-foreground">{t('profile.stats.noRankings', 'Aún no hay rankings creados')}</p>
          {isOwnProfile && (
            <div className="mt-3">
              <Button
                asChild
                size="sm"
                className="cursor-pointer"
              >
                <Link to="/tops">
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('common.create', 'Crear')}</span>
                </Link>
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {savedRankings.map((ranking) => (
            <div 
              key={ranking.id} 
              onClick={() => setSelectedRanking(ranking)}
              className="p-3.5 rounded-2xl glass-panel border border-border/30 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer flex justify-between items-center group"
            >
              <div className="space-y-1 flex-1 min-w-0 pr-3">
                <h4 className="font-extrabold text-xs text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5 min-w-0">
                  <span className="truncate">{ranking.title || t('tops.untitled', 'Sin título')}</span>
                  <Badge variant="primary-soft" className="shrink-0 text-xs py-0">
                    {ranking.mode === 'tier' ? 'Tier List' : 'Top 10'}
                  </Badge>
                </h4>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold font-mono-tabular">
                  <Calendar className="w-3 h-3 text-primary shrink-0" />
                  {formatDate(ranking.created_at || Date.now(), { day: 'numeric', month: 'short', year: 'numeric' }, language)}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {isOwnProfile && (
                  <>
                    <Button 
                      asChild 
                      variant="ghost" 
                      size="icon-sm"
                      className="cursor-pointer text-muted-foreground hover:text-primary hover:bg-primary/10"
                      title={t('common.edit', 'Editar')}
                      aria-label={t('common.edit', 'Editar')}
                    >
                      <Link to={`/tops?load=${ranking.id}`} onClick={(e) => e.stopPropagation()}>
                        <Edit className="w-3.5 h-3.5" />
                      </Link>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon-sm" 
                      onClick={(e) => handleDeleteRanking(e, ranking.id)}
                      className="cursor-pointer text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title={t('tops.deleteRanking', 'Eliminar')}
                      aria-label={t('tops.deleteRanking', 'Eliminar')}
                      icon={Trash2}
                    />
                  </>
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
