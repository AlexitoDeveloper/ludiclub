import { FC } from 'react'
import { Users, Plus, X, UserCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Chip } from '../../ui/chip'
import { Input } from '../../ui/input'
import { Button } from '../../ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '../../ui/avatar'
import { QuickLogAttendee } from '../../../hooks/useQuickLogMatch'

interface QuickLogAttendeesSectionProps {
  attendees: QuickLogAttendee[]
  selectedAttendeeIds: Set<string>
  toggleAttendee: (id: string) => void
  newGuestName: string
  setNewGuestName: (val: string) => void
  addGuest: () => void
  removeGuest: (id: string) => void
  isGroupMode: boolean
}

export const QuickLogAttendeesSection: FC<QuickLogAttendeesSectionProps> = ({
  attendees,
  selectedAttendeeIds,
  toggleAttendee,
  newGuestName,
  setNewGuestName,
  addGuest,
  removeGuest,
  isGroupMode,
}) => {
  const { t } = useTranslation()
  const activeCount = attendees.filter((a) => selectedAttendeeIds.has(a.id)).length

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            {t('quickLog.playersSection')}
          </span>
        </div>
        <span className="text-xs font-bold text-muted-foreground">
          {t('quickLog.selectedCount', { count: activeCount })}
        </span>
      </div>

      {/* Selectable Attendee Chips */}
      <div className="flex flex-wrap gap-2">
        {attendees.map((attendee) => {
          const isSelected = selectedAttendeeIds.has(attendee.id)
          const initials = attendee.name.slice(0, 2).toUpperCase()

          return (
            <div key={attendee.id} className="relative group/chip flex items-center">
              <Chip
                type="button"
                selected={isSelected}
                variant="primary"
                size="default"
                onClick={() => toggleAttendee(attendee.id)}
                className="gap-2 pr-2.5 pl-2 py-1 h-9 rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <Avatar className="w-5 h-5 shrink-0 border border-primary/20">
                  <AvatarImage src={attendee.avatarUrl || undefined} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-black">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <span className="truncate max-w-[120px]">{attendee.name}</span>

                {isSelected ? (
                  <UserCheck className="w-3.5 h-3.5 text-white shrink-0" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                )}
              </Chip>

              {attendee.isGuest && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeGuest(attendee.id)
                  }}
                  className="ml-0.5 text-muted-foreground hover:text-destructive"
                  title={t('quickLog.removeGuest')}
                  aria-label={t('quickLog.removeGuest')}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          )
        })}
      </div>

      {/* Quick Add Guest Form */}
      <div className="flex items-center gap-2 pt-1">
        <Input
          type="text"
          placeholder={isGroupMode ? t('quickLog.addGuestCasual') : t('quickLog.addGuestGroup')}
          aria-label={isGroupMode ? t('quickLog.addGuestCasual') : t('quickLog.addGuestGroup')}
          value={newGuestName}
          onChange={(e) => setNewGuestName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addGuest()
            }
          }}
          className="h-8 text-xs rounded-xl flex-1"
        />

        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={addGuest}
          disabled={!newGuestName.trim()}
          className="gap-1 cursor-pointer shrink-0 border-border/40"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t('quickLog.addGuestBtn')}</span>
        </Button>
      </div>
    </div>
  )
}
