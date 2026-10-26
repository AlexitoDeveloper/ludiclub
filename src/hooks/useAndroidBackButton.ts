import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

/**
 * Listens to Capacitor / Cordova 'backbutton' document events on Android
 * and navigates back in React Router when not on the root page ('/').
 */
export function useAndroidBackButton() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handleBackButton = (event: Event) => {
      // Prevent default hardware back button action (such as closing webview)
      event.preventDefault()

      if (location.pathname !== '/') {
        navigate(-1)
      }
    }

    document.addEventListener('backbutton', handleBackButton)
    return () => {
      document.removeEventListener('backbutton', handleBackButton)
    }
  }, [location.pathname, navigate])
}
