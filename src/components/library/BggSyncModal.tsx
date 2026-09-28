import { useState, useEffect, FC, FormEvent } from 'react'
import { Dices, Check, Sparkles, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Form } from '../ui/form'
import { useAuth } from '../../lib/authContext'
import { supabase } from '../../lib/supabaseClient'
import { USE_MOCKS } from '../../lib/config'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'

export interface BggSyncModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (count: number) => void
  variant?: 'sync' | 'onboarding'
  onImport?: (bggUsername: string) => Promise<void>
}

export const BggSyncModal: FC<BggSyncModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  variant = 'sync',
  onImport,
}) => {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [bggUsername, setBggUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [importedCount, setImportedCount] = useState<number | null>(null)

  const isOnboarding = variant === 'onboarding'

  useEffect(() => {
    if (isOpen) {
      setBggUsername('')
      setErrorMsg('')
      setImportedCount(null)
      setLoading(false)
    }
  }, [isOpen])

  const handleDismiss = () => {
    if (user?.id) {
      localStorage.setItem(`bgg_onboarded_${user.id}`, 'true')
    }
    onClose()
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = bggUsername.trim()
    if (!trimmed || !user) return

    setLoading(true)
    setErrorMsg('')

    try {
      if (onImport) {
        await onImport(trimmed)
        setImportedCount(1)
        onSuccess?.(1)
        return
      }

      if (USE_MOCKS) {
        await new Promise((resolve) => setTimeout(resolve, 1200))
        const mockKey = `ludiclub_mock_collection_${user.id}`
        const existing = JSON.parse(localStorage.getItem(mockKey) || localStorage.getItem(`boardgame_social_mock_collection_${user.id}`) || '[]')
        const dixitGame = {
          bgg_id: 37111,
          title: 'Dixit',
          year_published: 2008,
          image_url: 'https://cf.geekdo-images.com/39A865b4-B6BE-4b82-9022-7935E5B9FE6C.png',
        }
        const catanGame = {
          bgg_id: 13,
          title: 'Catan',
          year_published: 1995,
          image_url: 'https://cf.geekdo-images.com/40B7E05C-CC71-460B-A5DF-F2803CE10599.png',
        }
        const updated = [...existing]
        if (!updated.some((g: any) => g.bgg_id === dixitGame.bgg_id)) updated.push(dixitGame)
        if (!updated.some((g: any) => g.bgg_id === catanGame.bgg_id)) updated.push(catanGame)
        localStorage.setItem(mockKey, JSON.stringify(updated))
        localStorage.setItem(`bgg_onboarded_${user.id}`, 'true')

        setImportedCount(2)
        window.dispatchEvent(new Event('collection_update'))
        onSuccess?.(2)
        return
      }

      const { data, error } = await supabase.functions.invoke('bgg-ingest', {
        body: {
          action: 'import-collection',
          username: trimmed,
          userId: user.id,
        },
      })

      if (error) throw error

      if (data && data.success) {
        localStorage.setItem(`bgg_onboarded_${user.id}`, 'true')
        const count = data.imported || 0
        setImportedCount(count)
        window.dispatchEvent(new Event('collection_update'))
        onSuccess?.(count)
      } else {
        throw new Error(data?.error || t('profile.bggImport.error', 'Error al importar colección'))
      }
    } catch (err: any) {
      console.error('Error syncing BGG collection:', err)
      setErrorMsg(
        err.message ||
          t(
            'profile.bggImport.errorGeneral',
            'No se pudo conectar con BoardGameGeek. Revisa tu usuario e inténtalo de nuevo.'
          )
      )
    } finally {
      setLoading(false)
    }
  }

  const title = isOnboarding
    ? importedCount !== null
      ? t('onboarding.successTitle', '¡Ludoteca sincronizada!')
      : t('onboarding.title', 'Conecta tu ludoteca BGG')
    : importedCount !== null
    ? t('profile.bggImport.successTitle', '¡Colección importada con éxito!')
    : t('profile.bggImport.title', 'Sincronizar con BoardGameGeek')

  const description = isOnboarding
    ? importedCount !== null
      ? t('onboarding.successDesc', { count: importedCount, defaultValue: `Añadidos ${importedCount} juegos a tu cuenta.` })
      : t('onboarding.subtitle', 'Importa tus juegos directamente desde tu perfil de BoardGameGeek.')
    : importedCount !== null
    ? t('profile.bggImport.successDesc', { count: importedCount, defaultValue: `Se han añadido ${importedCount} juegos a tu colección.` })
    : t('profile.bggImport.desc', 'Introduce tu nombre de usuario de BGG para importar tus juegos en propiedad.')

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !loading && (open ? null : handleDismiss())}>
      <DialogContent className="max-w-md bg-card border-border/50 rounded-3xl p-6 shadow-2xl text-left gap-4 overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/15 to-transparent rounded-full blur-3xl pointer-events-none" />

        <DialogHeader className="border-b border-border/20 pb-3 flex flex-col space-y-1.5 text-left sm:text-left">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
              {isOnboarding ? (
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              ) : (
                <RefreshCw className="w-4 h-4 text-primary" />
              )}
            </div>
            <DialogTitle className="text-lg font-black tracking-tight text-foreground">
              {title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground font-semibold">
            {description}
          </DialogDescription>
        </DialogHeader>

        {importedCount !== null ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6 space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <div>
              <h4 className="font-extrabold text-base text-foreground">
                {t('common.ready', '¡Todo listo!')}
              </h4>
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                {t('profile.bggImport.readyNotice', { count: importedCount, defaultValue: `Tu colección cuenta ahora con ${importedCount} títulos nuevos.` })}
              </p>
            </div>
            <div className="pt-2">
              <Button
                onClick={handleDismiss}
                size="lg"
                className="w-full"
              >
                <span>{isOnboarding ? t('onboarding.startPlaying', 'Comenzar a jugar') : t('common.close', 'Cerrar')}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        ) : (
          <Form onSubmit={handleSubmit} className="space-y-4">
            {isOnboarding && (
              <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-wider">
                  <Dices className="w-4 h-4" />
                  <span>{t('onboarding.bggStepTitle', 'Importación rápida')}</span>
                </div>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  {t('onboarding.bggStepDesc', 'Si ya tienes cuenta en BoardGameGeek, introduce tu usuario y cargaremos tus juegos automáticamente.')}
                </p>
              </div>
            )}

            {errorMsg && (
              <div className="text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1.5 text-left">
              <Label
                htmlFor="bgg-sync-username"
                className="font-extrabold text-xs text-muted-foreground uppercase tracking-wider"
              >
                {t('onboarding.bggUsernameLabel', 'Usuario de BoardGameGeek')}
              </Label>
              <Input
                id="bgg-sync-username"
                type="text"
                required
                value={bggUsername}
                onChange={(e) => setBggUsername(e.target.value)}
                placeholder={t('onboarding.bggPlaceholder', 'Ej. RodneySmith')}
                disabled={loading}
                className="h-11 rounded-xl text-sm"
              />
              <p className="text-xs text-muted-foreground font-medium">
                {t('profile.bggImport.infoOwned', 'Solo se importarán los juegos marcados como "Owned" en tu perfil público.')}
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-3">
              <Button
                type="button"
                variant="ghost"
                size="default"
                onClick={handleDismiss}
                disabled={loading}
              >
                {isOnboarding ? t('onboarding.skip', 'Omitir por ahora') : t('common.cancel', 'Cancelar')}
              </Button>
              <Button
                type="submit"
                variant="default"
                size="default"
                disabled={!bggUsername.trim()}
                loading={loading}
                className="sm:w-auto w-full"
              >
                {t('profile.bggImport.start', 'Sincronizar')}
              </Button>
            </div>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
