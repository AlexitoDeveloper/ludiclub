import { FC, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Users, MessageCircle, Copy, Check, ArrowRight, Shield, Calendar, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../ui/sheet'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { toast } from '../ui/toast'
import { Group } from '../../hooks/useGroups'
import { getAppBaseUrl } from '../../lib/appUrl'

interface GroupQuickPeekSheetProps {
  group: Group | null
  isOpen: boolean
  onClose: () => void
  isOwner?: boolean
}

export const GroupQuickPeekSheet: FC<GroupQuickPeekSheetProps> = ({
  group,
  isOpen,
  onClose,
  isOwner = false,
}) => {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const handleCopyCode = useCallback(() => {
    if (!group) return
    const inviteUrl = `${getAppBaseUrl()}/grupos?join=${group.invite_code}`
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    toast.success(t('toast.inviteCopied', '¡Enlace de invitación copiado al portapapeles!'))
    setTimeout(() => setCopied(false), 2000)
  }, [group, t])

  const handleShareWhatsApp = useCallback(() => {
    if (!group) return
    const inviteUrl = `${getAppBaseUrl()}/grupos?join=${group.invite_code}`
    const text = t('groups.inviteWhatsAppText', {
      groupName: group.name,
      inviteUrl,
    })
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
  }, [group, t])

  if (!group) return null

  const initials = group.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || 'G'

  const formattedDate = new Date(group.created_at).toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  })

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-6 flex flex-col justify-between overflow-y-auto"
      >
        <div className="space-y-6">
          <SheetHeader className="text-left space-y-3">
            <div className="flex items-center gap-3">
              <div
                aria-hidden="true"
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/25 via-primary/10 to-transparent border border-primary/30 text-primary font-black font-display text-xl flex items-center justify-center shrink-0 shadow-sm"
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs font-mono-tabular py-0.5">
                    {group.member_count || 1} {group.member_count === 1 ? t('groups.memberCard') : t('groups.membersCard')}
                  </Badge>
                  {isOwner && (
                    <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/30 gap-1">
                      <Shield className="w-2.5 h-2.5" />
                      Admin
                    </Badge>
                  )}
                </div>
                <SheetTitle className="text-xl font-black font-display tracking-tight text-foreground truncate mt-1">
                  {group.name}
                </SheetTitle>
              </div>
            </div>
            <SheetDescription className="text-sm text-muted-foreground leading-relaxed">
              {group.description || t('groups.noDescription', 'Sin descripción')}
            </SheetDescription>
          </SheetHeader>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3 py-1">
            <div className="p-3 rounded-2xl bg-muted/30 border border-border/40 space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Comunidad
              </span>
              <div className="flex items-center gap-1.5 text-foreground font-black font-mono-tabular text-lg">
                <Users className="w-4 h-4 text-primary" />
                <span>{group.member_count || 1}</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-muted/30 border border-border/40 space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Fundado
              </span>
              <div className="flex items-center gap-1.5 text-foreground font-black font-mono-tabular text-sm py-0.5">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Invite Code & Share section */}
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>Código de Invitación</span>
              </div>
              <span className="font-mono-tabular text-xs font-bold text-primary tracking-widest bg-primary/10 px-2 py-0.5 rounded-md">
                {group.invite_code}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
                className="w-full"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-primary" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Enlace</span>
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleShareWhatsApp}
                className="w-full"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span>WhatsApp</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Footer Action: Full View Jump */}
        <div className="pt-6 border-t border-border/40 mt-6">
          <Button
            asChild
            className="w-full"
          >
            <Link to={`/grupos/${group.id}`} onClick={onClose}>
              <span>Ir al Hub del Grupo</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
