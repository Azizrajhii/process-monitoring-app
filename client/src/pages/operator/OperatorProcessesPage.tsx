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
      <Box>
        <Typography variant="h4" fontWeight={800}>
          Processus assignés
        </Typography>
        <Typography color="text.secondary">
          Vue des processus avec leurs limites de spécification.
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
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
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5', position: 'sticky', top: 0 }}>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 700, backgroundColor: '#f5f5f5', color: '#000' }}><strong>Nom</strong></TableCell>
                <TableCell sx={{ fontWeight: 700, backgroundColor: '#f5f5f5', color: '#000' }}><strong>Ligne</strong></TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#f5f5f5', color: '#000' }}><strong>LSL</strong></TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#f5f5f5', color: '#000' }}><strong>USL</strong></TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#f5f5f5', color: '#000' }}><strong>Cp cible</strong></TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#f5f5f5', color: '#000' }}><strong>Cpk cible</strong></TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#f5f5f5', color: '#000' }}><strong>Statut</strong></TableCell>
                <TableCell align="center" width={100} sx={{ fontWeight: 700, backgroundColor: '#f5f5f5', color: '#000' }}><strong>Actions</strong></TableCell>
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
                  <TableRow key={process._id} hover>
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
                        variant="text"
                        onClick={() => navigate(`/operator/process/${process._id}`)}
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