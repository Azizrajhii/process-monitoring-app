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

interface ProcessItem {
  _id: string;
  name: string;
  lsl: number;
  usl: number;
}

interface MeasurementItem {
  _id: string;
  value: number;
  date: string;
  process: {
    _id: string;
    name: string;
  };
}

export default function QualityValidationPage() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [processes, setProcesses] = React.useState<ProcessItem[]>([]);
  const [measurements, setMeasurements] = React.useState<MeasurementItem[]>([]);
  const [processId, setProcessId] = React.useState('');

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [procRes, measRes] = await Promise.all([
          api.get('/processes'),
          api.get('/measurements', { params: { limit: 200, sort: '-date' } }),
        ]);

        setProcesses(procRes.data.processes || []);
        setMeasurements(measRes.data.measurements || []);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Erreur de chargement de la validation qualite.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const processMap = React.useMemo(() => {
    const map = new Map<string, ProcessItem>();
    for (const p of processes) map.set(p._id, p);
    return map;
  }, [processes]);

  const screenedRows = measurements
    .filter((m) => !processId || m.process?._id === processId)
    .map((m) => {
      const process = processMap.get(m.process?._id);
      const lsl = Number(process?.lsl);
      const usl = Number(process?.usl);
      const outOfSpec = Number.isFinite(lsl) && Number.isFinite(usl)
        ? m.value < lsl || m.value > usl
        : false;

      return {
        ...m,
        lsl,
        usl,
        outOfSpec,
      };
    });

  const outCount = screenedRows.filter((row) => row.outOfSpec).length;

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h4" fontWeight={800}>Validation qualite</Typography>
        <Typography color="text.secondary">
          Controle des mesures recentes avec detection des valeurs hors limites (LSL/USL).
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 320 }}>
            <InputLabel>Processus</InputLabel>
            <Select
              label="Processus"
              value={processId}
              onChange={(e) => setProcessId(e.target.value)}
            >
              <MenuItem value="">Tous les processus</MenuItem>
              {processes.map((p) => (
                <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Alert severity={outCount > 0 ? 'warning' : 'success'}>
            {outCount > 0 ? `${outCount} mesure(s) hors specification detectee(s)` : 'Aucune derive detectee'}
          </Alert>
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
                <TableCell>Processus</TableCell>
                <TableCell>Valeur</TableCell>
                <TableCell>LSL</TableCell>
                <TableCell>USL</TableCell>
                <TableCell>Etat</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {screenedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">Aucune mesure disponible.</TableCell>
                </TableRow>
              ) : (
                screenedRows.map((row) => (
                  <TableRow key={row._id} hover selected={row.outOfSpec}>
                    <TableCell>{new Date(row.date).toLocaleString('fr-FR')}</TableCell>
                    <TableCell>{row.process?.name || '-'}</TableCell>
                    <TableCell>{row.value}</TableCell>
                    <TableCell>{Number.isFinite(row.lsl) ? row.lsl : '-'}</TableCell>
                    <TableCell>{Number.isFinite(row.usl) ? row.usl : '-'}</TableCell>
                    <TableCell>
                      {row.outOfSpec ? (
                        <Typography color="warning.main" fontWeight={700}>Hors spec</Typography>
                      ) : (
                        <Typography color="success.main" fontWeight={700}>Conforme</Typography>
                      )}
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