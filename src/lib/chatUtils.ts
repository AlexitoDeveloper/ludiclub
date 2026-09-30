import { MeetupMessage } from '../types'

/**
 * Checks whether a message was sent by the current user (either logged-in or guest).
 */
export function isMessageFromUser(
  msg: { user_id?: string | null; guest_id?: string | null },
  userId?: string | null,
  guestResId?: string | null
): boolean {
  if (userId && msg.user_id === userId) return true
  if (guestResId && msg.guest_id === guestResId) return true
  return false
}

export interface CalculateChatUnreadParams {
  messages: MeetupMessage[]
  userId?: string | null
  guestResId?: string | null
  lastReadStr?: string
}

export interface CalculateChatUnreadResult {
  unreadCount: number
  hasUnread: boolean
  lastMsg: MeetupMessage | null
  isLastMsgMine: boolean
  lastMyMsgTime: number
}

/**
 * Computes unread statistics for a conversation.
 * If the last message was sent by the current user, unreadCount is always 0.
 * Any messages before the user's latest sent message are considered already seen.
 */
export function calculateChatUnread({
  messages,
  userId,
  guestResId,
  lastReadStr,
}: CalculateChatUnreadParams): CalculateChatUnreadResult {
  if (!messages || messages.length === 0) {
    return {
      unreadCount: 0,
      hasUnread: false,
      lastMsg: null,
      isLastMsgMine: false,
      lastMyMsgTime: 0,
    }
  }

  // Ensure chronological sorting
  const sorted = [...messages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  const lastMsg = sorted[sorted.length - 1]
  const isLastMsgMine = isMessageFromUser(lastMsg, userId, guestResId)

  // Find the timestamp of the latest message sent by the user in this conversation
  let lastMyMsgTime = 0
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (isMessageFromUser(sorted[i], userId, guestResId)) {
      lastMyMsgTime = new Date(sorted[i].created_at).getTime()
      break
    }
  }

  // If the last message was sent by the user, there are no pending notifications
  if (isLastMsgMine) {
    return {
      unreadCount: 0,
      hasUnread: false,
      lastMsg,
      isLastMsgMine: true,
      lastMyMsgTime,
    }
  }

  const lastReadTime = lastReadStr ? new Date(lastReadStr).getTime() : 0
  const effectiveReadTime = Math.max(lastReadTime, lastMyMsgTime)

  const unreadCount = sorted.filter(
    (msg) =>
      !isMessageFromUser(msg, userId, guestResId) &&
      new Date(msg.created_at).getTime() > effectiveReadTime
  ).length

  return {
    unreadCount,
    hasUnread: unreadCount > 0,
    lastMsg,
    isLastMsgMine: false,
    lastMyMsgTime,
  }
}

/**
 * Retrieves the last read timestamp from localStorage.
 */
export function getChatLastRead(meetupId: string): string {
  if (!meetupId) return ''
  return (
    localStorage.getItem(`ludiclub_chat_last_read_${meetupId}`) ||
    localStorage.getItem(`boardgame_social_chat_last_read_${meetupId}`) ||
    ''
  )
}

/**
 * Stores the last read timestamp in localStorage and dispatches a global update event.
 */
export function setChatLastRead(
  meetupId: string,
  timestamp: string = new Date().toISOString()
): void {
  if (!meetupId) return
  localStorage.setItem(`ludiclub_chat_last_read_${meetupId}`, timestamp)
  window.dispatchEvent(new Event('chat_read_update'))
}
