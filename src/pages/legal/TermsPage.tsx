import { LegalLayout } from './LegalLayout'
import { useAuth } from '../../lib/authContext'
import { TermsContentEs } from './components/TermsContentEs'
import { TermsContentEn } from './components/TermsContentEn'

export function TermsPage() {
  const { language } = useAuth()
  const isEs = language === 'es'

  return (
    <LegalLayout
      title={isEs ? 'Términos de Servicio y Normas de la Comunidad' : 'Terms of Service & Community Rules'}
      subtitle={
        isEs
          ? 'Condiciones generales de uso, normas de convivencia, políticas UGC y aviso legal de Ludiclub.'
          : 'General terms of use, community standards, UGC policies, and legal notices for Ludiclub.'
      }
      lastUpdated="2026-09-28"
    >
      {isEs ? <TermsContentEs /> : <TermsContentEn />}
    </LegalLayout>
  )
}
