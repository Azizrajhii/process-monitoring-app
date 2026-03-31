import * as React from 'react';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import FactoryIcon from '@mui/icons-material/Factory';
import TimelineIcon from '@mui/icons-material/Timeline';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/http';

interface ProcessItem {
  _id: string;
  name: string;
  productionLine: string;
  lsl: number;
  usl: number;
  cpTarget: number;
  cpkTarget: number;
}

interface MeasurementItem {
  _id: string;
  process: string | { _id: string };
  value: number;
  date: string;
  comment?: string;
}

const toFixed2 = (value: number) => Number.isFinite(value) ? value.toFixed(2) : '0.00';

const getStatusColor = (value: number, lsl: number, usl: number) => {
  if (value < lsl || value > usl) return 'error';
  return 'success';
};

const getProcessId = (process: MeasurementItem['process']) =>
  typeof process === 'string' ? process : process?._id;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export default function OperatorDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [processes, setProcesses] = React.useState<ProcessItem[]>([]);
  const [measurements, setMeasurements] = React.useState<MeasurementItem[]>([]);
  const [measurementsToday, setMeasurementsToday] = React.useState(0);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch processes
        const processRes = await api.get('/processes');
        const processList = processRes.data.processes || [];
        setProcesses(processList);

        // Fetch measurements (last 10)
        const measureRes = await api.get('/measurements?limit=10&sort=-date');
        const measurementList = measureRes.data.measurements || [];
        setMeasurements(measurementList);

        // Count measurements from today
        const today = new Date().toDateString();
        const todayCount = measurementList.filter((m: MeasurementItem) => 
          new Date(m.date).toDateString() === today
        ).length;
        setMeasurementsToday(todayCount);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Erreur lors du chargement du dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
              Dashboard Opérateur
            </Typography>
            <Typography color="text.secondary">
              Bienvenue. Voici un aperçu de vos processus et mesures récentes.
            </Typography>
          </Box>
          <Chip icon={<TimelineIcon />} label="Vue temps reel" color="primary" variant="outlined" sx={{ width: 'fit-content' }} />
        </Stack>
      </Paper>

      {error && <Alert severity="warning">{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* KPIs Summary */}
          <Grid container spacing={2} columns={12}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined" sx={{ borderRadius: 3, bgcolor: 'rgba(255,255,255,0.02)', height: '100%' }}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Processus assignés
                  </Typography>
                  <Typography variant="h5">{processes.length}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined" sx={{ borderRadius: 3, bgcolor: 'rgba(255,255,255,0.02)', height: '100%' }}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Mesures aujourd'hui
                  </Typography>
                  <Typography variant="h5">{measurementsToday}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined" sx={{ borderRadius: 3, bgcolor: 'rgba(255,255,255,0.02)', height: '100%' }}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Mesures cette semaine
                  </Typography>
                  <Typography variant="h5">{measurements.length}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined" sx={{ borderRadius: 3, bgcolor: 'rgba(255,255,255,0.02)', height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography color="text.secondary" gutterBottom>
                        Actions rapides
                      </Typography>
                    </Box>
                    <Button 
                      size="small" 
                      variant="contained"
                      onClick={() => navigate('/operator/add-measurement')}
                      startIcon={<AddCircleOutlineIcon />}
                      sx={{ borderRadius: 99, textTransform: 'none', fontWeight: 700 }}
                    >
                      Ajouter
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Processes Overview */}
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: 3,
              borderColor: 'primary.light',
              background: 'linear-gradient(180deg, rgba(25,118,210,0.07), rgba(124,77,255,0.03))',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <FactoryIcon color="primary" />
              <Typography variant="h6" fontWeight={800}>
                Vos Processus
              </Typography>
            </Stack>
            <Stack spacing={1.5}>
              {processes.length === 0 ? (
                <Typography color="text.secondary">Aucun processus assigné.</Typography>
              ) : (
                processes.slice(0, 5).map((process) => {
                  const latestForProcess = measurements.find((m) => getProcessId(m.process) === process._id);
                  const latestValue = latestForProcess?.value ?? null;
                  const withinLimits =
                    latestValue !== null && latestValue >= process.lsl && latestValue <= process.usl;
                  const statusLabel = latestValue === null
                    ? 'Aucune mesure'
                    : withinLimits
                      ? 'Stable'
                      : 'Hors limite';
                  const statusColor = latestValue === null
                    ? 'default'
                    : withinLimits
                      ? 'success'
                      : 'error';
                  const markerPosition = latestValue === null
                    ? 50
                    : clamp(((latestValue - process.lsl) / Math.max(process.usl - process.lsl, 1e-6)) * 100, 0, 100);

                  return (
                    <Card key={process._id} variant="outlined" sx={{ position: 'relative', borderRadius: 2.5, bgcolor: 'rgba(255,255,255,0.02)' }}>
                      <CardContent sx={{ pb: 1.5 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                          <Box>
                            <Typography fontWeight={700}>
                              {process.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Ligne: {process.productionLine}
                            </Typography>
                          </Box>
                          <Chip size="small" color={statusColor} variant="outlined" label={statusLabel} />
                        </Stack>
                        <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                          <Typography variant="body2">
                            <strong>LSL:</strong> {toFixed2(process.lsl)}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Target:</strong> {toFixed2((process.lsl + process.usl) / 2)}
                          </Typography>
                          <Typography variant="body2">
                            <strong>USL:</strong> {toFixed2(process.usl)}
                          </Typography>
                        </Stack>
                        <Box sx={{ mt: 1.2 }}>
                          <Typography variant="caption" color="text.secondary">
                            Position mesure
                          </Typography>
                          <Box
                            sx={{
                              mt: 0.7,
                              position: 'relative',
                              height: 8,
                              borderRadius: 99,
                              bgcolor: 'rgba(255,255,255,0.12)',
                              overflow: 'hidden',
                            }}
                          >
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                background: 'linear-gradient(90deg, rgba(244,67,54,0.55), rgba(76,175,80,0.55), rgba(244,67,54,0.55))',
                              }}
                            />
                            <Box
                              sx={{
                                position: 'absolute',
                                top: -3,
                                left: `calc(${markerPosition}% - 4px)`,
                                width: 8,
                                height: 14,
                                borderRadius: 99,
                                bgcolor: latestValue === null ? 'grey.400' : withinLimits ? 'success.main' : 'error.main',
                                boxShadow: '0 0 10px rgba(0,0,0,0.45)',
                              }}
                            />
                          </Box>
                          <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.4 }}>
                            <Typography variant="caption" color="text.secondary">LSL</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {latestValue === null ? 'N/A' : `Mesure: ${toFixed2(latestValue)}`}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">USL</Typography>
                          </Stack>
                        </Box>
                        <Box sx={{ mt: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => navigate('/operator/add-measurement')}
                            sx={{ mr: 1, borderRadius: 99, textTransform: 'none', fontWeight: 700 }}
                          >
                            Saisir mesure
                          </Button>
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => navigate(`/operator/process/${process._id}`)}
                            sx={{ textTransform: 'none', fontWeight: 700 }}
                          >
                            Voir détails
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </Stack>
            {processes.length > 5 && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button
                  variant="text"
                  onClick={() => navigate('/operator/processes')}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  Voir tous les processus ({processes.length})
                </Button>
              </Box>
            )}
          </Paper>

          {/* Recent Measurements */}
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: 3,
              borderColor: 'primary.light',
              background: 'linear-gradient(180deg, rgba(25,118,210,0.07), rgba(124,77,255,0.03))',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <TimelineIcon color="primary" />
              <Typography variant="h6" fontWeight={800}>
                Mesures Récentes
              </Typography>
            </Stack>
            <Stack spacing={1}>
              {measurements.length === 0 ? (
                <Typography color="text.secondary">Aucune mesure enregistrée.</Typography>
              ) : (
                measurements.slice(0, 5).map((measurement) => {
                  const process = processes.find((p) => p._id === getProcessId(measurement.process));
                  const status = process ? getStatusColor(measurement.value, process.lsl, process.usl) : 'info';
                  const statusLabel = status === 'error' ? 'Hors limite' : 'OK';

                  return (
                    <Box key={measurement._id} sx={{ py: 1, px: 1, borderRadius: 2, borderBottom: '1px solid #2b2f3a', bgcolor: 'rgba(255,255,255,0.02)' }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {process?.name || 'Process inconnu'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(measurement.date).toLocaleString('fr-FR')}
                          </Typography>
                        </Box>
                        <Stack alignItems="flex-end" spacing={0.3}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              color: status === 'error' ? '#d32f2f' : '#388e3c'
                            }}
                          >
                            {toFixed2(measurement.value)}
                          </Typography>
                          <Chip size="small" variant="outlined" color={status === 'error' ? 'error' : 'success'} label={statusLabel} />
                          {measurement.comment && (
                            <Typography variant="caption" color="text.secondary">
                              {measurement.comment}
                            </Typography>
                          )}
                        </Stack>
                      </Stack>
                    </Box>
                  );
                })
              )}
            </Stack>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant="text"
                onClick={() => navigate('/operator/measurements')}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Voir toutes les mesures
              </Button>
            </Box>
          </Paper>
        </>
      )}
    </Stack>
  );
}