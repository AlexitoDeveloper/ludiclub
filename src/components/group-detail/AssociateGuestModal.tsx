import React, { useState } from 'react'
import { Link2, Loader2, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar'
import { GroupGuest, GroupMember } from '../../hooks/useGroupDetail'

interface AssociateGuestModalProps {
  isOpen: boolean
  onClose: () => void
  guest: GroupGuest | null
  members: GroupMember[]
  onAssociate: (guestId: string, userId: string) => Promise<void>
}

export const AssociateGuestModal: React.FC<AssociateGuestModalProps> = ({
  isOpen,
  onClose,
  guest,
  members,
  onAssociate,
}) => {
  const { t } = useTranslation()
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!guest) return null

  const handleConfirm = async () => {
    if (!selectedUserId) {
      setError(t('groups.selectUserToLink', 'Selecciona un miembro del grupo para vincular.'))
      return
    }

    setLoading(true)
    setError(null)
    try {
      await onAssociate(guest.id, selectedUserId)
      setSelectedUserId(null)
      onClose()
    } catch (err: any) {
      setError(err?.message || t('groups.associateError', 'Error al vincular el usuario.'))
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedUserId(null)
      setError(null)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl border border-border/40 bg-card/95 backdrop-blur-xl">
        <DialogHeader className="space-y-1.5 text-left">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-1">
            <Link2 className="w-5 h-5" aria-hidden="true" />
          </div>
          <DialogTitle className="text-lg font-black font-display tracking-tight text-foreground">
            {t('groups.associateGuestTitle', 'Vincular Invitado a Cuenta')}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            {t(
              'groups.associateGuestDesc',
              'Elige a qué miembro del grupo corresponde el invitado habitual "{{guestName}}". Todas sus partidas jugadas y victorias históricas quedarán asociadas a su perfil.',
              { guestName: guest.name }
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <label className="text-xs font-bold text-muted-foreground block">
            {t('groups.selectMember', 'Miembros registrados del grupo')}
          </label>

          <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            {members.map((member) => {
              const isSelected = selectedUserId === member.user_id
              const isAlreadyLinked = guest.associated_user_id === member.user_id

              return (
                <div
                  key={member.user_id}
                  onClick={() => {
                    setSelectedUserId(member.user_id)
                    if (error) setError(null)
                  }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40'
                      : isAlreadyLinked
                      ? 'border-primary/40 bg-primary/5 opacity-80'
                      : 'border-border/30 bg-muted/20 hover:border-border/60 hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="w-8 h-8 shrink-0 border border-border/40">
                      <AvatarImage src={member.avatar_url || undefined} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary font-black">
                        {member.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-foreground truncate">
                        {member.username}
                      </p>
                      {isAlreadyLinked && (
                        <p className="text-xs text-primary font-bold">
                          {t('groups.currentlyLinked', 'Actualmente vinculado')}
                        </p>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" aria-hidden="true" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {error && (
            <p className="text-xs text-destructive font-semibold mt-1">
              {error}
            </p>
          )}

          <DialogFooter className="flex gap-2 sm:justify-end pt-3 border-t border-border/20">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              {t('common.cancel', 'Cancelar')}
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={loading || !selectedUserId}
              className="gap-1.5"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <>
                  <Link2 className="w-4 h-4" aria-hidden="true" />
                  <span>{t('groups.confirmAssociate', 'Confirmar Vinculación')}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
