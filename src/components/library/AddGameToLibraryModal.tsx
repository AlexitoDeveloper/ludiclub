import { FC, useState, useEffect, useMemo } from 'react'
import { Search, Loader2, Globe, Dices, PenTool, Sparkles, X, Check, Users } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabOption } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { FilterChip } from '@/components/ui/chip'
import { Game } from '@/types'
import { supabase } from '@/lib/supabaseClient'
import { useTranslation } from 'react-i18next'
import { ManualGameForm } from './ManualGameForm'
import { GameSearchResultItem } from './GameSearchResultItem'

export interface GroupMemberOwner {
  id: string
  name: string
  avatarUrl?: string | null
  role?: string
  isGuest?: boolean
}

interface AddGameToLibraryModalProps {
  isOpen: boolean
  onClose: () => void
  userCollectionGameIds: number[]
  onAddGame: (game: Game, ownerId?: string, isGuestOwner?: boolean) => Promise<void>
  isGroupContext?: boolean
  groupMembers?: GroupMemberOwner[]
  currentUserId?: string
  mergedCollection?: {
    game: Game
    owners: { user_id: string; username: string; avatar_url: string | null }[]
  }[]
}

type TabMode = 'search' | 'manual'

const tabOptions: TabOption<TabMode>[] = [
  { id: 'search', label: 'Buscar catálogo', icon: Search },
  { id: 'manual', label: 'Crear manual', icon: PenTool },
]

export const AddGameToLibraryModal: FC<AddGameToLibraryModalProps> = ({
  isOpen,
  onClose,
  userCollectionGameIds,
  onAddGame,
  isGroupContext = false,
  groupMembers = [],
  currentUserId,
  mergedCollection = [],
}) => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabMode>('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Game[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isBggSearching, setIsBggSearching] = useState(false)
  const [addingIds, setAddingIds] = useState<Record<number, boolean>>({})
  const [addedIds, setAddedIds] = useState<Record<number, boolean>>({})
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>(
    currentUserId || (groupMembers.length > 0 ? groupMembers[0].id : '')
  )

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
      setSearchResults([])
      setIsSearching(false)
      setIsBggSearching(false)
      setActiveTab('search')
      setAddedIds({})
      if (currentUserId) {
        setSelectedOwnerId(currentUserId)
      } else if (groupMembers.length > 0) {
        setSelectedOwnerId(groupMembers[0].id)
      }
    }
  }, [isOpen, currentUserId, groupMembers])

  // Determine which games the selected owner already has in their collection
  const selectedOwnerGameIds = useMemo(() => {
    if (isGroupContext && selectedOwnerId && mergedCollection.length > 0) {
      return mergedCollection
        .filter((item) => item.owners.some((o) => o.user_id === selectedOwnerId))
        .map((item) => item.game.bgg_id)
    }
    return userCollectionGameIds
  }, [isGroupContext, selectedOwnerId, mergedCollection, userCollectionGameIds])

  // Search local database as user types
  useEffect(() => {
    if (!isOpen || activeTab !== 'search') return

    const trimmed = searchQuery.trim()
    if (!trimmed) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const { data, error } = await supabase
          .from('games')
          .select('*')
          .or(`title.ilike.%${trimmed}%,title_es.ilike.%${trimmed}%`)
          .order('year_published', { ascending: false, nullsFirst: false })
          .limit(20)

        if (!error && data) {
          setSearchResults(data as Game[])
        }
      } catch (err) {
        console.error('Error searching catalog:', err)
      } finally {
        setIsSearching(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [searchQuery, isOpen, activeTab])

  const handleSearchBgg = async () => {
    const trimmed = searchQuery.trim()
    if (!trimmed) return

    setIsBggSearching(true)
    try {
      const { data, error } = await supabase.functions.invoke('bgg-ingest', {
        body: { action: 'search', query: trimmed },
      })

      if (!error && data && data.results) {
        const bggGames: Game[] = data.results.map((item: any) => ({
          bgg_id: item.bgg_id,
          title: item.title,
          year_published: item.year_published,
          is_expansion: item.is_expansion,
          image_url: null,
          isFromBgg: true,
        }))
        setSearchResults((prev) => {
          const ids = new Set(prev.map((g) => g.bgg_id))
          const newBgg = bggGames.filter((g) => !ids.has(g.bgg_id))
          return [...prev, ...newBgg]
        })
      }
    } catch (err) {
      console.error('Error searching BGG:', err)
    } finally {
      setIsBggSearching(false)
    }
  }

  const handleAdd = async (game: Game) => {
    setAddingIds((prev) => ({ ...prev, [game.bgg_id]: true }))
    try {
      const selectedMember = groupMembers.find((m) => m.id === selectedOwnerId)
      await onAddGame(
        game,
        isGroupContext ? selectedOwnerId : undefined,
        Boolean(selectedMember?.isGuest)
      )
      setAddedIds((prev) => ({ ...prev, [game.bgg_id]: true }))
    } catch (err) {
      console.error('Error adding game:', err)
    } finally {
      setAddingIds((prev) => ({ ...prev, [game.bgg_id]: false }))
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="sm:max-w-lg mx-auto w-full p-5 sm:p-6 pb-[max(1rem,calc(env(safe-area-inset-bottom)+0.5rem))] space-y-3">
        <SheetHeader className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wider w-fit">
            <Dices className="w-3.5 h-3.5" />
            <span>{isGroupContext ? 'Ludoteca del Grupo' : 'Mi Ludoteca'}</span>
          </div>
          <SheetTitle>
            Añadir Juego a la Ludoteca
          </SheetTitle>
          <SheetDescription>
            {isGroupContext
              ? t(
                  'groups.groupContextSheetDesc',
                  'Elige quién aporta el juego para que quede registrado a su nombre en la ludoteca del grupo.'
                )
              : 'Busca en el catálogo, en BGG o añade manualmente cualquier juego a tu colección.'}
          </SheetDescription>
        </SheetHeader>

        {/* Owner Selection Bar in Group Context */}
        {isGroupContext && groupMembers.length > 0 && (
          <div className="space-y-1.5 p-3 rounded-2xl bg-muted/20 border border-border/40">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-foreground flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary" />
                <span>{t('groups.selectGameOwner', 'Propietario del juego')}</span>
              </span>
              <span className="text-muted-foreground text-xs font-medium">
                {t('groups.whoBringsGame', '¿Quién aporta este juego?')}
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-1 no-scrollbar">
              {groupMembers.map((member) => {
                const isSelected = selectedOwnerId === member.id
                const isCurrentUser = member.id === currentUserId
                const displayName = isCurrentUser
                  ? `${member.name} (${t('common.you', 'Tú')})`
                  : member.name

                return (
                  <FilterChip
                    key={member.id}
                    selected={isSelected}
                    variant={member.isGuest ? 'default' : 'primary'}
                    size="sm"
                    onClick={() => setSelectedOwnerId(member.id)}
                    className="h-8 gap-1.5 px-2.5 rounded-xl shrink-0 cursor-pointer"
                  >
                    <Avatar className="w-4 h-4 border border-border/30">
                      <AvatarImage src={member.avatarUrl || ''} alt={member.name} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary font-black">
                        {member.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate max-w-[120px]">{displayName}</span>
                    {member.isGuest && (
                      <span className="text-xs text-muted-foreground font-semibold">
                        ({t('common.guest', 'Invitado')})
                      </span>
                    )}
                    {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                  </FilterChip>
                )
              })}
            </div>
          </div>
        )}

        {/* Mode Tabs */}
        <Tabs
          options={tabOptions}
          activeTab={activeTab}
          onChange={setActiveTab}
          className="w-full"
        />

        {/* Ergonomically sized viewport to eliminate empty dead space and prevent tab jumpiness */}
        <div className="h-[250px] flex flex-col min-h-0 pt-1">
          {activeTab === 'search' ? (
            <div className="flex-1 flex flex-col min-h-0 space-y-3">
              {/* Search Input Box */}
              <div className="relative shrink-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                <Input
                  type="text"
                  placeholder="Escribe el nombre del juego (ej. Catan, Carcassonne...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 rounded-xl h-11 text-sm bg-card/60 border-border/50 focus-visible:bg-card shadow-xs"
                />
                {searchQuery && !isSearching && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg text-muted-foreground hover:text-foreground h-7 w-7"
                    aria-label="Limpiar búsqueda"
                    icon={X}
                  />
                )}
                {isSearching && (
                  <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
                )}
              </div>

              {/* Results container filling remainder of viewport */}
              <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
                {searchResults.length > 0 ? (
                  searchResults.map((game) => (
                    <GameSearchResultItem
                      key={game.bgg_id}
                      game={game}
                      isInCollection={
                        selectedOwnerGameIds.includes(game.bgg_id) || !!addedIds[game.bgg_id]
                      }
                      isAdding={!!addingIds[game.bgg_id]}
                      onAdd={handleAdd}
                    />
                  ))
                ) : searchQuery.trim() && !isSearching ? (
                  <div className="h-full flex items-center justify-center p-4 text-center border border-dashed border-border/40 rounded-2xl bg-muted/10">
                    <p className="text-xs text-muted-foreground font-semibold">
                      No se encontraron coincidencias en el catálogo local.
                    </p>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground/60 select-none space-y-2">
                    <Sparkles className="w-8 h-8 opacity-40" />
                    <p className="text-xs font-semibold">
                      Escribe el nombre de un juego para buscarlo en el catálogo
                    </p>
                  </div>
                )}
              </div>

              {/* BGG Search Option */}
              {searchQuery.trim().length >= 2 && (
                <div className="shrink-0 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="default"
                    disabled={isBggSearching}
                    onClick={handleSearchBgg}
                    className="w-full"
                    icon={isBggSearching ? Loader2 : Globe}
                    label={`Buscar "${searchQuery.trim()}" en BoardGameGeek`}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto">
              <ManualGameForm
                onAddGame={(game) => {
                  const selectedMember = groupMembers.find((m) => m.id === selectedOwnerId)
                  return onAddGame(
                    game,
                    isGroupContext ? selectedOwnerId : undefined,
                    Boolean(selectedMember?.isGuest)
                  )
                }}
                onClose={onClose}
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
