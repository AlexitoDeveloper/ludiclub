import { useState } from 'react'
import { Crown, MapPin, Calendar, Camera } from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { PremiumUpgradeModal } from '../PremiumUpgradeModal'
import { PremiumDeactivateModal } from '../PremiumDeactivateModal'
import { UserProfile } from '../../types'
import { useTranslation } from 'react-i18next'
import { useGameLocale } from '../../hooks/useGameLocale'
import { formatDate } from '../../lib/dateLocale'
import { ProfileXpBar } from './ProfileXpBar'
import { GamerLevelData } from '../../hooks/useGamerLevel'

interface ProfileShowcaseCardProps extends GamerLevelData {
  profile: UserProfile;
  isOwnProfileEditable: boolean;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  onEditClick?: () => void;
}

export function ProfileShowcaseCard({
  profile,
  isOwnProfileEditable,
  playerLevel,
  playerTitle,
  totalXp,
  xpCurrent,
  xpRange,
  xpProgress,
  setProfile,
  onEditClick,
}: ProfileShowcaseCardProps) {
  const { t } = useTranslation()
  const { language } = useGameLocale()
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false)

  return (
    <Card className="glass-panel border-border/30 shadow-2xl overflow-hidden rounded-3xl relative">
      {/* Sleek retro-futuristic backdrop glow */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-br from-primary/15 to-violet-500/5 rounded-full blur-[80px] -z-10" />
      <div className="absolute top-10 left-10 w-28 h-28 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 rounded-full blur-[60px] -z-10" />

      {/* Banner backdrop */}
      <div className="h-32 bg-gradient-to-r from-primary/30 via-[#260f38]/20 to-[#0e271a]/30 border-b border-white/5 relative overflow-hidden" />

      <CardContent className="p-4 pb-6 sm:p-6 sm:pb-6 relative flex flex-col items-center sm:items-start sm:flex-row gap-5">
        {/* Avatar with static high-contrast gradient ring */}
        <div className="relative -mt-16 z-10 shrink-0">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-amber-400 via-primary to-emerald-400 opacity-90 shadow-sm" />
          {isOwnProfileEditable ? (
            <Button
              type="button"
              variant="ghost"
              onClick={onEditClick}
              className="relative z-10 p-0 h-auto w-auto rounded-full active:scale-95 hover:bg-transparent group cursor-pointer block border-0 shadow-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label={t('profile.editAvatarAria', 'Editar avatar y perfil')}
              title={t('profile.editAvatarTooltip', 'Toca para editar tu perfil')}
            >
              <div className="relative rounded-full overflow-hidden">
                <Avatar className="w-28 h-28 border-[6px] border-card shadow-xl group-hover:brightness-90 transition-all">
                  <AvatarImage src={profile.avatar_url || undefined} alt={profile.username} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-violet-500/10 text-primary text-3xl font-black">
                    {profile.username?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Camera className="w-7 h-7 text-white drop-shadow-md" />
                </div>
              </div>
            </Button>
          ) : (
            <Avatar className="w-28 h-28 border-[6px] border-card relative z-10 shadow-xl">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.username} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-violet-500/10 text-primary text-3xl font-black">
                {profile.username?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="absolute -bottom-1 -right-1 z-20 bg-primary border-4 border-card text-white text-xs font-black font-mono-tabular rounded-full h-8 w-8 flex items-center justify-center shadow-lg pointer-events-none">
            {playerLevel}
          </div>
        </div>

        <div className="pt-2 sm:pt-4 space-y-3 text-center sm:text-left flex-1 min-w-0 w-full">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-foreground truncate flex items-center justify-center sm:justify-start gap-2">
              <span>{profile.username}</span>
              {profile.is_premium ? (
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant="amber" size="sm" className="shrink-0 font-black">
                    <Crown className="w-3 h-3 shrink-0 mr-1" /> PRO
                  </Badge>
                  {isOwnProfileEditable && (
                    <>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => setIsDeactivateModalOpen(true)}
                        className="cursor-pointer text-muted-foreground hover:text-destructive h-7 px-2 font-bold text-xs"
                      >
                        {t('profile.deactivate')}
                      </Button>
                      <PremiumDeactivateModal
                        isOpen={isDeactivateModalOpen}
                        onClose={() => setIsDeactivateModalOpen(false)}
                        onSuccess={() => {
                          setProfile((prev) => (prev ? { ...prev, is_premium: false } : null))
                        }}
                      />
                    </>
                  )}
                </div>
              ) : (
                isOwnProfileEditable && (
                  <>
                    <Button
                      variant="premium"
                      size="sm"
                      onClick={() => setIsUpgradeModalOpen(true)}
                      className="shrink-0 cursor-pointer shadow-xs"
                      icon={Crown}
                      label={t('profile.upgradeProShort')}
                    />
                    <PremiumUpgradeModal
                      isOpen={isUpgradeModalOpen}
                      onClose={() => setIsUpgradeModalOpen(false)}
                      onSuccess={() => {
                        setProfile((prev) => (prev ? { ...prev, is_premium: true } : null))
                      }}
                    />
                  </>
                )
              )}
            </h2>
            <span className="text-xs font-bold text-primary block mt-0.5">
              {playerTitle}
            </span>
          </div>

          {/* Subcomponent handling XP progress bar and accessible rules dropdown */}
          <ProfileXpBar
            totalXp={totalXp}
            xpCurrent={xpCurrent}
            xpRange={xpRange}
            xpProgress={xpProgress}
          />

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1.5 text-xs font-bold pt-0.5">
            {profile.city && (
              <span className="flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-lg border border-border/40 text-foreground/80 shadow-sm">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" /> {profile.city}
              </span>
            )}
            <span className="flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-lg border border-border/40 text-foreground/80 shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />{' '}
              {(() => {
                const dStr = formatDate(profile.created_at || Date.now(), { month: 'long', year: 'numeric' }, language)
                return dStr.charAt(0).toUpperCase() + dStr.slice(1)
              })()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
