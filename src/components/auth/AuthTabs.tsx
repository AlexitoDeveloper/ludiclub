import { createElement } from 'react'
import { motion } from 'framer-motion'
import { Button } from '../ui/button'
import { LogIn, UserPlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface AuthTabsProps {
  activeTab: 'login' | 'register'
  onTabChange: (tab: 'login' | 'register') => void
}

export function AuthTabs({ activeTab, onTabChange }: AuthTabsProps) {
  const { t } = useTranslation()

  const tabs = [
    { id: 'login' as const, label: t('auth.signInTab'), icon: LogIn },
    { id: 'register' as const, label: t('auth.signUpTab'), icon: UserPlus },
  ]

  return (
    <div className="flex border-b border-border">
      {tabs.map(({ id, label, icon }) => (
        <Button
          key={id}
          onClick={() => onTabChange(id)}
          variant="ghost"
          className={`flex-1 rounded-none h-auto hover:bg-transparent flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-colors duration-200 relative ${
            activeTab === id
              ? 'text-primary hover:text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {createElement(icon, { className: 'h-4 w-4' })}
          {label}
          {activeTab === id && (
            <motion.div
              layoutId="auth-tab-underline"
              className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-full"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
        </Button>
      ))}
    </div>
  )
}
