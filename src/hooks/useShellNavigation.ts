import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/authContext'
import { useTheme } from '../lib/useTheme'
import { supabase } from '../lib/supabaseClient'
import { calculateChatUnread, getChatLastRead } from '../lib/chatUtils'

export function useShellNavigation() {
  const { user, signOut, language, setLanguage } = useAuth()
  const { isDark, toggle: toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const [showQuickActions, setShowQuickActions] = useState(false)
  const [unreadChats, setUnreadChats] = useState(0)
  const [showBggOnboarding, setShowBggOnboarding] = useState(false)

  const isChatPage = location.pathname.startsWith('/chats')
  const hasActiveChat = isChatPage && new URLSearchParams(location.search).has('id')
  const isProfileActive = location.pathname.startsWith('/perfil')
  const isGameDetailPage = location.pathname.startsWith('/juegos/')
  const isCreateMatchPage = location.pathname.startsWith('/partida/nueva') || location.pathname.startsWith('/crear-partida')

  // Reset vertical scroll on every route transition & close open quick actions
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    document.body.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    setShowQuickActions(false)
  }, [location.pathname])

  // Check if express BGG onboarding is needed
  useEffect(() => {
    if (!user) return

    // 1. If explicit query ?onboarding=true is set, open it
    const searchParams = new URLSearchParams(location.search)
    if (searchParams.get('onboarding') === 'true') {
      setShowBggOnboarding(true)
      return
    }

    // 2. If already marked as onboarded in localStorage, don't open
    if (localStorage.getItem(`bgg_onboarded_${user.id}`) === 'true') {
      return
    }

    // 3. If user has bgg_username in metadata, they are already synced
    if (user.user_metadata?.bgg_username) {
      localStorage.setItem(`bgg_onboarded_${user.id}`, 'true')
      return
    }

    // 4. Check if user already has games in mock collection
    const mockCollStr = localStorage.getItem(`ludiclub_mock_collection_${user.id}`) || localStorage.getItem(`boardgame_social_mock_collection_${user.id}`)
    if (mockCollStr) {
      try {
        const parsed = JSON.parse(mockCollStr)
        if (Array.isArray(parsed) && parsed.length > 0) {
          localStorage.setItem(`bgg_onboarded_${user.id}`, 'true')
          return
        }
      } catch {}
    }

    // 5. Query Supabase user_collection to verify if user already has games
    let isCancelled = false
    const checkUserCollection = async () => {
      try {
        const { count, error } = await supabase
          .from('user_collection')
          .select('game_id', { count: 'exact', head: true })
          .eq('user_id', user.id)

        if (error) return

        if (count && count > 0) {
          localStorage.setItem(`bgg_onboarded_${user.id}`, 'true')
          return
        }

        if (!isCancelled && !localStorage.getItem(`bgg_onboarded_${user.id}`)) {
          setShowBggOnboarding(true)
        }
      } catch {
        // Silently skip if query fails
      }
    }

    checkUserCollection()
    return () => {
      isCancelled = true
    }
  }, [user, location.search])

  // Function to calculate and update unread chats count
  const updateUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadChats(0)
      return
    }

    const guestReservationsStr = localStorage.getItem('ludiclub_guest_reservations') || localStorage.getItem('boardgame_social_guest_reservations')
    const guestReservations = guestReservationsStr ? JSON.parse(guestReservationsStr) : {}
    const guestMeetupIds = Object.keys(guestReservations)

    const orParts = [
      `creator_id.eq.${user.id}`,
      `joined_players.cs.{${user.id}}`
    ]
    if (guestMeetupIds.length > 0) {
      orParts.push(`id.in.(${guestMeetupIds.join(',')})`)
    }

    try {
      const { data: meetupsData } = await supabase
        .from('meetups')
        .select('id')
        .or(orParts.join(','))

      if (meetupsData && meetupsData.length > 0) {
        const ids = meetupsData.map(m => m.id)
        const { data: msgsData } = await supabase
          .from('meetup_messages')
          .select('meetup_id, created_at, user_id, guest_id')
          .in('meetup_id', ids)

        if (msgsData) {
          let count = 0
          ids.forEach(mId => {
            const lastReadStr = getChatLastRead(mId)
            const guestRes = guestReservations[mId]
            const meetupMsgs = msgsData.filter(m => m.meetup_id === mId)
            
            const { unreadCount } = calculateChatUnread({
              messages: meetupMsgs as any,
              userId: user.id,
              guestResId: guestRes?.id,
              lastReadStr,
            })

            if (unreadCount > 0) {
              count++
            }
          })
          setUnreadChats(count)
        }
      } else {
        setUnreadChats(0)
      }
    } catch (err) {
      console.error("Error updating unread count in useShellNavigation:", err)
    }
  }, [user])

  // Sync on mount, auth change, and subscribe to realtime chat updates
  useEffect(() => {
    updateUnreadCount()

    window.addEventListener('chat_read_update', updateUnreadCount)

    const channel = supabase
      .channel('app_shell_chat_counter_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'meetup_messages'
        },
        () => {
          updateUnreadCount()
        }
      )
      .subscribe()

    return () => {
      window.removeEventListener('chat_read_update', updateUnreadCount)
      supabase.removeChannel(channel)
    }
  }, [user, updateUnreadCount])

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  return {
    user,
    language,
    setLanguage,
    isDark,
    toggleTheme,
    unreadChats,
    showQuickActions,
    setShowQuickActions,
    showBggOnboarding,
    setShowBggOnboarding,
    isChatPage,
    hasActiveChat,
    isProfileActive,
    isGameDetailPage,
    isCreateMatchPage,
    pathname: location.pathname,
    handleSignOut,
    navigate,
  }
}
