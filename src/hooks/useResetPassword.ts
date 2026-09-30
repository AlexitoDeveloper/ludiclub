import { useState, FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useTranslation } from 'react-i18next'

export function useResetPassword(onSuccess?: () => void) {
  const { t } = useTranslation()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleUpdatePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMsg('')

    if (password.length < 6) {
      setErrorMsg(t('auth.passwordHelp'))
      return
    }

    if (password !== confirmPassword) {
      setErrorMsg(t('auth.passwordsDoNotMatch'))
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        setErrorMsg(error.message)
      } else {
        setIsSuccess(true)
        setPassword('')
        setConfirmPassword('')
        if (onSuccess) {
          onSuccess()
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : t('toast.error'))
    } finally {
      setLoading(false)
    }
  }

  return {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    loading,
    errorMsg,
    isSuccess,
    handleUpdatePassword,
  }
}
