import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bookmark,
  BookmarkCheck,
  CalendarPlus,
  ExternalLink,
  Trash2,
  Users,
  Clock,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../../ui/sheet'
import { Button } from '../../ui/button'
import { Badge } from '../../ui/badge'
import { ExpansionBadge } from '../../ui/expansion-badge'
import { Game } from '../../../types'
import { useGameLocale } from '../../../hooks/useGameLocale'
import { useTranslation } from 'react-i18next'

interface ProfileGameDrawerProps {
  game: Game | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isWishlisted: boolean
  isUnplayed: boolean
  isOwnProfileEditable: boolean
  gameTitle: string
  onToggleWishlist: (bggId: number) => void
  onRemove: (game: Game) => void
}

export const ProfileGameDrawer: React.FC<ProfileGameDrawerProps> = ({
  game,
  open,
  onOpenChange,
  isWishlisted,
  isUnplayed,
  isOwnProfileEditable,
  gameTitle,
  onToggleWishlist,
  onRemove,
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { getGameCover } = useGameLocale()

  if (!game) return null

  const coverUrl = getGameCover(game) || game.image_url

  const handleOpenGameDetail = () => {
    onOpenChange(false)
    navigate(`/juegos/${game.bgg_id}`)
  }

  const handleCreateMatch = () => {
    onOpenChange(false)
    navigate(`/partida/nueva?gameId=${game.bgg_id}`)
  }

  const handleRemove = () => {
    onOpenChange(false)
    onRemove(game)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="sm:max-w-md sm:mx-auto sm:rounded-3xl p-5 sm:p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] space-y-5"
      >
        {/* Game Header: Cover & Main Meta */}
        <div className="flex gap-4 items-start">
          <div className="relative w-20 h-28 rounded-2xl overflow-hidden bg-muted/40 shrink-0 border border-border/40 shadow-md">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={gameTitle}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground/40 font-black text-xs">
                BOX
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            <SheetHeader className="space-y-1 text-left">
              <SheetTitle className="text-lg font-black text-foreground tracking-tight leading-snug truncate">
                {gameTitle}
              </SheetTitle>
              <SheetDescription className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                {game.is_expansion && <ExpansionBadge size="xs" />}
                <span>{game.year_published || 'N/A'}</span>
              </SheetDescription>
            </SheetHeader>

            {/* Quick Badges Row */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {isUnplayed && (
                <Badge variant="warning" size="sm" className="font-bold text-xs py-0 px-2 uppercase tracking-wide">
                  {t('profile.collection.unplayedBadge', 'Sin jugar')}
                </Badge>
              )}
              {(game.min_players || game.max_players) && (
                <Badge variant="secondary" size="sm" className="font-mono text-xs py-0 px-2">
                  <Users className="w-2.5 h-2.5 mr-1 text-primary" />
                  {game.min_players === game.max_players
                    ? t('profile.collection.drawer.singlePlayer', '{{count}} jug.', { count: game.min_players ?? 0 })
                    : t('profile.collection.drawer.players', '{{min}}-{{max}} jug.', { min: game.min_players ?? 1, max: game.max_players ?? '?' })}
                </Badge>
              )}
              {game.playing_time && (
                <Badge variant="secondary" size="sm" className="font-mono text-xs py-0 px-2">
                  <Clock className="w-2.5 h-2.5 mr-1 text-muted-foreground" />
                  {game.playing_time}m
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Ergonomic 48px Action Stack */}
        <div className="space-y-2.5 pt-1">
          {/* Wishlist Toggle Button */}
          <Button
            type="button"
            variant={isWishlisted ? 'secondary' : 'outline'}
            size="lg"
            className="w-full justify-center"
            onClick={() => onToggleWishlist(game.bgg_id)}
            icon={isWishlisted ? BookmarkCheck : Bookmark}
            label={isWishlisted
              ? t('profile.collection.drawer.wishlistRemove', 'Quitar de Quiero Jugar')
              : t('profile.collection.drawer.wishlistAdd', 'Marcar como Quiero Jugar')}
          />

          {/* Create Match CTA */}
          <Button
            type="button"
            variant="default"
            size="lg"
            className="w-full justify-center"
            onClick={handleCreateMatch}
            icon={CalendarPlus}
            label={t('profile.collection.drawer.createMatch', 'Crear partida con este juego')}
          />

          {/* Game Detail View CTA */}
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full justify-center"
            onClick={handleOpenGameDetail}
            icon={ExternalLink}
            label={t('profile.collection.drawer.viewGame', 'Ver ficha completa del juego')}
          />

          {/* Destructive Action: Remove from Collection */}
          {isOwnProfileEditable && (
            <Button
              type="button"
              variant="ghost"
              size="default"
              className="w-full text-destructive hover:bg-destructive/10 justify-center mt-1"
              onClick={handleRemove}
              icon={Trash2}
              label={t('profile.collection.drawer.removeGame', 'Quitar de mi ludoteca')}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
