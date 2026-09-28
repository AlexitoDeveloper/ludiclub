import { Flame, Star, ExternalLink, CalendarPlus, Zap } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../../ui/sheet'
import { Avatar, AvatarImage, AvatarFallback } from '../../ui/avatar'
import { Badge } from '../../ui/badge'
import { ExpansionBadge } from '../../ui/expansion-badge'
import { Button } from '../../ui/button'
import { OptimizedImage } from '../../ui/OptimizedImage'
import { MergedGame } from '../../../hooks/useGroupDetail'
import { getGameCover, getGameTitle } from '../../../lib/gameLocale'
import { User } from '@supabase/supabase-js'

interface LudotecaGameDrawerProps {
  item: MergedGame | null
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUser: User | null
  onLogMatch?: (bggId: number) => void
  onProposeGame?: (gameTitle: string) => void
}

export const LudotecaGameDrawer: React.FC<LudotecaGameDrawerProps> = ({
  item,
  open,
  onOpenChange,
  currentUser,
  onLogMatch,
  onProposeGame,
}) => {
  if (!item) return null
  const { game, owners } = item
  const coverUrl = getGameCover(game) || game.image_url
  const title = getGameTitle(game) || game.title_es || game.title
  const hasMultipleOwners = owners.length > 1
  const isOwnedByMe = owners.some((o) => o.user_id === currentUser?.id)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="sm:max-w-xl sm:mx-auto sm:rounded-3xl p-5 sm:p-6 space-y-5">
        {/* Header Hero Container */}
        <div className="flex gap-4 items-start">
          <div className="relative w-20 h-24 sm:w-24 sm:h-28 rounded-2xl overflow-hidden bg-muted/40 shrink-0 border border-border/40 shadow-md">
            {coverUrl ? (
              <OptimizedImage
                src={coverUrl}
                fallbackSrc={game.image_url}
                alt={title}
                fit="cover"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground/40 font-black text-xs">
                BOX
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <SheetHeader className="space-y-0.5">
              <SheetTitle className="text-lg sm:text-xl font-black text-foreground truncate">
                {title}
              </SheetTitle>
              {game.title_es && game.title !== game.title_es && (
                <SheetDescription className="text-xs text-muted-foreground/75 font-medium truncate">
                  Original: {game.title}
                </SheetDescription>
              )}
              <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                {game.is_expansion && <ExpansionBadge size="xs" />}
                {game.rating_geek && (
                  <Badge variant="tag-amber" className="gap-1 text-xs font-black py-0.5 font-mono-tabular">
                    <Star className="w-3 h-3 fill-amber text-amber" />
                    {game.rating_geek.toFixed(1)} BGG
                  </Badge>
                )}
              </div>
            </SheetHeader>

            {/* 3-Column Spec Matrix from GameShelfCard */}
            <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-surface-elevated/60 border border-border/60 text-center mt-3">
              <div>
                <span className="block text-xs text-muted-foreground font-semibold">Jugadores</span>
                <span className="font-mono-tabular text-xs font-black text-foreground">
                  {game.min_players === game.max_players
                    ? game.min_players
                    : `${game.min_players ?? 1}–${game.max_players ?? '?'}`}
                </span>
              </div>
              <div className="border-x border-border/60">
                <span className="block text-xs text-muted-foreground font-semibold">Tiempo</span>
                <span className="font-mono-tabular text-xs font-black text-foreground">
                  {game.playing_time ? `${game.playing_time}m` : '—'}
                </span>
              </div>
              <div>
                <span className="block text-xs text-muted-foreground font-semibold">En Grupo</span>
                <span className="font-mono-tabular text-xs font-black text-foreground">
                  {owners.length} {owners.length === 1 ? 'copia' : 'copias'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ownership Matrix */}
        <div className="p-4 rounded-2xl bg-muted/30 border border-border/30 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>
              {hasMultipleOwners ? `Copias en el grupo (${owners.length})` : 'Copia en el grupo'}
            </span>
            {isOwnedByMe && (
              <Badge variant="tag-emerald" size="sm" className="text-xs">
                En tu colección
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {owners.map((owner) => {
              const isMe = owner.user_id === currentUser?.id
              return (
                <div
                  key={owner.user_id}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-background border border-border/40 text-xs font-semibold shadow-2xs"
                >
                  <Avatar className="w-6 h-6 border border-primary/20">
                    <AvatarImage src={owner.avatar_url || undefined} />
                    <AvatarFallback className="text-xs font-black bg-primary/10 text-primary">
                      {owner.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate max-w-[120px]">
                    {isMe ? 'Tú (aportado)' : owner.username}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Additional Game Intel & Specs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
          {game.complexity ? (
            <div className="p-3 rounded-xl bg-card/60 border border-border/30">
              <span className="text-muted-foreground text-xs block font-semibold">Complejidad</span>
              <span className="font-extrabold text-foreground flex items-center gap-1 mt-0.5 font-mono-tabular">
                <Flame className="w-3.5 h-3.5 text-amber dark:text-amber-hover" />
                {game.complexity.toFixed(1)} / 5.0
              </span>
            </div>
          ) : null}

          {game.rating_geek ? (
            <div className="p-3 rounded-xl bg-card/60 border border-border/30">
              <span className="text-muted-foreground text-xs block font-semibold">Geek Rating</span>
              <span className="font-extrabold text-foreground flex items-center gap-1 mt-0.5 font-mono-tabular">
                <Star className="w-3.5 h-3.5 fill-amber text-amber" />
                {game.rating_geek.toFixed(1)} / 10
              </span>
            </div>
          ) : null}

          {game.year_published ? (
            <div className="p-3 rounded-xl bg-card/60 border border-border/30">
              <span className="text-muted-foreground text-xs block font-semibold">Año</span>
              <span className="font-extrabold text-foreground block mt-0.5 font-mono-tabular">{game.year_published}</span>
            </div>
          ) : null}
        </div>

        {/* Direct Action Drawer Footer */}
        <div className="flex items-center gap-2 pt-2">
          {game.bgg_id && (
            <Button
              variant="outline"
              size="sm"
              className="h-10 px-3.5 rounded-xl font-bold text-xs gap-1.5 border-border/50 text-muted-foreground hover:text-foreground active:scale-[0.97] transition-transform duration-160 ease-out cursor-pointer"
              onClick={() => window.open(`https://boardgamegeek.com/boardgame/${game.bgg_id}`, '_blank', 'noreferrer')}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver en BGG</span>
            </Button>
          )}

          {onLogMatch ? (
            <Button
              size="sm"
              className="flex-1 h-10 px-4 rounded-xl font-black text-xs gap-2 shadow-xs active:scale-[0.97] transition-transform duration-160 ease-out cursor-pointer"
              onClick={() => {
                onLogMatch(game.bgg_id)
                onOpenChange(false)
              }}
            >
              <Zap className="w-4 h-4 text-primary-foreground fill-primary-foreground" />
              <span>Registrar partida</span>
            </Button>
          ) : (
            <Button
              size="sm"
              className="flex-1 h-10 px-4 rounded-xl font-black text-xs gap-2 shadow-xs active:scale-[0.97] transition-transform duration-160 ease-out cursor-pointer"
              onClick={() => {
                if (onProposeGame) onProposeGame(title)
                onOpenChange(false)
              }}
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Proponer para quedada</span>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
