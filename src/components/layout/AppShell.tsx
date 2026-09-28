import { Outlet } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { useShellNavigation } from '../../hooks/useShellNavigation'
import { DesktopNavbar } from './DesktopNavbar'
import { MobileBottomBar } from './MobileBottomBar'
import { MobileQuickActions } from './MobileQuickActions'
import { BggSyncModal } from '../library/BggSyncModal'

export function AppShell() {
  const {
    user,
    language,
    setLanguage,
    isDark,
    toggleTheme,
    unreadChats,
    showQuickActions,
    setShowQuickActions,
    showBggOnboarding,
    setShowBggOnboarding,
    isChatPage,
    hasActiveChat,
    isGameDetailPage,
    isCreateMatchPage,
    handleSignOut,
  } = useShellNavigation()

  return (
    <div className={cn("min-h-dvh bg-background selection:bg-primary/30 flex flex-col md:flex-row", isChatPage && "h-dvh max-h-dvh overflow-hidden")}>
      {/* Desktop Sidebar Navigation */}
      <DesktopNavbar
        user={user}
        unreadChats={unreadChats}
        isDark={isDark}
        toggleTheme={toggleTheme}
        language={language}
        setLanguage={setLanguage}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <main
        className={cn(
          'flex-1 min-w-0 w-full max-w-full px-4 pb-24 pb-[max(5.5rem,calc(4.5rem+env(safe-area-inset-bottom)))] pt-[max(1rem,env(safe-area-inset-top))] md:p-8 md:pb-8',
          isChatPage &&
            (hasActiveChat
              ? 'px-0 pt-0 pb-0 h-dvh overflow-hidden flex flex-col md:p-8 md:pb-8 md:h-dvh md:overflow-hidden bg-card/95 md:bg-transparent'
              : 'px-0 pt-0 pb-[calc(3rem+env(safe-area-inset-bottom))] h-dvh overflow-hidden flex flex-col md:p-8 md:pb-8 md:h-dvh md:overflow-hidden bg-card/95 md:bg-transparent')
        )}
      >
        <Outlet />
      </main>

      {/* Mobile Ergonomic Bottom Navigation Bar (hidden inside active chat, game detail, or match creation) */}
      {!hasActiveChat && !isGameDetailPage && !isCreateMatchPage && <MobileBottomBar user={user} unreadChats={unreadChats} />}

      {/* Floating Drawers & Modals */}
      <MobileQuickActions
        isOpen={showQuickActions}
        onClose={() => setShowQuickActions(false)}
      />

      <BggSyncModal
        isOpen={showBggOnboarding}
        onClose={() => setShowBggOnboarding(false)}
        variant="onboarding"
      />
    </div>
  )
}

export { AppShell as default }
