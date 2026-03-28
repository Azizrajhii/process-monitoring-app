import * as React from 'react';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import LockResetRoundedIcon from '@mui/icons-material/LockResetRounded';
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/http';

export default function UserProfilePage() {
  const { user, refreshUser } = useAuth();
  const [openPasswordDialog, setOpenPasswordDialog] = React.useState(false);
  const [profileLoading, setProfileLoading] = React.useState(false);
  const [profileError, setProfileError] = React.useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = React.useState(false);
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [passwordLoading, setPasswordLoading] = React.useState(false);
  const [passwordError, setPasswordError] = React.useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = React.useState(false);

  const [passwordForm, setPasswordForm] = React.useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  React.useEffect(() => {
    setFullName(user?.fullName || '');
    setEmail(user?.email || '');
  }, [user?.fullName, user?.email]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('Veuillez remplir tous les champs.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    try {
      setPasswordLoading(true);
      await api.put('/auth/me', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      await refreshUser();
      setPasswordSuccess(true);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      setTimeout(() => {
        setOpenPasswordDialog(false);
        setPasswordSuccess(false);
      }, 2000);
    } catch (err: any) {
      setPasswordError(err?.response?.data?.message || 'Erreur lors du changement du mot de passe.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleProfileSave = async () => {
    setProfileError(null);
    setProfileSuccess(false);

    const normalizedName = fullName.trim();
    if (!normalizedName) {
      setProfileError('Le nom complet est requis.');
      return;
    }

    const normalizedEmail = email.trim();
    if (!normalizedEmail || !/\S+@\S+\.\S+/.test(normalizedEmail)) {
      setProfileError('Veuillez saisir un email valide.');
      return;
    }

    try {
      setProfileLoading(true);
      await api.put('/auth/me', {
        fullName: normalizedName,
        email: normalizedEmail,
      });
      await refreshUser();
      setProfileSuccess(true);
    } catch (err: any) {
      setProfileError(err?.response?.data?.message || 'Erreur lors de la mise à jour du profil.');
    } finally {
      setProfileLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
      'operator': 'Opérateur',
      'manager': 'Manager',
      'quality': 'Manager Qualité',
    };
    return roleMap[role] || role;
  };

  const initials = (user?.fullName || 'U')
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Stack spacing={3}>
      <Paper
        variant="outlined"
        sx={(theme) => ({
          p: { xs: 2.2, md: 3 },
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
          background: theme.vars
            ? `linear-gradient(135deg, rgba(${theme.vars.palette.primary.mainChannel} / 0.18), rgba(${theme.vars.palette.info.mainChannel} / 0.08))`
            : 'linear-gradient(135deg, rgba(25,118,210,0.16), rgba(2,136,209,0.08))',
        })}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} alignItems={{ xs: 'flex-start', md: 'center' }}>
          <Avatar
            sx={{
              width: 68,
              height: 68,
              fontSize: 24,
              fontWeight: 800,
              boxShadow: 2,
            }}
          >
            {initials}
          </Avatar>

          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" fontWeight={800}>
              Mon Profil
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Modifiez vos informations personnelles et la sécurité de votre compte.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip
              icon={<BadgeRoundedIcon fontSize="small" />}
              label={user?.role ? getRoleLabel(user.role) : 'Role'}
              color="primary"
              variant="outlined"
            />
            <Chip
              icon={<VerifiedUserRoundedIcon fontSize="small" />}
              label={user?.isActive ? 'Actif' : 'Inactif'}
              color={user?.isActive ? 'success' : 'default'}
              variant="outlined"
            />
          </Stack>
        </Stack>
      </Paper>

      {/* Account Settings */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <BadgeRoundedIcon fontSize="small" />
          <Typography variant="h6" fontWeight={700}>
            Informations du compte
          </Typography>
        </Stack>
        <Stack spacing={2}>
          {profileError && <Alert severity="error">{profileError}</Alert>}
          {profileSuccess && <Alert severity="success">Profil mis à jour avec succès.</Alert>}

          <Grid container spacing={1.8} columns={12}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Nom complet"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={profileLoading}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={profileLoading}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Rôle"
                value={user?.role ? getRoleLabel(user.role) : ''}
                disabled
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Statut"
                value={user?.isActive ? 'Actif' : 'Inactif'}
                disabled
              />
            </Grid>
          </Grid>

          <Stack direction="row" spacing={1.5}>
            <Button
              variant="contained"
              onClick={handleProfileSave}
              disabled={profileLoading}
            >
              {profileLoading ? <CircularProgress size={20} /> : 'Enregistrer le profil'}
            </Button>
          </Stack>

          <Divider />

          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <LockResetRoundedIcon fontSize="small" />
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Sécurité du compte
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, maxWidth: 720 }}>
              Changez votre mot de passe régulièrement pour sécuriser votre compte.
            </Typography>
            <Button
              variant="outlined"
              onClick={() => setOpenPasswordDialog(true)}
            >
              Changer le mot de passe
            </Button>
          </Box>
        </Stack>
      </Paper>

      {/* Additional Information */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, backgroundColor: '#fafafa' }}>
        <Typography variant="body2" color="text.secondary">
          💡 <strong>Conseil:</strong> Les champs nom et email sont modifiables ici.
          Le role et le statut restent en lecture seule.
        </Typography>
      </Paper>

      {/* Password Change Dialog */}
      <Dialog open={openPasswordDialog} onClose={() => setOpenPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Changer le mot de passe</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            {passwordError && <Alert severity="error">{passwordError}</Alert>}
            {passwordSuccess && <Alert severity="success">Mot de passe changé avec succès!</Alert>}

            <TextField
              fullWidth
              label="Mot de passe actuel"
              type="password"
              name="currentPassword"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              disabled={passwordLoading}
              variant="outlined"
              autoComplete="current-password"
            />

            <TextField
              fullWidth
              label="Nouveau mot de passe"
              type="password"
              name="newPassword"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              disabled={passwordLoading}
              variant="outlined"
              helperText="Minimum 6 caractères"
              autoComplete="new-password"
            />

            <TextField
              fullWidth
              label="Confirmer le nouveau mot de passe"
              type="password"
              name="confirmPassword"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
              disabled={passwordLoading}
              variant="outlined"
              autoComplete="new-password"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setOpenPasswordDialog(false)}
            disabled={passwordLoading}
          >
            Annuler
          </Button>
          <Button
            onClick={handlePasswordSubmit}
            variant="contained"
            disabled={passwordLoading}
          >
            {passwordLoading ? <CircularProgress size={24} /> : 'Changer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
