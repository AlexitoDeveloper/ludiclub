import { FC } from 'react'
import { Link } from 'react-router-dom'
import { Lock, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card'
import { Button } from '../ui/button'

export const MeetupDetailChatGuestPrompt: FC = () => {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 sm:p-6 text-center">
      <Card variant="glass" className="max-w-md w-full border-border/60 bg-card/75 backdrop-blur-xl shadow-xl p-6 sm:p-8 rounded-3xl space-y-5">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shadow-sm">
          <Lock className="w-7 h-7" aria-hidden="true" />
        </div>

        <CardHeader className="p-0 space-y-2">
          <CardTitle className="text-lg sm:text-xl font-black text-foreground">
            {t('meetup.chatGuestTitle', 'Chat exclusivo para miembros registrados')}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {t(
              'meetup.chatGuestDesc',
              'Crea tu cuenta gratis o inicia sesión en segundos para coordinarte por chat con los jugadores de la mesa y guardar tu historial de partidas.'
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0 pt-2 flex flex-col items-center gap-3">
          <Button
            variant="default"
            size="default"
            asChild
            className="w-full sm:w-auto px-6 rounded-xl font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
          >
            <Link to="/auth">
              <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />
              <span>{t('meetup.chatGuestCta', 'Iniciar sesión / Crear cuenta')}</span>
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
