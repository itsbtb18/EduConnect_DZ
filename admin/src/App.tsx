import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoadingOutlined } from '@ant-design/icons';

import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import Dashboard from './pages/Dashboard';
import StudentList from './pages/students/StudentList';
import StudentDetail from './pages/students/StudentDetail';
import TeacherList from './pages/teachers/TeacherList';
import GradeManagement from './pages/grades/GradeManagement';
import AttendancePage from './pages/attendance/AttendancePage';
import AnnouncementsPage from './pages/announcements/AnnouncementsPage';
import MessagingPage from './pages/messaging/MessagingPage';
import FinancialPage from './pages/financial/FinancialPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import TimetablePage from './pages/timetable/TimetablePage';
import SettingsPage from './pages/settings/SettingsPage';
import UserManagement from './pages/users/UserManagement';
import SchoolManagement from './pages/schools/SchoolManagement';
import NotificationsPage from './pages/notifications/NotificationsPage';
import HomeworkPage from './pages/homework/HomeworkPage';

// Super Admin pages
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import PlanManagement from './pages/superadmin/PlanManagement';
import PlatformSettings from './pages/superadmin/PlatformSettings';
import SuperAdminAnalytics from './pages/superadmin/SuperAdminAnalytics.tsx';
import ActivityLogsPage from './pages/superadmin/ActivityLogsPage';
import SystemHealthPage from './pages/superadmin/SystemHealthPage';

// Academics
import ClassManagement from './pages/academics/ClassManagement';

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
    colorPrimary: '#1A6BFF',
    borderRadius: 10,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    colorBgContainer: '#FFFFFF',
    colorTextBase: '#1F2937',
    colorBgLayout: '#F1F5F9',
  },
  components: {
    Button: { borderRadius: 10, controlHeight: 38, fontWeight: 600 },
    Table: { borderRadius: 12 },
    Input: { borderRadius: 10 },
    Select: { borderRadius: 10 },
    Modal: { borderRadiusLG: 18 },
    Card: { borderRadiusLG: 14 },
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
        <Route path="/dashboard" element={<SchoolAdminGuard><Dashboard /></SchoolAdminGuard>} />
        <Route path="/users" element={<SchoolAdminGuard><UserManagement /></SchoolAdminGuard>} />
        <Route path="/students" element={<SchoolAdminGuard><StudentList /></SchoolAdminGuard>} />
        <Route path="/students/:id" element={<SchoolAdminGuard><StudentDetail /></SchoolAdminGuard>} />
        <Route path="/teachers" element={<SchoolAdminGuard><TeacherList /></SchoolAdminGuard>} />
        <Route path="/classes" element={<SchoolAdminGuard><ClassManagement /></SchoolAdminGuard>} />
        <Route path="/grades" element={<SchoolAdminGuard><GradeManagement /></SchoolAdminGuard>} />
        <Route path="/attendance" element={<SchoolAdminGuard><AttendancePage /></SchoolAdminGuard>} />
        <Route path="/announcements" element={<SchoolAdminGuard><AnnouncementsPage /></SchoolAdminGuard>} />
        <Route path="/messaging" element={<SchoolAdminGuard><MessagingPage /></SchoolAdminGuard>} />
        <Route path="/financial" element={<SchoolAdminGuard><FinancialPage /></SchoolAdminGuard>} />
        <Route path="/analytics" element={<SchoolAdminGuard><AnalyticsPage /></SchoolAdminGuard>} />
        <Route path="/timetable" element={<SchoolAdminGuard><TimetablePage /></SchoolAdminGuard>} />
        <Route path="/notifications" element={<SchoolAdminGuard><NotificationsPage /></SchoolAdminGuard>} />
        <Route path="/homework" element={<SchoolAdminGuard><HomeworkPage /></SchoolAdminGuard>} />
        <Route path="/settings" element={<SchoolAdminGuard><SettingsPage /></SchoolAdminGuard>} />
      </Route>
      <Route path="*" element={<Navigate to={defaultPath} replace />} />
    </Routes>
  );
};

const App: React.FC = () => (
  <ConfigProvider theme={theme}>
    <QueryClientProvider client={queryClient}>
      <AntApp>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </AntApp>
    </QueryClientProvider>
  </ConfigProvider>
);

export default App;
