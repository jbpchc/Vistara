import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import ProtectedRoute from '@/routes/ProtectedRoute';
import AppLayout from '@/components/shared/AppLayout';
import { Loader2 } from 'lucide-react';
import ErrorBoundary from '@/components/shared/ErrorBoundary';

// ─── Lazy Loaded Pages (Code Splitting for Production) ───────────────────────

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const NotFoundPage = lazy(() => import('@/pages/shared/NotFoundPage'));

// Guard
const GuardDashboard    = lazy(() => import('@/pages/guard/DashboardPage'));
const ScanPage          = lazy(() => import('@/pages/guard/ScanPage'));
const ManualEntryPage   = lazy(() => import('@/pages/guard/ManualEntryPage'));
const LogsPage          = lazy(() => import('@/pages/guard/LogsPage'));

// Resident
const ResidentDashboard = lazy(() => import('@/pages/resident/DashboardPage'));
const CreatePassPage    = lazy(() => import('@/pages/resident/CreatePassPage'));
const ManagePassesPage  = lazy(() => import('@/pages/resident/ManagePassesPage'));

// Admin
const AdminDashboard    = lazy(() => import('@/pages/admin/DashboardPage'));
const UsersPage         = lazy(() => import('@/pages/admin/UsersPage'));
const ResidentsPage     = lazy(() => import('@/pages/admin/ResidentsPage'));
const PropertiesPage    = lazy(() => import('@/pages/admin/PropertiesPage'));

/**
 * Global suspense fallback for lazy-loaded routes
 */
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="flex flex-col items-center gap-2 text-green-800">
      <Loader2 className="w-8 h-8 spin" />
      <span className="text-sm font-semibold text-gray-500">Loading module...</span>
    </div>
  </div>
);

/**
 * Root redirect — authenticated users land on their role's home.
 */
const RootRedirect = () => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const roleMap = {
    admin:    '/admin/dashboard',
    guard:    '/guard/dashboard',
    resident: '/resident/dashboard',
  };
  return <Navigate to={roleMap[user?.role] || '/login'} replace />;
};

const GUARD_ADMIN = ['guard', 'admin'];

const App = () => (
  <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ── Public ────────────────────────────────────────────── */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/"      element={<RootRedirect />} />

            {/* ── Guard ─────────────────────────────────────────────── */}
            <Route path="/guard/dashboard" element={
              <ProtectedRoute roles={GUARD_ADMIN}><AppLayout><GuardDashboard /></AppLayout></ProtectedRoute>
            } />
            <Route path="/guard/scan" element={
              <ProtectedRoute roles={GUARD_ADMIN}><AppLayout><ScanPage /></AppLayout></ProtectedRoute>
            } />
            <Route path="/guard/manual-entry" element={
              <ProtectedRoute roles={GUARD_ADMIN}><AppLayout><ManualEntryPage /></AppLayout></ProtectedRoute>
            } />
            <Route path="/guard/logs" element={
              <ProtectedRoute roles={GUARD_ADMIN}><AppLayout><LogsPage /></AppLayout></ProtectedRoute>
            } />

            {/* ── Resident ──────────────────────────────────────────── */}
            <Route path="/resident/dashboard" element={
              <ProtectedRoute roles="resident"><AppLayout><ResidentDashboard /></AppLayout></ProtectedRoute>
            } />
            <Route path="/resident/create-pass" element={<Navigate to="/resident/dashboard" replace />} />
            <Route path="/resident/passes"      element={<Navigate to="/resident/dashboard" replace />} />

            {/* ── Admin ─────────────────────────────────────────────── */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute roles="admin"><AppLayout><AdminDashboard /></AppLayout></ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute roles="admin"><AppLayout><UsersPage /></AppLayout></ProtectedRoute>
            } />
            <Route path="/admin/residents" element={
              <ProtectedRoute roles="admin"><AppLayout><ResidentsPage /></AppLayout></ProtectedRoute>
            } />
            <Route path="/admin/properties" element={
              <ProtectedRoute roles="admin"><AppLayout><PropertiesPage /></AppLayout></ProtectedRoute>
            } />

            {/* 404 fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>

        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>
);

export default App;
