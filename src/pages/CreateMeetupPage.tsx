import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, AlertTriangle, Dices, Calendar, Users } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Stepper, StepItem } from '../components/ui/stepper'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { useCreateMeetup, WizardStep } from '../hooks/useCreateMeetup'
import { WizardStepGame } from '../components/meetup-form/WizardStepGame'
import { WizardStepLogistics } from '../components/meetup-form/WizardStepLogistics'
import { WizardStepDetails } from '../components/meetup-form/WizardStepDetails'
import { WizardNavigationDock } from '../components/meetup-form/WizardNavigationDock'

const MotionDiv = motion.div

const STEPS: { id: WizardStep; labelKey: string; shortLabelKey: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 1, labelKey: 'create.stepGame', shortLabelKey: 'create.stepGameShort', icon: Dices },
  { id: 2, labelKey: 'create.stepLogistics', shortLabelKey: 'create.stepLogisticsShort', icon: Calendar },
  { id: 3, labelKey: 'create.stepDetails', shortLabelKey: 'create.stepDetailsShort', icon: Users },
]

export function CreateMeetupPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const form = useCreateMeetup()

  const stepperSteps: StepItem[] = STEPS.map((s) => ({
    id: s.id,
    title: t(s.labelKey),
    shortTitle: t(s.shortLabelKey),
    icon: s.icon,
  }))

  return (
    <section className="space-y-4 max-w-xl mx-auto p-0 pb-32 sm:pb-36 md:p-4 md:pb-36 relative">
      <div className="sticky top-0 z-30 flex items-center justify-between py-2 -mx-4 px-4 md:-mx-8 md:px-8 bg-background/85 backdrop-blur-md border-b border-border/20">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={form.isEditMode ? () => navigate(`/mesa/${form.id}`) : () => navigate(-1)}
          className="flex-shrink-0 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> {t('common.back')}
        </Button>
        <Badge variant="primary-soft" className="text-xs font-bold select-none">
          {form.isEditMode ? t('create.editTitle') : t('create.hostTitle')}
        </Badge>
      </div>

      <MotionDiv initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="border-border/40 shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-2xl">
          <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-3 border-b border-border/30">
            <div className="min-w-0">
              <CardTitle className="text-xl sm:text-2xl font-extrabold tracking-tight text-primary truncate">
                {form.isEditMode ? t('create.editTitle') : t('create.hostTitle')}
              </CardTitle>
              <CardDescription className="font-medium text-foreground/80 truncate text-xs sm:text-sm">
                {form.isEditMode ? t('create.editDesc') : t('create.hostDesc')}
              </CardDescription>
            </div>

            <div className="pt-3">
              <Stepper
                steps={stepperSteps}
                activeStep={form.currentStep}
                onStepClick={(stepId) => form.goToStep(stepId as WizardStep)}
              />
            </div>
          </CardHeader>

          <CardContent className="p-4 pt-5 sm:p-6 sm:pt-6">
            <div className="space-y-5">
                <AnimatePresence mode="wait">
                  {form.errorMsg && (
                    <MotionDiv initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="text-destructive bg-destructive/10 px-3.5 py-2.5 rounded-xl font-medium text-xs border border-destructive/20 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{form.errorMsg}</span>
                      </div>
                    </MotionDiv>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {form.currentStep === 1 && (
                    <WizardStepGame
                      searchQuery={form.searchQuery}
                      setSearchQuery={form.setSearchQuery}
                      games={form.games}
                      setGames={form.setGames}
                      selectedGames={form.selectedGames}
                      isSearching={form.isSearching}
                      isShowingBggResults={form.isShowingBggResults}
                      isImporting={form.isImporting}
                      availableExpansions={form.availableExpansions}
                      showExpansions={form.showExpansions}
                      setShowExpansions={form.setShowExpansions}
                      hasOnlyExpansions={form.hasOnlyExpansions}
                      handleSearchBgg={form.handleSearchBgg}
                      handleSelectGame={form.handleSelectGame}
                      handleToggleExpansion={form.handleToggleExpansion}
                      handleRemoveGame={form.handleRemoveGame}
                      onClearGames={() => form.setSelectedGames([])}
                    />
                  )}

                  {form.currentStep === 2 && (
                    <WizardStepLogistics
                      isOnline={form.isOnline}
                      setIsOnline={form.setIsOnline}
                      city={form.city}
                      setCity={form.setCity}
                      location={form.location}
                      setLocation={form.setLocation}
                      platform={form.platform}
                      setPlatform={form.setPlatform}
                      voiceLink={form.voiceLink}
                      setVoiceLink={form.setVoiceLink}
                      date={form.date}
                      setDate={form.setDate}
                      allCities={form.allCities}
                    />
                  )}

                  {form.currentStep === 3 && (
                    <WizardStepDetails
                      title={form.title}
                      setTitle={form.setTitle}
                      description={form.description}
                      setDescription={form.setDescription}
                      maxPlayers={form.maxPlayers}
                      setMaxPlayers={form.setMaxPlayers}
                      incrementPlayers={form.incrementPlayers}
                      decrementPlayers={form.decrementPlayers}
                      selectedGames={form.selectedGames}
                      isOnline={form.isOnline}
                      city={form.city}
                      platform={form.platform}
                      date={form.date}
                    />
                  )}
                </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </MotionDiv>

      <WizardNavigationDock
        currentStep={form.currentStep}
        goToStep={form.goToStep}
        nextStep={form.nextStep}
        prevStep={form.prevStep}
        onSubmit={form.handleSubmit}
        isSubmitting={form.isSubmitting}
        isFormValid={form.isFormValid}
        canProceedStep1={form.canProceedStep1}
        canProceedStep2={form.canProceedStep2}
        isEditMode={form.isEditMode}
        onCancel={() => (form.isEditMode ? navigate(`/mesa/${form.id}`) : navigate(-1))}
      />
    </section>
  )
}

export default CreateMeetupPage
