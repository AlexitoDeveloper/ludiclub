import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
} from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import { Form } from '../ui/form'
import { Loader2, Mail, CheckCircle2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useForgotPassword } from '../../hooks/useForgotPassword'

interface ForgotPasswordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ForgotPasswordModal({
  open,
  onOpenChange,
}: ForgotPasswordModalProps) {
  const { t } = useTranslation()
  const {
    email,
    setEmail,
    loading,
    isSent,
    errorMsg,
    cooldown,
    handleSendResetEmail,
    resetState,
  } = useForgotPassword()

  const handleClose = () => {
    resetState()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            {t('auth.forgotPasswordTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('auth.forgotPasswordSubtitle')}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          {isSent ? (
            <div className="space-y-4 py-3 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground text-sm">
                  {t('auth.resetLinkSentTitle')}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('auth.resetLinkSentDesc')}
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={handleClose}
              >
                {t('auth.backToSignIn')}
              </Button>
            </div>
          ) : (
            <Form onSubmit={handleSendResetEmail} className="space-y-4 py-2">
              {errorMsg && (
                <div className="text-destructive bg-destructive/10 px-3 py-2 rounded-lg text-xs font-medium border border-destructive/20">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="forgot-email" className="font-semibold text-xs">
                  {t('auth.emailLabel')}
                </Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="tu@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 rounded-xl bg-background border-border"
                  autoFocus
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  onClick={handleClose}
                  disabled={loading}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="premium"
                  className="flex-1 font-semibold"
                  disabled={loading || cooldown > 0}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('auth.sendResetLinkLoader')}
                    </span>
                  ) : cooldown > 0 ? (
                    `${t('auth.sendResetLinkButton')} (${cooldown}s)`
                  ) : (
                    t('auth.sendResetLinkButton')
                  )}
                </Button>
              </div>
            </Form>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
