import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { User } from '@supabase/supabase-js'
import { Meetup, UserProfile, MeetupMessage } from '../types'
import { USE_MOCKS } from '../lib/config'
import { useBlockedUsers } from './useBlockedUsers'
import { setChatLastRead } from '../lib/chatUtils'

export function useSingleMeetupChat(
  meetupId: string | undefined,
  currentUser: User | null,
  guestReservation: { id: string; name: string } | null,
  meetup: Meetup | null,
  attendees: UserProfile[]
) {
  const [messages, setMessages] = useState<MeetupMessage[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const { isBlocked } = useBlockedUsers()

  const isMock = USE_MOCKS && meetupId ? meetupId.startsWith('mock-') : false

  const isAttendee = useCallback(() => {
    if (!meetupId || !meetup) return false
    if (currentUser) {
      return meetup.creator_id === currentUser.id || Boolean(meetup.joined_players?.includes(currentUser.id))
    }
    if (guestReservation) {
      return attendees.some(attendee => attendee.id === guestReservation.id)
    }
    return false
  }, [meetupId, meetup, currentUser, guestReservation, attendees])

  const getMockDefaultMessages = (mId: string): MeetupMessage[] => {
    const defaults: Record<string, MeetupMessage[]> = {
      'mock-m1': [
        {
          id: 'mock-msg-init1',
          meetup_id: mId,
          user_id: 'mock-u1',
          guest_id: null,
          sender_name: 'boardgamer_alex',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
          content: '¡Hola a todos! Qué ganas de jugar a Terraforming Mars. ¿Alguien se trae la expansión de Preludio?',
          created_at: new Date(Date.now() - 3600000 * 2).toISOString()
        },
        {
          id: 'mock-msg-init2',
          meetup_id: mId,
          user_id: 'mock-u2',
          guest_id: null,
          sender_name: 'meeple_sara',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sara',
          content: '¡Yo la tengo! Me la llevo sin falta. ¿Trae alguien fundas para las cartas?',
          created_at: new Date(Date.now() - 3600000 * 1.5).toISOString()
        }
      ]
    }
    return defaults[mId] || []
  }

  useEffect(() => {
    if (!meetupId) return
    setLoading(true)
    setError(null)

    if (isMock) {
      const storageKey = `ludiclub_mock_chat_${meetupId}`
      const savedMessagesStr = localStorage.getItem(storageKey) || localStorage.getItem(`boardgame_social_mock_chat_${meetupId}`)
      if (savedMessagesStr) {
        setMessages(JSON.parse(savedMessagesStr))
      } else {
        const defaults = getMockDefaultMessages(meetupId)
        setMessages(defaults)
        localStorage.setItem(storageKey, JSON.stringify(defaults))
      }
      setLoading(false)
      return
    }

    const fetchHistory = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('meetup_messages')
          .select('*')
          .eq('meetup_id', meetupId)
          .order('created_at', { ascending: true })

        if (fetchError) throw fetchError
        setMessages((data ?? []).filter((m: MeetupMessage) => !(m.user_id && isBlocked(m.user_id))))
      } catch (err: any) {
        console.error('Error fetching chat history:', err)
        setError(err.message || 'No se pudo cargar el historial del chat.')
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()

    const channel = supabase
      .channel(`meetup_chat_${meetupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'meetup_messages',
          filter: `meetup_id=eq.${meetupId}`
        },
        (payload) => {
          const newMessage = payload.new as MeetupMessage
          // Suppress messages from blocked users in real-time
          if (newMessage.user_id && isBlocked(newMessage.user_id)) return
          setMessages(prev => (prev.some(m => m.id === newMessage.id) ? prev : [...prev, newMessage]))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [meetupId, isMock])

  const sendMessage = async (content: string) => {
    if (!meetupId) return
    const trimmed = content.trim()
    if (!trimmed) return

    if (!isAttendee()) {
      throw new Error('Debes estar unido a la partida para enviar mensajes.')
    }

    let user_id: string | null = null
    let guest_id: string | null = null
    let sender_name = 'Anónimo'
    let avatar_url: string | null = null

    if (currentUser) {
      user_id = currentUser.id
      sender_name = currentUser.user_metadata?.username || currentUser.email?.split('@')[0] || 'Tú'
      avatar_url = currentUser.user_metadata?.avatar_url || null
    } else if (guestReservation) {
      guest_id = guestReservation.id
      sender_name = guestReservation.name
      avatar_url = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(guestReservation.name)}`
    } else {
      throw new Error('No se pudo identificar al remitente del mensaje.')
    }

    if (isMock) {
      const storageKey = `ludiclub_mock_chat_${meetupId}`
      const newMsg: MeetupMessage = {
        id: `mock-msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        meetup_id: meetupId,
        user_id,
        guest_id,
        sender_name,
        avatar_url,
        content: trimmed,
        created_at: new Date().toISOString()
      }
      setMessages(prev => {
        const updated = [...prev, newMsg]
        localStorage.setItem(storageKey, JSON.stringify(updated))
        return updated
      })
      return
    }

    const { error: insertError } = await supabase
      .from('meetup_messages')
      .insert({
        meetup_id: meetupId,
        user_id,
        guest_id,
        sender_name,
        avatar_url,
        content: trimmed
      })

    if (insertError) {
      throw new Error(insertError.message || 'Error al enviar el mensaje.')
    }

    setChatLastRead(meetupId)
  }

  return {
    messages,
    loading,
    error,
    sendMessage,
    isAttendee: isAttendee()
  }
}
