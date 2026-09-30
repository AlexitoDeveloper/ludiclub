import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/authContext'
import { useBlockedUsers } from './useBlockedUsers'
import { Meetup, MeetupMessage, Game } from '../types'
import { USE_MOCKS } from '../lib/config'

export function useMeetupChat(activeMeetupId: string | null) {
  const { user } = useAuth()
  const { isBlocked } = useBlockedUsers()

  const [meetups, setMeetups] = useState<Meetup[]>([])
  const [allMessages, setAllMessages] = useState<MeetupMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [readTimestamps, setReadTimestamps] = useState<Record<string, string>>({})
  const [hiddenChats, setHiddenChats] = useState<string[]>([])

  // Load hidden chats from localStorage
  useEffect(() => {
    const hiddenStr = localStorage.getItem('ludiclub_hidden_chats') || localStorage.getItem('boardgame_social_hidden_chats')
    if (hiddenStr) {
      try {
        setHiddenChats(JSON.parse(hiddenStr))
      } catch {
        setHiddenChats([])
      }
    }
  }, [])

  // Load read timestamps from localStorage
  useEffect(() => {
    const stamps: Record<string, string> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('ludiclub_chat_last_read_')) {
        stamps[key.replace('ludiclub_chat_last_read_', '')] = localStorage.getItem(key) || ''
      } else if (key?.startsWith('boardgame_social_chat_last_read_')) {
        const id = key.replace('boardgame_social_chat_last_read_', '')
        if (!stamps[id]) stamps[id] = localStorage.getItem(key) || ''
      }
    }
    setReadTimestamps(stamps)
  }, [])

  const markAsRead = useCallback((meetupId: string) => {
    const nowStr = new Date().toISOString()
    localStorage.setItem(`ludiclub_chat_last_read_${meetupId}`, nowStr)
    setReadTimestamps(prev => ({ ...prev, [meetupId]: nowStr }))
    window.dispatchEvent(new Event('chat_read_update'))
  }, [])

  const getReservation = useCallback((meetupId: string) => {
    const str = localStorage.getItem('ludiclub_guest_reservations') || localStorage.getItem('boardgame_social_guest_reservations')
    const parsed = str ? JSON.parse(str) : {}
    return parsed[meetupId] || null
  }, [])

  // Fetch meetups and messages
  useEffect(() => {
    if (!user) return

    async function loadChatsData() {
      setLoading(true)
      setErrorMsg('')

      const guestReservationsStr = localStorage.getItem('ludiclub_guest_reservations') || localStorage.getItem('boardgame_social_guest_reservations')
      const guestReservations = guestReservationsStr ? JSON.parse(guestReservationsStr) : {}
      const guestMeetupIds = Object.keys(guestReservations)

      const orParts = [`creator_id.eq.${user?.id}`, `joined_players.cs.{${user?.id}}`]
      if (guestMeetupIds.length > 0) orParts.push(`id.in.(${guestMeetupIds.join(',')})`)

      try {
        const { data: meetupsData, error: meetupsError } = await supabase
          .from('meetups')
          .select('*, users:users!meetups_creator_id_fkey (*), meetup_games(game_id, winner_user_id, winner_guest_id, games(*)), meetup_guests:meetup_guests!meetup_guests_meetup_id_fkey (id, guest_name)')
          .or(orParts.join(','))
          .order('date', { ascending: false })

        if (meetupsError) throw meetupsError

        const fetchedMeetups = (meetupsData || []).map((m: any) => {
          const mg = m.meetup_games || []
          const mGames = mg.map((item: any) => item.games ? { ...item.games, winner_user_id: item.winner_user_id, winner_guest_id: item.winner_guest_id } : null).filter(Boolean) as Game[]
          return { ...m, games: mGames }
        }) as Meetup[]

        setMeetups(fetchedMeetups)

        if (fetchedMeetups.length > 0) {
          const meetupIds = fetchedMeetups.map(m => m.id)
          const { data: messagesData, error: messagesError } = await supabase
            .from('meetup_messages')
            .select('*')
            .in('meetup_id', meetupIds)
            .order('created_at', { ascending: true })

          if (messagesError) throw messagesError
          setAllMessages((messagesData as MeetupMessage[]) || [])
        }
      } catch (err: any) {
        console.error('Error loading chat conversations:', err)
        setErrorMsg(err.message || 'Error al obtener tus salas de chat.')
      } finally {
        setLoading(false)
      }
    }

    loadChatsData()
  }, [user])

  // Realtime subscription for incoming messages
  useEffect(() => {
    if (meetups.length === 0) return
    const meetupIds = meetups.map(m => m.id)

    const channel = supabase
      .channel('chats_page_global_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'meetup_messages' }, (payload) => {
        const newMsg = payload.new as MeetupMessage
        if (!meetupIds.includes(newMsg.meetup_id)) return

        setAllMessages(prev => {
          const newMsg = payload.new as MeetupMessage
          if (!meetupIds.includes(newMsg.meetup_id)) return prev
          // Suppress messages from blocked users in real-time
          if (newMsg.user_id && isBlocked(newMsg.user_id)) return prev
          return prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]
        })

        // Auto-unhide if new message arrives
        setHiddenChats(prev => {
          if (!prev.includes(newMsg.meetup_id)) return prev
          const updated = prev.filter(id => id !== newMsg.meetup_id)
          localStorage.setItem('ludiclub_hidden_chats', JSON.stringify(updated))
          return updated
        })

        if (activeMeetupId === newMsg.meetup_id) {
          markAsRead(activeMeetupId)
        } else {
          window.dispatchEvent(new Event('chat_read_update'))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [meetups, activeMeetupId, markAsRead])

  // Send message to active meetup
  const sendMessage = useCallback(async (content: string): Promise<boolean> => {
    if (!activeMeetupId || !content.trim() || !user) return false
    const trimmed = content.trim()
    setSending(true)

    const guestRes = getReservation(activeMeetupId)
    const activeM = meetups.find(m => m.id === activeMeetupId)
    if (!activeM) {
      setSending(false)
      return false
    }

    const user_id = guestRes ? null : user.id
    const guest_id = guestRes ? guestRes.id : null
    const sender_name = guestRes ? guestRes.name : (user.user_metadata?.username || user.email?.split('@')[0] || 'Tú')
    const avatar_url = guestRes
      ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(guestRes.name)}`
      : (user.user_metadata?.avatar_url || null)

    try {
      const { error } = await supabase.from('meetup_messages').insert({
        meetup_id: activeMeetupId,
        user_id,
        guest_id,
        sender_name,
        avatar_url,
        content: trimmed
      })
      if (error) throw error
      markAsRead(activeMeetupId)
      return true
    } catch (err: any) {
      console.error('Error sending message:', err)
      setErrorMsg(err.message || 'Error al enviar el mensaje.')
      return false
    } finally {
      setSending(false)
    }
  }, [activeMeetupId, user, meetups, getReservation, markAsRead])

  const hideConversation = useCallback((meetupId: string) => {
    const updated = [...hiddenChats, meetupId]
    setHiddenChats(updated)
    localStorage.setItem('ludiclub_hidden_chats', JSON.stringify(updated))
  }, [hiddenChats])

  const deleteMeetup = useCallback(async (meetupId: string) => {
    const isMock = USE_MOCKS && meetupId.startsWith('mock-')
    if (isMock) {
      setMeetups(prev => prev.filter(m => m.id !== meetupId))
      return
    }
    const { error } = await supabase.from('meetups').delete().eq('id', meetupId)
    if (error) throw error
    setMeetups(prev => prev.filter(m => m.id !== meetupId))
  }, [])

  const visibleMeetups = useMemo(() => meetups.filter(m => !hiddenChats.includes(m.id)), [meetups, hiddenChats])
  const activeMeetup = useMemo(() => meetups.find(m => m.id === activeMeetupId) || null, [meetups, activeMeetupId])
  const activeGame = useMemo(() => {
    if (!activeMeetup?.games) return null
    return (Array.isArray(activeMeetup.games) ? activeMeetup.games[0] : activeMeetup.games) as Game
  }, [activeMeetup])
  const activeChatMessages = useMemo(
    () => allMessages.filter(m => m.meetup_id === activeMeetupId && !(m.user_id && isBlocked(m.user_id))),
    [allMessages, activeMeetupId, isBlocked]
  )

  return {
    meetups,
    visibleMeetups,
    allMessages,
    activeMeetup,
    activeGame,
    activeChatMessages,
    loading,
    sending,
    errorMsg,
    readTimestamps,
    markAsRead,
    sendMessage,
    hideConversation,
    deleteMeetup,
    getReservation,
    setErrorMsg
  }
}
