import { FC, useState } from 'react'
import { Zap, AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog'
import { Button } from '../ui/button'
import {
  useQuickLogMatch,
  GroupMemberInput,
} from '../../hooks/useQuickLogMatch'
import { QuickLogGameSelector } from './quick-log/QuickLogGameSelector'
import { QuickLogAttendeesSection } from './quick-log/QuickLogAttendeesSection'
import { QuickLogWinnerSection } from './quick-log/QuickLogWinnerSection'
import { BoardPhotoUploader } from './BoardPhotoUploader'
import { VictoryCardModal } from './VictoryCardModal'
import { Game, Meetup, PlayerScore } from '../../types'

interface QuickLogMatchModalProps {
  isOpen: boolean
  onClose: () => void
  groupId?: string
  groupMembers?: GroupMemberInput[]
  groupGuests?: Array<{ id: string; name: string; avatarUrl?: string | null }>
  groupGames?: Game[]
  onSuccess?: (meetup: Meetup, scores: PlayerScore[]) => void
  initialGame?: Game | null
}

export const QuickLogMatchModal: FC<QuickLogMatchModalProps> = ({
  isOpen,
  onClose,
  groupId,
  groupMembers = [],
  groupGuests = [],
  groupGames = [],
  onSuccess,
  initialGame,
}) => {
  const { t } = useTranslation()

  // Victory Card state triggered on successful match log
  const [victoryMeetup, setVictoryMeetup] = useState<Meetup | null>(null)
  const [victoryScores, setVictoryScores] = useState<PlayerScore[]>([])

  const handleMatchSaved = (savedMeetup: Meetup, scores: PlayerScore[]) => {
    onSuccess?.(savedMeetup, scores)
    setVictoryMeetup(savedMeetup)
    setVictoryScores(scores)
  }

  const {
    meetupId,
    selectedGame,
    setSelectedGame,
    gameSearchQuery,
    setGameSearchQuery,
    filteredGroupGames,
    catalogSearchResults,
    isSearchingCatalog,
    attendees,
    selectedAttendeeIds,
    toggleAttendee,
    activeAttendees,
    newGuestName,
    setNewGuestName,
    addGuest,
    removeGuest,
    winnerMode,
    setWinnerMode,
    winnerId,
    setWinnerId,
    scores,
    setPlayerScore,
    boardPhotoUrl,
    setBoardPhotoUrl,
    isSubmitting,
    submitError,
    handleSaveMatch,
  } = useQuickLogMatch({
    groupId,
    groupMembers,
    groupGuests,
    groupGames,
    isOpen,
    onSuccess: handleMatchSaved,
    initialGame,
  })

  const isGroupMode = Boolean(groupId && groupMembers.length > 0)

  return (
    <>
      <Dialog open={isOpen && !victoryMeetup} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-1 text-left pb-2 border-b border-border/30">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-black tracking-tight text-foreground">
                  {t('quickLog.title')}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground font-semibold">
                  {isGroupMode
                    ? t('quickLog.descGroup')
                    : t('quickLog.descCasual')}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {submitError && (
              <div className="flex items-center gap-2 p-3 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* 1. Game Autocomplete */}
            <QuickLogGameSelector
              selectedGame={selectedGame}
              setSelectedGame={setSelectedGame}
              searchQuery={gameSearchQuery}
              setSearchQuery={setGameSearchQuery}
              groupGames={filteredGroupGames}
              catalogResults={catalogSearchResults}
              isSearchingCatalog={isSearchingCatalog}
            />

            {/* 2. Attendees / Chips */}
            <QuickLogAttendeesSection
              attendees={attendees}
              selectedAttendeeIds={selectedAttendeeIds}
              toggleAttendee={toggleAttendee}
              newGuestName={newGuestName}
              setNewGuestName={setNewGuestName}
              addGuest={addGuest}
              removeGuest={removeGuest}
              isGroupMode={isGroupMode}
            />

            {/* 3. Winner Selection & Scores */}
            {activeAttendees.length > 0 && (
              <QuickLogWinnerSection
                activeAttendees={activeAttendees}
                winnerMode={winnerMode}
                setWinnerMode={setWinnerMode}
                winnerId={winnerId}
                setWinnerId={setWinnerId}
                scores={scores}
                setPlayerScore={setPlayerScore}
              />
            )}

            {/* 4. Board Photo Uploader */}
            <div className="space-y-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                {t('quickLog.photosSection')}
              </span>
              <BoardPhotoUploader
                meetupId={meetupId}
                currentPhotoUrl={boardPhotoUrl}
                onPhotoUploaded={async (url) => setBoardPhotoUrl(url)}
              />
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/30">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl font-bold text-xs h-9 cursor-pointer"
              >
                {t('common.cancel')}
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleSaveMatch}
                disabled={!selectedGame || activeAttendees.length === 0}
                loading={isSubmitting}
                icon={Zap}
              >
                <span>{isSubmitting ? t('quickLog.savingBtn') : t('quickLog.saveBtn')}</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Victory Card Modal upon save success */}
      {victoryMeetup && (
        <VictoryCardModal
          isOpen={Boolean(victoryMeetup)}
          onClose={() => {
            setVictoryMeetup(null)
            onClose()
          }}
          meetup={victoryMeetup}
          scores={victoryScores}
        />
      )}
    </>
  )
}
