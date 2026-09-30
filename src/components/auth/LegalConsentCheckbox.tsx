import { Checkbox } from '../ui/checkbox'
import { Label } from '../ui/label'
import { useTranslation } from 'react-i18next'

interface LegalConsentCheckboxProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}

export function LegalConsentCheckbox({
  checked,
  onCheckedChange,
  disabled,
}: LegalConsentCheckboxProps) {
  const { t } = useTranslation()

  return (
    <div className="flex items-start space-x-3 pt-1 pb-1">
      <div className="flex items-center h-5 mt-0.5">
        <Checkbox
          id="terms-consent"
          checked={checked}
          onCheckedChange={(val) => onCheckedChange(val === true)}
          disabled={disabled}
          className="border-muted-foreground/40 data-[state=checked]:border-primary"
        />
      </div>
      <div className="text-xs text-muted-foreground leading-relaxed select-none">
        <Label
          htmlFor="terms-consent"
          className="text-xs text-muted-foreground font-normal leading-relaxed cursor-pointer"
        >
          {t('auth.termsConsentLabel', 'Acepto los')}{' '}
          <a
            href="/terms"
            target="_blank"
            rel="noreferrer"
            className="text-primary font-medium underline underline-offset-2 hover:text-primary/80 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {t('auth.termsLink', 'Términos de Servicio')}
          </a>{' '}
          {t('auth.andWord', 'y la')}{' '}
          <a
            href="/privacy"
            target="_blank"
            rel="noreferrer"
            className="text-primary font-medium underline underline-offset-2 hover:text-primary/80 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {t('auth.privacyLink', 'Política de Privacidad')}
          </a>
          .
        </Label>
      </div>
    </div>
  )
}
