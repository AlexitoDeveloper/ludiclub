import { FormEvent, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useTranslation } from 'react-i18next'

export function useAuthPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/'

  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [tabDir, setTabDir] = useState(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false)
  const [isRecoveryMode, setIsRecoveryMode] = useState(
    searchParams.get('reset') === 'true'
  )

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event in case user clicks magic link
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const switchTab = (next: 'login' | 'register') => {
    setTabDir(next === 'register' ? 1 : -1)
    setTab(next)
    setErrorMsg('')
    setSuccessMsg('')
  }

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setErrorMsg(
        error.message === 'Invalid login credentials'
          ? t('auth.errorInvalidCredentials')
          : error.message
      )
    } else {
      navigate(redirectTo)
    }
  }

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!username.trim()) {
      setErrorMsg(t('auth.errorUsernameRequired'))
      return
    }
    if (!acceptedTerms) {
      setErrorMsg(t('auth.errorTermsRequired'))
      return
    }

    setLoading(true)
    setErrorMsg('')

    const now = new Date().toISOString()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          terms_accepted_at: now,
          privacy_accepted_at: now,
        },
      },
    })

    if (error) {
      setLoading(false)
      setErrorMsg(error.message)
      return
    }

    if (data.user) {
      await supabase.from('users').upsert({
        id: data.user.id,
        username,
        terms_accepted_at: now,
        privacy_accepted_at: now,
      })
    }

    setLoading(false)
    setSuccessMsg(t('auth.successRegistered'))
    switchTab('login')
  }

  const handleRecoverySuccess = () => {
    setIsRecoveryMode(false)
    setSuccessMsg(t('auth.passwordResetSuccess'))
    setTab('login')
  }

  return {
    tab,
    tabDir,
    switchTab,
    email,
    setEmail,
    password,
    setPassword,
    username,
    setUsername,
    acceptedTerms,
    setAcceptedTerms,
    loading,
    errorMsg,
    successMsg,
    isForgotModalOpen,
    setIsForgotModalOpen,
    isRecoveryMode,
    setIsRecoveryMode,
    handleLogin,
    handleRegister,
    handleRecoverySuccess,
  }
}
