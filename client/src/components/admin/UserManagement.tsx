import * as React from 'react';
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
    setEditingUser(null);
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
        const payload: Partial<FormState> = { fullName: form.fullName, role: form.role };
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
      showSnack(`Compte ${!u.isActive ? 'activé' : 'désactivé'} avec succès.`);
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
      showSnack('Utilisateur supprimé.');
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err: any) {
      showSnack(err?.response?.data?.message || 'Erreur lors de la suppression.', 'error');
    }
  };

  return (
      <Container maxWidth="lg" sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4" fontWeight={700}>
            Gestion des utilisateurs
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
            Nouvel utilisateur
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} elevation={2}>
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700 } }}>
                  <TableCell>Nom complet</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Rôle</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Créé le</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u._id} hover sx={{ opacity: u.isActive ? 1 : 0.55 }}>
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
                        <IconButton size="small" onClick={() => openEditDialog(u)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {u._id !== currentUser?.id && (
                        <>
                          <Tooltip title={u.isActive ? 'Désactiver' : 'Activer'}>
                            <IconButton size="small" onClick={() => handleToggleActive(u)}>
                              {u.isActive ? (
                                <PersonOffIcon fontSize="small" color="warning" />
                              ) : (
                                <PersonIcon fontSize="small" color="success" />
                              )}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <IconButton size="small" onClick={() => confirmDelete(u)}>
                              <DeleteIcon fontSize="small" color="error" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      Aucun utilisateur trouvé.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Create / Edit dialog */}
        <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
          <DialogTitle>{editingUser ? 'Modifier l\'utilisateur' : 'Créer un utilisateur'}</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <FormControl fullWidth>
              <FormLabel htmlFor="dlg-fullName">Nom complet</FormLabel>
              <TextField
                id="dlg-fullName"
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                placeholder="Jean Dupont"
                size="small"
              />
            </FormControl>
            {!editingUser && (
              <>
                <FormControl fullWidth>
                  <FormLabel htmlFor="dlg-email">Email</FormLabel>
                  <TextField
                    id="dlg-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="jean@example.com"
                    size="small"
                  />
                </FormControl>
                <FormControl fullWidth>
                  <FormLabel htmlFor="dlg-password">Mot de passe</FormLabel>
                  <TextField
                    id="dlg-password"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="••••••"
                    size="small"
                  />
                </FormControl>
              </>
            )}
            <FormControl fullWidth>
              <FormLabel htmlFor="dlg-role">Rôle</FormLabel>
              <Select
                id="dlg-role"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
                size="small"
              >
                <MenuItem value="operator">Opérateur</MenuItem>
                <MenuItem value="quality">Manager Qualité</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleDialogClose} disabled={submitting}>
              Annuler
            </Button>
            <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <CircularProgress size={20} /> : editingUser ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete confirmation dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Confirmer la suppression</DialogTitle>
          <DialogContent>
            <Typography>
              Êtes-vous sûr de vouloir supprimer{' '}
              <strong>{userToDelete?.fullName}</strong> ? Cette action est irréversible.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDeleteDialogOpen(false)}>Annuler</Button>
            <Button variant="contained" color="error" onClick={handleDelete}>
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
          <Alert severity={snack.severity} variant="filled" onClose={() => setSnack((s) => ({ ...s, open: false }))}>
            {snack.message}
          </Alert>
        </Snackbar>
      </Container>
  );
}
