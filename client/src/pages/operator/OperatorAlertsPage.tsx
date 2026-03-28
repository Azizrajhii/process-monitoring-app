import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { api } from '../../api/http';

type AlertStatus = 'treated' | 'not_treated';

interface AlertItem {
  _id: string;
  process?: {
    _id: string;
    name: string;
    productionLine?: string;
  } | string;
  type: string;
  message?: string;
  status: AlertStatus;
  date: string;
}

const typeLabelMap: Record<string, string> = {
  cpk_low: 'Cpk faible',
  limit_exceeded: 'Limite depassee',
  trend_anomaly: 'Anomalie de tendance',
  lsl_breach: 'Sous LSL',
  usl_breach: 'Au-dessus USL',
  spc_drift: 'Derive SPC',
  insufficient_data: 'Donnees insuffisantes',
};

const getTypeLabel = (type: string) => typeLabelMap[type] || type;

const getStatusChipColor = (status: AlertStatus): 'success' | 'warning' => {
  return status === 'treated' ? 'success' : 'warning';
};

export default function OperatorAlertsPage() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [alerts, setAlerts] = React.useState<AlertItem[]>([]);
  const [statusFilter, setStatusFilter] = React.useState<'all' | AlertStatus>('all');

  const fetchAlerts = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string> = {
        sort: '-date',
        limit: '200',
      };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const res = await api.get('/alerts', { params });
      setAlerts(res.data.alerts || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors du chargement des alertes.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  React.useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" fontWeight={800}>
          Alertes operateur
        </Typography>
        <Typography color="text.secondary">
          Suivi des alertes de processus a traiter sur la ligne.
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Filtrer par statut</InputLabel>
            <Select
              value={statusFilter}
              label="Filtrer par statut"
              onChange={(e) => setStatusFilter(e.target.value as 'all' | AlertStatus)}
            >
              <MenuItem value="all">Tous les statuts</MenuItem>
              <MenuItem value="not_treated">Non traitée</MenuItem>
              <MenuItem value="treated">Traitée</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="body2" color="text.secondary">
            Total: {alerts.length} alerte(s)
          </Typography>
        </Stack>
      </Paper>

      {error && <Alert severity="warning">{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5', position: 'sticky', top: 0 }}>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 700, backgroundColor: '#f5f5f5', color: '#000' }}><strong>Date</strong></TableCell>
                <TableCell sx={{ fontWeight: 700, backgroundColor: '#f5f5f5', color: '#000' }}><strong>Processus</strong></TableCell>
                <TableCell sx={{ fontWeight: 700, backgroundColor: '#f5f5f5', color: '#000' }}><strong>Type</strong></TableCell>
                <TableCell sx={{ fontWeight: 700, backgroundColor: '#f5f5f5', color: '#000' }}><strong>Message</strong></TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#f5f5f5', color: '#000' }}><strong>Statut</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {alerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      Aucune alerte a afficher.
                    </Typography>
                  </TableCell>
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
                      <TableCell>
                        <Typography fontWeight={600}>{processName}</Typography>
                      </TableCell>
                      <TableCell>{getTypeLabel(item.type)}</TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {item.message || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          color={getStatusChipColor(item.status)}
                          label={item.status === 'treated' ? 'Traitee' : 'Non traitee'}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  );
}