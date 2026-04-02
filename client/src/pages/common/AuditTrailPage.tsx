import * as React from 'react';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
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
const formatAction = (value: string) => value.split('_').join(' ');

export default function AuditTrailPage() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [logs, setLogs] = React.useState<AuditLogItem[]>([]);
  const [action, setAction] = React.useState('ALL');
  const [entity, setEntity] = React.useState('ALL');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');

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

  const filteredLogs = logs.filter((log) => {
    const timestamp = new Date(log.timestamp);
    if (dateFrom) {
      const from = new Date(`${dateFrom}T00:00:00`);
      if (timestamp < from) return false;
    }
    if (dateTo) {
      const to = new Date(`${dateTo}T23:59:59`);
      if (timestamp > to) return false;
    }
    return true;
  });

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
              <HistoryEduIcon />
              Audit Trail
            </Typography>
            <Typography color="text.secondary">
              Historique des actions critiques: process, mesures, alertes et rapports.
            </Typography>
          </Box>
          <Chip
            label={`${filteredLogs.length} entrée(s)`}
            color="primary"
            variant="outlined"
            sx={{ width: 'fit-content', fontWeight: 700 }}
          />
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
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 240 }}>
            <InputLabel>Action</InputLabel>
            <Select label="Action" value={action} onChange={(e) => setAction(e.target.value)} sx={{ borderRadius: 2 }}>
              {actionOptions.map((value) => (
                <MenuItem key={value} value={value}>{value}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Entite</InputLabel>
            <Select label="Entite" value={entity} onChange={(e) => setEntity(e.target.value)} sx={{ borderRadius: 2 }}>
              {entityOptions.map((value) => (
                <MenuItem key={value} value={value}>{value}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            type="date"
            label="Du"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 170 }}
          />
          <TextField
            size="small"
            type="date"
            label="Au"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 170 }}
          />
          <Button
            variant="text"
            onClick={() => {
              setDateFrom('');
              setDateTo('');
            }}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Reinitialiser dates
          </Button>
        </Stack>
      </Paper>

      {error && <Alert severity="warning">{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
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
                <TableCell>Utilisateur</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Entite</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Statut</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">Aucune entree d audit pour cette periode.</TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log._id} hover sx={{ '&:hover': { bgcolor: 'rgba(25,118,210,0.06)' } }}>
                    <TableCell>{new Date(log.timestamp).toLocaleString('fr-FR')}</TableCell>
                    <TableCell>{log.user?.userName || '-'}</TableCell>
                    <TableCell>
                      <Chip size="small" label={log.user?.role || '-'} variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={formatAction(log.action)} color="info" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={log.entity} color="default" variant="outlined" />
                    </TableCell>
                    <TableCell>{log.description || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={log.status || 'success'}
                        color={(log.status || 'success') === 'success' ? 'success' : 'error'}
                        variant="filled"
                      />
                    </TableCell>
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
