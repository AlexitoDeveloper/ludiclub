import { ArrowLeft, Bookmark, Check, Download, Loader2, Plus, Sparkles, Trophy } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTops } from '../hooks/useTops'
import { TopsCanvas } from '../components/tops/TopsCanvas'
import { TopsSettings } from '../components/tops/TopsSettings'
import { TopsSearchSection } from '../components/tops/TopsSearchSection'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { useTranslation } from 'react-i18next'

export function TopsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const tops = useTops()

  const hasGames = tops.mode === 'tier'
    ? tops.tiers.some(tier => tier.games.length > 0)
    : tops.top10.some(game => game !== null)

  return (
    <section className="space-y-4 max-w-5xl mx-auto p-3 sm:p-4 pb-28 text-left">
      {/* Sticky Mobile/Desktop Studio Header */}
      <header className="sticky top-[-2px] pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 z-40 flex items-center justify-between -mx-3 px-3 sm:-mx-4 sm:px-4 bg-background/85 backdrop-blur-md border-b border-border/20">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            icon={ArrowLeft}
            label={t('common.back', 'Volver')}
            className="cursor-pointer shrink-0"
          />
          <div className="min-w-0 hidden xs:flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-primary shrink-0" />
            <h1 className="text-sm sm:text-base font-black truncate text-foreground">
              {tops.rankingTitle || t('tops.studioTitle', 'Tops Studio')}
            </h1>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={tops.handleSaveToProfile}
            disabled={tops.saving || !hasGames}
            className="cursor-pointer"
          >
            {tops.saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">{t('tops.saving', 'Guardando...')}</span>
              </>
            ) : tops.saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                <span className="hidden sm:inline text-emerald-500">{t('tops.saveSuccess', 'Guardado')}</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline">{t('tops.saveButton', 'Guardar en perfil')}</span>
                <span className="inline sm:hidden">{t('common.save', 'Guardar')}</span>
              </>
            )}
          </Button>

          <Button
            size="sm"
            onClick={tops.handleExportImage}
            disabled={tops.exporting || !hasGames}
            className="cursor-pointer"
          >
            {tops.exporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">{t('common.generating', 'Generando...')}</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('common.savePhoto', 'Exportar PNG')}</span>
                <span className="inline sm:hidden">{t('common.export', 'Exportar')}</span>
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Saved Rankings Horizontal Bar */}
      {tops.savedRankings.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-primary" /> {t('tops.myRankings', 'Mis Rankings')}:
          </span>

          <Button
            size="xs"
            variant={tops.activeRankingId === null ? 'default' : 'outline'}
            onClick={tops.startNewRanking}
            className="cursor-pointer shrink-0"
            icon={Plus}
            label={t('common.new', 'Nuevo')}
          />

          {tops.savedRankings.map((ranking) => {
            const isActive = tops.activeRankingId === ranking.id
            return (
              <Button
                key={ranking.id}
                size="xs"
                variant={isActive ? 'default' : 'outline'}
                onClick={() => tops.loadRanking(ranking)}
                className={`cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  isActive ? 'ring-2 ring-primary ring-offset-1' : ''
                }`}
              >
                <span className="truncate max-w-[120px]">{ranking.title || t('tops.untitled', 'Sin título')}</span>
                <Badge variant={isActive ? 'secondary' : 'primary-soft'} className="text-[9px] px-1 py-0 uppercase">
                  {ranking.mode === 'tier' ? 'Tier' : 'Top 10'}
                </Badge>
              </Button>
            )
          })}
        </div>
      )}

      {/* Sleek Compact Studio Toolbar */}
      <TopsSettings
        mode={tops.mode}
        setMode={tops.setMode}
        showWatermark={tops.showWatermark}
        setShowWatermark={tops.setShowWatermark}
        customWatermark={tops.customWatermark}
        setCustomWatermark={tops.setCustomWatermark}
        selectedBg={tops.selectedBg}
        setSelectedBg={tops.setSelectedBg}
        aspectRatio={tops.aspectRatio}
        setAspectRatio={tops.setAspectRatio}
      />

      {/* Podium & Export-Clean Canvas */}
      <TopsCanvas
        exportAreaRef={tops.exportAreaRef}
        mode={tops.mode}
        rankingTitle={tops.rankingTitle}
        setRankingTitle={tops.setRankingTitle}
        tiers={tops.tiers}
        top10={tops.top10}
        activeTarget={tops.activeTarget}
        setActiveTarget={tops.setActiveTarget}
        selectedGameForPlacement={tops.selectedGameForPlacement}
        placeInTier={tops.placeInTier}
        returnTierGameToPool={tops.returnTierGameToPool}
        placeInTop10={tops.placeInTop10}
        returnTop10GameToPool={tops.returnTop10GameToPool}
        moveTop10Slot={tops.moveTop10Slot}
        editTierName={tops.editTierName}
        handleDragStart={tops.handleDragStart}
        handleDropOnTier={tops.handleDropOnTier}
        handleDropOnTop10={tops.handleDropOnTop10}
        pool={tops.pool}
        handleClearAll={tops.handleClearAll}
        showWatermark={tops.showWatermark}
        customWatermark={tops.customWatermark}
        selectedBg={tops.selectedBg}
        aspectRatio={tops.aspectRatio}
        isExportingCanvas={tops.isExportingCanvas}
      />

      {/* Personal Ludoteca + Search Section */}
      <TopsSearchSection
        collectionGames={tops.collectionGames}
        loadingCollection={tops.loadingCollection}
        quickPlaceGame={tops.quickPlaceGame}
        searchQuery={tops.searchQuery}
        setSearchQuery={tops.setSearchQuery}
        searchResults={tops.searchResults}
        setSearchResults={tops.setSearchResults}
        isSearching={tops.isSearching}
        errorMsg={tops.errorMsg}
        addToPool={tops.addToPool}
        pool={tops.pool}
        selectedGameForPlacement={tops.selectedGameForPlacement}
        selectGame={tops.selectGame}
        removeFromPool={tops.removeFromPool}
        handleClearPool={tops.handleClearPool}
        tiers={tops.tiers}
        top10={tops.top10}
        placeInTier={tops.placeInTier}
        placeInTop10={tops.placeInTop10}
        setSelectedGameForPlacement={tops.setSelectedGameForPlacement}
        handleDragStart={tops.handleDragStart}
        handleDropOnPool={tops.handleDropOnPool}
        mode={tops.mode}
      />
    </section>
  )
}

export default TopsPage;
