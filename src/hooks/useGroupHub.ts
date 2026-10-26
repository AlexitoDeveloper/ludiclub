import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../lib/authContext'
import { useGroupDetail, GroupMember, GroupGuest, MergedGame, GroupPoll } from './useGroupDetail'
import { supabase } from '../lib/supabaseClient'
import { USE_MOCKS } from '../lib/config'
import { toast } from '../components/ui/toast'
import { getAppBaseUrl } from '../lib/appUrl'

export interface GroupMeetup {
  id: string;
  title: string;
  date: string;
  location?: string | null;
  city?: string | null;
  max_players?: number;
  joined_players?: string[];
  is_online?: boolean;
  gameTitle?: string;
  gameImg?: string | null;
  completed?: boolean;
  winnerName?: string | null;
  winnerScore?: string | number | null;
  boardPhotoUrl?: string | null;
  playerScores?: Array<{ name: string; score: number; meepleColor?: string; isWinner?: boolean }>;
}

export function useGroupHub(groupId: string | undefined) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()

  const groupDetail = useGroupDetail(groupId)
  const { group, members, leaveGroup, deleteGroup, kickMember, refresh: refreshGroup } = groupDetail

  // Meetups for this group (upcoming and past/recorded)
  const [upcomingMeetups, setUpcomingMeetups] = useState<GroupMeetup[]>([])
  const [loadingMeetups, setLoadingMeetups] = useState(true)
  const [pastMeetups, setPastMeetups] = useState<GroupMeetup[]>([])
  const [loadingPastMeetups, setLoadingPastMeetups] = useState(true)

  // Modals & triggers
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [isAddGameModalOpen, setIsAddGameModalOpen] = useState(false)
  const [isQuickLogModalOpen, setIsQuickLogModalOpen] = useState(false)
  const [isPollOpen, setIsPollOpen] = useState(false)

  // Copy feedback
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  // Action error banner
  const [actionError, setActionError] = useState<string | null>(null)

  // Confirmation dialog config
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    confirmText?: string;
    isDestructive?: boolean;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  })

  const triggerConfirm = useCallback((
    title: string,
    description: string,
    onConfirm: () => void,
    confirmText = t('groups.confirmText', 'Confirmar'),
    isDestructive = false
  ) => {
    setConfirmConfig({
      isOpen: true,
      title,
      description,
      onConfirm,
      confirmText,
      isDestructive,
    })
  }, [t])

  // Fetch upcoming meetups
  const fetchUpcomingMeetups = useCallback(async () => {
    if (!groupId) {
      setUpcomingMeetups([])
      setLoadingMeetups(false)
      return
    }

    setLoadingMeetups(true)
    try {
      if (USE_MOCKS) {
        const stored = localStorage.getItem('ludiclub_mock_meetups') || localStorage.getItem('boardgame_social_mock_meetups')
        if (stored) {
          const list = JSON.parse(stored)
          const now = Date.now()
          const matched = list
            .filter((m: any) => m.group_id === groupId && !m.completed && new Date(m.date).getTime() >= now - 1000 * 60 * 60 * 4)
            .map((m: any) => {
              const firstGame = m.games?.[0] || m.meetup_games?.[0]?.games
              return {
                id: m.id,
                title: m.title,
                date: m.date,
                location: m.location,
                city: m.city,
                max_players: m.max_players,
                joined_players: m.joined_players || [],
                is_online: m.is_online,
                gameTitle: firstGame?.title || m.title,
                gameImg: firstGame?.image_url || null,
              }
            })
          setUpcomingMeetups(matched)
        }
        setLoadingMeetups(false)
        return
      }

      const nowIso = new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
      const { data, error } = await supabase
        .from('meetups')
        .select(`
          id,
          title,
          date,
          location,
          city,
          max_players,
          joined_players,
          completed,
          is_online,
          meetup_games (
            game_id,
            games (
              title,
              title_es,
              image_url,
              image_url_es
            )
          )
        `)
        .eq('group_id', groupId)
        .eq('completed', false)
        .gte('date', nowIso)
        .order('date', { ascending: true })

      if (error) throw error

      const mapped: GroupMeetup[] = (data || []).map((m: any) => {
        const firstGame = m.meetup_games?.[0]?.games
        return {
          id: m.id,
          title: m.title,
          date: m.date,
          location: m.location,
          city: m.city,
          max_players: m.max_players,
          joined_players: m.joined_players || [],
          is_online: m.is_online,
          gameTitle: firstGame?.title_es || firstGame?.title || m.title,
          gameImg: firstGame?.image_url_es || firstGame?.image_url || null,
        }
      })
      setUpcomingMeetups(mapped)
    } catch {
      setUpcomingMeetups([])
    } finally {
      setLoadingMeetups(false)
    }
  }, [groupId])

  // Fetch past / completed meetups (including Quick Matches)
  const fetchPastMeetups = useCallback(async () => {
    if (!groupId) {
      setPastMeetups([])
      setLoadingPastMeetups(false)
      return
    }

    setLoadingPastMeetups(true)
    try {
      if (USE_MOCKS) {
        const stored = localStorage.getItem('ludiclub_mock_meetups') || localStorage.getItem('boardgame_social_mock_meetups')
        if (stored) {
          const list = JSON.parse(stored)
          const matched = list
            .filter((m: any) => m.group_id === groupId && m.completed)
            .map((m: any) => {
              const firstGame = m.games?.[0] || m.meetup_games?.[0]?.games
              const winnerEntry = Array.isArray(m.player_scores)
                ? m.player_scores.find((s: any) => s.isWinner)
                : null
              const winnerName = winnerEntry?.name || m.games?.[0]?.winner_name || null
              const winnerScore = winnerEntry?.score ?? m.games?.[0]?.winner_score ?? null

              return {
                id: m.id,
                title: m.title,
                date: m.date,
                location: m.location,
                city: m.city,
                max_players: m.max_players,
                joined_players: m.joined_players || [],
                is_online: m.is_online,
                gameTitle: firstGame?.title_es || firstGame?.title || m.title,
                gameImg: firstGame?.image_url || null,
                completed: true,
                winnerName,
                winnerScore,
                boardPhotoUrl: m.board_photo_url || null,
                playerScores: Array.isArray(m.player_scores) ? m.player_scores : [],
              }
            })
            .reverse()
          setPastMeetups(matched)
        }
        setLoadingPastMeetups(false)
        return
      }

      const { data, error } = await supabase
        .from('meetups')
        .select(`
          id,
          title,
          date,
          location,
          city,
          max_players,
          joined_players,
          completed,
          is_online,
          board_photo_url,
          player_scores,
          meetup_games (
            game_id,
            winner_user_id,
            winner_guest_id,
            winner_score,
            games (
              title,
              title_es,
              image_url,
              image_url_es
            )
          )
        `)
        .eq('group_id', groupId)
        .eq('completed', true)
        .order('date', { ascending: false })

      if (error) throw error

      const mapped: GroupMeetup[] = (data || []).map((m: any) => {
        const firstGame = m.meetup_games?.[0]?.games
        const winnerEntry = Array.isArray(m.player_scores)
          ? m.player_scores.find((s: any) => s.isWinner)
          : null
        const winnerName = winnerEntry?.name || null
        const winnerScore = winnerEntry?.score ?? m.meetup_games?.[0]?.winner_score ?? null

        return {
          id: m.id,
          title: m.title,
          date: m.date,
          location: m.location,
          city: m.city,
          max_players: m.max_players,
          joined_players: m.joined_players || [],
          is_online: m.is_online,
          gameTitle: firstGame?.title_es || firstGame?.title || m.title,
          gameImg: firstGame?.image_url_es || firstGame?.image_url || null,
          completed: true,
          winnerName,
          winnerScore,
          boardPhotoUrl: m.board_photo_url || null,
          playerScores: Array.isArray(m.player_scores) ? m.player_scores : [],
        }
      })
      setPastMeetups(mapped)
    } catch (err) {
      console.error('Error fetching past meetups for group:', err)
      setPastMeetups([])
    } finally {
      setLoadingPastMeetups(false)
    }
  }, [groupId])

  useEffect(() => {
    fetchUpcomingMeetups()
    fetchPastMeetups()
  }, [fetchUpcomingMeetups, fetchPastMeetups])

  // Roles
  const isCreator = useMemo(() => Boolean(group && user && group.creator_id === user.id), [group, user])
  const isAdmin = useMemo(() => {
    if (!user) return false
    if (isCreator) return true
    return members.find(m => m.user_id === user.id)?.role === 'admin'
  }, [members, user, isCreator])

  // Invite actions
  const handleCopyCode = useCallback(() => {
    if (!group) return
    navigator.clipboard.writeText(group.invite_code)
    setCopiedCode(true)
    toast.success(t('toast.inviteCopied', '¡Enlace de invitación copiado al portapapeles!'))
    setTimeout(() => setCopiedCode(false), 2000)
  }, [group, t])

  const handleCopyInviteLink = useCallback(() => {
    if (!group) return
    const inviteUrl = `${getAppBaseUrl()}/grupos?join=${group.invite_code}`
    navigator.clipboard.writeText(inviteUrl)
    setCopiedLink(true)
    toast.success(t('toast.inviteCopied', '¡Enlace de invitación copiado al portapapeles!'))
    setTimeout(() => setCopiedLink(false), 2000)
  }, [group, t])

  const handleShareWhatsApp = useCallback(() => {
    if (!group) return
    const inviteUrl = `${getAppBaseUrl()}/grupos?join=${group.invite_code}`
    const text = t('groups.inviteWhatsAppText', { groupName: group.name, inviteUrl })
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank')
  }, [group, t])

  const handleLeave = useCallback(() => {
    triggerConfirm(
      t('groups.leaveGroupConfirmTitle'),
      t('groups.leaveGroupConfirmDesc'),
      async () => {
        setActionError(null)
        try {
          await leaveGroup()
          navigate('/grupos')
        } catch (err: any) {
          setActionError(err.message || t('groups.leaveGroup'))
        }
      },
      t('groups.leaveGroup'),
      true
    )
  }, [leaveGroup, navigate, t, triggerConfirm])

  const handleDelete = useCallback(() => {
    triggerConfirm(
      t('groups.deleteGroupConfirmTitle'),
      t('groups.deleteGroupConfirmDesc'),
      async () => {
        setActionError(null)
        try {
          await deleteGroup()
          navigate('/grupos')
        } catch (err: any) {
          setActionError(err.message || t('groups.deleteGroup'))
        }
      },
      t('groups.deleteGroup'),
      true
    )
  }, [deleteGroup, navigate, t, triggerConfirm])

  const handleKick = useCallback((targetUserId: string, username: string) => {
    triggerConfirm(
      t('groups.kickMemberConfirmTitle'),
      t('groups.kickMemberConfirmDesc', { username }),
      async () => {
        setActionError(null)
        try {
          await kickMember(targetUserId)
        } catch (err: any) {
          setActionError(err.message || t('groups.kick'))
        }
      },
      t('groups.kick'),
      true
    )
  }, [kickMember, t, triggerConfirm])

  const refreshAll = useCallback(() => {
    refreshGroup()
    fetchUpcomingMeetups()
    fetchPastMeetups()
  }, [refreshGroup, fetchUpcomingMeetups, fetchPastMeetups])

  return {
    ...groupDetail,
    upcomingMeetups,
    loadingMeetups,
    fetchUpcomingMeetups,
    pastMeetups,
    loadingPastMeetups,
    fetchPastMeetups,
    isCreator,
    isAdmin,
    copiedCode,
    copiedLink,
    handleCopyCode,
    handleCopyInviteLink,
    handleShareWhatsApp,
    handleLeave,
    handleDelete,
    handleKick,
    isQrModalOpen,
    setIsQrModalOpen,
    isAddGameModalOpen,
    setIsAddGameModalOpen,
    isQuickLogModalOpen,
    setIsQuickLogModalOpen,
    isPollOpen,
    setIsPollOpen,
    actionError,
    setActionError,
    confirmConfig,
    setConfirmConfig,
    triggerConfirm,
    refreshAll,
  }
}
export type { GroupMember, GroupGuest, MergedGame, GroupPoll };
