import { HashRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Index from '@/pages/Index'
import DeviceEmulator from '@/pages/DeviceEmulator'
import NotFound from '@/pages/NotFound'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/emulator" element={<DeviceEmulator />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </QueryClientProvider>
  )
}

export default App
