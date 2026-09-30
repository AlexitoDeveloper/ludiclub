import { useState, FormEvent } from 'react'
import { LegalLayout } from './LegalLayout'
import { useAuth } from '../../lib/authContext'
import { supabase } from '../../lib/supabaseClient'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Form } from '../../components/ui/form'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { CheckCircle2, Loader2, Trash2 } from 'lucide-react'

export function AccountDeletionPage() {
  const { language } = useAuth()
  const isEs = language === 'es'
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setErrorMsg(null)
    const { error } = await supabase
      .from('account_deletion_requests')
      .insert({ email: email.trim().toLowerCase(), status: 'pending', requested_at: new Date().toISOString() })
    setLoading(false)
    if (error) {
      setErrorMsg(
        isEs
          ? 'Error al enviar la solicitud. Inténtalo de nuevo.'
          : 'Failed to submit the request. Please try again.'
      )
      return
    }
    setSubmitted(true)
  }

  return (
    <LegalLayout
      title={isEs ? 'Eliminación de Cuenta y Datos Personales' : 'Account & Personal Data Deletion'}
      subtitle={
        isEs
          ? 'Instrucciones y solicitud para borrar de forma definitiva tu cuenta y datos en Ludiclub.'
          : 'Instructions and form to permanently delete your account and personal data from Ludiclub.'
      }
      lastUpdated="2026-09-23"
    >
      <div className="space-y-6">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground">
            {isEs ? '1. Eliminación Inmediata dentro de la App' : '1. Immediate In-App Deletion'}
          </h2>
          <p>
            {isEs
              ? 'Si tienes la aplicación instalada en tu dispositivo Android o navegador:'
              : 'If you have the app installed on your device or browser:'}
          </p>
          <ol className="list-decimal pl-5 space-y-1.5 text-muted-foreground">
            <li>{isEs ? 'Abre Ludiclub e inicia sesión en tu cuenta.' : 'Open Ludiclub and log in.'}</li>
            <li>{isEs ? 'Ve a la pestaña de Perfil y pulsa en el icono de Ajustes (⚙️).' : 'Go to Profile and tap Settings (⚙️).'}</li>
            <li>{isEs ? 'Desplázate hasta la sección de "Zona de Peligro" y pulsa "Eliminar cuenta".' : 'Scroll to Danger Zone and tap "Delete account".'}</li>
            <li>{isEs ? 'Confirma la acción. Tu cuenta, sesiones y datos serán borrados permanentemente.' : 'Confirm action. Your account, sessions, and data will be permanently wiped.'}</li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground">
            {isEs ? '2. ¿Qué datos se eliminan?' : '2. What data is deleted?'}
          </h2>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>{isEs ? 'Credenciales de acceso (correo electrónico y autenticación).' : 'Authentication credentials (email and password hash).'}</li>
            <li>{isEs ? 'Perfil público (nombre, foto de avatar en almacenamiento).' : 'Public profile (name, avatar photo).'}</li>
            <li>{isEs ? 'Partidas creadas, invitaciones y mensajes en chats.' : 'Created meetups, invitations, and chat records.'}</li>
            <li>{isEs ? 'Colecciones de juegos, votos en encuestas y rankings.' : 'Game collections, poll votes, and tier lists.'}</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground">
            {isEs ? '3. Solicitud Web de Eliminación (Sin tener la app)' : '3. Web Deletion Request (Without the app)'}
          </h2>
          <p className="text-muted-foreground">
            {isEs
              ? 'Si ya no tienes acceso a la app o la has desinstalado, puedes solicitar la baja inmediata introduciendo el correo asociado a tu cuenta:'
              : 'If you have uninstalled the app or lost access, you can submit a manual deletion request below:'}
          </p>

          <Card className="max-w-md border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-destructive" />
                <span>{isEs ? 'Formulario de Baja Definitiva' : 'Account Deletion Request'}</span>
              </CardTitle>
              <CardDescription className="text-xs">
                {isEs
                  ? 'Recibirás un correo de verificación para autorizar el borrado.'
                  : 'You will receive a confirmation email to authorize deletion.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <p>
                    {isEs
                      ? 'Solicitud recibida. Te hemos enviado un correo de confirmación para procesar la baja.'
                      : 'Request received. We sent a verification email to process the deletion.'}
                  </p>
                </div>
              ) : (
                <Form onSubmit={handleSubmit} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="del-email" className="text-xs">
                      {isEs ? 'Correo Electrónico de tu Cuenta' : 'Account Email'}
                    </Label>
                    <Input
                      id="del-email"
                      type="email"
                      required
                      placeholder="tu-correo@ejemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <Button type="submit" variant="destructive" size="sm" className="w-full" disabled={loading}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {isEs ? 'Enviando...' : 'Submitting...'}
                      </span>
                    ) : (
                      isEs ? 'Solicitar Borrado Permanente' : 'Request Permanent Deletion'
                    )}
                  </Button>
                  {errorMsg && (
                    <p className="text-destructive text-xs mt-2">{errorMsg}</p>
                  )}
                </Form>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </LegalLayout>
  )
}
