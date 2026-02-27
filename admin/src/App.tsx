import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import './styles/app.css';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import Dashboard from './pages/Dashboard';
import StudentList from './pages/students/StudentList';
import StudentDetail from './pages/students/StudentDetail';
import TeacherList from './pages/teachers/TeacherList';
import GradeManagement from './pages/grades/GradeManagement';
import AttendancePage from './pages/attendance/AttendancePage';
import FinancialPage from './pages/financial/FinancialPage';
import MessagingPage from './pages/messaging/MessagingPage';
import AnnouncementsPage from './pages/announcements/AnnouncementsPage';
import TimetablePage from './pages/timetable/TimetablePage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import SettingsPage from './pages/settings/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

/** Redirect to /login if not authenticated */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading)
    return (
      <div className="loading-screen">
        Chargement…
      </div>
    );
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />

      {/* Protected */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/students" element={<StudentList />} />
        <Route path="/students/:id" element={<StudentDetail />} />
        <Route path="/teachers" element={<TeacherList />} />
        <Route path="/grades" element={<GradeManagement />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/financial" element={<FinancialPage />} />
        <Route path="/messaging" element={<MessagingPage />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/timetable" element={<TimetablePage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
