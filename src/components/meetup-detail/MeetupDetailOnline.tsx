import { Laptop, PhoneCall, Lock, ExternalLink, HelpCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { useTranslation } from 'react-i18next'

interface MeetupDetailOnlineProps {
  platform: string;
  voiceLink: string | null | undefined;
  isAuthorized: boolean;
}

export function MeetupDetailOnline({ platform, voiceLink, isAuthorized }: MeetupDetailOnlineProps) {
  const { t } = useTranslation()
  // Check if voiceLink is valid/non-empty
  const hasVoiceLink = Boolean(voiceLink && voiceLink.trim())
  
  // Format link correctly (ensure it has protocol)
  const formattedVoiceLink = hasVoiceLink && voiceLink
    ? (voiceLink.startsWith('http://') || voiceLink.startsWith('https://') ? voiceLink : `https://${voiceLink}`)
    : '#'

  return (
    <Card className="border-border/30 bg-card/65 backdrop-blur-2xl shadow-lg overflow-hidden relative">
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      
      <CardHeader className="p-4 sm:p-6 pb-3 border-b border-border/20">
        <CardTitle className="text-md font-extrabold tracking-tight uppercase text-primary flex items-center gap-2">
          <Laptop className="w-4 h-4" /> {t('meetup.onlinePlatformTitle')}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 pt-4 sm:p-6 sm:pt-6 space-y-5">
        {/* Platform Info Row */}
        <div className="flex gap-4 items-center p-3.5 rounded-xl border border-border/30 bg-muted/20 backdrop-blur-sm">
          <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary shrink-0">
            <Laptop className="w-5 h-5 animate-pulse [animation-duration:4s]" />
          </div>
          <div className="space-y-0.5">
            <h3 className="font-extrabold text-xs text-primary uppercase tracking-wider">{t('meetup.gamePlatformLabel')}</h3>
            <p className="text-md font-black text-foreground">{platform || t('meetup.toBeDefinedPlatform')}</p>
          </div>
        </div>

        {/* Voice/Video Link Section */}
        <div className="relative rounded-2xl border border-border/40 bg-muted/40 p-4 min-h-[120px] flex flex-col justify-center shadow-inner overflow-hidden">
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.08] bg-[radial-gradient(#000_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          {isAuthorized ? (
            // User is authorized (creator, participant or guest shadow)
            <div className="relative z-10 space-y-3.5 text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1 text-left">
                <h4 className="font-extrabold text-sm text-foreground flex items-center gap-1.5 justify-center sm:justify-start">
                  <PhoneCall className="w-4 h-4 text-success animate-bounce" /> {t('meetup.voiceChannelTitle')}
                </h4>
                <p className="text-xs text-muted-foreground font-medium">
                  {hasVoiceLink 
                    ? t('meetup.voiceChannelSetDesc')
                    : t('meetup.voiceChannelUnsetDesc')
                  }
                </p>
              </div>

              {hasVoiceLink ? (
                <Button 
                  variant="emerald"
                  asChild
                  className="w-full sm:w-auto font-bold"
                >
                  <a 
                    href={formattedVoiceLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('meetup.enterChannel')} <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              ) : (
                <Button 
                  disabled
                  variant="outline"
                  className="w-full sm:w-auto rounded-xl font-bold h-11 border-border/60 text-muted-foreground cursor-not-allowed select-none bg-background/50 flex items-center gap-1.5 justify-center"
                >
                  <HelpCircle className="w-4 h-4" /> {t('meetup.noLink')}
                </Button>
              )}
            </div>
          ) : (
            // User is not authorized (visitor / logged out / not joined)
            <div className="relative z-10 flex flex-col items-center text-center p-2 space-y-3">
              <div className="p-2.5 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-500 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="font-extrabold text-sm text-foreground">
                  {t('meetup.voiceProtectedTitle')}
                </h4>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  {t('meetup.voiceProtectedDesc')}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
