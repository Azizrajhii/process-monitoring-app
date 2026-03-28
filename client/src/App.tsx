import CssBaseline from '@mui/material/CssBaseline';
import AppTheme from './theme/AppTheme';
import AppRoutes from './app/AppRoutes';
import { AuthProvider } from './context/AuthContext';
import { RealtimeNotificationsProvider } from './context/RealtimeNotificationsContext';

export default function App(props: { disableCustomTheme?: boolean }) {
  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <AuthProvider>
        <RealtimeNotificationsProvider>
          <AppRoutes />
        </RealtimeNotificationsProvider>
      </AuthProvider>
    </AppTheme>
  );
}

