import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
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
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/http';

interface ProcessItem {
  _id: string;
  name: string;
}

interface MeasurementItem {
  _id: string;
  process: {
    _id: string;
    name: string;
  } | string;
  value: number;
  date: string;
  comment?: string;
}

const toFixed2 = (value: number) => Number.isFinite(value) ? value.toFixed(2) : '0.00';

export default function OperatorMeasurementsPage() {
  const navigate = useNavigate();
  const csvInputRef = React.useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [importLoading, setImportLoading] = React.useState(false);
  const [importSummary, setImportSummary] = React.useState<{
    fileName: string;
    importedCount: number;
    alertsCreated: number;
    errors: string[];
  } | null>(null);
  const [measurements, setMeasurements] = React.useState<MeasurementItem[]>([]);
  const [processes, setProcesses] = React.useState<ProcessItem[]>([]);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [totalCount, setTotalCount] = React.useState(0);

  const [filters, setFilters] = React.useState({
    processId: '',
    searchValue: '',
  });

  // Fetch processes first
  React.useEffect(() => {
    const fetchProcesses = async () => {
      try {
        const res = await api.get('/processes');
        setProcesses(res.data.processes || []);
      } catch (err) {
        console.error('Error loading processes:', err);
      }
    };

    fetchProcesses();
  }, []);

  // Fetch measurements when filters or pagination changes
  React.useEffect(() => {
    const fetchMeasurements = async () => {
      try {
        setLoading(true);
        setError(null);

        let url = `/measurements?skip=${page * rowsPerPage}&limit=${rowsPerPage}&sort=-date`;
        if (filters.processId) {
          url += `&process=${filters.processId}`;
        }

        const res = await api.get(url);
        const measurementList = res.data.measurements || [];
        setMeasurements(measurementList);
        setTotalCount(res.data.total || 0);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Erreur lors du chargement des mesures.');
      } finally {
        setLoading(false);
      }
    };

    fetchMeasurements();
  }, [filters.processId, page, rowsPerPage]);

  const handleFilterChange = (e: any) => {
    setFilters(prev => ({ ...prev, processId: e.target.value }));
    setPage(0);
  };

  const handlePageChange = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event?.target?.value, 10));
    setPage(0);
  };

  const handleImportCsv = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isCsvFile = file.name.toLowerCase().endsWith('.csv') || file.type.includes('csv');
    if (!isCsvFile) {
      setError('Fichier invalide. Veuillez importer un fichier CSV.');
      if (csvInputRef.current) {
        csvInputRef.current.value = '';
      }
      return;
    }

    try {
      setError(null);
      setImportSummary(null);
      setImportLoading(true);

      const csvText = await file.text();
      const res = await api.post('/measurements/import-csv', { csv: csvText });

      const importedCount = res.data?.importedCount || 0;
      const alertsCreated = res.data?.alertsCreated || 0;
      const rawErrors = Array.isArray(res.data?.errors) ? res.data.errors : [];
      const normalizedErrors = rawErrors.map((item: any, index: number) => {
        if (typeof item === 'string') return item;
        const line = item?.line ? `Ligne ${item.line}` : `Ligne ${index + 1}`;
        const message = item?.message || 'Erreur inconnue';
        return `${line}: ${message}`;
      });

      setImportSummary({
        fileName: file.name,
        importedCount,
        alertsCreated,
        errors: normalizedErrors,
      });

      setPage(0);
      const refreshRes = await api.get(`/measurements?skip=0&limit=${rowsPerPage}&sort=-date${filters.processId ? `&process=${filters.processId}` : ''}`);
      setMeasurements(refreshRes.data.measurements || []);
      setTotalCount(refreshRes.data.total || 0);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de l import CSV.');
    } finally {
      setImportLoading(false);
      if (csvInputRef.current) {
        csvInputRef.current.value = '';
      }
    }
  };

  const getProcessName = (processField: any) => {
    if (typeof processField === 'object' && processField?.name) {
      return processField.name;
    }
    return 'N/A';
  };

  const filteredMeasurements = measurements.filter(m => {
    if (!filters.searchValue) return true;
    const searchStr = filters.searchValue.toLowerCase();
    const processName = getProcessName(m.process).toLowerCase();
    const value = toFixed2(m.value).toLowerCase();
    return processName.includes(searchStr) || value.includes(searchStr);
  });

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" fontWeight={800}>
          Mes Mesures
        </Typography>
        <Typography color="text.secondary">
          Historique de toutes vos mesures enregistrées.
        </Typography>
      </Box>

      {error && <Alert severity="warning">{error}</Alert>}
      {importLoading && (
        <Alert severity="info" icon={<CircularProgress size={16} color="inherit" />}>
          Import CSV en cours...
        </Alert>
      )}
      {importSummary && (
        <Alert
          severity={
            importSummary.errors.length === 0
              ? 'success'
              : importSummary.importedCount > 0
                ? 'warning'
                : 'error'
          }
        >
          Import termine ({importSummary.fileName}) : {importSummary.importedCount} mesure(s) importee(s),{' '}
          {importSummary.alertsCreated} alerte(s), {importSummary.errors.length} erreur(s).
          {importSummary.errors.length > 0 && (
            <Box component="ul" sx={{ m: 0, mt: 1, pl: 2 }}>
              {importSummary.errors.slice(0, 5).map((message, idx) => (
                <li key={`${message}-${idx}`}>{message}</li>
              ))}
              {importSummary.errors.length > 5 && (
                <li>...et {importSummary.errors.length - 5} autre(s) erreur(s).</li>
              )}
            </Box>
          )}
        </Alert>
      )}

      {/* Filters */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Grid container spacing={2} columns={12}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Filtrer par processus</InputLabel>
              <Select
                value={filters.processId}
                label="Filtrer par processus"
                onChange={handleFilterChange}
              >
                <MenuItem value="">Tous les processus</MenuItem>
                {processes.map(process => (
                  <MenuItem key={process._id} value={process._id}>
                    {process.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Recherche..."
              value={filters.searchValue}
              onChange={(e) => setFilters(prev => ({ ...prev, searchValue: e.target.value }))}
              variant="outlined"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Actions */}
      <Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2}>
          <Button
            variant="contained"
            onClick={() => navigate('/operator/add-measurement')}
          >
            Ajouter une mesure
          </Button>
          <Button
            variant="outlined"
            disabled={importLoading}
            onClick={() => csvInputRef.current?.click()}
          >
            {importLoading ? 'Import en cours...' : 'Importer CSV'}
          </Button>
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,text/csv"
            style={{ display: 'none' }}
            onChange={handleImportCsv}
          />
        </Stack>
      </Box>

      {/* Measurements Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5', position: 'sticky', top: 0 }}>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 700, backgroundColor: '#f5f5f5', color: '#000' }}><strong>Processus</strong></TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, backgroundColor: '#f5f5f5', color: '#000' }}><strong>Valeur</strong></TableCell>
                  <TableCell sx={{ fontWeight: 700, backgroundColor: '#f5f5f5', color: '#000' }}><strong>Date</strong></TableCell>
                  <TableCell sx={{ fontWeight: 700, backgroundColor: '#f5f5f5', color: '#000' }}><strong>Commentaire</strong></TableCell>
                  <TableCell align="right" width={80} sx={{ fontWeight: 700, backgroundColor: '#f5f5f5', color: '#000' }}><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMeasurements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      <Typography color="text.secondary">
                        Aucune mesure enregistrée.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMeasurements.map(measurement => (
                    <TableRow key={measurement._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {getProcessName(measurement.process)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>
                          {toFixed2(measurement.value)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(measurement.date).toLocaleString('fr-FR')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {measurement.comment || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => {
                            // Could add edit/delete functionality later
                            console.log('Action on measurement:', measurement._id);
                          }}
                        >
                          ···
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredMeasurements.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              labelRowsPerPage="Lignes par page:"
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
            />
          )}
        </>
      )}
    </Stack>
  );
}