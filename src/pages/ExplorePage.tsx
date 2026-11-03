import { useState } from 'react'
import { useExploreGames } from '../hooks/useExploreGames'
import { ExploreHeader } from '../components/ExploreHeader'
import { ExploreSearchResults } from '../components/explore/ExploreSearchResults'
import { ExploreCarousels } from '../components/explore/ExploreCarousels'
import { ExploreLoadingState } from '../components/explore/ExploreLoadingState'
import { useTranslation } from 'react-i18next'
import { cn } from '../lib/utils'

export function ExplorePage() {
  const { t } = useTranslation()
  const [search, setSearchChange] = useState('')
  const [playerFilter, setPlayerFilterChange] = useState('')
  const [complexityFilter, setComplexityFilterChange] = useState('')
  const [spanishOnly, setSpanishOnlyChange] = useState(false)

  const {
    loadingCarousels,
    loadingSearch,
    error,
    novedades,
    upcomingGames,
    paraDos,
    classics,
    fastGames,
    heavyGames,
    partyGames,
    top10,
    top10Month,
    communityRankings,
    searchResults,
    isFiltering,
    featuredGame
  } = useExploreGames(search, playerFilter, complexityFilter, spanishOnly)

  return (
    <section className="space-y-6 pb-20">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black font-display tracking-tight text-foreground">
          {t('nav.home')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('explore.exploreSubtitle')}
        </p>
      </div>

      {/* Filter and Search Bar */}
      <ExploreHeader
        search={search}
        onSearchChange={setSearchChange}
        playerFilter={playerFilter}
        onPlayerFilterChange={setPlayerFilterChange}
        complexityFilter={complexityFilter}
        onComplexityFilterChange={setComplexityFilterChange}
        spanishOnly={spanishOnly}
        onSpanishOnlyChange={setSpanishOnlyChange}
      />

      {error && (
        <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-sm font-semibold">
          {t('meetup.errorTitle')}: {error}
        </div>
      )}

      {/* Main View Transition Area */}
      <div className="min-h-[400px]">
        {isFiltering && (
          <ExploreSearchResults
            loading={loadingSearch}
            searchResults={searchResults}
          />
        )}

        <div className={cn("space-y-5", isFiltering && "hidden")}>
          {loadingCarousels ? (
            <ExploreLoadingState />
          ) : (
            <ExploreCarousels
              featuredGame={featuredGame}
              top10={top10}
              novedades={novedades}
              upcomingGames={upcomingGames}
              fastGames={fastGames}
              paraDos={paraDos}
              heavyGames={heavyGames}
              top10Month={top10Month}
              partyGames={partyGames}
              communityRankings={communityRankings}
              classics={classics}
            />
          )}
        </div>
      </div>
    </section>
  )
}

export default ExplorePage;
