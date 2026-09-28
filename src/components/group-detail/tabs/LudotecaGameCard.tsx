import React from 'react'
import { Users, Clock, Flame } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '../../ui/avatar'
import { Badge } from '../../ui/badge'
import { ExpansionBadge } from '../../ui/expansion-badge'
import { OptimizedImage } from '../../ui/OptimizedImage'
import { MergedGame } from '../../../hooks/useGroupDetail'
import { getGameCover, getGameTitle } from '../../../lib/gameLocale'
import { User } from '@supabase/supabase-js'

interface LudotecaGameCardProps {
  item: MergedGame
  user: User | null
  isHighlighted?: boolean
  onClick: () => void
}

export const LudotecaGameCard: React.FC<LudotecaGameCardProps> = ({
  item,
  user,
  isHighlighted = false,
  onClick,
}) => {
  const { game, owners } = item
  const coverUrl = getGameCover(game) || game.image_url
  const title = getGameTitle(game) || game.title_es || game.title

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className={`group relative flex flex-col text-left rounded-2xl overflow-hidden border cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-[0.97] transition-[transform,border-color,box-shadow] duration-160 ease-out ${
        isHighlighted
          ? 'border-primary ring-2 ring-primary/40 shadow-lg shadow-primary/20 scale-[1.02]'
          : 'border-border/30 bg-card/40 hover:bg-card/90 hover:border-primary/40 hover:shadow-md'
      }`}
    >
      {/* Game Cover Poster Area */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/40">
        {coverUrl ? (
          <OptimizedImage
            src={coverUrl}
            fallbackSrc={game.image_url}
            alt={title}
            fit="cover"
            className="h-full w-full object-cover transition-transform duration-250 ease-out group-hover:scale-105"
            fallbackClassName="h-full w-full rounded-none"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-muted/30 text-muted-foreground/40 font-black text-xs">
            SIN PORTADA
          </div>
        )}

        {/* Ambient Bottom Gradient Scrim for crisp text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent pointer-events-none" />

        {/* Top Left Badges: Expansion */}
        {game.is_expansion && (
          <div className="absolute top-2 left-2 z-10">
            <ExpansionBadge size="xs" />
          </div>
        )}

        {/* Bottom Left Badge (Player Count) */}
        {(game.min_players || game.max_players) && (
          <div className="absolute bottom-2 left-2.5 z-10 flex items-center">
            <Badge
              variant="secondary"
              size="sm"
              className="bg-background/85 backdrop-blur-xs border-border/40 font-mono-tabular text-xs py-0.5 px-2 shadow-2xs"
            >
              <Users className="w-3 h-3 mr-0.5 text-primary" />
              {game.min_players === game.max_players
                ? `${game.min_players} jug.`
                : `${game.min_players ?? 1}-${game.max_players ?? '?'} jug.`}
            </Badge>
          </div>
        )}

        {/* Bottom Right Playing Time */}
        {game.playing_time && (
          <div className="absolute bottom-2 right-2.5 z-10 text-xs font-mono-tabular font-bold text-foreground/90 bg-background/80 backdrop-blur-2xs px-2 py-0.5 rounded-md border border-border/20 flex items-center gap-1">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span>{game.playing_time}m</span>
          </div>
        )}
      </div>

      {/* Typography Block / Footer */}
      <div className="p-3 space-y-1">
        <h4 className="font-extrabold text-xs sm:text-sm text-foreground tracking-tight line-clamp-1 group-hover:text-primary transition-colors duration-160">
          {title}
        </h4>
        <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {/* Avatar(s) next to owner name */}
            <div className="flex items-center -space-x-1 shrink-0">
              {owners.slice(0, 2).map((owner) => {
                const isMe = owner.user_id === user?.id
                return (
                  <Avatar
                    key={owner.user_id}
                    className="h-4 w-4 border border-background shadow-2xs ring-1 ring-border/20"
                    title={isMe ? 'Tú aportaste esta copia' : owner.username}
                  >
                    <AvatarImage src={owner.avatar_url || undefined} />
                    <AvatarFallback className="text-[9px] font-black bg-primary/20 text-primary">
                      {owner.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )
              })}
              {owners.length > 2 && (
                <span className="h-4 min-w-4 px-0.5 rounded-full bg-muted border border-border/40 text-[9px] font-black text-muted-foreground flex items-center justify-center font-mono-tabular">
                  +{owners.length - 2}
                </span>
              )}
            </div>
            <span className="truncate">
              {owners.length === 1 ? owners[0].username : `${owners.length} aportaciones`}
            </span>
          </div>
          {game.complexity && (
            <span className="flex items-center gap-0.5 text-xs font-mono-tabular text-amber dark:text-amber-hover font-bold shrink-0">
              <Flame className="w-3 h-3" />
              {game.complexity.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

