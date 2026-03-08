import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp, Spin } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import frFR from 'antd/locale/fr_FR';
import arEG from 'antd/locale/ar_EG';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoadingOutlined } from '@ant-design/icons';
import { useSchoolProfile } from './hooks/useApi';
import { ToastProvider } from './components/ui/Toast.tsx';
import { ConfirmProvider } from './components/ui/ConfirmDialog.tsx';
import { RoleGuard, getDefaultPath } from './components/guards/RoleGuard';
import { ReadOnlyProvider } from './components/guards/ReadOnlyProvider';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Non-lazy: layout + login (always needed)
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/auth/LoginPage';

// ── Lazy-loaded page components ──
const Dashboard = lazy(() => import('./pages/Dashboard'));
const StudentList = lazy(() => import('./pages/students/StudentList'));
const StudentDetail = lazy(() => import('./pages/students/StudentDetail'));
const StudentProfilePage = lazy(() => import('./pages/students/StudentProfilePage'));
const TeacherList = lazy(() => import('./pages/teachers/TeacherList'));
const TeacherProfilePage = lazy(() => import('./pages/teachers/TeacherProfilePage'));
const GradeManagement = lazy(() => import('./pages/grades/GradeManagement'));
const GradesFullPage = lazy(() => import('./pages/grades/GradesFullPage'));
const ReportCardBuilder = lazy(() => import('./pages/grades/ReportCardBuilder'));
const AttendancePage = lazy(() => import('./pages/attendance/AttendancePage'));
const AttendanceReportsPage = lazy(() => import('./pages/attendance/AttendanceReportsPage'));
const AnnouncementsPage = lazy(() => import('./pages/announcements/AnnouncementsPage'));
const MessagingPage = lazy(() => import('./pages/messaging/MessagingPage'));
const FinancialPage = lazy(() => import('./pages/financial/FinancialPage'));
const AnalyticsPage = lazy(() => import('./pages/analytics/AnalyticsPage'));
const TimetablePage = lazy(() => import('./pages/timetable/TimetablePage'));
const TimetableBuilder = lazy(() => import('./pages/timetable/TimetableBuilder'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const UserManagement = lazy(() => import('./pages/users/UserManagement'));
const SchoolManagement = lazy(() => import('./pages/schools/SchoolManagement'));
const NotificationsPage = lazy(() => import('./pages/notifications/NotificationsPage'));
const HomeworkPage = lazy(() => import('./pages/homework/HomeworkPage'));

// Super Admin pages
const SuperAdminDashboard = lazy(() => import('./pages/superadmin/SuperAdminDashboard'));
const PlanManagement = lazy(() => import('./pages/superadmin/PlanManagement'));
const PlatformSettings = lazy(() => import('./pages/superadmin/PlatformSettings'));
const SuperAdminAnalytics = lazy(() => import('./pages/superadmin/SuperAdminAnalytics'));
const ActivityLogsPage = lazy(() => import('./pages/superadmin/ActivityLogsPage'));
const SystemHealthPage = lazy(() => import('./pages/superadmin/SystemHealthPage'));
const SubscriptionManagement = lazy(() => import('./pages/superadmin/SubscriptionManagement'));
const InvoicesPage = lazy(() => import('./pages/superadmin/InvoicesPage'));
const ImpersonationPage = lazy(() => import('./pages/superadmin/ImpersonationPage'));
const ContentManagement = lazy(() => import('./pages/superadmin/ContentManagement'));
const SchoolDetail = lazy(() => import('./pages/schools/SchoolDetail'));

// Academics
const ClassManagement = lazy(() => import('./pages/academics/ClassManagement'));

// Infirmerie
const InfirmerieDashboard = lazy(() => import('./pages/infirmerie').then(m => ({ default: m.InfirmerieDashboard })));
const MedicalRecordPage = lazy(() => import('./pages/infirmerie').then(m => ({ default: m.MedicalRecordPage })));
const ConsultationPage = lazy(() => import('./pages/infirmerie').then(m => ({ default: m.ConsultationPage })));
const EmergencyPage = lazy(() => import('./pages/infirmerie').then(m => ({ default: m.EmergencyPage })));
const EpidemicDashboard = lazy(() => import('./pages/infirmerie').then(m => ({ default: m.EpidemicDashboard })));
const InfirmeryReportsPage = lazy(() => import('./pages/infirmerie').then(m => ({ default: m.InfirmeryReportsPage })));
const InfirmeryMessaging = lazy(() => import('./pages/infirmerie').then(m => ({ default: m.InfirmeryMessaging })));
const AbsenceJustificationPage = lazy(() => import('./pages/infirmerie').then(m => ({ default: m.AbsenceJustificationPage })));

// Cantine
const CanteenDashboard = lazy(() => import('./pages/cantine').then(m => ({ default: m.CanteenDashboard })));
const CanteenEnrollment = lazy(() => import('./pages/cantine').then(m => ({ default: m.CanteenEnrollment })));
const MenuManagement = lazy(() => import('./pages/cantine').then(m => ({ default: m.MenuManagement })));
const CanteenReports = lazy(() => import('./pages/cantine').then(m => ({ default: m.CanteenReports })));

// Transport
const TransportDashboard = lazy(() => import('./pages/transport').then(m => ({ default: m.TransportDashboard })));
const TransportLinesPage = lazy(() => import('./pages/transport').then(m => ({ default: m.TransportLinesPage })));
const DriversPage = lazy(() => import('./pages/transport').then(m => ({ default: m.DriversPage })));
const TransportAssignment = lazy(() => import('./pages/transport').then(m => ({ default: m.TransportAssignment })));
const TransportReports = lazy(() => import('./pages/transport').then(m => ({ default: m.TransportReports })));

// Library
const LibraryDashboard = lazy(() => import('./pages/library').then(m => ({ default: m.LibraryDashboard })));
const BookCatalog = lazy(() => import('./pages/library').then(m => ({ default: m.BookCatalog })));
const LoanManagement = lazy(() => import('./pages/library').then(m => ({ default: m.LoanManagement })));
const BookRequests = lazy(() => import('./pages/library').then(m => ({ default: m.BookRequests })));
const LibraryReports = lazy(() => import('./pages/library').then(m => ({ default: m.LibraryReports })));

// E-Learning
const ElearningDashboard = lazy(() => import('./pages/elearning').then(m => ({ default: m.ElearningDashboard })));
const ResourceManagement = lazy(() => import('./pages/elearning').then(m => ({ default: m.ResourceManagement })));
const ExamBankPage = lazy(() => import('./pages/elearning').then(m => ({ default: m.ExamBankPage })));
const QuizBuilder = lazy(() => import('./pages/elearning').then(m => ({ default: m.QuizBuilder })));
const QuizAnalytics = lazy(() => import('./pages/elearning').then(m => ({ default: m.QuizAnalytics })));

// SMS
const SMSDashboard = lazy(() => import('./pages/sms').then(m => ({ default: m.SMSDashboard })));
const SMSTemplates = lazy(() => import('./pages/sms').then(m => ({ default: m.SMSTemplates })));
const SMSCampaigns = lazy(() => import('./pages/sms').then(m => ({ default: m.SMSCampaigns })));
const SMSHistory = lazy(() => import('./pages/sms').then(m => ({ default: m.SMSHistory })));

// Fingerprint
const FingerprintDashboard = lazy(() => import('./pages/fingerprint').then(m => ({ default: m.FingerprintDashboard })));
const FingerprintEnrollment = lazy(() => import('./pages/fingerprint').then(m => ({ default: m.FingerprintEnrollment })));
const FingerprintReports = lazy(() => import('./pages/fingerprint').then(m => ({ default: m.FingerprintReports })));

// Discipline
const DisciplineDashboard = lazy(() => import('./pages/discipline').then(m => ({ default: m.DisciplineDashboard })));

// Staff
const StaffManagement = lazy(() => import('./pages/staff').then(m => ({ default: m.StaffManagement })));

// Role-specific dashboards
const FinanceManagerDashboard = lazy(() => import('./pages/roles').then(m => ({ default: m.FinanceManagerDashboard })));
const LibrarianDashboard = lazy(() => import('./pages/roles').then(m => ({ default: m.LibrarianDashboard })));
const CanteenManagerDashboard = lazy(() => import('./pages/roles').then(m => ({ default: m.CanteenManagerDashboard })));
const TransportManagerDashboard = lazy(() => import('./pages/roles').then(m => ({ default: m.TransportManagerDashboard })));
const HRManagerDashboard = lazy(() => import('./pages/roles').then(m => ({ default: m.HRManagerDashboard })));

// Setup Wizard
const SetupWizard = lazy(() => import('./pages/setup/SetupWizard'));

// Formation (Training Center)
const CenterSetupWizard = lazy(() => import('./pages/formation/setup/CenterSetupWizard'));
const FormationDashboard = lazy(() => import('./pages/formation/FormationDashboard'));
const LearnerManagement = lazy(() => import('./pages/formation/LearnerManagement'));
const TrainerManagement = lazy(() => import('./pages/formation/TrainerManagement'));
const GroupManagement = lazy(() => import('./pages/formation/GroupManagement'));
const FormationSchedule = lazy(() => import('./pages/formation/FormationSchedule'));
const EvaluationsCertificates = lazy(() => import('./pages/formation/EvaluationsCertificates'));
const FormationFinance = lazy(() => import('./pages/formation/FormationFinance'));
const CancelledSessions = lazy(() => import('./pages/formation/CancelledSessions'));

// Security
const SecurityAuditLogPage = lazy(() => import('./pages/security/AuditLogPage'));
const SecurityDevicesPage = lazy(() => import('./pages/security/DevicesPage'));
const SecuritySessionManagement = lazy(() => import('./pages/security/SessionManagement'));

// Suspense fallback
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
    <Spin indicator={<LoadingOutlined style={{ fontSize: 36 }} spin />} />
  </div>
);

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

  const school = schoolProfile as { setup_completed?: boolean; school_category?: string } | undefined;
  if (school && school.setup_completed === false) {
    const setupPath = school.school_category === 'TRAINING_CENTER' ? '/formation/setup' : '/setup';
    return <Navigate to={setupPath} replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { user, operationalRole } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const defaultPath = isSuperAdmin ? '/platform/dashboard' : getDefaultPath(operationalRole);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <ReadOnlyProvider>
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <AppLayout />
                </Suspense>
              </ErrorBoundary>
            </ReadOnlyProvider>
          </ProtectedRoute>
        }
      >
        {/* ── Super Admin routes (guarded) ── */}
        <Route path="/platform/dashboard" element={<ErrorBoundary><SuperAdminGuard><SuperAdminDashboard /></SuperAdminGuard></ErrorBoundary>} />
        <Route path="/platform/schools" element={<ErrorBoundary><SuperAdminGuard><SchoolManagement /></SuperAdminGuard></ErrorBoundary>} />
        <Route path="/platform/users" element={<ErrorBoundary><SuperAdminGuard><UserManagement /></SuperAdminGuard></ErrorBoundary>} />
        <Route path="/platform/plans" element={<ErrorBoundary><SuperAdminGuard><PlanManagement /></SuperAdminGuard></ErrorBoundary>} />
        <Route path="/platform/analytics" element={<ErrorBoundary><SuperAdminGuard><SuperAdminAnalytics /></SuperAdminGuard></ErrorBoundary>} />
        <Route path="/platform/settings" element={<ErrorBoundary><SuperAdminGuard><PlatformSettings /></SuperAdminGuard></ErrorBoundary>} />
        <Route path="/platform/activity-logs" element={<ErrorBoundary><SuperAdminGuard><ActivityLogsPage /></SuperAdminGuard></ErrorBoundary>} />
        <Route path="/platform/system-health" element={<ErrorBoundary><SuperAdminGuard><SystemHealthPage /></SuperAdminGuard></ErrorBoundary>} />
        <Route path="/platform/invoices" element={<ErrorBoundary><SuperAdminGuard><InvoicesPage /></SuperAdminGuard></ErrorBoundary>} />
        <Route path="/platform/schools/:schoolId/subscription" element={<ErrorBoundary><SuperAdminGuard><SubscriptionManagement /></SuperAdminGuard></ErrorBoundary>} />
        <Route path="/platform/schools/:schoolId" element={<ErrorBoundary><SuperAdminGuard><SchoolDetail /></SuperAdminGuard></ErrorBoundary>} />
        <Route path="/platform/impersonation" element={<ErrorBoundary><SuperAdminGuard><ImpersonationPage /></SuperAdminGuard></ErrorBoundary>} />
        <Route path="/platform/content" element={<ErrorBoundary><SuperAdminGuard><ContentManagement /></SuperAdminGuard></ErrorBoundary>} />
        <Route path="/platform/notifications" element={<ErrorBoundary><SuperAdminGuard><NotificationsPage /></SuperAdminGuard></ErrorBoundary>} />
        <Route path="/platform/audit-logs" element={<ErrorBoundary><SuperAdminGuard><SecurityAuditLogPage /></SuperAdminGuard></ErrorBoundary>} />

        {/* ── Security pages (admin + super admin) ── */}
        <Route path="/security/audit-logs" element={<ErrorBoundary><SchoolAdminGuard><SecurityAuditLogPage /></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/security/devices" element={<ErrorBoundary><SecurityDevicesPage /></ErrorBoundary>} />
        <Route path="/security/sessions" element={<ErrorBoundary><SecuritySessionManagement /></ErrorBoundary>} />

        {/* ── School Admin routes (guarded) ── */}
        <Route path="/setup" element={<ErrorBoundary><SchoolAdminGuard><SetupWizard /></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/dashboard" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><Dashboard /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/users" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><UserManagement /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/students" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><StudentList /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/students/:id" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><StudentDetail /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/students/:id/profile" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><StudentProfilePage /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/teachers" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><TeacherList /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/teachers/:id/profile" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><TeacherProfilePage /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/classes" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><ClassManagement /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/grades" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><GradeManagement /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/notes-bulletins" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><GradesFullPage /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/report-cards" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><ReportCardBuilder /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/attendance" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><AttendancePage /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/attendance/reports" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><AttendanceReportsPage /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/announcements" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><AnnouncementsPage /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/messaging" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><MessagingPage /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/financial" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><FinancialPage /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/analytics" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><AnalyticsPage /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/timetable" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><TimetableBuilder /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/timetable/legacy" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><TimetablePage /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/notifications" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><NotificationsPage /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/homework" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><HomeworkPage /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />

        {/* ── Infirmerie routes ── */}
        <Route path="/infirmerie" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><InfirmerieDashboard /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/infirmerie/records" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><MedicalRecordPage /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/infirmerie/consultations" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><ConsultationPage /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/infirmerie/emergencies" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><EmergencyPage /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/infirmerie/epidemics" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><EpidemicDashboard /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/infirmerie/reports" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><InfirmeryReportsPage /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/infirmerie/messages" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><InfirmeryMessaging /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/infirmerie/justifications" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><AbsenceJustificationPage /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />

        {/* ── Cantine routes ── */}
        <Route path="/cantine" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><CanteenDashboard /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/cantine/enrollments" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><CanteenEnrollment /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/cantine/menus" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><MenuManagement /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/cantine/reports" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><CanteenReports /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />

        {/* ── Transport routes ── */}
        <Route path="/transport" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><TransportDashboard /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/transport/lines" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><TransportLinesPage /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/transport/drivers" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><DriversPage /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/transport/assignments" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><TransportAssignment /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/transport/reports" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><TransportReports /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />

        {/* ── Library routes ── */}
        <Route path="/library" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><LibraryDashboard /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/library/catalog" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><BookCatalog /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/library/loans" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><LoanManagement /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/library/requests" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><BookRequests /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/library/reports" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><LibraryReports /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />

        {/* ── E-Learning routes ── */}
        <Route path="/elearning" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><ElearningDashboard /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/elearning/resources" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><ResourceManagement /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/elearning/exams" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><ExamBankPage /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/elearning/quiz-builder" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><QuizBuilder /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/elearning/quiz-analytics" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><QuizAnalytics /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />

        {/* ── SMS routes ── */}
        <Route path="/sms" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><SMSDashboard /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/sms/templates" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><SMSTemplates /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/sms/campaigns" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><SMSCampaigns /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/sms/history" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><SMSHistory /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />

        {/* ── Fingerprint routes ── */}
        <Route path="/fingerprint" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><FingerprintDashboard /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/fingerprint/enrollment" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><FingerprintEnrollment /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/fingerprint/reports" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><FingerprintReports /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />

        {/* ── Discipline routes ── */}
        <Route path="/discipline" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><DisciplineDashboard /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />

        {/* ── Staff routes ── */}
        <Route path="/staff" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><StaffManagement /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />

        {/* ── Role-specific dashboards ── */}
        <Route path="/finance/dashboard" element={<ErrorBoundary><RoleGuard allowed={['FINANCE_MANAGER', 'ADMIN', 'SECTION_ADMIN', 'GENERAL_SUPERVISOR']}><FinanceManagerDashboard /></RoleGuard></ErrorBoundary>} />
        <Route path="/librarian/dashboard" element={<ErrorBoundary><RoleGuard allowed={['LIBRARIAN', 'ADMIN', 'SECTION_ADMIN', 'GENERAL_SUPERVISOR']}><LibrarianDashboard /></RoleGuard></ErrorBoundary>} />
        <Route path="/canteen-manager/dashboard" element={<ErrorBoundary><RoleGuard allowed={['CANTEEN_MANAGER', 'ADMIN', 'SECTION_ADMIN', 'GENERAL_SUPERVISOR']}><CanteenManagerDashboard /></RoleGuard></ErrorBoundary>} />
        <Route path="/transport-manager/dashboard" element={<ErrorBoundary><RoleGuard allowed={['TRANSPORT_MANAGER', 'ADMIN', 'SECTION_ADMIN', 'GENERAL_SUPERVISOR']}><TransportManagerDashboard /></RoleGuard></ErrorBoundary>} />
        <Route path="/hr/dashboard" element={<ErrorBoundary><RoleGuard allowed={['HR_MANAGER', 'ADMIN', 'SECTION_ADMIN', 'GENERAL_SUPERVISOR']}><HRManagerDashboard /></RoleGuard></ErrorBoundary>} />

        <Route path="/settings" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><SettingsPage /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />

        {/* ── Formation (Training Center) routes ── */}
        <Route path="/formation/setup" element={<ErrorBoundary><SchoolAdminGuard><CenterSetupWizard /></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/formation/dashboard" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><FormationDashboard /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/formation/learners" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><LearnerManagement /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/formation/trainers" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><TrainerManagement /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/formation/groups" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><GroupManagement /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/formation/schedule" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><FormationSchedule /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/formation/evaluations" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><EvaluationsCertificates /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/formation/finance" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><FormationFinance /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
        <Route path="/formation/cancelled-sessions" element={<ErrorBoundary><SchoolAdminGuard><SetupRedirectGuard><CancelledSessions /></SetupRedirectGuard></SchoolAdminGuard></ErrorBoundary>} />
      </Route>
      <Route path="*" element={<Navigate to={defaultPath} replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  useEffect(() => {
    document.documentElement.dir = isArabic ? 'rtl' : 'ltr';
    document.documentElement.lang = isArabic ? 'ar' : 'fr';
  }, [isArabic]);

  return (
    <ConfigProvider theme={theme} locale={isArabic ? arEG : frFR} direction={isArabic ? 'rtl' : 'ltr'}>
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
};

export default App;
