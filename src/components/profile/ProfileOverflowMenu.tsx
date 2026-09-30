import { useState, useEffect } from 'react'
import { Flag, UserX, UserCheck, Share2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DropdownIconButton, DropdownItem } from '../ui/dropdown-icon-button'
import { toast } from '../ui/toast'
import { useUgcSafety } from '../../hooks/useUgcSafety'
import { ReportContentDialog } from '../common/ReportContentDialog'
import { BlockUserConfirmDialog } from './BlockUserConfirmDialog'

interface ProfileOverflowMenuProps {
  targetUserId: string
  currentUserId: string
  username: string
  initialBlocked?: boolean
  onBlockStatusChange?: (blocked: boolean) => void
}

export function ProfileOverflowMenu({
  targetUserId,
  currentUserId,
  username,
  initialBlocked,
  onBlockStatusChange,
}: ProfileOverflowMenuProps) {
  const { t } = useTranslation()
  const { blockUser, unblockUser, isUserBlocked } = useUgcSafety()
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [isConfirmBlockOpen, setIsConfirmBlockOpen] = useState(false)
  const [blocked, setBlocked] = useState(initialBlocked ?? false)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (initialBlocked !== undefined) {
      setBlocked(initialBlocked)
      return
    }
    isUserBlocked(targetUserId).then((res) => {
      setBlocked(res)
    })
  }, [targetUserId, initialBlocked])

  if (targetUserId === currentUserId) return null

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `@${username} | Ludiclub`,
          url: window.location.href,
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        toast.success(t('profile.linkCopied', 'Enlace copiado al portapapeles.'))
      }
    } catch {
      // Ignored if cancelled
    }
  }

  const handleConfirmBlock = async () => {
    setIsProcessing(true)
    const success = await blockUser(targetUserId)
    setIsProcessing(false)
    if (success) {
      setBlocked(true)
      setIsConfirmBlockOpen(false)
      onBlockStatusChange?.(true)
      toast.info(t('reports.blockSuccess', 'Has bloqueado a este usuario.'))
    }
  }

  const handleUnblock = async () => {
    setIsProcessing(true)
    const success = await unblockUser(targetUserId)
    setIsProcessing(false)
    if (success) {
      setBlocked(false)
      onBlockStatusChange?.(false)
      toast.success(t('reports.unblockSuccess', 'Usuario desbloqueado.'))
    }
  }

  const menuItems: DropdownItem[] = [
    {
      label: t('profile.shareProfile', 'Compartir perfil'),
      icon: <Share2 className="w-4 h-4 text-muted-foreground" />,
      onClick: handleShare,
    },
    {
      label: t('reports.reportProfile', 'Reportar perfil'),
      icon: <Flag className="w-4 h-4 text-amber-500" />,
      onClick: () => setIsReportOpen(true),
    },
    blocked
      ? {
          label: t('reports.unblockUser', 'Desbloquear a @{{username}}', { username }),
          icon: <UserCheck className="w-4 h-4 text-primary" />,
          onClick: handleUnblock,
          disabled: isProcessing,
        }
      : {
          label: t('reports.blockUser', 'Bloquear a @{{username}}', { username }),
          icon: <UserX className="w-4 h-4 text-destructive" />,
          className: 'text-destructive hover:bg-destructive/10 hover:text-destructive',
          onClick: () => setIsConfirmBlockOpen(true),
          disabled: isProcessing,
        },
  ]

  return (
    <>
      <DropdownIconButton
        items={menuItems}
        variant="ghost"
        size="sm"
        aria-label={t('common.moreOptions', 'Más opciones')}
        className="min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground"
      />

      <ReportContentDialog
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        contentType="profile"
        reportedUserId={targetUserId}
        title={t('reports.reportProfile', 'Reportar perfil')}
      />

      <BlockUserConfirmDialog
        isOpen={isConfirmBlockOpen}
        onClose={() => setIsConfirmBlockOpen(false)}
        onConfirm={handleConfirmBlock}
        username={username}
        loading={isProcessing}
      />
    </>
  )
}
