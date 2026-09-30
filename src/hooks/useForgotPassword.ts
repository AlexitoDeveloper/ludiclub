import { useState, useEffect, FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useTranslation } from 'react-i18next'

export function useForgotPassword() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const handleSendResetEmail = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email.trim() || cooldown > 0) return

    setLoading(true)
    setErrorMsg('')

    try {
      const redirectTo = `${window.location.origin}/auth?reset=true`
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      })

      if (error) {
        // Log silently or show generic message to avoid email enumeration
        console.error('Password reset request error:', error.message)
      }

      // Always show success state for security anti-enumeration
      setIsSent(true)
      setCooldown(60)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : t('toast.error'))
    } finally {
      setLoading(false)
    }
  }

  const resetState = () => {
    setEmail('')
    setIsSent(false)
    setErrorMsg('')
  }

  return {
    email,
    setEmail,
    loading,
    isSent,
    errorMsg,
    cooldown,
    handleSendResetEmail,
    resetState,
  }
}
