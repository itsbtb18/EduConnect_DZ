import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
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

const App: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route element={<AppLayout />}>
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
    </Routes>
  </BrowserRouter>
);

export default App;
