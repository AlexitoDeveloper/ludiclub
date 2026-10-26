import { FC, useState, useCallback, MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { Users, Eye, Copy, Check, ChevronRight, Shield, MessageCircle } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { toast } from '../ui/toast'
import { Group } from '../../hooks/useGroups'
import { getAppBaseUrl } from '../../lib/appUrl'

interface GroupInteractiveCardProps {
  group: Group
  isOwner?: boolean
  onQuickPeek: (group: Group) => void
}

export const GroupInteractiveCard: FC<GroupInteractiveCardProps> = ({
  group,
  isOwner = false,
  onQuickPeek,
}) => {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  const handleCopyCode = useCallback(
    (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const inviteUrl = `${getAppBaseUrl()}/grupos?join=${group.invite_code}`
      navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      toast.success(t('toast.inviteCopied', '¡Enlace de invitación copiado!'))
      setTimeout(() => setCopied(false), 2000)
    },
    [group.invite_code, t]
  )

  const handleShareWhatsApp = useCallback(
    (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const inviteUrl = `${getAppBaseUrl()}/grupos?join=${group.invite_code}`
      const text = t('groups.inviteWhatsAppText', {
        groupName: group.name,
        inviteUrl,
      })
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
    },
    [group.invite_code, group.name, t]
  )

  const handlePeekClick = useCallback(
    (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onQuickPeek(group)
    },
    [group, onQuickPeek]
  )

  const initials = group.name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase() || 'G'

  const memberText =
    group.member_count === 1 ? t('groups.memberCard') : t('groups.membersCard')

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 10 },
        show: {
          opacity: 1,
          y: 0,
          transition: { type: 'spring', stiffness: 420, damping: 28 },
        },
      }}
      className="h-full"
    >
      <Card
        variant="interactive"
        className="group relative flex flex-col justify-between h-full p-5 overflow-hidden text-left bg-card/80 hover:bg-card border-border/40 hover:border-primary/45 shadow-xs hover:shadow-lg hover:shadow-primary/5 transition-[border-color,background-color,box-shadow,transform] duration-200 active:scale-[0.99] rounded-2xl"
      >
        {/* Top Bar: Monogram, Badges & Quick Peek Action */}
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-3">
            <div
              aria-hidden="true"
              className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/25 text-primary font-black font-display text-base flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform duration-200"
            >
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge
                  variant="secondary"
                  className="font-mono-tabular text-xs font-semibold py-0.5 px-2 gap-1 border-border/40"
                >
                  <Users className="w-3 h-3 text-primary" aria-hidden="true" />
                  <span>
                    {group.member_count || 1} {memberText}
                  </span>
                </Badge>
                {isOwner && (
                  <Badge
                    variant="tag-amber"
                    className="text-xs font-bold py-0.5 px-1.5 gap-1"
                  >
                    <Shield className="w-2.5 h-2.5" />
                    <span>Admin</span>
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Quick Peek Trigger */}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handlePeekClick}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/70 cursor-pointer"
            title="Vista rápida"
            aria-label="Vista rápida del grupo"
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>

        {/* Middle Content: Title & Description */}
        <div className="space-y-1.5 flex-1 min-h-[4rem]">
          <h3 className="text-base sm:text-lg font-black tracking-tight text-foreground group-hover:text-primary transition-colors duration-150 line-clamp-1 font-display">
            <Link
              to={`/grupos/${group.id}`}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg after:absolute after:inset-0 after:z-0"
            >
              {group.name}
            </Link>
          </h3>

          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {group.description || t('groups.noDescription')}
          </p>
        </div>

        {/* Footer Row: Invite code & Quick Share triggers */}
        <div className="flex items-center justify-between pt-3.5 mt-3 border-t border-border/30 relative z-10">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={handleCopyCode}
            className="text-muted-foreground bg-muted/40 border border-border/40 hover:bg-muted/70 hover:text-foreground font-mono-tabular cursor-pointer"
            title={t('groups.copyInviteLink')}
            aria-label={copied ? t('groups.copied') : t('groups.copyInviteLink')}
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-primary" aria-hidden="true" />
                <span>{t('groups.copied')}</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 mr-1" aria-hidden="true" />
                <span>{group.invite_code}</span>
              </>
            )}
          </Button>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={handleShareWhatsApp}
              className="text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 cursor-pointer"
              title={t('groups.inviteWhatsApp')}
              aria-label={t('groups.inviteWhatsApp')}
            >
              <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
            </Button>

            <Link
              to={`/grupos/${group.id}`}
              className="text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-150 p-1 rounded-md"
              aria-hidden="true"
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
