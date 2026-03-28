import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
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
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import HistoryIcon from '@mui/icons-material/History';
import { api } from '../../api/http';
import ProcessHistoryDialog from '../../components/process/ProcessHistoryDialog';

type ProcessStatus = 'active' | 'inactive';

interface ProcessItem {
  _id: string;
  name: string;
  productionLine: string;
  cpTarget: number;
  cpkTarget: number;
  lsl: number;
  usl: number;
  status: ProcessStatus;
  createdAt: string;
}

interface ProcessForm {
  name: string;
  productionLine: string;
  cpTarget: string;
  cpkTarget: string;
  lsl: string;
  usl: string;
  status: ProcessStatus;
}

const emptyForm: ProcessForm = {
  name: '',
  productionLine: '',
  cpTarget: '1.33',
  cpkTarget: '1.33',
  lsl: '85',
  usl: '95',
  status: 'active',
};

export default function ManagerProcessesPage() {
  const [processes, setProcesses] = React.useState<ProcessItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | ProcessStatus>('all');
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ProcessItem | null>(null);
  const [form, setForm] = React.useState<ProcessForm>(emptyForm);
  const [submitting, setSubmitting] = React.useState(false);
  const [snack, setSnack] = React.useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [historyOpen, setHistoryOpen] = React.useState<null | string>(null);

  const showSnack = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnack({ open: true, message, severity });
  };

  const fetchProcesses = async (mode: 'initial' | 'refresh' = 'refresh') => {
    try {
      if (mode === 'initial') {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      const params: Record<string, string> = {};
      if (query.trim()) params.q = query.trim();
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await api.get('/processes', { params });
      setProcesses(res.data.processes || []);
    } catch (error: any) {
      showSnack(error?.response?.data?.message || 'Erreur lors du chargement des processus.', 'error');
    } finally {
      if (mode === 'initial') {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  };

  React.useEffect(() => {
    fetchProcesses('initial');
  }, [statusFilter]);

  const openCreateDialog = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (process: ProcessItem) => {
    setEditing(process);
    setForm({
      name: process.name,
      productionLine: process.productionLine,
      cpTarget: String(process.cpTarget),
      cpkTarget: String(process.cpkTarget),
      lsl: String(process.lsl),
      usl: String(process.usl),
      status: process.status,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.productionLine.trim()) {
      showSnack('Nom et ligne de production sont requis.', 'error');
      return;
    }

    const cpTarget = Number(form.cpTarget);
    const cpkTarget = Number(form.cpkTarget);
    const lsl = Number(form.lsl);
    const usl = Number(form.usl);

    if (!Number.isFinite(cpTarget) || cpTarget <= 0 || !Number.isFinite(cpkTarget) || cpkTarget <= 0) {
      showSnack('Cp et Cpk doivent être des nombres positifs.', 'error');
      return;
    }

    if (!Number.isFinite(lsl) || !Number.isFinite(usl) || usl <= lsl) {
      showSnack('LSL et USL doivent être valides (USL > LSL).', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        productionLine: form.productionLine.trim(),
        cpTarget,
        cpkTarget,
        lsl,
        usl,
        status: form.status,
      };

      if (editing) {
        await api.put(`/processes/${editing._id}`, payload);
        showSnack('Processus mis à jour avec succes.');
      } else {
        await api.post('/processes', payload);
        showSnack('Processus cree avec succes.');
      }

      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
      fetchProcesses('refresh');
    } catch (error: any) {
      showSnack(error?.response?.data?.message || 'Erreur lors de la sauvegarde.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (process: ProcessItem) => {
    try {
      setStatusUpdatingId(process._id);
      const nextStatus: ProcessStatus = process.status === 'active' ? 'inactive' : 'active';
      await api.patch(`/processes/${process._id}/status`, { status: nextStatus });
      showSnack(`Processus ${nextStatus === 'active' ? 'activé' : 'désactivé'}.`);
      fetchProcesses('refresh');
    } catch (error: any) {
      showSnack(error?.response?.data?.message || 'Erreur lors du changement de statut.', 'error');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Gestion des processus
            </Typography>
            <Typography color="text.secondary">
              Création, mise à jour et activation/désactivation des processus industriels.
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
            Nouveau processus
          </Button>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5}>
          <TextField
            size="small"
            placeholder="Rechercher par nom ou ligne"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') fetchProcesses();
            }}
            sx={{ minWidth: { xs: '100%', md: 320 } }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
              <MenuItem value="all">Tous statuts</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            onClick={() => fetchProcesses('refresh')}
            disabled={refreshing || loading}
            startIcon={refreshing ? <CircularProgress size={16} /> : undefined}
          >
            {refreshing ? 'Actualisation...' : 'Actualiser'}
          </Button>
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nom</TableCell>
                  <TableCell>Ligne</TableCell>
                  <TableCell>LSL</TableCell>
                  <TableCell>USL</TableCell>
                  <TableCell>Cp cible</TableCell>
                  <TableCell>Cpk cible</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Créé le</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {processes.map((process) => (
                  <TableRow key={process._id} hover>
                    <TableCell>{process.name}</TableCell>
                    <TableCell>{process.productionLine}</TableCell>
                    <TableCell>{process.lsl}</TableCell>
                    <TableCell>{process.usl}</TableCell>
                    <TableCell>{process.cpTarget}</TableCell>
                    <TableCell>{process.cpkTarget}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={process.status === 'active' ? 'Active' : 'Inactive'}
                        color={process.status === 'active' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{new Date(process.createdAt).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => openEditDialog(process)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => toggleStatus(process)}
                        disabled={statusUpdatingId === process._id}
                      >
                        {statusUpdatingId === process._id ? (
                          <CircularProgress size={16} />
                        ) : (
                          <SyncAltIcon fontSize="small" />
                        )}
                      </IconButton>
                      <IconButton size="small" onClick={() => setHistoryOpen(process._id)}>
                        <HistoryIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {processes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      Aucun processus trouvé.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Modifier le processus' : 'Nouveau processus'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <FormControl fullWidth>
            <FormLabel>Nom</FormLabel>
            <TextField
              size="small"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </FormControl>
          <FormControl fullWidth>
            <FormLabel>Ligne de production</FormLabel>
            <TextField
              size="small"
              value={form.productionLine}
              onChange={(e) => setForm((prev) => ({ ...prev, productionLine: e.target.value }))}
            />
          </FormControl>
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
            <FormControl fullWidth>
              <FormLabel>Cp cible</FormLabel>
              <TextField
                size="small"
                type="number"
                value={form.cpTarget}
                onChange={(e) => setForm((prev) => ({ ...prev, cpTarget: e.target.value }))}
              />
            </FormControl>
            <FormControl fullWidth>
              <FormLabel>Cpk cible</FormLabel>
              <TextField
                size="small"
                type="number"
                value={form.cpkTarget}
                onChange={(e) => setForm((prev) => ({ ...prev, cpkTarget: e.target.value }))}
              />
            </FormControl>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
            <FormControl fullWidth>
              <FormLabel>LSL</FormLabel>
              <TextField
                size="small"
                type="number"
                value={form.lsl}
                onChange={(e) => setForm((prev) => ({ ...prev, lsl: e.target.value }))}
              />
            </FormControl>
            <FormControl fullWidth>
              <FormLabel>USL</FormLabel>
              <TextField
                size="small"
                type="number"
                value={form.usl}
                onChange={(e) => setForm((prev) => ({ ...prev, usl: e.target.value }))}
              />
            </FormControl>
          </Stack>
          <FormControl fullWidth>
            <FormLabel>Statut</FormLabel>
            <Select
              size="small"
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as ProcessStatus }))}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={submitting}>Annuler</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <CircularProgress size={20} /> : editing ? 'Enregistrer' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
      <ProcessHistoryDialog
        processId={historyOpen || ''}
        open={!!historyOpen}
        onClose={() => setHistoryOpen(null)}
      />
      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snack.severity}
          variant="filled"
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}