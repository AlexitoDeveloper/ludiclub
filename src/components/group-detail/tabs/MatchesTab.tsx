import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, Plus } from 'lucide-react'
import { Button } from '../../ui/button'
import { Card } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Skeleton } from '../../ui/skeleton'
import { toast } from '../../ui/toast'
import { useTranslation } from 'react-i18next'
import { formatDate } from '../../../lib/dateLocale'
import { GroupMeetup } from '../../../hooks/useGroupHub'
import { supabase } from '../../../lib/supabaseClient'
import { USE_MOCKS } from '../../../lib/config'
import { DeleteTableConfirmDialog } from '../../meetup-detail/DeleteTableConfirmDialog'
import { MatchChronicleCard } from './MatchChronicleCard'

interface MatchesTabProps {
  groupId: string
  matches: GroupMeetup[]
  loading: boolean
  onOpenQuickLogModal: () => void
  onRefresh?: () => void
}

export const MatchesTab: React.FC<MatchesTabProps> = ({
  groupId: _groupId,
  matches,
  loading,
  onOpenQuickLogModal,
  onRefresh,
}) => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const language = i18n.language as any

  const [deletingMatch, setDeletingMatch] = useState<GroupMeetup | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirmDelete = async () => {
    if (!deletingMatch) return
    setIsDeleting(true)
    try {
      const isMock = USE_MOCKS && deletingMatch.id.startsWith('mock-')
      if (isMock) {
        const stored = localStorage.getItem('ludiclub_mock_meetups') || localStorage.getItem('boardgame_social_mock_meetups')
        if (stored) {
          const list = JSON.parse(stored).filter((m: any) => m.id !== deletingMatch.id)
          localStorage.setItem('ludiclub_mock_meetups', JSON.stringify(list))
        }
      } else {
        const { error } = await supabase.from('meetups').delete().eq('id', deletingMatch.id)
        if (error) throw error
      }
      toast.success(t('meetup.deleteSuccess', 'Mesa eliminada correctamente.'))
      setDeletingMatch(null)
      onRefresh?.()
    } catch (err: any) {
      toast.error(err?.message || 'Error al eliminar la partida.')
    } finally {
      setIsDeleting(false)
    }
  }

  const formatMatchDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return formatDate(
        d,
        { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' },
        language
      )
    } catch {
      return dateStr
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
        {[1, 2, 3, 4].map((n) => (
          <Skeleton key={n} className="h-44 w-full rounded-2xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-black font-display tracking-tight text-foreground flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>{t('groups.pastMatchesSubTab', 'Historial de partidas')}</span>
          </h2>
          <Badge variant="secondary" size="sm" className="font-bold">
            {matches.length}
          </Badge>
        </div>

        <Button
          size="sm"
          onClick={onOpenQuickLogModal}
          className="gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t('quickLog.saveBtn', 'Registrar Partida')}</span>
        </Button>
      </div>

      {matches.length === 0 ? (
        <Card className="p-10 text-center border-dashed border-border/50 bg-card/40 rounded-3xl max-w-lg mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 mx-auto flex items-center justify-center text-amber-500">
            <Trophy className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-sm mx-auto">
            <h3 className="font-black text-foreground text-base font-display">
              {t('groups.noMatchesRecorded', 'No hay partidas registradas')}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t(
                'groups.noMatchesRecordedDesc',
                'Registrad vuestra primera partida para inmortalizar las puntuaciones y coronar al campeón.'
              )}
            </p>
          </div>
          <Button
            size="default"
            onClick={onOpenQuickLogModal}
            className="cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('quickLog.saveBtn', 'Anotar Primera Partida')}</span>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matches.map((match) => (
            <MatchChronicleCard
              key={match.id}
              match={match}
              formattedDate={formatMatchDate(match.date)}
              canDelete={Boolean(onRefresh)}
              onClick={() => navigate(`/mesa/${match.id}`)}
              onDelete={() => setDeletingMatch(match)}
            />
          ))}
        </div>
      )}

      {deletingMatch && (
        <DeleteTableConfirmDialog
          isOpen={Boolean(deletingMatch)}
          onClose={() => setDeletingMatch(null)}
          onConfirmDelete={handleConfirmDelete}
          isDeleting={isDeleting}
          tableTitle={deletingMatch.gameTitle || deletingMatch.title}
        />
      )}
    </div>
  )
}

export default MatchesTab
