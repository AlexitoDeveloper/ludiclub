import { useMemo } from 'react'
import { UserProfile, Game } from '../../types'
import { EditProfileModal } from './EditProfileModal'
import { BggSyncModal } from '../library/BggSyncModal'
import { AddGameToLibraryModal } from '../library/AddGameToLibraryModal'
import { RankingVisualizerModal } from './RankingVisualizerModal'
import { ProfileSettingsModal } from './ProfileSettingsModal'
import { useTranslation } from 'react-i18next'
import { toast } from '../ui/toast'

interface ProfileModalsProps {
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
  profile: UserProfile;
  profileId: string;
  currentUserId?: string;
  saveProfile: (username: string, city: string, avatarUrl: string) => Promise<void>;
  savingProfile: boolean;
  isImportModalOpen: boolean;
  setIsImportModalOpen: (val: boolean) => void;
  importBggCollection: (username: string) => Promise<any>;
  isAddGameModalOpen: boolean;
  setIsAddGameModalOpen: (val: boolean) => void;
  collectionGames: Game[];
  addToCollection: (game: Game) => Promise<void>;
  selectedRanking: any | null;
  setSelectedRanking: (ranking: any | null) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (val: boolean) => void;
}

export function ProfileModals({
  isEditing,
  setIsEditing,
  profile,
  profileId,
  currentUserId,
  saveProfile,
  savingProfile,
  isImportModalOpen,
  setIsImportModalOpen,
  importBggCollection,
  isAddGameModalOpen,
  setIsAddGameModalOpen,
  collectionGames,
  addToCollection,
  selectedRanking,
  setSelectedRanking,
  isSettingsOpen,
  setIsSettingsOpen,
}: ProfileModalsProps) {
  const { t } = useTranslation()

  const userCollectionGameIds = useMemo(
    () => collectionGames.map((g) => g.bgg_id),
    [collectionGames]
  )

  return (
    <>
      <EditProfileModal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        profile={profile}
        profileId={profileId}
        currentUserId={currentUserId}
        onSave={async (username, city, avatarUrl) => {
          await saveProfile(username, city, avatarUrl)
          toast.success(t('toast.profileSaved', 'Ajustes del perfil guardados.'))
        }}
        saving={savingProfile}
      />

      <BggSyncModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={importBggCollection}
      />

      <AddGameToLibraryModal
        isOpen={isAddGameModalOpen}
        onClose={() => setIsAddGameModalOpen(false)}
        userCollectionGameIds={userCollectionGameIds}
        currentUserId={currentUserId}
        onAddGame={async (game) => {
          await addToCollection(game)
          toast.success(t('toast.gameAddedToCollection', '¡Juego añadido a tu ludoteca!'))
        }}
      />

      <RankingVisualizerModal
        selectedRanking={selectedRanking}
        onClose={() => setSelectedRanking(null)}
      />

      <ProfileSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  )
}
