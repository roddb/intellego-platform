'use client'

import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Check if this is a ChunkLoadError and handle it specially
    if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
      console.warn('ChunkLoadError detected, attempting to reload...')
      
      // Optionally auto-reload after a short delay for chunk errors
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
    
    this.setState({
      error,
      errorInfo
    })
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      // Check if a custom fallback was provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} retry={this.retry} />
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <h2 className="text-xl font-bold text-slate-800 mb-2">
                Oops, algo salió mal
              </h2>
              
              <p className="text-slate-600 mb-6">
                {this.state.error?.name === 'ChunkLoadError' || this.state.error?.message.includes('Loading chunk')
                  ? 'Error de carga de recursos. La página se recargará automáticamente...'
                  : 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.'}
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={this.retry}
                  className="w-full bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors font-medium"
                >
                  Intentar nuevamente
                </button>
                
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors font-medium"
                >
                  Recargar página
                </button>
              </div>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 p-3 bg-slate-50 rounded border text-left">
                  <summary className="cursor-pointer font-medium text-sm text-slate-700">
                    Detalles del error (modo desarrollo)
                  </summary>
                  <pre className="mt-2 text-xs text-slate-600 overflow-auto">
                    {this.state.error.name}: {this.state.error.message}
                    {this.state.error.stack && '\n\n' + this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook for functional components to handle chunk loading errors
export function useChunkErrorHandler() {
  React.useEffect(() => {
    const handleChunkError = (event: Event) => {
      // Handle chunk loading errors globally
      if (event.type === 'error' && 
          (event as ErrorEvent).message?.includes('Loading chunk') ||
          (event as ErrorEvent).error?.name === 'ChunkLoadError') {
        
        console.warn('Global chunk loading error detected, reloading page...')
        
        // Show user-friendly message
        if (window.confirm('Se ha detectado un error de carga. ¿Deseas recargar la página?')) {
          window.location.reload()
        }
      }
    }

    // Listen for global error events
    window.addEventListener('error', handleChunkError)
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.name === 'ChunkLoadError') {
        handleChunkError(event as any)
      }
    })

    return () => {
      window.removeEventListener('error', handleChunkError)
      window.removeEventListener('unhandledrejection', handleChunkError as any)
    }
  }, [])
}

export default ErrorBoundary