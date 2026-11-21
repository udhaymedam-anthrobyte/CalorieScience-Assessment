import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { CalorieScienceProvider } from './context/CalorieScienceContext';
import { LandingPage } from './pages/LandingPage';
import { ClientCompanionPage } from './pages/ClientCompanionPage';
import { PractitionerDashboardPage } from './pages/PractitionerDashboardPage';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';

export default function App() {
  return (
    <CalorieScienceProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/client" element={<ClientCompanionPage />} />
          <Route path="/practitioner" element={<PractitionerDashboardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <OfflineIndicator />
        <Toaster
          position="top-center"
          richColors
          toastOptions={{
            className: 'font-sans text-sm',
          }}
        />
      </BrowserRouter>
    </CalorieScienceProvider>
  );
}
