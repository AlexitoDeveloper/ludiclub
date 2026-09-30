import { LegalLayout } from './LegalLayout'
import { useAuth } from '../../lib/authContext'
import { PrivacyContentEs } from './components/PrivacyContentEs'
import { PrivacyContentEn } from './components/PrivacyContentEn'

export function PrivacyPage() {
  const { language } = useAuth()
  const isEs = language === 'es'

  return (
    <LegalLayout
      title={isEs ? 'Política de Privacidad' : 'Privacy Policy'}
      subtitle={
        isEs
          ? 'Información detallada sobre el tratamiento y protección de tus datos personales conforme al RGPD y la LOPDGDD.'
          : 'Detailed information regarding personal data processing and protection under EU GDPR and Spanish LOPDGDD.'
      }
      lastUpdated="2026-09-28"
    >
      {isEs ? <PrivacyContentEs /> : <PrivacyContentEn />}
    </LegalLayout>
  )
}
