import { ArrowLeft, ArrowRight, Loader2, CalendarCheck2 } from 'lucide-react'
import { Button } from '../ui/button'
import { useTranslation } from 'react-i18next'
import { WizardStep } from '../../hooks/useCreateMeetup'

interface WizardNavigationDockProps {
  currentStep: WizardStep
  goToStep: (step: WizardStep) => void
  nextStep: () => void
  prevStep: () => void
  onSubmit: (e?: React.FormEvent) => void
  isSubmitting: boolean
  isFormValid: boolean
  canProceedStep1: boolean
  canProceedStep2: boolean
  isEditMode: boolean
  onCancel: () => void
}

export function WizardNavigationDock({
  currentStep,
  goToStep,
  nextStep,
  prevStep,
  onSubmit,
  isSubmitting,
  isFormValid,
  canProceedStep1,
  canProceedStep2,
  isEditMode,
  onCancel
}: WizardNavigationDockProps) {
  const { t } = useTranslation()

  const handleBack = () => {
    if (currentStep === 1) {
      onCancel()
    } else {
      prevStep()
    }
  }

  const handleNextOrSubmit = () => {
    if (currentStep < 3) {
      nextStep()
    } else {
      onSubmit()
    }
  }

  const isNextDisabled =
    (currentStep === 1 && !canProceedStep1) ||
    (currentStep === 2 && !canProceedStep2) ||
    (currentStep === 3 && (!isFormValid || isSubmitting))

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/40 shadow-2xl px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
        {/* Back Button */}
        <Button
          type="button"
          variant="outline"
          size="default"
          onClick={handleBack}
          disabled={isSubmitting}
          className="h-11 px-3.5 rounded-xl border-border/60 hover:bg-muted/50 cursor-pointer flex items-center gap-1.5 shrink-0 text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{currentStep === 1 ? t('common.cancel') : t('create.prevStep')}</span>
        </Button>

        {/* Step dots / indicator */}
        <div className="flex items-center gap-1.5" role="tablist">
          {([1, 2, 3] as WizardStep[]).map((step) => {
            const isActive = currentStep === step
            const isCompleted = currentStep > step
            const isDisabled =
              (step === 2 && !canProceedStep1) ||
              (step === 3 && (!canProceedStep1 || !canProceedStep2))

            return (
              <div
                key={step}
                role="tab"
                tabIndex={isDisabled ? -1 : 0}
                aria-selected={isActive}
                onClick={() => {
                  if (!isDisabled) goToStep(step)
                }}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !isDisabled) {
                    goToStep(step)
                  }
                }}
                aria-label={t('create.stepIndicator', { current: step, total: 3 })}
                className={`h-2 rounded-full transition-all duration-300 ${
                  isActive
                    ? 'w-6 bg-primary'
                    : isCompleted
                    ? 'w-2 bg-primary/40 cursor-pointer hover:bg-primary/60'
                    : 'w-2 bg-muted-foreground/30 cursor-not-allowed'
                }`}
              />
            )
          })}
        </div>

        <Button
          type="button"
          variant="premium"
          size="default"
          onClick={handleNextOrSubmit}
          disabled={isNextDisabled}
          className="shrink-0 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t('create.saving')}</span>
            </>
          ) : currentStep === 3 ? (
            <>
              <CalendarCheck2 className="w-4 h-4" />
              <span>{isEditMode ? t('create.saveChanges') : t('create.createButtonFull')}</span>
            </>
          ) : (
            <>
              <span>{t('create.nextStep')}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
