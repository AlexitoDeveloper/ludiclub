import { useState, useRef, useCallback } from 'react'
import { toPng } from 'html-to-image'
import { toast } from '../components/ui/toast'
import i18n from '../lib/i18n'

export function useTopsExport(rankingTitle: string) {
  const [exporting, setExporting] = useState(false)
  const [isExportingCanvas, setIsExportingCanvas] = useState(false)
  const exportAreaRef = useRef<HTMLDivElement>(null)

  const handleExportImage = useCallback(async () => {
    if (!exportAreaRef.current) return
    setExporting(true)
    setIsExportingCanvas(true)

    try {
      // Allow DOM to settle, hiding interactive edit buttons during canvas snapshot
      await new Promise(resolve => setTimeout(resolve, 180))

      const dataUrl = await toPng(exportAreaRef.current, {
        quality: 0.95,
        pixelRatio: 3,
        backgroundColor: '#030712',
        cacheBust: true,
        includeQueryParams: true,
        style: {
          margin: '0',
          transform: 'none',
        },
      })

      const cleanTitle = (rankingTitle || 'ranking').trim().replace(/\s+/g, '-').toLowerCase()
      const filename = `${cleanTitle}.png`

      if (navigator.share && navigator.canShare) {
        const response = await fetch(dataUrl)
        const blob = await response.blob()
        const file = new File([blob], filename, { type: 'image/png' })

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: rankingTitle || 'Ranking',
            text: i18n.t('tops.shareText', '¡Mira mi ranking de juegos de mesa creado en LudiClub!'),
          })
          toast.success(i18n.t('tops.shareSuccess', '¡Ranking compartido!'))
          return
        }
      }

      const link = document.createElement('a')
      link.download = filename
      link.href = dataUrl
      link.click()
      toast.success(i18n.t('tops.exportSuccess', '¡Imagen PNG descargada con éxito!'))
    } catch (err: unknown) {
      console.error('Error generating image:', err)
      toast.error(i18n.t('tops.exportError', 'No se pudo generar la imagen. Revisa tu conexión.'))
    } finally {
      setExporting(false)
      setIsExportingCanvas(false)
    }
  }, [rankingTitle])

  return {
    exportAreaRef,
    exporting,
    isExportingCanvas,
    handleExportImage,
  }
}
