import { lazy, Suspense, ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AppShell } from './components/layout/AppShell'
import { ExplorePage } from './pages/ExplorePage'
import { useAuth } from './lib/authContext'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { useAndroidBackButton } from './hooks/useAndroidBackButton'

// Secondary and heavy pages lazy-loaded to optimize initial bundle size
const AuthPage = lazy(() => import('./pages/AuthPage').then((m) => ({ default: m.AuthPage })))
const PrivacyPage = lazy(() => import('./pages/legal/PrivacyPage').then((m) => ({ default: m.PrivacyPage })))
const TermsPage = lazy(() => import('./pages/legal/TermsPage').then((m) => ({ default: m.TermsPage })))
const AccountDeletionPage = lazy(() => import('./pages/legal/AccountDeletionPage').then((m) => ({ default: m.AccountDeletionPage })))
const PlayPage = lazy(() => import('./pages/PlayPage').then((m) => ({ default: m.PlayPage })))
const TopsPage = lazy(() => import('./pages/TopsPage').then((m) => ({ default: m.TopsPage })))
const DesignSystemPlaygroundPage = lazy(() => import('./pages/DesignSystemPlaygroundPage').then((m) => ({ default: m.DesignSystemPlaygroundPage })))
const ChatsPage = lazy(() => import('./pages/ChatsPage').then((m) => ({ default: m.ChatsPage })))
const GroupsPage = lazy(() => import('./pages/GroupsPage').then((m) => ({ default: m.GroupsPage })))
const GroupDetailPage = lazy(() => import('./pages/GroupDetailPage').then((m) => ({ default: m.GroupDetailPage })))
const GameDetailPage = lazy(() => import('./pages/GameDetailPage').then((m) => ({ default: m.GameDetailPage })))
const CreateMatchPage = lazy(() => import('./pages/CreateMatchPage').then((m) => ({ default: m.CreateMatchPage })))
const CreateMeetupPage = lazy(() => import('./pages/CreateMeetupPage').then((m) => ({ default: m.CreateMeetupPage })))
const MeetupDetailPage = lazy(() => import('./pages/MeetupDetailPage').then((m) => ({ default: m.MeetupDetailPage })))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })))

/** Minimal loading spinner conforming to design system tokens */
function PageLoadingFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[50vh] w-full flex-1 items-center justify-center p-8 text-muted-foreground"
    >
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
          Cargando...
        </span>
      </div>
    </div>
  )
}

/** Redirects unauthenticated users to /auth with redirect query */
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return null // wait for session check before deciding
  if (!user) {
    const redirectTarget = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/auth?redirectTo=${redirectTarget}`} replace />
  }
  return <>{children}</>
}

function App() {
  useAndroidBackButton()

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoadingFallback />}>
        <Routes>
          {/* Public auth & legal pages – outside AppShell */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/delete-account" element={<AccountDeletionPage />} />

          {/* App shell wraps all in-app pages */}
          <Route element={<AppShell />}>
            {/* Core Discovery & Play Navigation */}
            <Route path="/" element={<ExplorePage />} />
            <Route path="/jugar" element={<PlayPage />} />
            <Route path="/tops" element={<TopsPage />} />
            <Route
              path="/design-system"
              element={
                import.meta.env.DEV ? (
                  <DesignSystemPlaygroundPage />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            {/* Chats */}
            <Route
              path="/chats"
              element={
                <ProtectedRoute>
                  <ChatsPage />
                </ProtectedRoute>
              }
            />

            {/* Groups */}
            <Route
              path="/grupos"
              element={
                <ProtectedRoute>
                  <GroupsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/grupos/:id"
              element={
                <ProtectedRoute>
                  <GroupDetailPage />
                </ProtectedRoute>
              }
            />

            {/* Games / Ludoteca */}
            <Route path="/juegos/:id" element={<GameDetailPage />} />
            <Route path="/juego/:id" element={<Navigate to="/juegos/:id" replace />} />

            {/* Match Logging (Canonical /partida/nueva + /crear-partida alias) */}
            <Route
              path="/partida/nueva"
              element={
                <ProtectedRoute>
                  <CreateMatchPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/crear-partida"
              element={
                <ProtectedRoute>
                  <CreateMatchPage />
                </ProtectedRoute>
              }
            />

            {/* Meetups / Mesas (Static routes first, then parameterized) */}
            <Route
              path="/mesa/nueva"
              element={
                <ProtectedRoute>
                  <CreateMeetupPage />
                </ProtectedRoute>
              }
            />
            <Route path="/crear-mesa" element={<Navigate to="/mesa/nueva" replace />} />
            <Route
              path="/mesa/:id/edit"
              element={
                <ProtectedRoute>
                  <CreateMeetupPage />
                </ProtectedRoute>
              }
            />
            <Route path="/mesa/:id" element={<MeetupDetailPage />} />
            <Route path="/mesa" element={<Navigate to="/jugar" replace />} />

            {/* User Profiles */}
            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route path="/perfil/:id" element={<ProfilePage />} />

            {/* Fallback 404 handler */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}

export default App
