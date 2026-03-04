import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoadingOutlined } from '@ant-design/icons';
import { useSchoolProfile } from './hooks/useApi';
import { ToastProvider } from './components/ui/Toast.tsx';
import { ConfirmProvider } from './components/ui/ConfirmDialog.tsx';

import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import Dashboard from './pages/Dashboard';
import StudentList from './pages/students/StudentList';
import StudentDetail from './pages/students/StudentDetail';
import StudentProfilePage from './pages/students/StudentProfilePage';
import TeacherList from './pages/teachers/TeacherList';
import TeacherProfilePage from './pages/teachers/TeacherProfilePage';
import GradeManagement from './pages/grades/GradeManagement';
import GradesFullPage from './pages/grades/GradesFullPage';
import AttendancePage from './pages/attendance/AttendancePage';
import AnnouncementsPage from './pages/announcements/AnnouncementsPage';
import MessagingPage from './pages/messaging/MessagingPage';
import FinancialPage from './pages/financial/FinancialPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import TimetablePage from './pages/timetable/TimetablePage';
import SettingsPage from './pages/settings/SettingsPage';
import UserManagement from './pages/users/UserManagement';
import SchoolManagement from './pages/schools/SchoolManagement';
import NotificationsPage from './pages/notifications/NotificationsPage.tsx';
import HomeworkPage from './pages/homework/HomeworkPage';

// Super Admin pages
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import PlanManagement from './pages/superadmin/PlanManagement';
import PlatformSettings from './pages/superadmin/PlatformSettings';
import SuperAdminAnalytics from './pages/superadmin/SuperAdminAnalytics.tsx';
import ActivityLogsPage from './pages/superadmin/ActivityLogsPage.tsx';
import SystemHealthPage from './pages/superadmin/SystemHealthPage.tsx';

// Academics
import ClassManagement from './pages/academics/ClassManagement';

// Setup Wizard
import SetupWizard from './pages/setup/SetupWizard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000,
    },
  },
});

const theme = {
  token: {
    colorPrimary: '#00C9A7',
    borderRadius: 10,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    colorBgContainer: '#FFFFFF',
    colorBgElevated: '#FFFFFF',
    colorBgLayout: '#FFFFFF',
    colorBgSpotlight: '#F7F9FC',
    colorTextBase: '#0F2044',
    colorText: '#4A5568',
    colorTextSecondary: '#94A3B8',
    colorTextTertiary: '#CBD5E0',
    colorTextQuaternary: '#E2E8F0',
    colorBorder: '#E2E8F0',
    colorBorderSecondary: '#F1F5F9',
    colorFill: 'rgba(0, 0, 0, 0.04)',
    colorFillSecondary: 'rgba(0, 0, 0, 0.03)',
    colorFillTertiary: 'rgba(0, 0, 0, 0.02)',
    colorLink: '#00C9A7',
    colorSuccess: '#10B981',
    colorWarning: '#F59E0B',
    colorError: '#EF4444',
    colorInfo: '#3B82F6',
    controlItemBgHover: 'rgba(0, 201, 167, 0.06)',
    controlItemBgActive: 'rgba(0, 201, 167, 0.10)',
  },
  components: {
    Button: { borderRadius: 10, controlHeight: 42, fontWeight: 600 },
    Table: { borderRadius: 12, headerBg: '#F7F9FC', rowHoverBg: '#F7F9FC' },
    Input: { borderRadius: 10, activeBorderColor: '#00C9A7', hoverBorderColor: '#CBD5E0' },
    Select: { borderRadius: 10 },
    Modal: { borderRadiusLG: 16, contentBg: '#FFFFFF', headerBg: '#FFFFFF' },
    Card: { borderRadiusLG: 12 },
    Menu: { itemBg: '#FFFFFF', subMenuItemBg: '#F7F9FC' },
  },
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <LoadingOutlined />
        <span>Chargement...</span>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

/** Guard that only allows SUPER_ADMIN role */
const SuperAdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (user?.role !== 'SUPER_ADMIN') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

/** Guard that blocks SUPER_ADMIN from school-level routes */
const SchoolAdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (user?.role === 'SUPER_ADMIN') return <Navigate to="/platform/dashboard" replace />;

  return <>{children}</>;
};

/** Guard that redirects to setup wizard if school setup is not completed */
const SetupRedirectGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const { data: schoolProfile, isLoading } = useSchoolProfile({ enabled: !isSuperAdmin });

  if (isSuperAdmin) return <>{children}</>;
  if (isLoading) return null; // Wait for profile to load

  const school = schoolProfile as { setup_completed?: boolean } | undefined;
  if (school && school.setup_completed === false) {
    return <Navigate to="/setup" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const defaultPath = isSuperAdmin ? '/platform/dashboard' : '/dashboard';

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* ── Super Admin routes (guarded) ── */}
        <Route path="/platform/dashboard" element={<SuperAdminGuard><SuperAdminDashboard /></SuperAdminGuard>} />
        <Route path="/platform/schools" element={<SuperAdminGuard><SchoolManagement /></SuperAdminGuard>} />
        <Route path="/platform/users" element={<SuperAdminGuard><UserManagement /></SuperAdminGuard>} />
        <Route path="/platform/plans" element={<SuperAdminGuard><PlanManagement /></SuperAdminGuard>} />
        <Route path="/platform/analytics" element={<SuperAdminGuard><SuperAdminAnalytics /></SuperAdminGuard>} />
        <Route path="/platform/settings" element={<SuperAdminGuard><PlatformSettings /></SuperAdminGuard>} />
        <Route path="/platform/activity-logs" element={<SuperAdminGuard><ActivityLogsPage /></SuperAdminGuard>} />
        <Route path="/platform/system-health" element={<SuperAdminGuard><SystemHealthPage /></SuperAdminGuard>} />
        <Route path="/platform/notifications" element={<SuperAdminGuard><NotificationsPage /></SuperAdminGuard>} />

        {/* ── School Admin routes (guarded) ── */}
        <Route path="/setup" element={<SchoolAdminGuard><SetupWizard /></SchoolAdminGuard>} />
        <Route path="/dashboard" element={<SchoolAdminGuard><SetupRedirectGuard><Dashboard /></SetupRedirectGuard></SchoolAdminGuard>} />
        <Route path="/users" element={<SchoolAdminGuard><SetupRedirectGuard><UserManagement /></SetupRedirectGuard></SchoolAdminGuard>} />
        <Route path="/students" element={<SchoolAdminGuard><SetupRedirectGuard><StudentList /></SetupRedirectGuard></SchoolAdminGuard>} />
        <Route path="/students/:id" element={<SchoolAdminGuard><SetupRedirectGuard><StudentDetail /></SetupRedirectGuard></SchoolAdminGuard>} />
        <Route path="/students/:id/profile" element={<SchoolAdminGuard><SetupRedirectGuard><StudentProfilePage /></SetupRedirectGuard></SchoolAdminGuard>} />
        <Route path="/teachers" element={<SchoolAdminGuard><SetupRedirectGuard><TeacherList /></SetupRedirectGuard></SchoolAdminGuard>} />
        <Route path="/teachers/:id/profile" element={<SchoolAdminGuard><SetupRedirectGuard><TeacherProfilePage /></SetupRedirectGuard></SchoolAdminGuard>} />
        <Route path="/classes" element={<SchoolAdminGuard><SetupRedirectGuard><ClassManagement /></SetupRedirectGuard></SchoolAdminGuard>} />
        <Route path="/grades" element={<SchoolAdminGuard><SetupRedirectGuard><GradeManagement /></SetupRedirectGuard></SchoolAdminGuard>} />
        <Route path="/notes-bulletins" element={<SchoolAdminGuard><SetupRedirectGuard><GradesFullPage /></SetupRedirectGuard></SchoolAdminGuard>} />
        <Route path="/attendance" element={<SchoolAdminGuard><SetupRedirectGuard><AttendancePage /></SetupRedirectGuard></SchoolAdminGuard>} />
        <Route path="/announcements" element={<SchoolAdminGuard><SetupRedirectGuard><AnnouncementsPage /></SetupRedirectGuard></SchoolAdminGuard>} />
        <Route path="/messaging" element={<SchoolAdminGuard><SetupRedirectGuard><MessagingPage /></SetupRedirectGuard></SchoolAdminGuard>} />
        <Route path="/financial" element={<SchoolAdminGuard><SetupRedirectGuard><FinancialPage /></SetupRedirectGuard></SchoolAdminGuard>} />
        <Route path="/analytics" element={<SchoolAdminGuard><SetupRedirectGuard><AnalyticsPage /></SetupRedirectGuard></SchoolAdminGuard>} />
        <Route path="/timetable" element={<SchoolAdminGuard><SetupRedirectGuard><TimetablePage /></SetupRedirectGuard></SchoolAdminGuard>} />
        <Route path="/notifications" element={<SchoolAdminGuard><SetupRedirectGuard><NotificationsPage /></SetupRedirectGuard></SchoolAdminGuard>} />
        <Route path="/homework" element={<SchoolAdminGuard><SetupRedirectGuard><HomeworkPage /></SetupRedirectGuard></SchoolAdminGuard>} />
        <Route path="/settings" element={<SchoolAdminGuard><SetupRedirectGuard><SettingsPage /></SetupRedirectGuard></SchoolAdminGuard>} />
      </Route>
      <Route path="*" element={<Navigate to={defaultPath} replace />} />
    </Routes>
  );
};

const App: React.FC = () => (
  <ConfigProvider theme={theme}>
    <QueryClientProvider client={queryClient}>
      <AntApp>
        <ToastProvider>
          <ConfirmProvider>
            <BrowserRouter>
              <AuthProvider>
                <AppRoutes />
              </AuthProvider>
            </BrowserRouter>
          </ConfirmProvider>
        </ToastProvider>
      </AntApp>
    </QueryClientProvider>
  </ConfigProvider>
);

export default App;
