import { useState } from 'react'
import { Crown, UserPlus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { UserProfile } from '../../types'
import { useTranslation } from 'react-i18next'
import { AddGuestPlayerModal } from './AddGuestPlayerModal'

const MotionDiv = motion.div

interface MeetupDetailAttendeesProps {
  attendees: UserProfile[];
  maxPlayers: number;
  spotsRemaining: number;
  creatorId: string;
  userId: string | undefined;
  guestReservationId?: string;
  onAddGuest?: (name: string) => Promise<boolean>;
}

export function MeetupDetailAttendees({ 
  attendees, 
  maxPlayers, 
  spotsRemaining, 
  creatorId, 
  userId, 
  guestReservationId,
  onAddGuest
}: MeetupDetailAttendeesProps) {
  const { t } = useTranslation()
  const [isAddGuestModalOpen, setIsAddGuestModalOpen] = useState(false)
  const isOrganizer = userId === creatorId
  
  const renderEmptySlots = () => {
    const slotsToRender = Math.min(1, spotsRemaining)
    if (slotsToRender <= 0) return null

    return Array.from({ length: slotsToRender }).map((_, idx) => (
      <div 
        key={`empty-${idx}`} 
        className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-border/50 bg-transparent text-muted-foreground/40"
      >
        <div className="w-9 h-9 rounded-full border border-dashed border-border/50 flex items-center justify-center text-xs font-bold text-muted-foreground/30">
          ?
        </div>
        <span className="text-xs font-bold text-muted-foreground">{t('meetup.vacantSpot')}</span>
      </div>
    ))
  }

  return (
    <Card className="border-border/30 bg-card/60 backdrop-blur-2xl shadow-lg">
      <CardHeader className="p-4 sm:p-6 pb-3 border-b border-border/20 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold tracking-tight text-foreground">{t('meetup.attendeesTitle')}</CardTitle>
          <CardDescription className="text-xs font-semibold text-muted-foreground mt-0.5 font-mono-tabular">
            {t('meetup.attendeesCount', { current: attendees.length, max: maxPlayers })}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center -space-x-2 shrink-0">
            {attendees.slice(0, 4).map((a) => (
              <div key={a.id} className="relative">
                <Avatar className="w-7 h-7 border-2 border-background ring-1 ring-border/20">
                  <AvatarImage src={a.avatar_url || undefined} />
                  <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                    {a.username?.slice(0, 2).toUpperCase() || 'P'}
                  </AvatarFallback>
                </Avatar>
                {a.id === creatorId && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#D97706] rounded-full flex items-center justify-center text-white shadow-2xs ring-1 ring-background">
                    <Crown className="w-2 h-2 fill-current" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <Badge variant="primary-soft" className="text-xs font-mono-tabular">
            {t('meetup.spotsLeft', { count: spotsRemaining })}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-4 sm:p-6 sm:pt-6">
        <div className="max-h-[300px] overflow-y-auto pr-1.5 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pb-1">
            {attendees.map((attendee) => {
              const isUserOrganizer = attendee.id === creatorId
              const isCurrentAttendee = attendee.id === userId || (guestReservationId && attendee.id === guestReservationId)

              const attendeeContent = (
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar className="w-9 h-9 border border-background shadow-sm group-hover:scale-105 transition-transform duration-300">
                    <AvatarImage src={attendee.avatar_url || undefined} />
                    <AvatarFallback className={`text-xs font-bold ${attendee.is_guest ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                      {attendee.username?.slice(0,2)?.toUpperCase() || 'IN'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 text-left">
                    <span className="text-sm font-bold block text-foreground truncate group-hover:text-primary transition-colors">
                      {attendee.username} {isCurrentAttendee && <span className="text-xs text-primary font-semibold">({t('meetup.you')})</span>}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium block">
                      {isUserOrganizer ? t('meetup.organizer') : attendee.is_guest ? t('meetup.tempGuest') : t('meetup.player')}
                    </span>
                  </div>
                </div>
              )

              return (
                <MotionDiv 
                  key={attendee.id} 
                  layoutId={`attendee-${attendee.id}`}
                  className={`flex items-center justify-between p-3 rounded-xl border bg-background/30 hover:border-primary/20 hover:bg-primary/5 transition-all duration-300 group ${
                    attendee.is_guest 
                      ? 'border-border/20 border-dashed opacity-90' 
                      : 'border-border/30'
                  }`}
                >
                  {attendee.is_guest ? (
                    attendeeContent
                  ) : (
                    <Link to={`/perfil/${attendee.id}`} className="min-w-0 flex-1 flex items-center">
                      {attendeeContent}
                    </Link>
                  )}

                  {isUserOrganizer && (
                    <Badge variant="tag-amber" className="flex items-center gap-1 shrink-0 text-xs font-bold">
                      <Crown className="w-3 h-3 fill-amber text-amber" />
                      Master
                    </Badge>
                  )}

                  {attendee.is_guest && !isUserOrganizer && (
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {t('common.guest')}
                    </Badge>
                  )}
                </MotionDiv>
              )
            })}

            {renderEmptySlots()}
          </div>

          {isOrganizer && onAddGuest && attendees.length < maxPlayers && (
            <div className="pt-2 border-t border-border/20">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddGuestModalOpen(true)}
                className="w-full h-9 rounded-xl text-xs font-bold gap-1.5 border-dashed border-border/60 hover:border-primary/50 text-muted-foreground hover:text-foreground hover:bg-muted/30"
              >
                <UserPlus className="w-3.5 h-3.5 text-primary" />
                <span>{t('meetup.addGuestManualBtn', 'Añadir invitado')}</span>
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      {onAddGuest && (
        <AddGuestPlayerModal
          isOpen={isAddGuestModalOpen}
          onClose={() => setIsAddGuestModalOpen(false)}
          onAddGuest={onAddGuest}
          existingNames={attendees.map(a => a.username)}
          maxPlayers={maxPlayers}
          currentCount={attendees.length}
        />
      )}
    </Card>
  )
}
