import { useState, useCallback } from 'react'
import { Game } from '../types'

export interface Tier {
  id: string;
  name: string;
  color: string;
  textColor: string;
  games: Game[];
}

export type ActiveTarget = 
  | { type: 'tier'; tierId: string }
  | { type: 'top10'; index: number }
  | null;

export const DEFAULT_TIERS: Tier[] = [
  { id: 'S', name: 'S', color: 'bg-[#C51F5D] text-white', textColor: 'text-white', games: [] },
  { id: 'A', name: 'A', color: 'bg-[#D97706] text-white', textColor: 'text-white', games: [] },
  { id: 'B', name: 'B', color: 'bg-[#243447] text-white', textColor: 'text-white', games: [] },
  { id: 'C', name: 'C', color: 'bg-[#0284C7] text-white', textColor: 'text-white', games: [] },
  { id: 'D', name: 'D', color: 'bg-[#10B981] text-white', textColor: 'text-white', games: [] },
]

export function useTopsPlacement(mode: 'tier' | 'top10') {
  const [tiers, setTiers] = useState<Tier[]>(DEFAULT_TIERS)
  const [top10, setTop10] = useState<(Game | null)[]>(Array(10).fill(null))
  const [pool, setPool] = useState<Game[]>([])
  const [selectedGameForPlacement, setSelectedGameForPlacement] = useState<Game | null>(null)
  
  const [activeTarget, setActiveTarget] = useState<ActiveTarget>(
    mode === 'tier' ? { type: 'tier', tierId: 'S' } : { type: 'top10', index: 0 }
  )

  const isGameInRanking = useCallback((bggId: number) => {
    return (
      pool.some(g => g.bgg_id === bggId) ||
      tiers.some(t => t.games.some(g => g.bgg_id === bggId)) ||
      top10.some(g => g?.bgg_id === bggId)
    )
  }, [pool, tiers, top10])

  const addToPool = useCallback((game: Game) => {
    if (isGameInRanking(game.bgg_id)) return
    setPool(prev => [...prev, game])
  }, [isGameInRanking])

  const removeFromPool = useCallback((bggId: number) => {
    setPool(prev => prev.filter(g => g.bgg_id !== bggId))
    setSelectedGameForPlacement(prev => prev?.bgg_id === bggId ? null : prev)
  }, [])

  const selectGame = useCallback((game: Game) => {
    setSelectedGameForPlacement(prev => prev?.bgg_id === game.bgg_id ? null : game)
  }, [])

  const placeInTier = useCallback((tierId: string) => {
    if (!selectedGameForPlacement) return
    const game = selectedGameForPlacement
    setTiers(prev => prev.map(t => {
      const clean = t.games.filter(g => g.bgg_id !== game.bgg_id)
      return t.id === tierId ? { ...t, games: [...clean, game] } : { ...t, games: clean }
    }))
    removeFromPool(game.bgg_id)
    setSelectedGameForPlacement(null)
  }, [selectedGameForPlacement, removeFromPool])

  const placeInTop10 = useCallback((index: number) => {
    if (!selectedGameForPlacement) return
    const game = selectedGameForPlacement
    const displacedGame = top10[index]

    setTop10(prev => {
      const next = prev.map(g => g?.bgg_id === game.bgg_id ? null : g)
      next[index] = game
      return next
    })

    removeFromPool(game.bgg_id)
    if (displacedGame && displacedGame.bgg_id !== game.bgg_id) {
      setPool(prev => prev.some(g => g.bgg_id === displacedGame.bgg_id) ? prev : [...prev, displacedGame])
    }
    setSelectedGameForPlacement(null)
  }, [selectedGameForPlacement, top10, removeFromPool])

  // 1-Tap quick place for mobile & desktop
  const quickPlaceGame = useCallback((game: Game) => {
    if (isGameInRanking(game.bgg_id)) return

    if (mode === 'top10') {
      const targetIdx = (activeTarget?.type === 'top10') 
        ? activeTarget.index 
        : top10.findIndex(g => g === null)

      if (targetIdx !== -1) {
        setTop10(prev => {
          const next = [...prev]
          next[targetIdx] = game
          return next
        })
        // Auto-advance activeTarget to next empty slot
        const nextEmpty = top10.findIndex((g, idx) => idx > targetIdx && g === null)
        const fallbackEmpty = top10.findIndex(g => g === null)
        const nextSlot = nextEmpty !== -1 ? nextEmpty : (fallbackEmpty !== -1 ? fallbackEmpty : (targetIdx + 1) % 10)
        setActiveTarget({ type: 'top10', index: nextSlot })
      } else {
        setPool(prev => [...prev, game])
      }
    } else {
      const targetTierId = (activeTarget?.type === 'tier') ? activeTarget.tierId : 'S'
      setTiers(prev => prev.map(t => t.id === targetTierId ? { ...t, games: [...t.games, game] } : t))
    }

    removeFromPool(game.bgg_id)
  }, [activeTarget, isGameInRanking, mode, top10, removeFromPool])

  const moveTop10Slot = useCallback((index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1
    if (targetIdx < 0 || targetIdx > 9) return

    setTop10(prev => {
      const next = [...prev]
      const temp = next[index]
      next[index] = next[targetIdx]
      next[targetIdx] = temp
      return next
    })
  }, [])

  const moveTierGame = useCallback((fromTierId: string, toTierId: string, game: Game) => {
    setTiers(prev => prev.map(t => {
      if (t.id === fromTierId) {
        return { ...t, games: t.games.filter(g => g.bgg_id !== game.bgg_id) }
      }
      if (t.id === toTierId) {
        return { ...t, games: [...t.games.filter(g => g.bgg_id !== game.bgg_id), game] }
      }
      return t
    }))
  }, [])

  const returnTierGameToPool = useCallback((tierId: string, game: Game) => {
    setTiers(prev => prev.map(t => t.id === tierId ? { ...t, games: t.games.filter(g => g.bgg_id !== game.bgg_id) } : t))
    setPool(prev => prev.some(g => g.bgg_id === game.bgg_id) ? prev : [...prev, game])
  }, [])

  const returnTop10GameToPool = useCallback((index: number) => {
    const game = top10[index]
    if (!game) return
    setTop10(prev => {
      const next = [...prev]
      next[index] = null
      return next
    })
    setPool(prev => prev.some(g => g.bgg_id === game.bgg_id) ? prev : [...prev, game])
  }, [top10])

  const editTierName = useCallback((tierId: string, newName: string) => {
    setTiers(prev => prev.map(t => t.id === tierId ? { ...t, name: newName } : t))
  }, [])

  const handleClearAll = useCallback(() => {
    setPool([])
    setSelectedGameForPlacement(null)
    setTiers(prev => prev.map(t => ({ ...t, games: [] })))
    setTop10(Array(10).fill(null))
  }, [])

  const handleClearPool = useCallback(() => {
    setPool([])
    setSelectedGameForPlacement(null)
  }, [])

  // Drag and Drop
  const handleDragStart = useCallback((e: React.DragEvent, gameId: number, source: string) => {
    e.dataTransfer.setData('text/plain', gameId.toString())
    e.dataTransfer.setData('source', source)
  }, [])

  const handleDropOnTier = useCallback((tierId: string, draggedBggId: number, source: string) => {
    let gameToPlace: Game | null = null
    if (source === 'pool') {
      gameToPlace = pool.find(g => g.bgg_id === draggedBggId) || null
      if (gameToPlace) removeFromPool(draggedBggId)
    } else if (source.startsWith('top10-')) {
      const idx = Number(source.replace('top10-', ''))
      gameToPlace = top10[idx]
      if (gameToPlace) setTop10(prev => { const n = [...prev]; n[idx] = null; return n })
    } else {
      for (const t of tiers) {
        if (t.id === source) {
          gameToPlace = t.games.find(g => g.bgg_id === draggedBggId) || null
          if (gameToPlace) {
            setTiers(prev => prev.map(pt => pt.id === t.id ? { ...pt, games: pt.games.filter(g => g.bgg_id !== draggedBggId) } : pt))
          }
          break
        }
      }
    }
    if (gameToPlace) {
      setTiers(prev => prev.map(t => {
        const clean = t.games.filter(g => g.bgg_id !== gameToPlace!.bgg_id)
        return t.id === tierId ? { ...t, games: [...clean, gameToPlace!] } : { ...t, games: clean }
      }))
    }
  }, [pool, top10, tiers, removeFromPool])

  const handleDropOnTop10 = useCallback((targetIdx: number, draggedBggId: number, source: string) => {
    let gameToPlace: Game | null = null
    if (source === 'pool') {
      gameToPlace = pool.find(g => g.bgg_id === draggedBggId) || null
      if (gameToPlace) removeFromPool(draggedBggId)
    } else if (source.startsWith('top10-')) {
      const srcIdx = Number(source.replace('top10-', ''))
      gameToPlace = top10[srcIdx]
      if (gameToPlace) setTop10(prev => { const n = [...prev]; n[srcIdx] = null; return n })
    } else {
      for (const t of tiers) {
        if (t.id === source) {
          gameToPlace = t.games.find(g => g.bgg_id === draggedBggId) || null
          if (gameToPlace) {
            setTiers(prev => prev.map(pt => pt.id === t.id ? { ...pt, games: pt.games.filter(g => g.bgg_id !== draggedBggId) } : pt))
          }
          break
        }
      }
    }
    if (gameToPlace) {
      const displaced = top10[targetIdx]
      setTop10(prev => {
        const next = prev.map(g => g?.bgg_id === gameToPlace!.bgg_id ? null : g)
        next[targetIdx] = gameToPlace
        return next
      })
      if (displaced && displaced.bgg_id !== gameToPlace.bgg_id) {
        setPool(prev => prev.some(g => g.bgg_id === displaced.bgg_id) ? prev : [...prev, displaced])
      }
    }
  }, [pool, top10, tiers, removeFromPool])

  const handleDropOnPool = useCallback((draggedBggId: number, source: string) => {
    if (source === 'pool') return
    let gameToReturn: Game | null = null
    if (source.startsWith('top10-')) {
      const srcIdx = Number(source.replace('top10-', ''))
      gameToReturn = top10[srcIdx]
      if (gameToReturn) setTop10(prev => { const n = [...prev]; n[srcIdx] = null; return n })
    } else {
      for (const t of tiers) {
        if (t.id === source) {
          gameToReturn = t.games.find(g => g.bgg_id === draggedBggId) || null
          if (gameToReturn) {
            setTiers(prev => prev.map(pt => pt.id === t.id ? { ...pt, games: pt.games.filter(g => g.bgg_id !== draggedBggId) } : pt))
          }
          break
        }
      }
    }
    if (gameToReturn) {
      setPool(prev => prev.some(g => g.bgg_id === draggedBggId) ? prev : [...prev, gameToReturn!])
    }
  }, [top10, tiers])

  return {
    tiers,
    setTiers,
    top10,
    setTop10,
    pool,
    setPool,
    selectedGameForPlacement,
    setSelectedGameForPlacement,
    activeTarget,
    setActiveTarget,
    isGameInRanking,
    addToPool,
    removeFromPool,
    selectGame,
    placeInTier,
    placeInTop10,
    quickPlaceGame,
    moveTop10Slot,
    moveTierGame,
    returnTierGameToPool,
    returnTop10GameToPool,
    editTierName,
    handleClearAll,
    handleClearPool,
    handleDragStart,
    handleDropOnTier,
    handleDropOnTop10,
    handleDropOnPool,
  }
}
