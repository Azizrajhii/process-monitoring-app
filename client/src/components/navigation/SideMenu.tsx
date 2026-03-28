import { styled } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import MuiDrawer, { drawerClasses } from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { menuByRole, defaultDashboardByRole, profilePathByRole } from './menuByRole';

export const sideMenuWidth = 240;

const Drawer = styled(MuiDrawer)({
  width: sideMenuWidth,
  flexShrink: 0,
  boxSizing: 'border-box',
  [`& .${drawerClasses.paper}`]: {
    width: sideMenuWidth,
    boxSizing: 'border-box',
  },
});

export default function SideMenu() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const items = menuByRole[user.role] ?? [];
  const initials = user.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: 'none', md: 'block' },
        [`& .${drawerClasses.paper}`]: {
          backgroundColor: 'background.paper',
        },
      }}
    >
      {/* Logo / App name */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 2,
          py: 2,
          cursor: 'pointer',
        }}
        onClick={() => navigate(defaultDashboardByRole[user.role])}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.4 }}>
          PFE Platform
        </Typography>
      </Box>
      <Divider />

      {/* Profile shortcut */}
      <Box sx={{ px: 1.5, py: 1 }}>
        <ListItemButton
          onClick={() => navigate(profilePathByRole[user.role])}
          sx={{
            borderRadius: 2,
            px: 1,
            py: 1,
          }}
        >
          <Avatar sx={{ width: 36, height: 36, fontSize: 14, mr: 1.2 }}>{initials}</Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: '18px' }} noWrap>
              {user.fullName}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
              Voir profil
            </Typography>
          </Box>
        </ListItemButton>
      </Box>
      <Divider />

      {/* Navigation items */}
      <Box sx={{ overflow: 'auto', flexGrow: 1, py: 1 }}>
        <List dense disablePadding>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  component={NavLink}
                  to={item.path}
                  end={item.path.split('/').length === 2}
                  sx={{
                    mx: 1,
                    borderRadius: 2,
                    textDecoration: 'none',
                    color: 'inherit',
                    '&.active': {
                      bgcolor: 'action.selected',
                    },
                    '&.active:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
                    <Icon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    slotProps={{ primary: { variant: 'body2' } }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

    </Drawer>
  );
}