import FactoryIcon from '@mui/icons-material/Factory';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import * as React from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/http';

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
  updatedAt?: string;
}

const toFixed2 = (value: number) => Number.isFinite(value) ? value.toFixed(2) : '0.00';

export default function OperatorProcessesPage() {
  const navigate = useNavigate();
  const [processes, setProcesses] = React.useState<ProcessItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | ProcessStatus>('all');

  const fetchProcesses = async (mode: 'initial' | 'refresh' = 'refresh') => {
    try {
      if (mode === 'initial') {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);
      const params: Record<string, string> = {};
      if (query.trim()) params.q = query.trim();
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await api.get('/processes', { params });
      setProcesses(res.data.processes || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors du chargement des processus.');
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

  return (
    <Stack spacing={3}>
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
              <FactoryIcon />
              Processus assignés
            </Typography>
            <Typography color="text.secondary">
              Vue des processus avec leurs limites de spécification.
            </Typography>
          </Box>
          <Chip label={`${processes.length} processus`} color="primary" variant="outlined" sx={{ width: 'fit-content', fontWeight: 700 }} />
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
        <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5}>
          <TextField
            size="small"
            placeholder="Rechercher par nom ou ligne"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') fetchProcesses('refresh');
            }}
            sx={{ minWidth: { xs: '100%', md: 320 } }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | ProcessStatus)}>
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
            sx={{ borderRadius: 99, textTransform: 'none', fontWeight: 700 }}
          >
            {refreshing ? 'Actualisation...' : 'Actualiser'}
          </Button>
        </Stack>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
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
                <TableCell><strong>Nom</strong></TableCell>
                <TableCell><strong>Ligne</strong></TableCell>
                <TableCell align="center"><strong>LSL</strong></TableCell>
                <TableCell align="center"><strong>USL</strong></TableCell>
                <TableCell align="center"><strong>Cp cible</strong></TableCell>
                <TableCell align="center"><strong>Cpk cible</strong></TableCell>
                <TableCell align="center"><strong>Statut</strong></TableCell>
                <TableCell align="center" width={100}><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {processes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">
                      Aucun processus trouvé.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                processes.map((process) => (
                  <TableRow key={process._id} hover sx={{ '&:hover': { bgcolor: 'rgba(25,118,210,0.06)' } }}>
                    <TableCell>
                      <Typography fontWeight={600}>{process.name}</Typography>
                    </TableCell>
                    <TableCell>{process.productionLine}</TableCell>
                    <TableCell align="center">{toFixed2(process.lsl)}</TableCell>
                    <TableCell align="center">{toFixed2(process.usl)}</TableCell>
                    <TableCell align="center">{toFixed2(process.cpTarget)}</TableCell>
                    <TableCell align="center">{toFixed2(process.cpkTarget)}</TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={process.status === 'active' ? 'Actif' : 'Inactif'}
                        color={process.status === 'active' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => navigate(`/operator/process/${process._id}`)}
                        sx={{ borderRadius: 99, textTransform: 'none', fontWeight: 700 }}
                      >
                        Détails
                      </Button>
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