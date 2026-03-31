import * as React from 'react';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import PersonIcon from '@mui/icons-material/Person';
import { api } from '../../api/http';
import { useAuth } from '../../context/AuthContext';

type Role = 'operator' | 'quality' | 'manager';

interface UserRow {
  _id: string;
  fullName: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

interface FormState {
  fullName: string;
  email: string;
  password: string;
  role: Role;
}

const ROLE_LABELS: Record<Role, string> = {
  operator: 'Opérateur',
  quality: 'Manager Qualité',
  manager: 'Manager',
};

const ROLE_COLORS: Record<Role, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'> = {
  operator: 'default',
  quality: 'info',
  manager: 'primary',
};

const emptyForm: FormState = { fullName: '', email: '', password: '', role: 'operator' };

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = React.useState<UserRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<UserRow | null>(null);
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [userToDelete, setUserToDelete] = React.useState<UserRow | null>(null);
  const [snack, setSnack] = React.useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const showSnack = (message: string, severity: 'success' | 'error' = 'success') =>
    setSnack({ open: true, message, severity });

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data.users);
    } catch {
      showSnack('Erreur lors du chargement des utilisateurs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const openCreateDialog = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (u: UserRow) => {
    setEditingUser(u);
    setForm({ fullName: u.fullName, email: u.email, password: '', role: u.role });
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleDialogExited = () => {
    setEditingUser(null);
    setForm(emptyForm);
  };

  const handleSubmit = async () => {
    if (!form.fullName.trim() || !form.email.trim()) {
      showSnack('Nom complet et email sont requis.', 'error');
      return;
    }
    if (!editingUser && !form.password) {
      showSnack('Le mot de passe est requis pour un nouvel utilisateur.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      if (editingUser) {
        const payload: Partial<FormState> = {
          fullName: form.fullName,
          email: form.email,
          role: form.role,
        };
        await api.put(`/auth/users/${editingUser._id}`, payload);
        showSnack('Utilisateur mis à jour avec succès.');
      } else {
        await api.post('/auth/users', form);
        showSnack('Utilisateur créé avec succès.');
      }
      handleDialogClose();
      fetchUsers();
    } catch (err: any) {
      showSnack(err?.response?.data?.message || 'Une erreur est survenue.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (u: UserRow) => {
    try {
      await api.put(`/auth/users/${u._id}`, { isActive: !u.isActive });
      showSnack(
        !u.isActive
          ? `Utilisateur "${u.fullName}" activé. Accès rétabli.`
          : `Utilisateur "${u.fullName}" désactivé. Accès bloqué.`,
        !u.isActive ? 'success' : 'error',
      );
      fetchUsers();
    } catch (err: any) {
      showSnack(err?.response?.data?.message || 'Erreur lors de la mise à jour.', 'error');
    }
  };

  const confirmDelete = (u: UserRow) => {
    setUserToDelete(u);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      await api.delete(`/auth/users/${userToDelete._id}`);
      showSnack(`Utilisateur ${userToDelete.fullName} supprimé.`, 'success');
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err: any) {
      showSnack(err?.response?.data?.message || 'Erreur lors de la suppression.', 'error');
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      q.length === 0 ||
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      ROLE_LABELS[u.role].toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && u.isActive) ||
      (statusFilter === 'inactive' && !u.isActive);
    return matchesQuery && matchesStatus;
  });

  const snackAccent = snack.severity === 'success'
    ? '#22c55e'
    : '#f59e0b';

  return (
      <Container maxWidth="lg" sx={{ mb: 4 }}>
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 2, md: 2.5 },
            mb: 2.5,
            borderRadius: 4,
            borderColor: 'primary.light',
            background: 'linear-gradient(130deg, rgba(25,118,210,0.16), rgba(124,77,255,0.08))',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="h4" fontWeight={900} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AdminPanelSettingsIcon />
                Gestion des utilisateurs
              </Typography>
              <Typography color="text.secondary">
                Administration des comptes, rôles et statut d'accès.
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreateDialog}
              sx={{
                borderRadius: 99,
                px: 2.2,
                textTransform: 'none',
                fontWeight: 700,
                background: 'linear-gradient(90deg, #1976d2, #7c4dff)',
              }}
            >
              Nouvel utilisateur
            </Button>
          </Box>
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            p: 1.5,
            mb: 2,
            borderRadius: 3,
            borderColor: 'divider',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1.2,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <TextField
            size="small"
            placeholder="Rechercher par nom, email ou rôle"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{ minWidth: { xs: '100%', md: 320 } }}
          />
          <ToggleButtonGroup
            size="small"
            value={statusFilter}
            exclusive
            onChange={(_e, value) => {
              if (value) setStatusFilter(value);
            }}
          >
            <ToggleButton value="all">Tous ({users.length})</ToggleButton>
            <ToggleButton value="active">Actifs ({users.filter((u) => u.isActive).length})</ToggleButton>
            <ToggleButton value="inactive">Inactifs ({users.filter((u) => !u.isActive).length})</ToggleButton>
          </ToggleButtonGroup>
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(124,77,255,0.02))',
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 800, bgcolor: 'rgba(25,118,210,0.08)' } }}>
                  <TableCell>Nom complet</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Rôle</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Créé le</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow
                    key={u._id}
                    hover
                    sx={{
                      opacity: u.isActive ? 1 : 0.62,
                      '&:hover': { bgcolor: 'rgba(25,118,210,0.06)' },
                    }}
                  >
                    <TableCell>{u.fullName}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={ROLE_LABELS[u.role]}
                        color={ROLE_COLORS[u.role]}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={u.isActive ? 'Actif' : 'Inactif'}
                        color={u.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{new Date(u.createdAt).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Modifier">
                        <IconButton size="small" onClick={() => openEditDialog(u)} sx={{ border: '1px solid', borderColor: 'divider', mr: 0.5 }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {u._id !== currentUser?.id && (
                        <>
                          <Tooltip title={u.isActive ? 'Désactiver' : 'Activer'}>
                            <IconButton size="small" onClick={() => handleToggleActive(u)} sx={{ border: '1px solid', borderColor: 'divider', mr: 0.5 }}>
                              {u.isActive ? (
                                <PersonOffIcon fontSize="small" color="warning" />
                              ) : (
                                <PersonIcon fontSize="small" color="success" />
                              )}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <IconButton size="small" onClick={() => confirmDelete(u)} sx={{ border: '1px solid', borderColor: 'divider' }}>
                              <DeleteIcon fontSize="small" color="error" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      Aucun utilisateur ne correspond au filtre.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Create / Edit dialog */}
        <Dialog
          open={dialogOpen}
          onClose={handleDialogClose}
          TransitionProps={{ onExited: handleDialogExited }}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'primary.light',
              background: 'linear-gradient(160deg, rgba(20,28,44,0.97), rgba(18,22,34,0.98))',
              boxShadow: '0 20px 50px rgba(0,0,0,0.45)',
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 900, pb: 1 }}>
            {editingUser ? 'Modifier l\'utilisateur' : 'Créer un utilisateur'}
          </DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'primary.light',
                bgcolor: 'rgba(25,118,210,0.08)',
                borderRadius: 2.5,
                px: 1.5,
                py: 1,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {editingUser
                  ? 'Mettez à jour les informations du compte utilisateur.'
                  : 'Créez un nouveau compte et attribuez un rôle adapté.'}
              </Typography>
            </Box>
            <FormControl fullWidth>
              <FormLabel htmlFor="dlg-fullName">Nom complet</FormLabel>
              <TextField
                id="dlg-fullName"
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                placeholder="Jean Dupont"
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </FormControl>
            <FormControl fullWidth>
              <FormLabel htmlFor="dlg-email">Email</FormLabel>
              <TextField
                id="dlg-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="jean@example.com"
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </FormControl>
            {!editingUser && (
              <Paper
                variant="outlined"
                sx={{
                  p: 1.3,
                  borderRadius: 2.5,
                  borderColor: 'divider',
                  background: 'rgba(255,255,255,0.01)',
                }}
              >
                <FormControl fullWidth>
                  <FormLabel htmlFor="dlg-password">Mot de passe</FormLabel>
                  <TextField
                    id="dlg-password"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="••••••"
                    size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </FormControl>
              </Paper>
            )}
            <FormControl fullWidth>
              <FormLabel htmlFor="dlg-role">Rôle</FormLabel>
              <Select
                id="dlg-role"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
                size="small"
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="operator">Opérateur</MenuItem>
                <MenuItem value="quality">Manager Qualité</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={handleDialogClose}
              disabled={submitting}
              sx={{ borderRadius: 99, px: 2.2, textTransform: 'none', fontWeight: 700 }}
            >
              Annuler
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting}
              sx={{
                borderRadius: 99,
                px: 2.4,
                textTransform: 'none',
                fontWeight: 800,
                background: 'linear-gradient(90deg, #1976d2, #7c4dff)',
              }}
            >
              {submitting ? <CircularProgress size={20} /> : editingUser ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete confirmation dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'error.light',
              background: 'linear-gradient(160deg, rgba(35,16,20,0.95), rgba(18,22,34,0.97))',
              boxShadow: '0 20px 40px rgba(0,0,0,0.45)',
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 900, pb: 1 }}>
            Confirmer la suppression
          </DialogTitle>
          <DialogContent>
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'error.light',
                bgcolor: 'rgba(244,67,54,0.10)',
                borderRadius: 2.5,
                p: 1.4,
                mt: 0.5,
              }}
            >
              <Typography sx={{ lineHeight: 1.55 }}>
                Êtes-vous sûr de vouloir supprimer <strong>{userToDelete?.fullName}</strong> ? Cette action est irréversible.
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setDeleteDialogOpen(false)}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 99,
                px: 2.2,
              }}
            >
              Annuler
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDelete}
              sx={{
                textTransform: 'none',
                fontWeight: 800,
                borderRadius: 99,
                px: 2.4,
                background: 'linear-gradient(90deg, #b91c1c, #ef4444)',
              }}
            >
              Supprimer
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snack.open}
          autoHideDuration={4000}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity={snack.severity}
            variant="outlined"
            onClose={() => setSnack((s) => ({ ...s, open: false }))}
            sx={{
              minWidth: 360,
              borderRadius: 3,
              borderColor: `${snackAccent}66`,
              color: '#f3f4f6',
              bgcolor: 'rgba(10,15,28,0.96)',
              backdropFilter: 'blur(8px)',
              boxShadow: `0 10px 30px ${snackAccent}33`,
              '& .MuiAlert-icon': {
                color: snackAccent,
              },
              '& .MuiAlert-action .MuiIconButton-root': {
                color: '#cbd5e1',
              },
            }}
          >
            {snack.message}
          </Alert>
        </Snackbar>
      </Container>
  );
}
