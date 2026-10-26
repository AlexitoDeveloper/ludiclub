import { FC, useState, useCallback } from 'react'
import { Copy, Check, MessageCircle, QrCode, Sparkles, ShieldCheck } from 'lucide-react'
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
import { getAppBaseUrl } from '../../lib/appUrl'

interface GroupDetailInviteDrawerProps {
  isOpen: boolean
  onClose: () => void
  groupName: string
  inviteCode: string
  onOpenQrModal: () => void
  onShareWhatsApp: () => void
}

export const GroupDetailInviteDrawer: FC<GroupDetailInviteDrawerProps> = ({
  isOpen,
  onClose,
  groupName,
  inviteCode,
  onOpenQrModal,
  onShareWhatsApp,
}) => {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const handleCopyLink = useCallback(() => {
    const inviteUrl = `${getAppBaseUrl()}/grupos?join=${inviteCode}`
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    toast.success(t('toast.inviteCopied', '¡Enlace de invitación copiado al portapapeles!'))
    setTimeout(() => setCopied(false), 2000)
  }, [inviteCode, t])

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="w-full sm:max-w-lg p-6 rounded-t-3xl border-border/40 space-y-5"
      >
        <SheetHeader className="text-left space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1 text-xs font-bold py-0.5">
              <Sparkles className="w-3 h-3 text-primary" />
              <span>Invitaciones</span>
            </Badge>
          </div>
          <SheetTitle className="text-xl font-black font-display tracking-tight text-foreground">
            Invitar jugadores a {groupName}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground leading-relaxed">
            Comparte el enlace o código para que tus amigos se unan a la ludoteca y quedadas del grupo.
          </SheetDescription>
        </SheetHeader>

        {/* Invite Code Showcase */}
        <div className="p-4 rounded-2xl bg-card border border-border/50 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Código de Acceso
            </span>
            <span className="font-mono-tabular text-base font-black text-foreground tracking-widest">
              {inviteCode}
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="gap-1.5 border-border/60 hover:bg-muted cursor-pointer"
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
        </div>

        {/* Share Action Grid */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button
            type="button"
            variant="default"
            onClick={onShareWhatsApp}
            icon={MessageCircle}
            label="Enviar por WhatsApp"
          />

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onClose()
              onOpenQrModal()
            }}
            icon={QrCode}
            label="Mostrar Código QR"
          />
        </div>

        <div className="pt-2 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-primary/70" />
          <span>Solo los miembros con el enlace pueden acceder a este grupo privado.</span>
        </div>
      </SheetContent>
    </Sheet>
  )
}
