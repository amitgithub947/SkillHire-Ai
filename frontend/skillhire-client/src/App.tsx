import { BrowserRouter } from 'react-router-dom'
import { ServerWakingBanner } from './components/ServerWakingBanner'
import { AuthProvider } from './context/AuthProvider'
import { ThemeProvider } from './context/ThemeProvider'
import { AppRoutes } from './routes/AppRoutes'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
      <ServerWakingBanner />
    </ThemeProvider>
  )
}
