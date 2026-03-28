import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { api } from '../../api/http';

type AlertStatus = 'treated' | 'not_treated';

interface AlertItem {
  _id: string;
  type: string;
  message: string;
  status: AlertStatus;
  date: string;
  process?: {
    _id: string;
    name: string;
    productionLine?: string;
  } | string;
}

const typeLabelMap: Record<string, string> = {
  cpk_low: 'Cpk faible',
  limit_exceeded: 'Limite depassee',
  trend_anomaly: 'Anomalie tendance',
  lsl_breach: 'Sous LSL',
  usl_breach: 'Au-dessus USL',
  spc_drift: 'Derive SPC',
  insufficient_data: 'Donnees insuffisantes',
};

export default function QualityAlertsPage() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [alerts, setAlerts] = React.useState<AlertItem[]>([]);
  const [statusFilter, setStatusFilter] = React.useState<'all' | AlertStatus>('all');
  const [actionDialogOpen, setActionDialogOpen] = React.useState(false);
  const [selectedAlertId, setSelectedAlertId] = React.useState<string>('');
  const [actionDescription, setActionDescription] = React.useState('');
  const [actionResult, setActionResult] = React.useState('');
  const [snack, setSnack] = React.useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const showSnack = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnack({ open: true, message, severity });
  };

  const fetchAlerts = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string> = { limit: '300', sort: '-date' };
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await api.get('/alerts', { params });
      setAlerts(res.data.alerts || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors du chargement des alertes qualite.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  React.useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const updateStatus = async (alertId: string, status: AlertStatus) => {
    try {
      await api.patch(`/alerts/${alertId}/status`, { status });
      showSnack('Statut alerte mis a jour.');
      fetchAlerts();
    } catch (err: any) {
      showSnack(err?.response?.data?.message || 'Erreur lors de la mise a jour du statut.', 'error');
    }
  };

  const openActionDialog = (alertId: string) => {
    setSelectedAlertId(alertId);
    setActionDescription('');
    setActionResult('');
    setActionDialogOpen(true);
  };

  const submitCorrectiveAction = async () => {
    if (!actionDescription.trim()) {
      showSnack('La description de l action corrective est requise.', 'error');
      return;
    }

    try {
      await api.post(`/alerts/${selectedAlertId}/corrective-actions`, {
        description: actionDescription,
        result: actionResult,
      });
      setActionDialogOpen(false);
      showSnack('Action corrective ajoutee avec succes.');
    } catch (err: any) {
      showSnack(err?.response?.data?.message || 'Erreur lors de l ajout de l action corrective.', 'error');
    }
  };

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h4" fontWeight={800}>Alertes qualite</Typography>
        <Typography color="text.secondary">
          Traitement des ecarts, mise a jour des statuts et enregistrement des actions correctives.
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Filtrer par statut</InputLabel>
          <Select
            label="Filtrer par statut"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | AlertStatus)}
          >
            <MenuItem value="all">Tous</MenuItem>
            <MenuItem value="not_treated">Non traitee</MenuItem>
            <MenuItem value="treated">Traitee</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {error && <Alert severity="warning">{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 7 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Processus</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {alerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">Aucune alerte a afficher.</TableCell>
                </TableRow>
              ) : (
                alerts.map((item) => {
                  const processName =
                    typeof item.process === 'object' && item.process?.name
                      ? item.process.name
                      : 'Processus inconnu';

                  return (
                    <TableRow key={item._id} hover>
                      <TableCell>{new Date(item.date).toLocaleString('fr-FR')}</TableCell>
                      <TableCell>{processName}</TableCell>
                      <TableCell>{typeLabelMap[item.type] || item.type}</TableCell>
                      <TableCell>{item.message || '-'}</TableCell>
                      <TableCell>{item.status === 'treated' ? 'Traitee' : 'Non traitee'}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => updateStatus(item._id, item.status === 'treated' ? 'not_treated' : 'treated')}
                          >
                            {item.status === 'treated' ? 'Reouvrir' : 'Traiter'}
                          </Button>
                          <Button size="small" variant="contained" onClick={() => openActionDialog(item._id)}>
                            Action corrective
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Ajouter une action corrective</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              label="Description"
              value={actionDescription}
              onChange={(e) => setActionDescription(e.target.value)}
              multiline
              minRows={3}
              required
            />
            <TextField
              label="Resultat (optionnel)"
              value={actionResult}
              onChange={(e) => setActionResult(e.target.value)}
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialogOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={submitCorrectiveAction}>Enregistrer</Button>
        </DialogActions>
      </Dialog>

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
    </Stack>
  );
}