import * as React from 'react';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
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
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, md: 2.6 },
          borderRadius: 4,
          borderColor: 'primary.light',
          background: 'linear-gradient(130deg, rgba(25,118,210,0.16), rgba(124,77,255,0.08))',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1.5} alignItems={{ md: 'center' }}>
          <Box>
            <Typography variant="h4" fontWeight={900} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <NotificationsActiveIcon />
              Alertes qualite
            </Typography>
            <Typography color="text.secondary">
              Traitement des ecarts, mise a jour des statuts et enregistrement des actions correctives.
            </Typography>
          </Box>
          <Chip label={`${alerts.length} alerte(s)`} color="primary" variant="outlined" sx={{ width: 'fit-content', fontWeight: 700 }} />
        </Stack>
      </Paper>

      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          borderRadius: 3,
          borderColor: 'divider',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(124,77,255,0.02))',
        }}
      >
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Filtrer par statut</InputLabel>
          <Select
            label="Filtrer par statut"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | AlertStatus)}
            sx={{ borderRadius: 2 }}
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
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            borderColor: 'divider',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(124,77,255,0.02))',
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 800, bgcolor: 'rgba(25,118,210,0.08)' } }}>
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
                    <TableRow key={item._id} hover sx={{ '&:hover': { bgcolor: 'rgba(25,118,210,0.06)' } }}>
                      <TableCell>{new Date(item.date).toLocaleString('fr-FR')}</TableCell>
                      <TableCell>{processName}</TableCell>
                      <TableCell>
                        <Chip size="small" variant="outlined" color="info" label={typeLabelMap[item.type] || item.type} />
                      </TableCell>
                      <TableCell>{item.message || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          color={item.status === 'treated' ? 'success' : 'warning'}
                          variant={item.status === 'treated' ? 'filled' : 'outlined'}
                          label={item.status === 'treated' ? 'Traitee' : 'Non traitee'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => updateStatus(item._id, item.status === 'treated' ? 'not_treated' : 'treated')}
                            sx={{ borderRadius: 99, textTransform: 'none', fontWeight: 700 }}
                          >
                            {item.status === 'treated' ? 'Reouvrir' : 'Traiter'}
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => openActionDialog(item._id)}
                            sx={{ borderRadius: 99, textTransform: 'none', fontWeight: 700 }}
                          >
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

      <Dialog
        open={actionDialogOpen}
        onClose={() => setActionDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'primary.light',
            background: 'linear-gradient(160deg, rgba(20,28,44,0.97), rgba(18,22,34,0.98))',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Ajouter une action corrective</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              label="Description"
              value={actionDescription}
              onChange={(e) => setActionDescription(e.target.value)}
              multiline
              minRows={3}
              required
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Resultat (optionnel)"
              value={actionResult}
              onChange={(e) => setActionResult(e.target.value)}
              multiline
              minRows={2}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setActionDialogOpen(false)} sx={{ borderRadius: 99, textTransform: 'none', fontWeight: 700 }}>Annuler</Button>
          <Button
            variant="contained"
            onClick={submitCorrectiveAction}
            sx={{
              borderRadius: 99,
              px: 2.3,
              textTransform: 'none',
              fontWeight: 800,
              background: 'linear-gradient(90deg, #1976d2, #7c4dff)',
            }}
          >
            Enregistrer
          </Button>
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
          variant="outlined"
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          sx={{
            minWidth: 360,
            borderRadius: 3,
            color: '#f3f4f6',
            bgcolor: 'rgba(10,15,28,0.96)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}