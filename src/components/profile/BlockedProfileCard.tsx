import { useState } from 'react'
import { ShieldOff, UserCheck, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '../ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar'
import { Button } from '../ui/button'
import { UserProfile } from '../../types'
import { toast } from '../ui/toast'

interface BlockedProfileCardProps {
  profile: UserProfile
  onUnblock: () => Promise<boolean | void>
}

export function BlockedProfileCard({ profile, onUnblock }: BlockedProfileCardProps) {
  const { t } = useTranslation()
  const [unblocking, setUnblocking] = useState(false)

  const handleUnblock = async () => {
    setUnblocking(true)
    try {
      await onUnblock()
      toast.success(t('reports.unblockSuccess', 'Usuario desbloqueado.'))
    } finally {
      setUnblocking(false)
    }
  }

  const initial = profile.username ? profile.username.charAt(0).toUpperCase() : 'U'

  return (
    <Card variant="flat" className="max-w-md mx-auto text-center border-border/40 bg-card/60 p-6 md:p-8 space-y-6">
      <CardContent className="p-0 flex flex-col items-center space-y-4">
        {/* Avatar with Shield Badge */}
        <div className="relative">
          <Avatar className="w-20 h-20 border-2 border-border/60 opacity-60 grayscale">
            <AvatarImage src={profile.avatar_url || ''} alt={profile.username} />
            <AvatarFallback className="font-bold text-lg">{initial}</AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-destructive/15 text-destructive border border-destructive/30 backdrop-blur-xs">
            <ShieldOff className="w-4 h-4" />
          </div>
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-bold font-display text-foreground tracking-tight">
            @{profile.username}
          </h2>
          <p className="text-xs font-semibold text-destructive uppercase tracking-wider">
            {t('reports.profileBlockedBadge', 'Perfil bloqueado por ti')}
          </p>
        </div>

        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
          {t(
            'reports.profileBlockedExpl',
            'Has bloqueado a este usuario. Sus estadísticas, colecciones y partidas están ocultas mientras esté en tu lista de bloqueos.'
          )}
        </p>

        <div className="pt-2 w-full max-w-xs">
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={handleUnblock}
            disabled={unblocking}
            className="w-full gap-2 border-border/80 hover:border-primary/50"
          >
            {unblocking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserCheck className="w-4 h-4 text-primary" />
            )}
            <span>{t('reports.unblockUserAction', 'Desbloquear a @{{username}}', { username: profile.username })}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
