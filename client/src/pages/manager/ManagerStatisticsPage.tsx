import * as React from 'react';
import Predictor from '../../components/Predictor';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { LineChart } from '@mui/x-charts/LineChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { api } from '../../api/http';

interface ProcessItem {
  _id: string;
  name: string;
}

interface ProcessReportResponse {
  report: {
    process: {
      _id: string;
      name: string;
      productionLine: string;
      lsl: number;
      usl: number;
      cpTarget: number;
      cpkTarget: number;
    };
    analysisDate: string;
    statistics: {
      sampleSize: number;
      mean: number;
      stdDev: number;
      cp: number | null;
      cpk: number | null;
    };
    charts: {
      spc: {
        labels: string[];
        values: number[];
      };
      histogram: {
        labels: string[];
        counts: number[];
      };
    };
    alerts: Array<{
      _id?: string;
      type: string;
      message: string;
      status: 'treated' | 'not_treated' | 'system';
      date: string;
    }>;
    conclusion: {
      status: 'capable' | 'non_capable' | 'insufficient_data';
      message: string;
    };
  };
}

const toFixed2 = (value: number) => Number.isFinite(value) ? value.toFixed(2) : '0.00';
export default function ManagerStatisticsPage() {
  const [loading, setLoading] = React.useState(true);
  const [reportLoading, setReportLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [processes, setProcesses] = React.useState<ProcessItem[]>([]);
  const [selectedProcessId, setSelectedProcessId] = React.useState('');
  const [report, setReport] = React.useState<ProcessReportResponse['report'] | null>(null);

  // Ces variables dépendent de report, donc doivent être déclarées après les hooks
  const processInfo = report?.process;
  const latestValues = report?.charts?.spc?.values?.slice(-6) || [];
  const uslValue = processInfo?.usl ?? 510;

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const processRes = await api.get('/processes');

        const processList = processRes.data.processes || [];
        setProcesses(processList);
        if (processList.length > 0) {
          setSelectedProcessId(processList[0]._id);
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Erreur lors du chargement des rapports.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  React.useEffect(() => {
    const fetchReport = async () => {
      if (!selectedProcessId) {
        setReport(null);
        return;
      }

      try {
        setReportLoading(true);
        setError(null);
        const res = await api.get<ProcessReportResponse>(`/reports/process/${selectedProcessId}`);
        setReport(res.data.report);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Erreur lors du chargement du rapport process.');
      } finally {
        setReportLoading(false);
      }
    };

    fetchReport();
  }, [selectedProcessId]);

  const stats = report?.statistics;
  const capable = report?.conclusion?.status === 'capable';
  const cpValue = stats?.cp;
  const cpkValue = stats?.cpk;
  const isInsufficientData = report?.conclusion?.status === 'insufficient_data';
  const conclusionSeverity = isInsufficientData ? 'info' : capable ? 'success' : 'warning';
  const conclusionLabel = isInsufficientData ? 'Donnees insuffisantes' : capable ? 'Process capable' : 'Process non capable';
  const openAlertsCount = report?.alerts.filter((item) => item.status === 'not_treated').length ?? 0;
  const totalAlertsCount = report?.alerts.length ?? 0;
  const analysisDate = report?.analysisDate
    ? new Date(report.analysisDate).toLocaleDateString('fr-FR')
    : new Date().toLocaleDateString('fr-FR');

  const kpiCards = [
    { label: 'Nombre mesures', value: String(stats?.sampleSize ?? 0) },
    { label: 'Moyenne', value: toFixed2(Number(stats?.mean ?? 0)) },
    { label: 'Ecart type', value: toFixed2(Number(stats?.stdDev ?? 0)) },
    { label: 'Cp', value: cpValue === null || cpValue === undefined ? 'N/A' : toFixed2(cpValue) },
    { label: 'Cpk', value: cpkValue === null || cpkValue === undefined ? 'N/A' : toFixed2(cpkValue) },
  ];

  return (
    <Stack spacing={2.5} sx={{ pb: 2 }}>
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, md: 2.5 },
          borderRadius: 3,
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.8} alignItems={{ md: 'center' }} justifyContent="space-between">
          <Box>
            <Typography variant="h4" fontWeight={800}>Rapports Manager</Typography>
            <Typography color="text.secondary">
              Lecture operationnelle des process, capacite et prediction machine learning.
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">{processes.length} process</Typography>
        </Stack>
      </Paper>

      {error && <Alert severity="warning">{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: 3,
              borderColor: 'divider',
              backgroundColor: 'background.paper',
            }}
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
              <Typography variant="subtitle1" fontWeight={800}>Selection du process</Typography>
              <FormControl size="small" sx={{ minWidth: 320 }}>
                <Select
                  value={selectedProcessId}
                  onChange={(event) => setSelectedProcessId(event.target.value)}
                  displayEmpty
                >
                  {processes.length === 0 && <MenuItem value="">Aucun process disponible</MenuItem>}
                  {processes.map((item) => (
                    <MenuItem key={item._id} value={item._id}>{item.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {selectedProcessId && <AutoGraphIcon color="action" sx={{ ml: { sm: 'auto' } }} />}
            </Stack>
          </Paper>

          {reportLoading || !report ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Grid container spacing={2} columns={15}>
                {kpiCards.map((item) => (
                  <Grid key={item.label} size={{ xs: 15, sm: 7.5, md: 3 }}>
                    <Card
                      variant="outlined"
                      sx={{
                        height: '100%',
                        borderRadius: 3,
                        borderColor: 'divider',
                        backgroundColor: 'background.paper',
                      }}
                    >
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                        <Typography variant="h5" fontWeight={900} sx={{ mt: 0.4 }}>{item.value}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Grid container spacing={2} columns={12}>
                <Grid size={{ xs: 12, lg: 7 }}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      borderColor: 'divider',
                      backgroundColor: 'background.paper',
                    }}
                  >
                    <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>
                      SPC chart
                    </Typography>
                    <LineChart
                      xAxis={[{ scaleType: 'point', data: report.charts.spc.labels }]}
                      series={[{ label: 'Measurements', data: report.charts.spc.values, showMark: false, curve: 'monotoneX' }]}
                      height={280}
                      margin={{ left: 40, right: 20, top: 20, bottom: 20 }}
                      grid={{ horizontal: true }}
                    />
                  </Paper>
                    {/* Prediction ML integree */}
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2.5,
                        borderRadius: 3,
                        mt: 2,
                        borderColor: 'divider',
                        backgroundColor: 'background.paper',
                      }}
                    >
                      <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>
                        Prédiction Machine Learning (valeurs récentes)
                      </Typography>
                      <Predictor initialValues={latestValues} initialUsl={uslValue} showMeasurementsInput={false} showUslInput={false} />
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, lg: 5 }}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      borderColor: 'divider',
                      backgroundColor: 'background.paper',
                    }}
                  >
                    <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>
                      Histogram / Distribution
                    </Typography>
                    <BarChart
                      xAxis={[{ scaleType: 'band', data: report.charts.histogram.labels }]}
                      series={[{ label: 'Frequence', data: report.charts.histogram.counts }]}
                      height={280}
                      margin={{ left: 30, right: 10, top: 20, bottom: 20 }}
                      grid={{ horizontal: true }}
                    />
                  </Paper>

                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2.2,
                      borderRadius: 3,
                      mt: 2,
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.2 }}>
                      Informations du process
                    </Typography>
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography color="text.secondary">Nom process</Typography>
                        <Typography fontWeight={700}>{processInfo?.name || '-'}</Typography>
                      </Stack>
                      <Divider />
                      <Stack direction="row" justifyContent="space-between">
                        <Typography color="text.secondary">Date analyse</Typography>
                        <Typography fontWeight={700}>{analysisDate}</Typography>
                      </Stack>
                      <Divider />
                      <Stack direction="row" justifyContent="space-between">
                        <Typography color="text.secondary">LSL</Typography>
                        <Typography fontWeight={700}>{toFixed2(Number(processInfo?.lsl ?? 0))}</Typography>
                      </Stack>
                      <Divider />
                      <Stack direction="row" justifyContent="space-between">
                        <Typography color="text.secondary">USL</Typography>
                        <Typography fontWeight={700}>{toFixed2(Number(processInfo?.usl ?? 0))}</Typography>
                      </Stack>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>

              <Paper
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  borderColor: 'divider',
                  backgroundColor: 'background.paper',
                }}
              >
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  alignItems={{ sm: 'center' }}
                  justifyContent="space-between"
                  spacing={1.2}
                  sx={{ mb: 1.2 }}
                >
                  <Typography variant="h6" fontWeight={800}>
                    Conclusion
                  </Typography>
                  <Chip
                    size="small"
                    label={conclusionLabel}
                    color={conclusionSeverity}
                    variant="outlined"
                    sx={{ fontWeight: 700 }}
                  />
                </Stack>
                <Alert severity={conclusionSeverity} sx={{ mb: 1.2 }}>
                  {report.conclusion.message}
                </Alert>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Box sx={{ px: 1.2, py: 0.8, borderRadius: 2, bgcolor: 'action.hover' }}>
                    <Typography variant="caption" color="text.secondary">Date analyse</Typography>
                    <Typography variant="body2" fontWeight={700}>{analysisDate}</Typography>
                  </Box>
                  <Box sx={{ px: 1.2, py: 0.8, borderRadius: 2, bgcolor: 'action.hover' }}>
                    <Typography variant="caption" color="text.secondary">Cp / Cpk</Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {cpValue === null || cpValue === undefined ? 'N/A' : toFixed2(cpValue)} / {cpkValue === null || cpkValue === undefined ? 'N/A' : toFixed2(cpkValue)}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              <Paper
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  borderColor: 'divider',
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                  <WarningAmberIcon color="warning" fontSize="small" />
                  <Typography variant="h6" fontWeight={800}>
                    Alertes process
                  </Typography>
                  <Chip
                    size="small"
                    color={openAlertsCount > 0 ? 'warning' : 'success'}
                    label={`${openAlertsCount} ouvertes / ${totalAlertsCount}`}
                    variant="outlined"
                    sx={{ ml: 'auto', fontWeight: 700 }}
                  />
                </Stack>
                <Stack spacing={1}>
                  {report.alerts.length === 0 && (
                    <Typography color="text.secondary">Aucune alerte pour ce process.</Typography>
                  )}
                  {report.alerts.map((item, index) => {
                    const severity = item.status === 'system' ? 'info' : item.status === 'not_treated' ? 'warning' : 'success';
                    const statusLabel = item.status === 'system' ? 'Systeme' : item.status === 'not_treated' ? 'Ouvert' : 'Traite';
                    return (
                      <Box
                        key={item._id || `${item.date}-${index}`}
                        sx={{
                          p: 1.3,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: 'background.paper',
                        }}
                      >
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                          <Chip
                            size="small"
                            color={severity}
                            label={statusLabel}
                            sx={{ fontWeight: 700, width: 'fit-content' }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(item.date).toLocaleString('fr-FR')}
                          </Typography>
                        </Stack>
                        <Typography variant="body2" sx={{ mt: 0.8 }}>
                          {item.message}
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
              </Paper>
            </>
          )}
        </>
      )}
    </Stack>
  );
}