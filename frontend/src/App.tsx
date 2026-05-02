import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from './lib/theme';
import { AuthProvider, useAuth } from './lib/auth';
import { handleGoogleRedirect } from './lib/googleAuth';
import Sidebar from './components/Sidebar';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/portal/Dashboard';
import Keys from './pages/portal/Keys';
import Usage from './pages/portal/Usage';
import Plan from './pages/portal/Plan';
import AdminOverview from './pages/admin/Overview';
import AdminClients from './pages/admin/Clients';
import AdminAnomalies from './pages/admin/Anomalies';
import AdminAudit from './pages/admin/Audit';
import OnboardingTour from './components/OnboardingTour';
import { useState, useEffect } from 'react';

handleGoogleRedirect();

function ProtectedRoute({ adminOnly = false }: { adminOnly?: boolean }) {
  const { user, profile, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-parchment dark:bg-void flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary dark:border-teal border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/auth" replace />;
  if (adminOnly && profile?.role !== 'admin') return <Navigate to="/portal" replace />;
  return <Outlet />;
}

function PortalLayout() {
  const { profile, user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    if (user && !localStorage.getItem('villageapi-onboarded')) {
      const fetchApiKey = async () => {
        try {
          const rawApiUrl = import.meta.env.VITE_API_URL ?? '/api';
          const normalizedApiUrl = rawApiUrl.replace(/\/$/, '');
          const apiRoot = normalizedApiUrl.startsWith('/') || normalizedApiUrl.startsWith('http')
            ? normalizedApiUrl
            : `/${normalizedApiUrl}`;
          const apiBase = apiRoot.endsWith('/api') ? apiRoot : `${apiRoot}/api`;
          const res = await fetch(`${apiBase}/user-profile`, {
            credentials: 'include',
          });
          if (res.ok) {
            const data = await res.json();
            if (data.api_keys && data.api_keys.length > 0) {
              setApiKey(data.api_keys[0].api_key);
              setShowOnboarding(true);
            }
          }
        } catch (err) {
          console.error('Failed to fetch API key:', err);
        }
      };
      fetchApiKey();
    }
  }, [user]);

  return (
    <div className="flex min-h-screen bg-parchment dark:bg-void">
      <Sidebar type="portal" />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
      {showOnboarding && (
        <OnboardingTour
          apiKey={apiKey}
          onComplete={() => setShowOnboarding(false)}
        />
      )}
    </div>
  );
}

function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-parchment dark:bg-void">
      <Sidebar type="admin" />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<PortalLayout />}>
                <Route path="/portal" element={<Dashboard />} />
                <Route path="/portal/keys" element={<Keys />} />
                <Route path="/portal/usage" element={<Usage />} />
                <Route path="/portal/plan" element={<Plan />} />
              </Route>
            </Route>
            <Route element={<ProtectedRoute adminOnly />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminOverview />} />
                <Route path="/admin/clients" element={<AdminClients />} />
                <Route path="/admin/anomalies" element={<AdminAnomalies />} />
                <Route path="/admin/audit" element={<AdminAudit />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}