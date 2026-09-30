import { useState } from 'react'
import { UserX, UserCheck, ShieldCheck, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody } from '../ui/sheet'
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar'
import { Button } from '../ui/button'
import { Skeleton } from '../ui/skeleton'
import { BlockedUserInfo } from '../../hooks/useBlockedUsers'
import { toast } from '../ui/toast'

interface BlockedUsersSheetProps {
  isOpen: boolean
  onClose: () => void
  blockedUsers: BlockedUserInfo[]
  loading: boolean
  onUnblock: (userId: string) => Promise<boolean>
}

export function BlockedUsersSheet({
  isOpen,
  onClose,
  blockedUsers,
  loading,
  onUnblock,
}: BlockedUsersSheetProps) {
  const { t } = useTranslation()
  const [unblockingId, setUnblockingId] = useState<string | null>(null)

  const handleUnblock = async (user: BlockedUserInfo) => {
    setUnblockingId(user.id)
    try {
      const ok = await onUnblock(user.id)
      if (ok) {
        toast.success(t('reports.unblockSuccessNamed', 'Has desbloqueado a @{{username}}', { username: user.username }))
      }
    } finally {
      setUnblockingId(null)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="max-w-md max-h-[85vh] flex flex-col p-0">
        <SheetHeader>
          <SheetTitle>
            <UserX className="w-5 h-5 text-destructive" />
            {t('settings.blockedUsers', 'Usuarios bloqueados')}
          </SheetTitle>
          <SheetDescription>
            {t(
              'settings.blockedUsersDesc',
              'Personas que has restringido. No pueden ver tus actividades ni interactuar contigo.'
            )}
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="pb-[max(1.5rem,env(safe-area-inset-bottom))] space-y-3">
          {loading ? (
            <div className="space-y-3 py-2">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border/40">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <Skeleton className="w-24 h-4 rounded-md" />
                  </div>
                  <Skeleton className="w-20 h-8 rounded-lg" />
                </div>
              ))}
            </div>
          ) : blockedUsers.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-foreground">
                  {t('settings.noBlockedUsers', 'No tienes usuarios bloqueados')}
                </h4>
                <p className="text-xs text-muted-foreground max-w-xs">
                  {t(
                    'settings.noBlockedUsersDesc',
                    'Si bloqueas a alguien desde su perfil, aparecerá en esta lista para que puedas gestionarlo.'
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 py-1">
              {blockedUsers.map((item) => {
                const initial = item.username ? item.username.charAt(0).toUpperCase() : 'U'
                const isItemUnblocking = unblockingId === item.id
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-card border border-border/60 hover:border-border transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="w-9 h-9 border border-border/60">
                        <AvatarImage src={item.avatar_url || ''} alt={item.username} />
                        <AvatarFallback className="text-xs font-bold">{initial}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">
                          @{item.username}
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnblock(item)}
                      disabled={isItemUnblocking}
                      className="shrink-0 gap-1.5 text-xs h-8 px-3 hover:border-primary/50"
                    >
                      {isItemUnblocking ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <UserCheck className="w-3.5 h-3.5 text-primary" />
                      )}
                      <span>{t('reports.unblock', 'Desbloquear')}</span>
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
