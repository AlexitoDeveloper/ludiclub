import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Game } from '../../types'
import { useGameLocale } from '../../hooks/useGameLocale'
import { useTranslation } from 'react-i18next'

interface TopsGameCoverProps {
  game: Game;
  isLandscape?: boolean;
  onRemove?: () => void;
  isExportingCanvas?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function TopsGameCover({
  game,
  isLandscape = false,
  onRemove,
  isExportingCanvas = false,
  size = 'md',
}: TopsGameCoverProps) {
  const { t } = useTranslation()
  const { getGameTitle } = useGameLocale()
  const [hasError, setHasError] = useState(false)

  const imageDim = isLandscape ? 48 : size === 'sm' ? 44 : size === 'lg' ? 80 : 64
  const proxiedUrl = game.image_url
    ? `https://images.weserv.nl/?url=${encodeURIComponent(game.image_url)}&w=${imageDim * 2}&h=${imageDim * 2}&fit=cover`
    : null

  const title = getGameTitle(game)

  return (
    <div
      className={`group relative rounded-lg overflow-hidden border border-white/10 shadow bg-zinc-900 shrink-0 flex items-center justify-center select-none ${
        isLandscape
          ? 'w-10 h-10 sm:w-11 sm:h-11'
          : size === 'sm'
          ? 'w-10 h-10'
          : size === 'lg'
          ? 'w-16 h-16 sm:w-20 sm:h-20'
          : 'w-12 h-12 sm:w-14 sm:h-14'
      }`}
    >
      {proxiedUrl && !hasError ? (
        <img
          src={proxiedUrl}
          alt={title}
          className="w-full h-full object-cover transition-opacity"
          crossOrigin="anonymous"
          onError={() => setHasError(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center p-1 text-[10px] font-bold text-center text-zinc-300 bg-zinc-950/80 line-clamp-2 leading-tight">
          {title}
        </div>
      )}

      {/* Hover action cover on non-export mode */}
      {!isExportingCanvas && onRemove && (
        <div
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer"
          title={t('common.remove', 'Quitar')}
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-400 drop-shadow" />
        </div>
      )}
    </div>
  )
}
