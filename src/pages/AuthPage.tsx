import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '../components/ui/card'
import { useTranslation } from 'react-i18next'
import { LoginForm } from '../components/auth/LoginForm'
import { RegisterForm } from '../components/auth/RegisterForm'
import { ResetPasswordForm } from '../components/auth/ResetPasswordForm'
import { ForgotPasswordModal } from '../components/auth/ForgotPasswordModal'
import { AuthTabs } from '../components/auth/AuthTabs'
import { useAuthPage } from '../hooks/useAuthPage'

const MotionDiv = motion.div

const tabVars = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
}

export function AuthPage() {
  const { t } = useTranslation()
  const {
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
    handleLogin,
    handleRegister,
    handleRecoverySuccess,
  } = useAuthPage()

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center p-4">
      {/* Background blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <MotionDiv
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Branding */}
        <div className="text-center mb-8">
          <p className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
            {t('auth.title')}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {t('auth.subtitle')}
          </p>
        </div>

        <Card className="bg-card border border-border shadow-xl rounded-[24px]">
          {!isRecoveryMode && (
            <AuthTabs activeTab={tab} onTabChange={switchTab} />
          )}

          <CardContent className="pt-6 pb-8 px-6">
            {/* Feedback messages */}
            <AnimatePresence>
              {successMsg && (
                <MotionDiv
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-5"
                >
                  <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3">
                    {successMsg}
                  </div>
                </MotionDiv>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {errorMsg && (
                <MotionDiv
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-5"
                >
                  <div className="text-destructive bg-destructive/10 px-4 py-3 rounded-lg text-sm font-medium border border-destructive/20">
                    {errorMsg}
                  </div>
                </MotionDiv>
              )}
            </AnimatePresence>

            {/* Content view */}
            {isRecoveryMode ? (
              <ResetPasswordForm onSuccess={handleRecoverySuccess} />
            ) : (
              <AnimatePresence mode="wait" custom={tabDir}>
                {tab === 'login' ? (
                  <MotionDiv
                    key="login"
                    custom={tabDir}
                    variants={tabVars}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.25 }}
                  >
                    <LoginForm
                      email={email}
                      setEmail={setEmail}
                      password={password}
                      setPassword={setPassword}
                      loading={loading}
                      onSubmit={handleLogin}
                      onForgotPassword={() => setIsForgotModalOpen(true)}
                    />
                  </MotionDiv>
                ) : (
                  <MotionDiv
                    key="register"
                    custom={tabDir}
                    variants={tabVars}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.25 }}
                  >
                    <RegisterForm
                      username={username}
                      setUsername={setUsername}
                      email={email}
                      setEmail={setEmail}
                      password={password}
                      setPassword={setPassword}
                      acceptedTerms={acceptedTerms}
                      setAcceptedTerms={setAcceptedTerms}
                      loading={loading}
                      onSubmit={handleRegister}
                    />
                  </MotionDiv>
                )}
              </AnimatePresence>
            )}
          </CardContent>
        </Card>
      </MotionDiv>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        open={isForgotModalOpen}
        onOpenChange={setIsForgotModalOpen}
      />
    </div>
  )
}

export default AuthPage
