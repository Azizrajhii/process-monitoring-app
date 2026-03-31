import * as React from 'react';
import { styled, alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import Badge from '@mui/material/Badge';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import LogoutIcon from '@mui/icons-material/Logout';
import ColorModeIconDropdown from '../../theme/ColorModeIconDropdown';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useRealtimeNotifications } from '../../context/RealtimeNotificationsContext';
import { defaultDashboardByRole, menuByRole, profilePathByRole } from './menuByRole';
import { sideMenuWidth } from './SideMenu';

const ROLE_LABELS: Record<string, string> = {
  operator: 'Operateur',
  quality: 'Manager Qualite',
  manager: 'Manager',
};

const ROLE_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'info'> = {
  operator: 'default',
  quality: 'info',
  manager: 'primary',
};

const publicNavItems = [
  { label: 'Accueil', href: '#home' },
  { label: 'Contact', href: '#footer' },
];

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexShrink: 0,
  borderRadius: `calc(${theme.shape.borderRadius}px + 8px)`,
  backdropFilter: 'blur(24px)',
  border: '1px solid',
  borderColor: (theme.vars || theme).palette.divider,
  backgroundColor: theme.vars
    ? `rgba(${theme.vars.palette.background.defaultChannel} / 0.4)`
    : alpha(theme.palette.background.default, 0.4),
  boxShadow: (theme.vars || theme).shadows[1],
  padding: '8px 12px',
}));

export default function AppAppBar() {
  const [open, setOpen] = React.useState(false);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = React.useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { unreadCount, notifications, clearUnread, markAllAsRead } = useRealtimeNotifications();

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getNotificationsPath = () => {
    if (!user) return '/signin';
    if (user.role === 'operator') return '/operator/alerts';
    if (user.role === 'quality') return '/quality/alerts';
    return '/manager/audit';
  };

  const handleNotificationsClick = () => {
    clearUnread();
    navigate(getNotificationsPath());
  };

  const openNotificationsMenu = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const closeNotificationsMenu = () => {
    setNotificationsAnchorEl(null);
  };

  const navItems = user
    ? menuByRole[user.role].map((item) => ({ label: item.label, href: item.path }))
    : publicNavItems;

  return (
    <AppBar
      position="fixed"
      enableColorOnDark
      sx={{
        boxShadow: 0,
        bgcolor: 'transparent',
        backgroundImage: 'none',
        mt: 'calc(var(--template-frame-height, 0px) + 20px)',
        ...(user && {
          ml: { md: `${sideMenuWidth}px` },
          width: { md: `calc(100% - ${sideMenuWidth}px)` },
        }),
      }}
    >
      <Container maxWidth="xl">
        <StyledToolbar variant="dense" disableGutters>
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', px: 0 }}>
            <Typography
              component="button"
              type="button"
              variant="h6"
              onClick={() => navigate(user ? defaultDashboardByRole[user.role] : '/')}
              sx={{
                fontWeight: 700,
                letterSpacing: 0.4,
                color: 'text.primary',
                background: 'none',
                border: 0,
                cursor: 'pointer',
                p: 0,
              }}
            >
              PFE Platform
            </Typography>
            <Box sx={{ display: { xs: 'none', md: user ? 'none' : 'flex' }, ml: 2 }}>
              {navItems.map((item) => (
                <Button
                  key={item.label}
                  component={item.href.startsWith('#') ? 'a' : 'button'}
                  href={item.href.startsWith('#') ? item.href : undefined}
                  onClick={
                    item.href.startsWith('#')
                      ? undefined
                      : () => navigate(item.href)
                  }
                  variant="text"
                  color="info"
                  size="small"
                  sx={{ minWidth: 0 }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          </Box>
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              gap: 1,
              alignItems: 'center',
            }}
          >
            {user ? (
              <>
                <Chip
                  label={ROLE_LABELS[user.role] ?? user.role}
                  color={ROLE_COLORS[user.role] ?? 'default'}
                  size="small"
                  variant="outlined"
                />
                <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>
                  <Box
                    component="button"
                    onClick={() => navigate(profilePathByRole[user.role])}
                    sx={{
                      background: 'none',
                      border: 0,
                      p: 0,
                      m: 0,
                      color: 'inherit',
                      font: 'inherit',
                      fontWeight: 'inherit',
                      cursor: 'pointer',
                    }}
                  >
                    {user.fullName}
                  </Box>
                </Typography>
                <IconButton size="small" onClick={openNotificationsMenu} title="Notifications">
                  <Badge color="error" badgeContent={unreadCount} max={99} invisible={unreadCount === 0}>
                    <NotificationsRoundedIcon fontSize="small" />
                  </Badge>
                </IconButton>
                <Menu
                  anchorEl={notificationsAnchorEl}
                  open={Boolean(notificationsAnchorEl)}
                  onClose={closeNotificationsMenu}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  PaperProps={{ sx: { width: 360, maxWidth: '90vw', p: 1 } }}
                >
                  <Box sx={{ px: 1.2, py: 0.6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2" fontWeight={700}>Notifications</Typography>
                    <Button size="small" onClick={markAllAsRead}>Tout marquer lu</Button>
                  </Box>
                  <Divider sx={{ my: 0.5 }} />
                  {notifications.length === 0 ? (
                    <MenuItem disabled>Aucune notification recente</MenuItem>
                  ) : (
                    <List dense sx={{ py: 0, maxHeight: 320, overflowY: 'auto' }}>
                      {notifications.map((item) => (
                        <ListItem key={item.id} disableGutters>
                          <ListItemText
                            primary={item.message}
                            secondary={new Date(item.createdAt).toLocaleString('fr-FR')}
                            slotProps={{
                              primary: { variant: 'body2' },
                              secondary: { variant: 'caption' },
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                  <Divider sx={{ my: 0.5 }} />
                  <MenuItem onClick={() => {
                    closeNotificationsMenu();
                    handleNotificationsClick();
                  }}>
                    Voir page notifications
                  </MenuItem>
                </Menu>
                <IconButton size="small" onClick={handleLogout} title="Se deconnecter">
                  <LogoutIcon fontSize="small" />
                </IconButton>
              </>
            ) : (
              <>
                <Button color="primary" variant="text" size="small" onClick={() => navigate('/signin')}>
                  Sign in
                </Button>
                <Button color="primary" variant="contained" size="small" onClick={() => navigate('/signup')}>
                  Sign up
                </Button>
              </>
            )}
            <ColorModeIconDropdown />
          </Box>
          <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 1 }}>
            <ColorModeIconDropdown size="medium" />
            <IconButton aria-label="Menu button" onClick={toggleDrawer(true)}>
              <MenuIcon />
            </IconButton>
            <Drawer
              anchor="top"
              open={open}
              onClose={toggleDrawer(false)}
              PaperProps={{
                sx: {
                  top: 'var(--template-frame-height, 0px)',
                },
              }}
            >
              <Box sx={{ p: 2, backgroundColor: 'background.default' }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <IconButton onClick={toggleDrawer(false)}>
                    <CloseRoundedIcon />
                  </IconButton>
                </Box>
                {navItems.map((item) => (
                  <MenuItem
                    key={item.label}
                    component={item.href.startsWith('#') ? 'a' : 'button'}
                    href={item.href.startsWith('#') ? item.href : undefined}
                    onClick={() => {
                      if (!item.href.startsWith('#')) {
                        navigate(item.href);
                      }
                      setOpen(false);
                    }}
                  >
                    {item.label}
                  </MenuItem>
                ))}
                <Divider sx={{ my: 3 }} />
                {user ? (
                  <>
                    <MenuItem>
                      <Chip
                        label={ROLE_LABELS[user.role] ?? user.role}
                        color={ROLE_COLORS[user.role] ?? 'default'}
                        size="small"
                        variant="outlined"
                      />
                      <Typography variant="body2" sx={{ ml: 1, fontWeight: 600 }}>
                        {user.fullName}
                      </Typography>
                    </MenuItem>
                    <MenuItem>
                      <Button color="primary" variant="text" fullWidth onClick={() => {
                        navigate(profilePathByRole[user.role]);
                        setOpen(false);
                      }}>
                        Profil
                      </Button>
                    </MenuItem>
                    <MenuItem>
                      <Button color="info" variant="text" fullWidth onClick={() => {
                        handleNotificationsClick();
                        setOpen(false);
                      }}>
                        Notifications ({unreadCount})
                      </Button>
                    </MenuItem>
                    <MenuItem>
                      <Button color="error" variant="outlined" fullWidth startIcon={<LogoutIcon />} onClick={() => {
                        handleLogout();
                        setOpen(false);
                      }}>
                        Se deconnecter
                      </Button>
                    </MenuItem>
                  </>
                ) : (
                  <>
                    <MenuItem>
                      <Button color="primary" variant="contained" fullWidth onClick={() => {
                        navigate('/signup');
                        setOpen(false);
                      }}>
                        Sign up
                      </Button>
                    </MenuItem>
                    <MenuItem>
                      <Button color="primary" variant="outlined" fullWidth onClick={() => {
                        navigate('/signin');
                        setOpen(false);
                      }}>
                        Sign in
                      </Button>
                    </MenuItem>
                  </>
                )}
              </Box>
            </Drawer>
          </Box>
        </StyledToolbar>
      </Container>
    </AppBar>
  );
}