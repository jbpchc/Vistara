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
const ResidentPasses    = lazy(() => import('@/pages/resident/PassesPage'));
const AdminIncidents    = lazy(() => import('@/pages/admin/IncidentsPage'));
const GuardIncidents    = lazy(() => import('@/pages/guard/IncidentsPage'));
const named = (loader, name) => lazy(() => loader().then((m) => ({ default: m[name] })));
const adminPages = () => import('@/pages/admin/AdminPages');
const residentPages = () => import('@/pages/resident/ResidentPages');
const guardPages = () => import('@/pages/guard/GuardPages');
const A = {
  passes: named(adminPages, 'VisitorPasses'), documents: named(adminPages, 'Documents'), review: named(adminPages, 'DocumentReview'),
  items: named(adminPages, 'ItemPasses'), tenants: named(adminPages, 'Tenants'), vehicles: named(adminPages, 'Vehicles'), watchlist: named(adminPages, 'Watchlist'),
  reports: named(adminPages, 'Reports'), audit: named(adminPages, 'AuditLog'), settings: named(adminPages, 'Settings'), notifications: named(adminPages, 'Notifications'),
};
const R = { household: named(residentPages, 'Household'), home: named(residentPages, 'MyHome'), activity: named(residentPages, 'Activity'), account: named(residentPages, 'Account') };
const G = { patrol: named(guardPages, 'Patrol'), more: named(guardPages, 'More') };
const page = (roles, El) => <ProtectedRoute roles={roles}><AppLayout><El /></AppLayout></ProtectedRoute>;

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
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
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
            <Route path="/resident/passes" element={
              <ProtectedRoute roles="resident"><AppLayout><ResidentPasses /></AppLayout></ProtectedRoute>
            } />
            <Route path="/resident/create-pass" element={<Navigate to="/resident/passes#new-pass" replace />} />

            <Route path="/admin/incidents" element={
              <ProtectedRoute roles="admin"><AppLayout><AdminIncidents /></AppLayout></ProtectedRoute>
            } />
            <Route path="/guard/incidents" element={
              <ProtectedRoute roles={GUARD_ADMIN}><AppLayout><GuardIncidents /></AppLayout></ProtectedRoute>
            } />

            {/* ── Admin registry, review and administration ──────────── */}
            <Route path="/admin/passes" element={page('admin', A.passes)} />
            <Route path="/admin/documents" element={page('admin', A.documents)} />
            <Route path="/admin/documents/:id" element={page('admin', A.review)} />
            <Route path="/admin/item-passes" element={page('admin', A.items)} />
            <Route path="/admin/tenants" element={page('admin', A.tenants)} />
            <Route path="/admin/vehicles" element={page('admin', A.vehicles)} />
            <Route path="/admin/watchlist" element={page('admin', A.watchlist)} />
            <Route path="/admin/reports" element={page('admin', A.reports)} />
            <Route path="/admin/audit" element={page('admin', A.audit)} />
            <Route path="/admin/settings" element={page('admin', A.settings)} />
            <Route path="/admin/notifications" element={page('admin', A.notifications)} />

            {/* ── Resident ───────────────────────────────────────────── */}
            <Route path="/resident/household" element={page('resident', R.household)} />
            <Route path="/resident/home" element={page('resident', R.home)} />
            <Route path="/resident/home/:tab" element={page('resident', R.home)} />
            <Route path="/resident/activity" element={page('resident', R.activity)} />
            <Route path="/resident/activity/:tab" element={page('resident', R.activity)} />
            <Route path="/resident/account" element={page('resident', R.account)} />
            <Route path="/resident/account/:tab" element={page('resident', R.account)} />

            {/* ── Guard ──────────────────────────────────────────────── */}
            <Route path="/guard/patrol" element={page(GUARD_ADMIN, G.patrol)} />
            <Route path="/guard/more" element={page(GUARD_ADMIN, G.more)} />
            <Route path="/guard/more/:tab" element={page(GUARD_ADMIN, G.more)} />

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
