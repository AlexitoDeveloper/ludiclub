import { FormEvent } from 'react'
import { Form } from '../ui/form'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LegalConsentCheckbox } from './LegalConsentCheckbox'

export interface RegisterFormProps {
  username: string
  setUsername: (val: string) => void
  email: string
  setEmail: (val: string) => void
  password: string
  setPassword: (val: string) => void
  acceptedTerms: boolean
  setAcceptedTerms: (val: boolean) => void
  loading: boolean
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
}

export function RegisterForm({
  username,
  setUsername,
  email,
  setEmail,
  password,
  setPassword,
  acceptedTerms,
  setAcceptedTerms,
  loading,
  onSubmit,
}: RegisterFormProps) {
  const { t } = useTranslation()

  return (
    <Form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reg-username" className="font-semibold">
          {t('auth.usernameLabel')}
        </Label>
        <Input
          id="reg-username"
          type="text"
          placeholder={t('auth.usernamePlaceholder')}
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="h-11 rounded-xl bg-background border-border focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:border-primary transition-all duration-200"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reg-email" className="font-semibold">
          {t('auth.emailLabel')}
        </Label>
        <Input
          id="reg-email"
          type="email"
          placeholder="tu@email.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 rounded-xl bg-background border-border focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:border-primary transition-all duration-200"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reg-password" className="font-semibold">
          {t('auth.passwordLabel')}{' '}
          <span className="text-xs text-muted-foreground font-normal">
            {t('auth.passwordHelp')}
          </span>
        </Label>
        <Input
          id="reg-password"
          type="password"
          placeholder="••••••••"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-11 rounded-xl bg-background border-border focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:border-primary transition-all duration-200"
        />
      </div>

      <LegalConsentCheckbox
        checked={acceptedTerms}
        onCheckedChange={setAcceptedTerms}
        disabled={loading}
      />

      <Button
        type="submit"
        variant="premium"
        className="w-full h-11 font-bold shadow-lg transition-all"
        disabled={loading || !acceptedTerms}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> {t('auth.signUpLoader')}
          </span>
        ) : (
          t('auth.signUpButton')
        )}
      </Button>
    </Form>
  )
}
