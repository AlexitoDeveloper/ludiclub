import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react'

interface ImageLightboxModalProps {
  images: string[]
  initialIndex?: number
  isOpen: boolean
  onClose: () => void
  title?: string
}

export function ImageLightboxModal({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  title
}: ImageLightboxModalProps) {
  const { t } = useTranslation()
  const displayTitle = title || t('lightbox.defaultTitle')
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex)
  const [isZoomed, setIsZoomed] = React.useState(false)

  React.useEffect(() => {
    setCurrentIndex(initialIndex)
    setIsZoomed(false)
  }, [initialIndex, isOpen])

  const total = images.length
  const currentImage = images[currentIndex] || images[0]

  const handleNext = React.useCallback(() => {
    if (total <= 1) return
    setCurrentIndex((prev) => (prev + 1) % total)
    setIsZoomed(false)
  }, [total])

  const handlePrev = React.useCallback(() => {
    if (total <= 1) return
    setCurrentIndex((prev) => (prev - 1 + total) % total)
    setIsZoomed(false)
  }, [total])

  React.useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, handleNext, handlePrev, onClose])

  if (!isOpen || !currentImage) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='max-w-[95vw] sm:max-w-4xl max-h-[92vh] p-0 border-border/40 bg-black/95 overflow-hidden flex flex-col items-center justify-between text-white shadow-2xl rounded-2xl'>
        <DialogTitle className='sr-only'>{displayTitle}</DialogTitle>

        <div className='w-full flex items-center justify-between px-4 py-3 bg-black/60 backdrop-blur-xs border-b border-white/10 z-20'>
          <div className='flex items-center gap-2'>
            <span className='text-xs font-bold text-white/80'>{displayTitle}</span>
            {total > 1 && (
              <span className='text-xs font-black uppercase px-2 py-0.5 rounded-md bg-white/10 text-white/90'>
                {currentIndex + 1} / {total}
              </span>
            )}
          </div>
          <div className='flex items-center gap-1.5'>
            <Button
              variant='ghost'
              size='icon-xs'
              onClick={() => setIsZoomed((z) => !z)}
              className='text-white hover:bg-white/15'
              title={isZoomed ? t('lightbox.zoomOut') : t('lightbox.zoomIn')}
            >
              {isZoomed ? <ZoomOut className='w-4 h-4' /> : <ZoomIn className='w-4 h-4' />}
            </Button>
            <Button
              variant='ghost'
              size='icon-xs'
              onClick={onClose}
              className='text-white hover:bg-white/15'
              title={t('lightbox.close')}
            >
              <X className='w-4 h-4' />
            </Button>
          </div>
        </div>

        <div className='relative w-full flex-1 flex items-center justify-center overflow-auto p-2 sm:p-4 min-h-[50vh] max-h-[78vh]'>
          {total > 1 && (
            <Button
              variant='ghost'
              size='icon-sm'
              onClick={handlePrev}
              className='absolute left-3 top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/60 hover:bg-black/80 border border-white/15 text-white'
              title={t('lightbox.prev')}
            >
              <ChevronLeft className='w-5 h-5' />
            </Button>
          )}

          <img
            src={currentImage}
            alt={displayTitle}
            onClick={() => setIsZoomed((z) => !z)}
            className={"transition-transform duration-200 select-none rounded-lg max-h-[74vh] object-contain cursor-zoom-in " + (isZoomed ? "scale-150 cursor-zoom-out" : "scale-100")}
          />

          {total > 1 && (
            <Button
              variant='ghost'
              size='icon-sm'
              onClick={handleNext}
              className='absolute right-3 top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/60 hover:bg-black/80 border border-white/15 text-white'
              title={t('lightbox.next')}
            >
              <ChevronRight className='w-5 h-5' />
            </Button>
          )}
        </div>

        {total > 1 && (
          <div className='w-full flex items-center justify-center gap-2 p-2.5 bg-black/60 backdrop-blur-xs border-t border-white/10 z-20 overflow-x-auto'>
            {images.map((img, idx) => (
              <Button
                key={idx}
                type='button'
                variant='ghost'
                onClick={() => {
                  setCurrentIndex(idx)
                  setIsZoomed(false)
                }}
                className={"w-12 h-12 p-0 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer " + (idx === currentIndex ? "border-primary scale-105 shadow-md shadow-primary/30" : "border-white/20 opacity-60 hover:opacity-100")}
              >
                <img src={img} alt='' className='w-full h-full object-cover' />
              </Button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
