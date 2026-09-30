import { ArrowLeft, Edit, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/button'
import { ProfileOverflowMenu } from './ProfileOverflowMenu'

interface ProfileHeaderProps {
  isOwnProfile: boolean
  isOwnProfileEditable: boolean
  onEditClick: () => void
  onSettingsClick: () => void
  targetUserId?: string
  currentUserId?: string
  username?: string
  isBlockedByViewer?: boolean
  onBlockStatusChange?: (blocked: boolean) => void
}

export function ProfileHeader({
  isOwnProfile,
  isOwnProfileEditable,
  onEditClick,
  onSettingsClick,
  targetUserId,
  currentUserId,
  username,
  isBlockedByViewer,
  onBlockStatusChange,
}: ProfileHeaderProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <header className="sticky top-[-2px] pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 z-40 flex items-center justify-between -mx-4 px-4 md:-mx-8 md:px-8 bg-background/85 backdrop-blur-md border-b border-border/20">
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate(-1)}
        icon={ArrowLeft}
        label={t('profile.back')}
        className="cursor-pointer"
      />
      <div className="flex items-center gap-2">
        {/* Other user's profile: overflow actions (share, report, block) */}
        {!isOwnProfile && targetUserId && currentUserId && (
          <ProfileOverflowMenu
            targetUserId={targetUserId}
            currentUserId={currentUserId}
            username={username || ''}
            initialBlocked={isBlockedByViewer}
            onBlockStatusChange={onBlockStatusChange}
          />
        )}

        {/* Own profile: edit and settings actions */}
        {isOwnProfileEditable && (
          <Button
            size="sm"
            variant="outline"
            onClick={onEditClick}
            icon={Edit}
            label={t('profile.editData')}
            className="cursor-pointer text-foreground"
          />
        )}
        {isOwnProfile && (
          <Button
            size="sm"
            variant="outline"
            onClick={onSettingsClick}
            icon={Settings}
            aria-label={t('profile.settings', 'Ajustes y preferencias')}
            className="cursor-pointer text-foreground"
          />
        )}
      </div>
    </header>
  )
}
