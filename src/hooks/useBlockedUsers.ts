import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/authContext'

export interface BlockedUserInfo {
  id: string
  username: string
  avatar_url?: string | null
  created_at?: string
}

const MOCK_PROFILES_LOOKUP: Record<string, { username: string; avatar_url: string }> = {
  'mock-u1': { username: 'boardgamer_alex', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
  'mock-u2': { username: 'meeple_sara', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sara' },
  'mock-u3': { username: 'hex_and_counter', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=HexCounter' },
  'mock-u4': { username: 'ludo_valen', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Valen' },
}

export function useBlockedUsers() {
  const { user } = useAuth()
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set())
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserInfo[]>([])
  const [loading, setLoading] = useState(true)

  const fetchBlockedUsers = useCallback(async () => {
    if (!user) {
      setBlockedIds(new Set())
      setBlockedUsers([])
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('user_blocks')
        .select('blocked_user_id, created_at')
        .eq('blocker_id', user.id)

      let ids: string[] = []
      let blockRecords: Array<{ blocked_user_id: string; created_at?: string }> = []

      if (!error && data) {
        blockRecords = data
        ids = data.map((r: { blocked_user_id: string }) => r.blocked_user_id)
      }

      // Merge with local fallback for mock/offline blocks
      try {
        const localBlocksKey = `ludiclub_local_blocks_${user.id}`
        const localStored: string[] = JSON.parse(localStorage.getItem(localBlocksKey) || '[]')
        localStored.forEach((id) => {
          if (!ids.includes(id)) {
            ids.push(id)
            blockRecords.push({ blocked_user_id: id, created_at: new Date().toISOString() })
          }
        })
      } catch {}

      setBlockedIds(new Set(ids))

      if (ids.length === 0) {
        setBlockedUsers([])
        setLoading(false)
        return
      }

      // Fetch user metadata for each blocked id
      const { data: usersData } = await supabase
        .from('users')
        .select('id, username, avatar_url')
        .in('id', ids)

      const usersMap = new Map((usersData || []).map((u: any) => [u.id, u]))

      const fullList: BlockedUserInfo[] = blockRecords.map((rec) => {
        const meta = usersMap.get(rec.blocked_user_id) || MOCK_PROFILES_LOOKUP[rec.blocked_user_id]
        return {
          id: rec.blocked_user_id,
          username: meta?.username || 'Usuario',
          avatar_url: meta?.avatar_url || null,
          created_at: rec.created_at,
        }
      })

      setBlockedUsers(fullList)
    } catch (err) {
      console.warn('Error fetching blocked users:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchBlockedUsers()
  }, [fetchBlockedUsers])

  const isBlocked = useCallback((userId: string) => blockedIds.has(userId), [blockedIds])

  const unblock = useCallback(
    async (targetUserId: string): Promise<boolean> => {
      if (!user) return false

      // Optimistic update
      setBlockedIds((prev) => {
        const next = new Set(prev)
        next.delete(targetUserId)
        return next
      })
      setBlockedUsers((prev) => prev.filter((u) => u.id !== targetUserId))

      // Clean local storage
      try {
        const localBlocksKey = `ludiclub_local_blocks_${user.id}`
        const localStored: string[] = JSON.parse(localStorage.getItem(localBlocksKey) || '[]')
        const updated = localStored.filter((id) => id !== targetUserId)
        localStorage.setItem(localBlocksKey, JSON.stringify(updated))
      } catch {}

      try {
        await supabase
          .from('user_blocks')
          .delete()
          .eq('blocker_id', user.id)
          .eq('blocked_user_id', targetUserId)
        return true
      } catch (err) {
        console.error('Error unblocking user:', err)
        return false
      }
    },
    [user]
  )

  return {
    blockedIds,
    blockedUsers,
    isBlocked,
    unblockUser: unblock,
    refetch: fetchBlockedUsers,
    loading,
  }
}
