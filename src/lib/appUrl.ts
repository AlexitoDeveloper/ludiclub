/**
 * Canonical App Base URL Helper
 *
 * Resolves the appropriate base URL for external links, QR codes, deep links,
 * and authentication redirects. When running within a native Capacitor WebView
 * (where origin may be capacitor://localhost or localhost without a port),
 * it falls back to the canonical production domain 'https://ludiclub.app'.
 */
export function getAppBaseUrl(): string {
  const envUrl = import.meta.env.VITE_APP_URL
  if (typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/$/, '')
  }

  if (typeof window !== 'undefined') {
    const isCapacitor =
      window.location.protocol === 'capacitor:' ||
      (window.location.hostname === 'localhost' && !window.location.port)

    if (isCapacitor) {
      return 'https://ludiclub.app'
    }

    return window.location.origin
  }

  return 'https://ludiclub.app'
}
