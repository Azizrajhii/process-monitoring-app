import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
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

interface AuditLogItem {
  _id: string;
  action: string;
  entity: string;
  description?: string;
  timestamp: string;
  user?: {
    userName?: string;
    role?: string;
  };
  status?: 'success' | 'failure';
}

interface AuditApiResponse {
  data: {
    logs: AuditLogItem[];
    total: number;
  };
}

const actionOptions = [
  'ALL',
  'CREATE_PROCESS',
  'UPDATE_PROCESS',
  'ACTIVATE_PROCESS',
  'CREATE_MEASUREMENT',
  'UPDATE_ALERT',
  'VIEW_REPORT',
  'EXPORT_REPORT',
];

const entityOptions = ['ALL', 'Process', 'Measurement', 'Alert', 'CorrectiveAction', 'User'];

export default function AuditTrailPage() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [logs, setLogs] = React.useState<AuditLogItem[]>([]);
  const [action, setAction] = React.useState('ALL');
  const [entity, setEntity] = React.useState('ALL');

  const fetchAudit = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string> = { limit: '150', skip: '0' };
      if (action !== 'ALL') params.action = action;
      if (entity !== 'ALL') params.entity = entity;

      const res = await api.get<AuditApiResponse>('/audit/audit-trail', { params });
      setLogs(res.data.data.logs || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors du chargement de la trace d audit.');
    } finally {
      setLoading(false);
    }
  }, [action, entity]);

  React.useEffect(() => {
    fetchAudit();
  }, [fetchAudit]);

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h4" fontWeight={800}>Audit Trail</Typography>
        <Typography color="text.secondary">
          Historique des actions critiques: process, mesures, alertes et rapports.
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 240 }}>
            <InputLabel>Action</InputLabel>
            <Select label="Action" value={action} onChange={(e) => setAction(e.target.value)}>
              {actionOptions.map((value) => (
                <MenuItem key={value} value={value}>{value}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Entite</InputLabel>
            <Select label="Entite" value={entity} onChange={(e) => setEntity(e.target.value)}>
              {entityOptions.map((value) => (
                <MenuItem key={value} value={value}>{value}</MenuItem>
              ))}
            </Select>
          </FormControl>
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
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Utilisateur</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Entite</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Statut</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">Aucune entree d audit.</TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log._id} hover>
                    <TableCell>{new Date(log.timestamp).toLocaleString('fr-FR')}</TableCell>
                    <TableCell>{log.user?.userName || '-'}</TableCell>
                    <TableCell>{log.user?.role || '-'}</TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>{log.entity}</TableCell>
                    <TableCell>{log.description || '-'}</TableCell>
                    <TableCell>{log.status || 'success'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  );
}
