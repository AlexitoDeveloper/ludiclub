import React from 'react'
import { Users, Clock, Flame, ChevronRight } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '../../ui/avatar'
import { Badge } from '../../ui/badge'
import { ExpansionBadge } from '../../ui/expansion-badge'
import { OptimizedImage } from '../../ui/OptimizedImage'
import { MergedGame } from '../../../hooks/useGroupDetail'
import { getGameCover, getGameTitle } from '../../../lib/gameLocale'
import { User } from '@supabase/supabase-js'

interface LudotecaLedgerRowProps {
  item: MergedGame
  user: User | null
  isHighlighted?: boolean
  onClick: () => void
}

export const LudotecaLedgerRow: React.FC<LudotecaLedgerRowProps> = ({
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
      className={`group flex items-center justify-between gap-3 p-2.5 sm:px-3.5 sm:py-2.5 rounded-xl border text-left cursor-pointer outline-none active:scale-[0.99] transition-[background-color,border-color,transform] duration-160 ease-out select-none ${
        isHighlighted
          ? 'border-primary ring-2 ring-primary/40 bg-primary/5'
          : 'border-border/30 bg-card/40 hover:bg-card hover:border-primary/30'
      }`}
    >
      {/* Thumbnail + Title */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted/40 shrink-0 border border-border/20">
          {coverUrl ? (
            <OptimizedImage
              src={coverUrl}
              fallbackSrc={game.image_url}
              alt={title}
              widthSize={80}
              heightSize={80}
              fit="cover"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 ease-out"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground/40 font-bold">
              BOX
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-xs sm:text-sm text-foreground truncate group-hover:text-primary transition-colors">
              {title}
            </h4>
            {game.is_expansion && (
              <ExpansionBadge size="xs" />
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 font-mono-tabular">
              <Users className="w-3 h-3 text-primary/70" />
              {game.min_players === game.max_players
                ? `${game.min_players} jug.`
                : `${game.min_players ?? 1}-${game.max_players ?? '?'} jug.`}
            </span>
            {game.playing_time && (
              <>
                <span className="text-border">•</span>
                <span className="flex items-center gap-1 font-mono-tabular">
                  <Clock className="w-3 h-3 text-muted-foreground/70" />
                  {game.playing_time}m
                </span>
              </>
            )}
            {game.complexity && (
              <>
                <span className="text-border">•</span>
                <span className="flex items-center gap-1 font-mono-tabular text-amber dark:text-amber-hover font-semibold">
                  <Flame className="w-3 h-3" />
                  {game.complexity.toFixed(1)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Owners Stack & Arrow */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden sm:flex items-center -space-x-1.5">
          {owners.slice(0, 3).map((owner) => {
            const isMe = owner.user_id === user?.id
            return (
              <Avatar
                key={owner.user_id}
                className="h-6 w-6 border-2 border-background shadow-xs ring-1 ring-border/20"
                title={isMe ? 'Tú aportaste esta copia' : owner.username}
              >
                <AvatarImage src={owner.avatar_url || undefined} />
                <AvatarFallback className="text-xs font-black bg-primary/20 text-primary">
                  {owner.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )
          })}
          {owners.length > 3 && (
            <span className="text-xs font-black text-muted-foreground px-1 font-mono-tabular">
              +{owners.length - 3}
            </span>
          )}
        </div>

        <Badge variant="secondary" size="sm" className="hidden md:inline-flex text-xs font-mono">
          {owners.length === 1 ? '1 copia' : `${owners.length} copias`}
        </Badge>

        <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all duration-160 ease-out" />
      </div>
    </div>
  )
}
