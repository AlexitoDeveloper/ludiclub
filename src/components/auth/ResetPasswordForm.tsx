import { Form } from '../ui/form'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Loader2, KeyRound, CheckCircle2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useResetPassword } from '../../hooks/useResetPassword'

interface ResetPasswordFormProps {
  onSuccess: () => void
}

export function ResetPasswordForm({ onSuccess }: ResetPasswordFormProps) {
  const { t } = useTranslation()
  const {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    loading,
    errorMsg,
    isSuccess,
    handleUpdatePassword,
  } = useResetPassword(onSuccess)

  if (isSuccess) {
    return (
      <div className="space-y-4 py-4 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <p className="font-bold text-foreground text-sm">
            {t('auth.passwordResetSuccess')}
          </p>
        </div>
        <Button
          variant="premium"
          className="w-full mt-2 font-semibold"
          onClick={onSuccess}
        >
          {t('auth.signInButton')}
        </Button>
      </div>
    )
  }

  return (
    <Form onSubmit={handleUpdatePassword} className="space-y-4">
      <div className="text-center pb-1">
        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
          <KeyRound className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-bold text-foreground">
          {t('auth.resetPasswordTitle')}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          {t('auth.resetPasswordSubtitle')}
        </p>
      </div>

      {errorMsg && (
        <div className="text-destructive bg-destructive/10 px-3 py-2.5 rounded-lg text-xs font-medium border border-destructive/20">
          {errorMsg}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="reset-new-password" className="font-semibold text-xs">
          {t('auth.newPasswordLabel')}{' '}
          <span className="text-xs text-muted-foreground font-normal">
            {t('auth.passwordHelp')}
          </span>
        </Label>
        <Input
          id="reset-new-password"
          type="password"
          placeholder="••••••••"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-11 rounded-xl bg-background border-border"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reset-confirm-password" className="font-semibold text-xs">
          {t('auth.confirmPasswordLabel')}
        </Label>
        <Input
          id="reset-confirm-password"
          type="password"
          placeholder="••••••••"
          required
          minLength={6}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="h-11 rounded-xl bg-background border-border"
        />
      </div>

      <Button
        type="submit"
        variant="premium"
        className="w-full h-11 font-bold shadow-lg transition-all"
        disabled={loading}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('auth.saveNewPasswordLoader')}
          </span>
        ) : (
          t('auth.saveNewPasswordButton')
        )}
      </Button>
    </Form>
  )
}
