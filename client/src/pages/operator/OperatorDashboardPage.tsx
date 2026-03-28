import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
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
  process: string;
  value: number;
  date: string;
  comment?: string;
}

const toFixed2 = (value: number) => Number.isFinite(value) ? value.toFixed(2) : '0.00';

const getStatusColor = (value: number, lsl: number, usl: number) => {
  if (value < lsl || value > usl) return 'error';
  return 'success';
};

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
      <Box>
        <Typography variant="h4" fontWeight={800}>
          Dashboard Opérateur
        </Typography>
        <Typography color="text.secondary">
          Bienvenue. Voici un aperçu de vos processus et mesures récentes.
        </Typography>
      </Box>

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
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Processus assignés
                  </Typography>
                  <Typography variant="h5">{processes.length}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Mesures aujourd'hui
                  </Typography>
                  <Typography variant="h5">{measurementsToday}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Mesures cette semaine
                  </Typography>
                  <Typography variant="h5">{measurements.length}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined">
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
                    >
                      Ajouter
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Processes Overview */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Vos Processus
            </Typography>
            <Stack spacing={1.5}>
              {processes.length === 0 ? (
                <Typography color="text.secondary">Aucun processus assigné.</Typography>
              ) : (
                processes.slice(0, 5).map((process) => {
                  const lastMeasure = measurements.find(m => m.process === process._id);
                  const lastValue = lastMeasure?.value ?? null;
                  const status = lastValue !== null ? getStatusColor(lastValue, process.lsl, process.usl) : 'info';

                  return (
                    <Card key={process._id} variant="outlined" sx={{ position: 'relative' }}>
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
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: status === 'error' ? '#d32f2f' : '#388e3c',
                                fontWeight: 700
                              }}
                            >
                              {lastValue !== null ? `${toFixed2(lastValue)}` : 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Dernière mesure
                            </Typography>
                          </Box>
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
                        <Box sx={{ mt: 1 }}>
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => navigate(`/operator/process/${process._id}`)}
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
                >
                  Voir tous les processus ({processes.length})
                </Button>
              </Box>
            )}
          </Paper>

          {/* Recent Measurements */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Mesures Récentes
            </Typography>
            <Stack spacing={1}>
              {measurements.length === 0 ? (
                <Typography color="text.secondary">Aucune mesure enregistrée.</Typography>
              ) : (
                measurements.slice(0, 5).map((measurement) => {
                  const process = processes.find(p => p._id === measurement.process);
                  const status = process ? getStatusColor(measurement.value, process.lsl, process.usl) : 'info';

                  return (
                    <Box key={measurement._id} sx={{ py: 1, borderBottom: '1px solid #e0e0e0' }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {process?.name || 'Process inconnu'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(measurement.date).toLocaleString('fr-FR')}
                          </Typography>
                        </Box>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 700,
                            color: status === 'error' ? '#d32f2f' : '#388e3c'
                          }}
                        >
                          {toFixed2(measurement.value)}
                          {measurement.comment && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              {measurement.comment}
                            </Typography>
                          )}
                        </Typography>
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