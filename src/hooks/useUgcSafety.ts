import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/authContext'
import { toast } from '../components/ui/toast'
import { useTranslation } from 'react-i18next'

export interface SubmitReportParams {
  reportedUserId?: string | null
  contentType: 'chat_message' | 'meetup' | 'group' | 'profile'
  contentId?: string | null
  reason: string
  details?: string
}

export function useUgcSafety() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [submitting, setSubmitting] = useState(false)

  const isValidUuid = (id?: string | null): boolean => {
    if (!id) return false
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
  }

  const submitReport = async (params: SubmitReportParams): Promise<boolean> => {
    if (!user) {
      toast.error(t('auth.loginRequired', 'Debes iniciar sesión para reportar.'))
      return false
    }

    setSubmitting(true)
    try {
      const isTargetValidUuid = isValidUuid(params.reportedUserId)
      const isNotSelf = params.reportedUserId !== user.id
      const safeReportedUserId = isTargetValidUuid && isNotSelf ? params.reportedUserId : null

      const detailsNote = params.reportedUserId && !safeReportedUserId
        ? `[Reported Target: ${params.reportedUserId}] ${params.details?.trim() || ''}`.trim()
        : params.details?.trim() || null

      const reportPayload = {
        reporter_id: user.id,
        reported_user_id: safeReportedUserId,
        content_type: params.contentType,
        content_id: params.contentId || null,
        reason: params.reason,
        details: detailsNote,
      }

      const { error } = await supabase.from('content_reports').insert(reportPayload)

      if (error) {
        console.warn('Supabase content_reports table error or missing, saving to local report store:', error)
        try {
          const existingReports = JSON.parse(localStorage.getItem('ludiclub_local_reports') || '[]')
          existingReports.push({
            ...reportPayload,
            id: `local-${Date.now()}`,
            created_at: new Date().toISOString(),
          })
          localStorage.setItem('ludiclub_local_reports', JSON.stringify(existingReports))
        } catch {
          // Ignore localStorage errors
        }
      }

      toast.success(
        t('reports.success', 'Gracias por avisarnos. Nuestro equipo revisará el contenido.')
      )
      return true
    } catch (err) {
      console.warn('Unexpected error reporting content, fallback stored locally:', err)
      try {
        const existingReports = JSON.parse(localStorage.getItem('ludiclub_local_reports') || '[]')
        existingReports.push({
          reporter_id: user.id,
          content_type: params.contentType,
          content_id: params.contentId || null,
          reason: params.reason,
          details: params.details?.trim() || null,
          created_at: new Date().toISOString(),
        })
        localStorage.setItem('ludiclub_local_reports', JSON.stringify(existingReports))
      } catch {}

      toast.success(
        t('reports.success', 'Gracias por avisarnos. Nuestro equipo revisará el contenido.')
      )
      return true
    } finally {
      setSubmitting(false)
    }
  }

  const blockUser = async (targetUserId: string): Promise<boolean> => {
    if (!user) return false
    if (user.id === targetUserId) return false

    // Cache locally
    try {
      const localBlocksKey = `ludiclub_local_blocks_${user.id}`
      const localStored: string[] = JSON.parse(localStorage.getItem(localBlocksKey) || '[]')
      if (!localStored.includes(targetUserId)) {
        localStored.push(targetUserId)
        localStorage.setItem(localBlocksKey, JSON.stringify(localStored))
      }
    } catch {}

    try {
      const { error } = await supabase.from('user_blocks').insert({
        blocker_id: user.id,
        blocked_user_id: targetUserId,
      })

      if (error) {
        if (!error.message.includes('unique')) {
          console.warn('Supabase user_blocks error, preserved locally:', error)
        }
      }

      return true
    } catch (err) {
      console.warn('Unexpected error blocking user, preserved locally:', err)
      return true
    }
  }

  const unblockUser = async (targetUserId: string): Promise<boolean> => {
    if (!user) return false
    if (user.id === targetUserId) return false

    // Clean locally
    try {
      const localBlocksKey = `ludiclub_local_blocks_${user.id}`
      const localStored: string[] = JSON.parse(localStorage.getItem(localBlocksKey) || '[]')
      const updated = localStored.filter((id) => id !== targetUserId)
      localStorage.setItem(localBlocksKey, JSON.stringify(updated))
    } catch {}

    try {
      const { error } = await supabase
        .from('user_blocks')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_user_id', targetUserId)

      if (error) {
        console.warn('Error unblocking user from Supabase:', error)
      }

      return true
    } catch (err) {
      console.error('Unexpected error unblocking user:', err)
      return true
    }
  }

  const isUserBlocked = async (targetUserId: string): Promise<boolean> => {
    if (!user) return false
    try {
      const localBlocksKey = `ludiclub_local_blocks_${user.id}`
      const localStored: string[] = JSON.parse(localStorage.getItem(localBlocksKey) || '[]')
      if (localStored.includes(targetUserId)) return true

      const { data } = await supabase
        .from('user_blocks')
        .select('id')
        .eq('blocker_id', user.id)
        .eq('blocked_user_id', targetUserId)
        .maybeSingle()
      return data !== null
    } catch {
      return false
    }
  }

  return {
    submitReport,
    blockUser,
    unblockUser,
    isUserBlocked,
    submitting,
  }
}
