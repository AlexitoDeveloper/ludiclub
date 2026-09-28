import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Dices, Gamepad2, Calendar, Zap, CalendarPlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '../components/ui/button'
import { Tabs } from '../components/ui/tabs'
import { useGroups } from '../hooks/useGroups'
import { usePlayDecisionEngine } from '../hooks/usePlayDecisionEngine'
import { PlayFilterBar } from '../components/play/PlayFilterBar'
import { PlayCollectionSelector } from '../components/play/PlayCollectionSelector'
import { GameDecisionCard } from '../components/play/GameDecisionCard'
import { TableToolsBar } from '../components/table-hub/TableToolsBar'
import { PlayActiveMeetups } from '../components/play/PlayActiveMeetups'
import { BggSyncModal } from '../components/library/BggSyncModal'

type PlayTabMode = 'table' | 'activity'

export function PlayPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { groups } = useGroups()

  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState<PlayTabMode>(
    tabParam === 'activity' ? 'activity' : 'table'
  )
  const [showSyncModal, setShowSyncModal] = useState(false)

  const engine = usePlayDecisionEngine()
  const hasActiveFilters =
    engine.selectedPlayers !== null ||
    engine.selectedDuration !== 'any' ||
    engine.selectedComplexity !== 'any' ||
    engine.onlyUnplayed

  const tabOptions = [
    { id: 'table' as const, label: t('play.tabs.table', 'En Mesa'), icon: Gamepad2 },
    { id: 'activity' as const, label: t('play.tabs.activity', 'Actividad y Mesas'), icon: Calendar },
  ]

  return (
    <section className="space-y-6 max-w-4xl mx-auto pb-20 animate-in fade-in duration-300">
      {/* View Header with Dual-Action Layout */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/75 bg-clip-text text-transparent flex items-center gap-2.5 font-display">
            <span className="p-2 rounded-2xl bg-primary/10 text-primary inline-flex">
              <Dices className="w-7 h-7" aria-hidden="true" />
            </span>
            <span>{t('play.title')}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">{t('play.subtitle')}</p>
        </div>

        {/* Dual Actions CTAs: Same row on both mobile and desktop */}
        <div className="grid grid-cols-2 gap-2 sm:gap-2.5 items-center shrink-0 w-full sm:w-auto">
          <Button
            type="button"
            onClick={() => navigate('/partida/nueva')}
            className="rounded-2xl font-black shadow-lg shadow-primary/25 flex items-center justify-center gap-1.5 sm:gap-2 h-11 px-2 sm:px-5 text-xs sm:text-sm"
          >
            <Zap className="w-4 h-4 text-white shrink-0" aria-hidden="true" />
            <span className="truncate">{t('play.quickLog', 'Registrar partida')}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/mesa/nueva')}
            className="rounded-2xl font-bold flex items-center justify-center gap-1.5 sm:gap-2 h-11 px-2 sm:px-4 text-xs sm:text-sm"
          >
            <CalendarPlus className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            <span className="truncate">{t('play.organizeMeetup', 'Organizar quedada')}</span>
          </Button>
        </div>
      </div>

      {/* Segmented Mode Switcher */}
      <div className="max-w-md">
        <Tabs
          options={tabOptions}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab)}
        />
      </div>

      {/* Tab 1: En Mesa (Companion tools + Decision Engine) */}
      {activeTab === 'table' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Table Companion Tools */}
          <TableToolsBar />

          {/* Decision Engine Card */}
          <div className="rounded-[28px] glass-panel border border-border/40 p-6 sm:p-8 relative overflow-hidden shadow-xl space-y-6">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/5 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-1 relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/70 text-muted-foreground border border-border/40 text-xs font-bold uppercase tracking-wider mb-1">
                <Dices className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                <span>{t('play.decisionTitle')}</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium max-w-xl">{t('play.decisionDesc')}</p>
            </div>

            <div className="space-y-5">
              <PlayFilterBar
                selectedPlayers={engine.selectedPlayers}
                onSelectPlayers={engine.setSelectedPlayers}
                selectedDuration={engine.selectedDuration}
                onSelectDuration={engine.setSelectedDuration}
                selectedComplexity={engine.selectedComplexity}
                onSelectComplexity={engine.setSelectedComplexity}
                onResetFilters={engine.resetFilters}
                hasActiveFilters={hasActiveFilters}
              />
              <PlayCollectionSelector
                selectedGroupId={engine.selectedGroupId}
                onSelectGroupId={engine.setSelectedGroupId}
                groups={groups}
                loadingGames={engine.loadingGames}
                filteredCount={engine.filteredGames.length}
                onOpenSyncModal={() => setShowSyncModal(true)}
                onlyUnplayed={engine.onlyUnplayed}
                onToggleOnlyUnplayed={() => engine.setOnlyUnplayed((prev: boolean) => !prev)}
              />
            </div>

            <GameDecisionCard
              suggestedGame={engine.suggestedGame}
              spinningGame={engine.spinningGame}
              isSpinning={engine.isSpinning}
              loadingGames={engine.loadingGames}
              filteredCount={engine.filteredGames.length}
              spinError={engine.spinError}
              availableExpansions={engine.availableExpansionsForSuggested}
              onSpin={engine.spinRoulette}
              onResetFilters={engine.resetFilters}
              onQuickLog={(game) => {
                navigate(`/partida/nueva?gameId=${game.bgg_id}`)
              }}
            />
          </div>
        </div>
      )}

      {/* Tab 2: Actividad y Mesas */}
      {activeTab === 'activity' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <PlayActiveMeetups />
        </div>
      )}

      <BggSyncModal isOpen={showSyncModal} onClose={() => setShowSyncModal(false)} onSuccess={engine.refreshGames} />
    </section>
  )
}

export default PlayPage
