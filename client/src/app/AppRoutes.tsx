import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import PublicLayout from '../layouts/PublicLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import { defaultDashboardByRole } from '../components/navigation/menuByRole';
import HomePage from '../pages/public/HomePage';
import SignInPage from '../pages/public/SignInPage';
import SignUpPage from '../pages/public/SignUpPage';
import ForgotPasswordPage from '../pages/public/ForgotPasswordPage';
import ResetPasswordPage from '../pages/public/ResetPasswordPage';
import UnauthorizedPage from '../pages/public/UnauthorizedPage';
import ManagerDashboardPage from '../pages/manager/ManagerDashboardPage';
import UserManagementPage from '../pages/manager/UserManagementPage';
import ManagerProcessesPage from '../pages/manager/ManagerProcessesPage';
import ManagerStatisticsPage from '../pages/manager/ManagerStatisticsPage';
import OperatorDashboardPage from '../pages/operator/OperatorDashboardPage';
import OperatorProcessesPage from '../pages/operator/OperatorProcessesPage';
import OperatorMeasurementsPage from '../pages/operator/OperatorMeasurementsPage';
import OperatorAlertsPage from '../pages/operator/OperatorAlertsPage';
import AddMeasurementPage from '../pages/operator/AddMeasurementPage';
import ProcessDetailPage from '../pages/operator/ProcessDetailPage';
import UserProfilePage from '../pages/operator/UserProfilePage';
import QualityDashboardPage from '../pages/quality/QualityDashboardPage';
import QualityValidationPage from '../pages/quality/QualityValidationPage';
import QualityAlertsPage from '../pages/quality/QualityAlertsPage';
import QualityReportsPage from '../pages/quality/QualityReportsPage';
import AuditTrailPage from '../pages/common/AuditTrailPage';

function RootRedirect() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to={defaultDashboardByRole[user.role]} replace />;
  }

  return <HomePage />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<RootRedirect />} />
      </Route>

      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/manager"
          element={
            <ProtectedRoute roles={['manager']}>
              <Outlet />
            </ProtectedRoute>
          }
        >
          <Route index element={<ManagerDashboardPage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="processes" element={<ManagerProcessesPage />} />
          <Route path="statistics" element={<ManagerStatisticsPage />} />
          <Route path="reports" element={<ManagerStatisticsPage />} />
          <Route path="audit" element={<AuditTrailPage />} />
          <Route path="profile" element={<UserProfilePage />} />
        </Route>

        <Route
          path="/operator"
          element={
            <ProtectedRoute roles={['operator']}>
              <Outlet />
            </ProtectedRoute>
          }
        >
          <Route index element={<OperatorDashboardPage />} />
          <Route path="processes" element={<OperatorProcessesPage />} />
          <Route path="process/:processId" element={<ProcessDetailPage />} />
          <Route path="add-measurement" element={<AddMeasurementPage />} />
          <Route path="measurements" element={<OperatorMeasurementsPage />} />
          <Route path="alerts" element={<OperatorAlertsPage />} />
          <Route path="profile" element={<UserProfilePage />} />
        </Route>

        <Route
          path="/quality"
          element={
            <ProtectedRoute roles={['quality']}>
              <QualityDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quality/profile"
          element={
            <ProtectedRoute roles={['quality']}>
              <UserProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quality/validation"
          element={
            <ProtectedRoute roles={['quality']}>
              <QualityValidationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quality/alerts"
          element={
            <ProtectedRoute roles={['quality']}>
              <QualityAlertsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quality/audit"
          element={
            <ProtectedRoute roles={['quality']}>
              <AuditTrailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quality/reports"
          element={
            <ProtectedRoute roles={['quality']}>
              <QualityReportsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}