import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import { alpha } from '@mui/material/styles';
import { Outlet } from 'react-router-dom';
import AppAppBar from '../components/navigation/AppAppBar';
import SideMenu, { sideMenuWidth } from '../components/navigation/SideMenu';

export default function DashboardLayout() {
  return (
    <Box
      sx={(theme) => ({
        display: 'flex',
        minHeight: '100vh',
        backgroundImage: theme.vars
          ? `radial-gradient(circle at 15% -10%, rgba(${theme.vars.palette.primary.mainChannel} / 0.2), transparent 35%), radial-gradient(circle at 95% 5%, rgba(${theme.vars.palette.info.mainChannel} / 0.16), transparent 30%)`
          : 'none',
      })}
    >
      <AppAppBar />
      <SideMenu />
      <Box
        component="main"
        sx={(theme) => ({
          flexGrow: 1,
          width: { md: `calc(100% - ${sideMenuWidth}px)` },
          backgroundColor: theme.vars
            ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
            : alpha(theme.palette.background.default, 1),
          overflow: 'auto',
        })}
      >
        <Toolbar />
        <Stack
          spacing={2}
          sx={{
            px: { xs: 1.5, md: 2.5 },
            pb: 5,
            mt: { xs: 1, md: 0 },
          }}
        >
          <Outlet />
        </Stack>
      </Box>
    </Box>
  );
}