import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ShipmentProvider } from './context/ShipmentContext';
import { GlobalNotificationToasts } from './components/common/GlobalNotificationToasts';
import { EmergencyBroadcastBanner } from './components/common/EmergencyBroadcastBanner';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/common/Header';

// Pages
import { LandingPage } from './pages/LandingPage';
import { PublicTrackerPage } from './pages/PublicTrackerPage';
import { LoginPage } from './pages/LoginPage';
import { TransparencyStatsPage } from './pages/TransparencyStatsPage';
import { DashboardLayout } from './pages/dashboards/DashboardLayout';
import { SuperAdminDashboard } from './pages/dashboards/SuperAdminDashboard';
import { ImporterDashboard } from './pages/dashboards/ImporterDashboard';
import { ShippingDashboard } from './pages/dashboards/ShippingDashboard';
import { PortOperatorDashboard } from './pages/dashboards/PortOperatorDashboard';
import { CustomsDashboard } from './pages/dashboards/CustomsDashboard';
import { TransportDashboard } from './pages/dashboards/TransportDashboard';
import { FinanceDashboard } from './pages/dashboards/FinanceDashboard';
import { RegistrationDashboard } from './pages/dashboards/RegistrationDashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <ShipmentProvider>
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased transition-colors duration-200">
              <EmergencyBroadcastBanner />
              <GlobalNotificationToasts />
              <Header />
              <div className="flex-1">
                <Routes>
                  {/* Public Unauthenticated Routes */}
                  <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
                  <Route path="/track/:id" element={<PublicTrackerPage />} />
                  <Route path="/statistics" element={<TransparencyStatsPage />} />

                  {/* Stakeholder Role Dashboards */}
                  <Route path="/dashboard" element={<DashboardLayout />}>
                    <Route index element={<Navigate to="/dashboard/super-admin" replace />} />
                    <Route path="admin" element={<SuperAdminDashboard />} />
                    <Route path="super-admin" element={<SuperAdminDashboard />} />
                    <Route path="importer" element={<ImporterDashboard />} />
                    <Route path="importer-supplier" element={<ImporterDashboard />} />
                    <Route path="shipping" element={<ShippingDashboard />} />
                    <Route path="shipping-company" element={<ShippingDashboard />} />
                    <Route path="port" element={<PortOperatorDashboard />} />
                    <Route path="port-operator" element={<PortOperatorDashboard />} />
                    <Route path="customs" element={<CustomsDashboard />} />
                    <Route path="customs-authority" element={<CustomsDashboard />} />
                    <Route path="forwarder" element={<TransportDashboard />} />
                    <Route path="transport-forwarder" element={<TransportDashboard />} />
                    <Route path="finance" element={<FinanceDashboard />} />
                    <Route path="financial-insurance" element={<FinanceDashboard />} />
                    <Route path="registration" element={<RegistrationDashboard />} />
                    <Route path="vehicle-registration" element={<RegistrationDashboard />} />
                  </Route>

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </div>
          </BrowserRouter>
            </ShipmentProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
  );
};

export default App;
