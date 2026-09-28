import { FC } from 'react'
import { Code, Loader2 } from 'lucide-react'
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
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Form } from '../ui/form'

interface JoinGroupModalProps {
  isOpen: boolean
  onClose: () => void
  inviteCode: string
  onInviteCodeChange: (value: string) => void
  loading: boolean
  error: string | null
  onSubmit: (e: React.FormEvent) => void
}

export const JoinGroupModal: FC<JoinGroupModalProps> = ({
  isOpen,
  onClose,
  inviteCode,
  onInviteCodeChange,
  loading,
  error,
  onSubmit,
}) => {
  const { t } = useTranslation()

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            <Code className="w-5 h-5 text-primary" aria-hidden="true" />
            <span>{t('groups.joinModalTitle')}</span>
          </DialogTitle>
          <DialogDescription>
            {t('groups.joinModalDesc')}
          </DialogDescription>
        </DialogHeader>

        <Form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
          <DialogBody className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="join-invite-code"
                className="text-xs font-bold text-muted-foreground px-1 block"
              >
                {t('groups.joinModalTitle')}
              </Label>
              <Input
                id="join-invite-code"
                type="text"
                placeholder="Ej. GP-XXXXXX"
                value={inviteCode}
                onChange={(e) => onInviteCodeChange(e.target.value)}
                className="font-mono text-center uppercase tracking-wider text-sm font-bold"
                required
                disabled={loading}
                aria-invalid={!!error}
                aria-describedby={error ? 'join-error-message' : undefined}
              />
              {error && (
                <p
                  id="join-error-message"
                  role="alert"
                  className="text-xs font-semibold text-destructive px-1"
                >
                  {error}
                </p>
              )}
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={loading || !inviteCode.trim()}
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" aria-hidden="true" />
              ) : null}
              <span>{t('groups.joinButton')}</span>
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
