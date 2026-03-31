import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Fade from '@mui/material/Fade';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ScienceIcon from '@mui/icons-material/Science';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { LineChart } from '@mui/x-charts/LineChart';
import { api } from '../../api/http';

interface ProcessItem {
  _id: string;
  name: string;
}

interface AlertItem {
  type: string;
  message: string;
  status?: string;
  date?: string;
  details?: any;
}

interface SPCChart {
  labels: string[];
  values: number[];
  lsl: number;
  usl: number;
}

interface ProcessReportResponse {
  report: {
    process: {
      _id: string;
      name: string;
      lsl: number;
      usl: number;
    };
    statistics: {
      sampleSize: number;
      mean: number;
      stdDev: number;
      cp: number | null;
      cpk: number | null;
    };
    charts?: {
      spc?: SPCChart;
      histogram?: any;
    };
    alerts?: AlertItem[];
    conclusion: {
      status: 'capable' | 'non_capable' | 'insufficient_data';
      message: string;
    };
  };
}

interface HistoryPoint {
  label: string;
  cp: number | null;
  cpk: number | null;
}

interface HistoryResponse {
  history: HistoryPoint[];
}

const toFixed2 = (value: number) => (Number.isFinite(value) ? value.toFixed(2) : '0.00');

export default function QualityReportsPage() {
  const [loading, setLoading] = React.useState(true);
  const [reportLoading, setReportLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [exporting, setExporting] = React.useState<'csv' | 'pdf' | null>(null);
  const [feedback, setFeedback] = React.useState<{
    severity: 'success' | 'info';
    message: string;
  } | null>(null);
  const [processes, setProcesses] = React.useState<ProcessItem[]>([]);
  const [selectedProcessId, setSelectedProcessId] = React.useState('');
  const [period, setPeriod] = React.useState<'week' | 'month' | 'quarter'>('week');
  const [report, setReport] = React.useState<ProcessReportResponse['report'] | null>(null);
  const [history, setHistory] = React.useState<HistoryPoint[]>([]);

  React.useEffect(() => {
    const fetchProcesses = async () => {
      try {
        setLoading(true);
        const processRes = await api.get('/processes');
        const processList = processRes.data.processes || [];
        setProcesses(processList);
        if (processList.length > 0) setSelectedProcessId(processList[0]._id);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Erreur lors du chargement des processus.');
      } finally {
        setLoading(false);
      }
    };

    fetchProcesses();
  }, []);

  React.useEffect(() => {
    const fetchReportData = async () => {
      if (!selectedProcessId) return;

      try {
        setReportLoading(true);
        setError(null);
        setFeedback(null);

        const [reportRes, historyRes] = await Promise.all([
          api.get<ProcessReportResponse>(`/reports/process/${selectedProcessId}`),
          api.get<HistoryResponse>(`/reports/process/${selectedProcessId}/history`, {
            params: { period, points: 8 },
          }),
        ]);

        setReport(reportRes.data.report);
        setHistory(historyRes.data.history || []);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Erreur lors du chargement du rapport.');
      } finally {
        setReportLoading(false);
      }
    };

    fetchReportData();
  }, [selectedProcessId, period]);

  const exportCsv = async () => {
    if (!selectedProcessId) return;

    try {
      setExporting('csv');
      setError(null);
      const res = await api.get(`/reports/process/${selectedProcessId}/export.csv`, {
        responseType: 'blob',
      });

      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${selectedProcessId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setFeedback({ severity: 'success', message: 'Export CSV termine avec succes.' });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de l export CSV.');
    } finally {
      setExporting(null);
    }
  };

  const exportPdf = async () => {
    if (!selectedProcessId) return;

    try {
      setExporting('pdf');
      setError(null);
      const res = await api.get(`/reports/process/${selectedProcessId}/export.pdf`, {
        responseType: 'blob',
      });

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${selectedProcessId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setFeedback({ severity: 'success', message: 'Export PDF termine avec succes.' });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de l export PDF.');
    } finally {
      setExporting(null);
    }
  };

  const cpkSeries = history.map((item) => (item.cpk === null ? 0 : item.cpk));
  const cpSeries = history.map((item) => (item.cp === null ? 0 : item.cp));
  const labels = history.map((item) => item.label);

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
            <Typography variant="h4" fontWeight={900}>
              Rapports qualite
            </Typography>
            <Typography color="text.secondary">
              Lecture de capabilite par processus, comparaison temporelle et export CSV/PDF.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip label="SPC & Capabilite" color="primary" variant="outlined" sx={{ fontWeight: 800 }} />
            <Chip label="Comparaison Cp/Cpk" color="primary" variant="outlined" sx={{ fontWeight: 800 }} />
          </Stack>
        </Stack>
      </Paper>

      {error && (
        <Alert
          severity="warning"
          variant="outlined"
          sx={{
            borderRadius: 3,
            bgcolor: 'rgba(10,15,28,0.6)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {error}
        </Alert>
      )}
      {feedback && (
        <Alert
          severity={feedback.severity}
          variant="outlined"
          sx={{
            borderRadius: 3,
            bgcolor: 'rgba(10,15,28,0.6)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {feedback.message}
        </Alert>
      )}

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
              borderRadius: 4,
              borderColor: 'divider',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(124,77,255,0.02))',
            }}
          >
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 300 }}>
                <Select value={selectedProcessId} onChange={(e) => setSelectedProcessId(e.target.value)}>
                  {processes.map((process) => (
                    <MenuItem key={process._id} value={process._id}>{process.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <Select value={period} onChange={(e) => setPeriod(e.target.value as 'week' | 'month' | 'quarter')}>
                  <MenuItem value="week">Semaine</MenuItem>
                  <MenuItem value="month">Mois</MenuItem>
                  <MenuItem value="quarter">Trimestre</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="contained"
                onClick={exportCsv}
                disabled={exporting !== null || reportLoading}
                startIcon={exporting === 'csv' ? <CircularProgress size={16} color="inherit" /> : undefined}
                sx={{
                  borderRadius: 99,
                  textTransform: 'none',
                  fontWeight: 800,
                  background: 'linear-gradient(90deg, #1976d2, #7c4dff)',
                }}
              >
                {exporting === 'csv' ? 'Export CSV...' : 'Exporter CSV'}
              </Button>
              <Button
                variant="outlined"
                onClick={exportPdf}
                disabled={exporting !== null || reportLoading}
                startIcon={exporting === 'pdf' ? <CircularProgress size={16} /> : undefined}
                sx={{ borderRadius: 99, textTransform: 'none', fontWeight: 800 }}
              >
                {exporting === 'pdf' ? 'Export PDF...' : 'Exporter PDF'}
              </Button>
            </Stack>
          </Paper>

          {reportLoading || !report ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>


              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      borderColor: 'primary.light',
                      background: 'linear-gradient(180deg, rgba(25,118,210,0.08), rgba(124,77,255,0.02))',
                      height: '100%',
                    }}
                  >
                    <Typography variant="h6" fontWeight={800} sx={{ mb: 1.2 }}>
                      Statistiques actuelles
                    </Typography>
                    <Stack spacing={1}>
                      <Typography><strong>Sample size:</strong> {report?.statistics.sampleSize}</Typography>
                      <Typography><strong>Moyenne:</strong> {toFixed2(report?.statistics.mean ?? 0)}</Typography>
                      <Typography><strong>Ecart type:</strong> {toFixed2(report?.statistics.stdDev ?? 0)}</Typography>
                      <Typography><strong>Cp:</strong> {report?.statistics.cp === null ? 'N/A' : toFixed2(report?.statistics.cp ?? 0)}</Typography>
                      <Typography><strong>Cpk:</strong> {report?.statistics.cpk === null ? 'N/A' : toFixed2(report?.statistics.cpk ?? 0)}</Typography>
                    </Stack>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      height: '100%',
                      borderColor: 'primary.light',
                      background: 'linear-gradient(180deg, rgba(25,118,210,0.08), rgba(124,77,255,0.02))',
                    }}
                  >
                    <Typography variant="h6" fontWeight={800} sx={{ mb: 1.2 }}>
                      Conclusion
                    </Typography>
                    <Alert
                      severity={report?.conclusion.status === 'capable' ? 'success' : 'warning'}
                      variant="outlined"
                      sx={{ borderRadius: 2.5, bgcolor: 'rgba(255,255,255,0.02)' }}
                    >
                      {report?.conclusion.message}
                    </Alert>
                  </Paper>
                </Grid>
              </Grid>

              {/* SPC Chart (X-bar) */}
              {report.charts?.spc && Array.isArray(report.charts.spc.values) && report.charts.spc.values.length > 0 && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    mt: 2,
                    borderColor: 'primary.light',
                    background: 'linear-gradient(180deg, rgba(25,118,210,0.07), rgba(124,77,255,0.03))',
                  }}
                >
                  <Typography variant="h6" fontWeight={900} sx={{ mb: 1.5 }}>
                    SPC Chart (X-bar) — Contrôle process
                  </Typography>
                  <LineChart
                    xAxis={[{ scaleType: 'point', data: report.charts.spc.labels }]}
                    series={[
                      {
                        data: report.charts.spc.values,
                        label: 'Valeur',
                        color: '#7c4dff',
                        showMark: true,
                        curve: 'linear',
                        area: false,
                      },
                      {
                        data: Array(report.charts.spc.values.length).fill(report.statistics.mean),
                        label: 'Moyenne',
                        color: '#1976d2',
                        showMark: false,
                        curve: 'linear',
                        area: false,
                      },
                      {
                        data: Array(report.charts.spc.values.length).fill(report.charts.spc.lsl),
                        label: 'LSL',
                        color: 'rgba(144,164,174,0.9)',
                        showMark: false,
                        curve: 'linear',
                        area: false,
                      },
                      {
                        data: Array(report.charts.spc.values.length).fill(report.charts.spc.usl),
                        label: 'USL',
                        color: 'rgba(144,164,174,0.9)',
                        showMark: false,
                        curve: 'linear',
                        area: false,
                      },
                    ]}
                    height={320}
                    margin={{ left: 45, right: 20, top: 20, bottom: 20 }}
                    grid={{ horizontal: true }}
                  />
                </Paper>
              )}

              {/* Smart Alerts - Modern Design */}
              {report.alerts && report.alerts.length > 0 && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 3,
                    borderRadius: 4,
                    mt: 3,
                    borderColor: 'primary.light',
                    background: 'linear-gradient(180deg, rgba(25,118,210,0.08), rgba(124,77,255,0.03))',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                  }}
                >
                  <Typography variant="h5" fontWeight={900} sx={{ mb: 2, letterSpacing: 0.2 }}>
                    <ScienceIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} /> Alertes intelligentes
                  </Typography>
                  {report.alerts.map((alert, idx) => (
                    <Fade in timeout={700}>
                      <Alert
                        icon={alert.type === 'cpk_low' ? <ErrorOutlineIcon sx={{ color: '#d32f2f' }} /> : alert.type === 'lsl_breach' || alert.type === 'usl_breach' ? <ErrorOutlineIcon sx={{ color: '#d32f2f' }} /> : alert.type === 'trend_up' ? <TrendingUpIcon sx={{ color: '#fbc02d' }} /> : alert.type === 'trend_down' ? <TrendingDownIcon sx={{ color: '#fbc02d' }} /> : <WarningAmberIcon sx={{ color: '#ff9800' }} />}
                        severity={alert.type === 'cpk_low' ? 'error' : alert.type === 'lsl_breach' || alert.type === 'usl_breach' ? 'error' : alert.type === 'trend_up' ? 'warning' : alert.type === 'trend_down' ? 'warning' : 'warning'}
                        sx={{
                          borderRadius: 3,
                          fontSize: '1.02rem',
                          alignItems: 'center',
                          bgcolor: 'rgba(255,255,255,0.03)',
                          boxShadow: 2,
                          borderLeft: `6px solid ${alert.type === 'cpk_low' ? '#ef4444' : alert.type === 'lsl_breach' || alert.type === 'usl_breach' ? '#f59e0b' : '#60a5fa'}`,
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip label={alert.type === 'cpk_low' ? 'Cpk bas' : alert.type === 'lsl_breach' || alert.type === 'usl_breach' ? 'Limite dépassée' : alert.type === 'trend_up' ? 'Tendance ↑' : alert.type === 'trend_down' ? 'Tendance ↓' : 'Anomalie'} color={alert.type === 'cpk_low' ? 'error' : alert.type === 'lsl_breach' || alert.type === 'usl_breach' ? 'error' : alert.type === 'trend_up' ? 'warning' : alert.type === 'trend_down' ? 'warning' : 'warning'} size="small" sx={{ fontWeight: 700, letterSpacing: 0.5 }} />
                          <Box component="span" fontWeight={800} sx={{ textTransform: 'capitalize', color: 'text.primary' }}>
                            {alert.type.replace(/_/g, ' ')}
                          </Box>
                        </Box>
                        <Box mt={0.5} mb={0.5}>
                          {alert.message}
                        </Box>
                        {alert.details && Array.isArray(alert.details) && (
                          <Box sx={{ mt: 0.5, pl: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              Détails anomalies:&nbsp;
                              {alert.details.map((d: any, i: number) => (
                                <span key={i}>
                                  [valeur: {d.value}, z: {d.z}]
                                  {i < alert.details.length - 1 ? ', ' : ''}
                                </span>
                              ))}
                            </Typography>
                          </Box>
                        )}
                      </Alert>
                    </Fade>
                  ))}
                </Paper>
              )}

              <Paper
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  borderColor: 'primary.light',
                  background: 'linear-gradient(180deg, rgba(25,118,210,0.06), rgba(124,77,255,0.03))',
                }}
              >
                <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>
                  Historique comparaison Cp/Cpk
                </Typography>
                <LineChart
                  xAxis={[{ scaleType: 'point', data: labels }]}
                  series={[
                    { data: cpSeries, label: 'Cp', showMark: false, curve: 'linear' },
                    { data: cpkSeries, label: 'Cpk', showMark: false, curve: 'monotoneX' },
                  ]}
                  height={300}
                  margin={{ left: 45, right: 20, top: 20, bottom: 20 }}
                  grid={{ horizontal: true }}
                />
              </Paper>
            </>
          )}
        </>
      )}
    </Stack>
  );
}