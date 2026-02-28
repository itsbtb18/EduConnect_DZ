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

// Super Admin pages
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import PlanManagement from './pages/superadmin/PlanManagement';
import PlatformSettings from './pages/superadmin/PlatformSettings';

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
        {/* ── Super Admin routes ── */}
        <Route path="/platform/dashboard" element={<SuperAdminDashboard />} />
        <Route path="/platform/schools" element={<SchoolManagement />} />
        <Route path="/platform/users" element={<UserManagement />} />
        <Route path="/platform/plans" element={<PlanManagement />} />
        <Route path="/platform/analytics" element={<AnalyticsPage />} />
        <Route path="/platform/settings" element={<PlatformSettings />} />

        {/* ── School Admin routes ── */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/students" element={<StudentList />} />
        <Route path="/students/:id" element={<StudentDetail />} />
        <Route path="/teachers" element={<TeacherList />} />
        <Route path="/grades" element={<GradeManagement />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/messaging" element={<MessagingPage />} />
        <Route path="/financial" element={<FinancialPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/timetable" element={<TimetablePage />} />
        <Route path="/settings" element={<SettingsPage />} />
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
