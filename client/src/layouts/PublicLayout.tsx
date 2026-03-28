import Box from '@mui/material/Box';
import { Outlet } from 'react-router-dom';
import AppAppBar from '../components/navigation/AppAppBar';
import Footer from '../components/Footer';

export default function PublicLayout() {
  return (
    <Box id="top">
      <AppAppBar />
      <Outlet />
      <Footer />
    </Box>
  );
}