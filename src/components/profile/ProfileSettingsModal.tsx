import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sun, Moon, Languages, LogOut, Check, ListOrdered, ChevronRight, FileText, Shield, Trash2, Settings, UserX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../lib/authContext'
import { useTheme } from '../../lib/useTheme'
import { useBlockedUsers } from '../../hooks/useBlockedUsers'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody } from '../ui/sheet'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { DeleteAccountDialog } from './DeleteAccountDialog'
import { BlockedUsersSheet } from './BlockedUsersSheet'

interface ProfileSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ProfileSettingsModal({ isOpen, onClose }: ProfileSettingsModalProps) {
  const { t } = useTranslation()
  const { language, setLanguage, signOut } = useAuth()
  const { isDark, toggle: toggleTheme } = useTheme()
  const { blockedUsers, loading: loadingBlocks, unblockUser } = useBlockedUsers()
  const navigate = useNavigate()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isBlockedUsersOpen, setIsBlockedUsersOpen] = useState(false)

  const handleSignOut = async () => {
    onClose()
    await signOut()
    navigate('/auth')
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="bottom" className="max-w-md max-h-[92vh] flex flex-col p-0">
          <SheetHeader>
            <SheetTitle>
              <Settings className="w-5 h-5 text-primary" />
              {t('nav.theme')} & {t('nav.changeLang')}
            </SheetTitle>
            <SheetDescription>
              Personaliza la apariencia y el idioma de tu experiencia
            </SheetDescription>
          </SheetHeader>

          <SheetBody className="pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {/* Theme Selector */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-muted-foreground">
              {t('nav.theme')}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={!isDark ? 'default' : 'outline'}
                size="default"
                onClick={() => isDark && toggleTheme()}
                className="w-full justify-between"
              >
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-amber dark:text-amber-hover" />
                  <span>{t('nav.light')}</span>
                </div>
                {!isDark && <Check className="h-3.5 w-3.5 ml-auto" />}
              </Button>

              <Button
                type="button"
                variant={isDark ? 'default' : 'outline'}
                size="default"
                onClick={() => !isDark && toggleTheme()}
                className="w-full justify-between"
              >
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4 text-indigo-400" />
                  <span>{t('nav.dark')}</span>
                </div>
                {isDark && <Check className="h-3.5 w-3.5 ml-auto" />}
              </Button>
            </div>
          </div>

          {/* Language Selector */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-muted-foreground">
              {t('nav.changeLang')}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={language === 'es' ? 'default' : 'outline'}
                size="default"
                onClick={() => setLanguage('es')}
                className="w-full justify-between"
              >
                <div className="flex items-center gap-2">
                  <Languages className="h-4 w-4" />
                  <span>Español</span>
                </div>
                {language === 'es' && <Check className="h-3.5 w-3.5 ml-auto" />}
              </Button>

              <Button
                type="button"
                variant={language === 'en' ? 'default' : 'outline'}
                size="default"
                onClick={() => setLanguage('en')}
                className="w-full justify-between"
              >
                <div className="flex items-center gap-2">
                  <Languages className="h-4 w-4" />
                  <span>English</span>
                </div>
                {language === 'en' && <Check className="h-3.5 w-3.5 ml-auto" />}
              </Button>
            </div>
          </div>

          {/* Creator Tools Quick Access */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-muted-foreground">
              {t('nav.tools', 'Herramientas')}
            </span>
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => {
                onClose()
                navigate('/tops')
              }}
              className="w-full justify-between"
            >
              <div className="flex items-center gap-2.5">
                <ListOrdered className="h-4 w-4 text-primary" />
                <span>{t('tops.topsTitle', 'Generador de Tops & Tier Lists')}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>

          {/* Privacy & Safety */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-muted-foreground">
              {t('settings.safetySection', 'Seguridad y Privacidad')}
            </span>
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => setIsBlockedUsersOpen(true)}
              className="w-full justify-between"
            >
              <div className="flex items-center gap-2.5">
                <UserX className="h-4 w-4 text-muted-foreground" />
                <span>{t('settings.blockedUsers', 'Usuarios bloqueados')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {blockedUsers.length > 0 && (
                  <Badge variant="secondary" size="sm">
                    {blockedUsers.length}
                  </Badge>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Button>
          </div>

          {/* Legal & Policies */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-muted-foreground">
              {t('settings.legalSection', 'Información Legal')}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose()
                  navigate('/privacy')
                }}
                className="w-full justify-start gap-2 text-xs"
              >
                <Shield className="h-3.5 w-3.5 text-primary" />
                <span className="truncate">{t('legal.privacy', 'Privacidad')}</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose()
                  navigate('/terms')
                }}
                className="w-full justify-start gap-2 text-xs"
              >
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span className="truncate">{t('legal.terms', 'Términos')}</span>
              </Button>
            </div>
          </div>

          {/* Account Actions & Danger Zone */}
          <div className="pt-3 border-t border-border/20 space-y-2">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={handleSignOut}
              className="w-full justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span>{t('nav.signOut')}</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="w-full justify-center text-xs text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{t('settings.deleteAccount', 'Eliminar mi cuenta')}</span>
            </Button>
          </div>
        </SheetBody>
      </SheetContent>
    </Sheet>

    <BlockedUsersSheet
      isOpen={isBlockedUsersOpen}
      onClose={() => setIsBlockedUsersOpen(false)}
      blockedUsers={blockedUsers}
      loading={loadingBlocks}
      onUnblock={unblockUser}
    />

    <DeleteAccountDialog
      isOpen={isDeleteDialogOpen}
      onClose={() => setIsDeleteDialogOpen(false)}
    />
  </>
)
}

