import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import { Routes, Route } from 'react-router-dom';
import AppTheme from './theme/AppTheme';
import AppAppBar from './components/AppAppBar';
import HomePage from './components/HomePage';
import Footer from './components/Footer';
import SignUp from './components/signup/SignUp';
import SignInSide from './components/signIn/SignInSide';
import ForgotPasswordPage from './components/forget-pass/ForgotPasswordPage';
import ResetPasswordPage from './components/forget-pass/ResetPasswordPage';

function MainLayout() {
  return (
    <Box id="top">
      <AppAppBar />
      <HomePage />
      <Box>
        <Footer />
      </Box>
    </Box>
  );
}

export default function App(props: { disableCustomTheme?: boolean }) {
  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <Routes>
        <Route path="/" element={<MainLayout />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignInSide />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      </Routes>
    </AppTheme>
  );
}
