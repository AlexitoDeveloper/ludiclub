import { FC, useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { QrCode, Copy, Check, Users } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { useTranslation } from 'react-i18next'
import { toast } from '../ui/toast'
import { getAppBaseUrl } from '../../lib/appUrl'

interface GroupInviteQrModalProps {
  isOpen: boolean
  onClose: () => void
  groupName: string
  inviteCode: string
}

export const GroupInviteQrModal: FC<GroupInviteQrModalProps> = ({
  isOpen,
  onClose,
  groupName,
  inviteCode,
}) => {
  const { t } = useTranslation()
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [copied, setCopied] = useState(false)

  const inviteUrl = `${getAppBaseUrl()}/grupos?join=${inviteCode}`

  useEffect(() => {
    if (!isOpen || !inviteUrl) return
    let isMounted = true

    QRCode.toDataURL(inviteUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url)
      })
      .catch((err) => {
        console.error('Error generating QR code:', err)
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, inviteUrl])

  const handleCopy = () => {
    if (!inviteUrl) return
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    toast.success(t('toast.inviteCopied', '¡Enlace de invitación copiado al portapapeles!'))
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="text-center sm:text-center items-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-1">
            <QrCode className="w-6 h-6" />
          </div>
          <DialogTitle className="justify-center">
            {t('groups.qrModalTitle', 'Unirse al Grupo')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'groups.qrModalDesc',
              'Escanea este código QR con la cámara de tu móvil para unirte al grupo al instante.'
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4 flex flex-col items-center">
          {/* Group Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 border border-border/30 text-xs font-bold text-foreground mx-auto">
            <Users className="w-3.5 h-3.5 text-primary" />
            <span className="truncate max-w-[200px]">{groupName}</span>
          </div>

          {/* QR Code Canvas Frame */}
          <div className="p-4 bg-white rounded-2xl border border-border/30 shadow-inner w-fit mx-auto">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR para unirse al grupo ${groupName}`}
                className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
              />
            ) : (
              <div className="w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center text-xs text-slate-500 font-semibold animate-pulse">
                {t('common.loading', 'Cargando...')}
              </div>
            )}
          </div>

          {/* Code Box */}
          <div className="w-full font-mono text-center text-sm font-black tracking-widest text-primary bg-primary/10 border border-primary/20 rounded-xl py-1.5 px-3">
            {inviteCode}
          </div>
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            {t('common.close', 'Cerrar')}
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={handleCopy}
            className="flex-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-300" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
            <span>{copied ? t('common.copied', '¡Copiado!') : t('groups.copyInviteLink', 'Copiar enlace')}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
