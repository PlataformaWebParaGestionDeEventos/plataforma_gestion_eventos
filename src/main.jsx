import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import './styles/index.css'
import './styles/theme.css'
import App from './App.jsx'

// Configuración del QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tiempo antes de considerar los datos obsoletos (5 minutos)
      staleTime: 5 * 60 * 1000,
      // Tiempo que los datos permanecen en cache (10 minutos)
      gcTime: 10 * 60 * 1000,
      // Reintentar automáticamente hasta 3 veces en caso de error
      retry: 3,
      // Intervalo entre reintentos
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch al volver a enfocar la ventana
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Reintentar mutaciones hasta 2 veces
      retry: 2,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
)
