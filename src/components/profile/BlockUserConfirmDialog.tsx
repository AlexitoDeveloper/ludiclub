import { ShieldAlert, UserX, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '../ui/dialog'
import { Button } from '../ui/button'

interface BlockUserConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
  username: string
  loading?: boolean
}

export function BlockUserConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  username,
  loading = false,
}: BlockUserConfirmDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !loading && onClose()}>
      <DialogContent className="max-w-sm sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <DialogTitle>
              {t('reports.blockUserTitle', '¿Bloquear a @{{username}}?', { username })}
            </DialogTitle>
          </div>
          <DialogDescription>
            {t(
              'reports.blockUserDesc',
              'Al bloquear a este usuario, restringes de inmediato su interacción contigo:'
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="py-2 text-xs text-muted-foreground space-y-2">
          <ul className="list-disc pl-4 space-y-1.5 marker:text-destructive">
            <li>{t('reports.blockConsequence1', 'No podrá ver tu perfil ni tus colecciones.')}</li>
            <li>{t('reports.blockConsequence2', 'No podrá enviarte mensajes ni unirse a tus partidas.')}</li>
            <li>{t('reports.blockConsequence3', 'Sus mensajes quedarán ocultos en chats grupales.')}</li>
            <li>{t('reports.blockConsequence4', 'Puedes revertir el bloqueo en cualquier momento desde Ajustes.')}</li>
          </ul>
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            {t('common.cancel', 'Cancelar')}
          </Button>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            disabled={loading}
            className="gap-1.5"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserX className="w-4 h-4" />
            )}
            <span>{t('reports.confirmBlockAction', 'Bloquear usuario')}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
