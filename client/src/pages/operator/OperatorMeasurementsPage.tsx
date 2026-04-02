import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
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
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SearchIcon from '@mui/icons-material/Search';
import UploadFileIcon from '@mui/icons-material/UploadFile';
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
  createdBy?: string;
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
  const [editOpen, setEditOpen] = React.useState(false);
  const [editingMeasurementId, setEditingMeasurementId] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<MeasurementItem | null>(null);
  const [savingAction, setSavingAction] = React.useState(false);
  const [editForm, setEditForm] = React.useState({
    value: '',
    date: '',
    comment: '',
  });

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

  const reloadCurrentMeasurements = async () => {
    const refreshRes = await api.get(`/measurements?skip=${page * rowsPerPage}&limit=${rowsPerPage}&sort=-date${filters.processId ? `&process=${filters.processId}` : ''}`);
    setMeasurements(refreshRes.data.measurements || []);
    setTotalCount(refreshRes.data.total || 0);
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
            <Typography variant="h4" fontWeight={900}>
              Mes mesures
            </Typography>
            <Typography color="text.secondary">
              Suivi des mesures, filtrage rapide et import CSV.
            </Typography>
          </Box>
          <Chip label={`${totalCount} mesures`} color="primary" variant="outlined" sx={{ width: 'fit-content', fontWeight: 700 }} />
        </Stack>
      </Paper>

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

      {/* Filters + actions */}
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          borderRadius: 3,
          borderColor: 'divider',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(124,77,255,0.02))',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5} sx={{ mb: 2 }}>
          <Button
            variant="contained"
            onClick={() => navigate('/operator/add-measurement')}
            startIcon={<AddCircleOutlineIcon />}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 99 }}
          >
            Ajouter une mesure
          </Button>
          <Button
            variant="outlined"
            disabled={importLoading}
            onClick={() => csvInputRef.current?.click()}
            startIcon={<UploadFileIcon />}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 99 }}
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
        <Divider sx={{ mb: 2 }} />
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
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Measurements Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{
              borderRadius: 3,
              borderColor: 'divider',
              overflow: 'hidden',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(124,77,255,0.02))',
            }}
          >
            <Table>
              <TableHead sx={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <TableRow sx={{ '& th': { fontWeight: 800, bgcolor: 'rgba(25,118,210,0.08)' } }}>
                  <TableCell><strong>Processus</strong></TableCell>
                  <TableCell align="right"><strong>Valeur</strong></TableCell>
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell><strong>Commentaire</strong></TableCell>
                  <TableCell align="right" width={80}><strong>Actions</strong></TableCell>
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
                    <TableRow key={measurement._id} hover sx={{ '&:hover': { bgcolor: 'rgba(25,118,210,0.06)' } }}>
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
                        <Stack direction="row" spacing={0.7} justifyContent="flex-end">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<EditOutlinedIcon fontSize="small" />}
                            onClick={() => {
                              setEditingMeasurementId(measurement._id);
                              setEditForm({
                                value: String(measurement.value ?? ''),
                                date: new Date(measurement.date).toISOString().slice(0, 16),
                                comment: measurement.comment || '',
                              });
                              setEditOpen(true);
                            }}
                            sx={{ textTransform: 'none', borderRadius: 2 }}
                          >
                            Modifier
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteOutlineIcon fontSize="small" />}
                            onClick={() => setDeleteTarget(measurement)}
                            sx={{ textTransform: 'none', borderRadius: 2 }}
                          >
                            Supprimer
                          </Button>
                        </Stack>
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

      <Dialog open={editOpen} onClose={() => !savingAction && setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Modifier la mesure</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Valeur"
              type="number"
              value={editForm.value}
              onChange={(e) => setEditForm((prev) => ({ ...prev, value: e.target.value }))}
              fullWidth
              size="small"
            />
            <TextField
              label="Date"
              type="datetime-local"
              value={editForm.date}
              onChange={(e) => setEditForm((prev) => ({ ...prev, date: e.target.value }))}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Commentaire"
              value={editForm.comment}
              onChange={(e) => setEditForm((prev) => ({ ...prev, comment: e.target.value }))}
              fullWidth
              size="small"
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} disabled={savingAction}>Annuler</Button>
          <Button
            variant="contained"
            disabled={savingAction || !editingMeasurementId}
            onClick={async () => {
              if (!editingMeasurementId) return;
              const numericValue = Number(editForm.value);
              if (!Number.isFinite(numericValue)) {
                setError('La valeur de mesure doit être un nombre valide.');
                return;
              }
              try {
                setSavingAction(true);
                setError(null);
                await api.put(`/measurements/${editingMeasurementId}`, {
                  value: numericValue,
                  date: editForm.date ? new Date(editForm.date).toISOString() : undefined,
                  comment: editForm.comment,
                });
                await reloadCurrentMeasurements();
                setEditOpen(false);
                setEditingMeasurementId(null);
              } catch (err: any) {
                setError(err?.response?.data?.message || 'Erreur lors de la modification de la mesure.');
              } finally {
                setSavingAction(false);
              }
            }}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => !savingAction && setDeleteTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>Supprimer la mesure</DialogTitle>
        <DialogContent>
          <Typography>
            Confirmer la suppression de cette mesure ? Cette action est irreversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={savingAction}>Annuler</Button>
          <Button
            color="error"
            variant="contained"
            disabled={savingAction || !deleteTarget}
            onClick={async () => {
              if (!deleteTarget) return;
              try {
                setSavingAction(true);
                setError(null);
                await api.delete(`/measurements/${deleteTarget._id}`);
                await reloadCurrentMeasurements();
                setDeleteTarget(null);
              } catch (err: any) {
                setError(err?.response?.data?.message || 'Erreur lors de la suppression de la mesure.');
              } finally {
                setSavingAction(false);
              }
            }}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}