import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Users, Info, Puzzle } from 'lucide-react'
import { useGameDetail } from '../hooks/useGameDetail'
import { Button } from '../components/ui/button'
import { Tabs } from '../components/ui/tabs'
import { toast } from '../components/ui/toast'
import { useTranslation } from 'react-i18next'
import { useGameLocale } from '../hooks/useGameLocale'
import { AppLanguage } from '../lib/dateLocale'

import { GameHeroHeader } from '../components/game-detail/GameHeroHeader'
import { GameDetailsTab } from '../components/game-detail/GameDetailsTab'
import { GameCommunityTab } from '../components/game-detail/GameCommunityTab'
import { GameExpansionsTab } from '../components/game-detail/GameExpansionsTab'
import { GameActionsCard } from '../components/game-detail/GameActionsCard'
import { GameDetailSkeleton } from '../components/game-detail/GameDetailSkeleton'
import { GameStickyBottomDock } from '../components/game-detail/GameStickyBottomDock'

export function GameDetailPage() {
  const { t, i18n } = useTranslation()
  const { getGameTitle, getGameCover } = useGameLocale()
  const language = (i18n.language?.startsWith('en') ? 'en' : 'es') as AppLanguage
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const {
    loading,
    error,
    game,
    baseGame,
    expansions,
    playsCount,
    winnersLog,
    owners,
    isInCollection,
    actionLoading,
    toggleCollection,
    currentUserCity,
    upcomingMeetups
  } = useGameDetail(id)

  const [activeTab, setActiveTab] = useState<'details' | 'community' | 'expansions'>('details')

  const handleToggleCollection = async () => {
    const res = await toggleCollection()
    if (res?.success) {
      if (res.added) {
        toast.success(t('toast.gameAddedToCollection', '¡Juego añadido a tu ludoteca!'))
      } else {
        toast.info(t('toast.gameRemovedFromCollection', 'Juego eliminado de tu ludoteca.'))
      }
    } else if (res?.error) {
      toast.error(res.error)
    }
  }

  if (loading) {
    return <GameDetailSkeleton />
  }

  if (error || !game) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 max-w-md mx-auto text-center gap-4">
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-full">
          <Info className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-xl font-black tracking-tight text-foreground">{t('gameDetail.notFoundTitle')}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {error || t('gameDetail.notFoundDesc')}
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="gap-2 cursor-pointer">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            {t('gameDetail.backToExplore')}
          </Link>
        </Button>
      </div>
    )
  }

  const title = getGameTitle(game)
  const coverUrl = getGameCover(game)
  const hasBaseGame = !!(game.is_expansion && baseGame)
  const hasExpansions = !game.is_expansion && expansions.length > 0
  const hasExpansionsOrBaseGame = hasBaseGame || hasExpansions

  const tabs = [
    { id: 'details', label: t('gameDetail.technicalSheet'), icon: Info },
    { 
      id: 'community', 
      label: t('gameDetail.community', 'Comunidad'), 
      icon: Users, 
      count: upcomingMeetups.length > 0 ? upcomingMeetups.length : (owners.length > 0 ? owners.length : undefined) 
    },
    ...(hasExpansionsOrBaseGame ? [{ id: 'expansions', label: t('gameDetail.expansions'), icon: Puzzle, count: expansions.length > 0 ? expansions.length : undefined }] : [])
  ] as const

  return (
    <div className="relative min-h-dvh pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-16 space-y-6">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between py-2 -mx-4 px-4 md:-mx-8 md:px-8 bg-background/85 backdrop-blur-md border-b border-border/20">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate(-1)} 
          className="cursor-pointer"
          icon={ArrowLeft}
          label={t('common.back')}
          aria-label={t('common.back')}
          title={t('common.back')}
        />
      </div>

      {/* Hero Header */}
      <GameHeroHeader
        game={game}
        title={title}
        coverUrl={coverUrl}
        language={language}
      />

      {/* Main Grid Content */}
      <div className="max-w-6xl mx-auto px-4 relative z-10 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main content tabs */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs
              options={tabs as any}
              activeTab={activeTab}
              onChange={(tabId) => setActiveTab(tabId as any)}
              className="w-full sm:max-w-xl mb-4"
              scrollable
            />

            <div className="min-h-[300px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                >
                  {activeTab === 'details' && <GameDetailsTab game={game} />}
                  {activeTab === 'community' && (
                    <GameCommunityTab
                      playsCount={playsCount}
                      winnersLog={winnersLog}
                      owners={owners}
                      currentUserCity={currentUserCity}
                      upcomingMeetups={upcomingMeetups}
                      language={language}
                    />
                  )}
                  {activeTab === 'expansions' && (
                    <GameExpansionsTab
                      game={game}
                      baseGame={baseGame}
                      expansions={expansions}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Sidebar Actions on Desktop */}
          <div className="hidden lg:block lg:col-span-1 space-y-6 lg:sticky lg:top-8">
            <GameActionsCard
              game={game}
              isInCollection={isInCollection}
              actionLoading={actionLoading}
              toggleCollection={handleToggleCollection}
            />
          </div>
        </div>

        {/* BGG Legal Disclaimer */}
        <div className="text-xs text-center text-muted-foreground/50 font-semibold select-none pt-12 border-t border-border/10 mt-8">
          {t('profile.collection.attribution')}{' '}
          <a
            href="https://boardgamegeek.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors hover:underline"
          >
            BoardGameGeek
          </a>
        </div>
      </div>

      {/* Persistent Mobile Bottom Action Dock */}
      <GameStickyBottomDock
        game={game}
        isInCollection={isInCollection}
        actionLoading={actionLoading}
        onToggleCollection={handleToggleCollection}
      />
    </div>
  )
}

