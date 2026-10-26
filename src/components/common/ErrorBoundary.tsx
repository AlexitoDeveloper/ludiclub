import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card'
import { Button } from '../ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled rendering error:', error, errorInfo)
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-dvh w-full flex items-center justify-center p-4 bg-background selection:bg-primary/30">
          <Card className="w-full max-w-md border-border/80 bg-card shadow-tactile-sm">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 shadow-xs">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <CardTitle className="text-xl font-display font-black tracking-tight text-foreground">
                Algo no salió como esperábamos
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-1">
                Ha ocurrido un error inesperado al renderizar esta sección. Puedes recargar la pantalla o regresar a inicio.
              </CardDescription>
            </CardHeader>

            {import.meta.env.DEV && this.state.error?.message && (
              <CardContent className="pt-2 pb-4">
                <div className="rounded-xl bg-surface-void p-3 font-mono text-xs text-destructive/90 overflow-x-auto border border-border/40">
                  {this.state.error.message}
                </div>
              </CardContent>
            )}

            <CardFooter className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                variant="default"
                className="w-full"
                onClick={this.handleReload}
              >
                <RefreshCw className="w-4 h-4" />
                Recargar página
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={this.handleGoHome}
              >
                <Home className="w-4 h-4" />
                Ir al inicio
              </Button>
            </CardFooter>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
