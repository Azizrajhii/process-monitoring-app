import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
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
  const processInfo = report?.process;
  const capable = report?.conclusion?.status === 'capable';
  const cpValue = stats?.cp;
  const cpkValue = stats?.cpk;
  const analysisDate = report?.analysisDate
    ? new Date(report.analysisDate).toLocaleDateString('fr-FR')
    : new Date().toLocaleDateString('fr-FR');

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h4" fontWeight={800}>Rapports Manager</Typography>
        <Typography color="text.secondary">
          Analyse detaillee des processus avec conclusion de capacite.
        </Typography>
      </Box>

      {error && <Alert severity="warning">{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
              <Typography variant="subtitle1" fontWeight={700}>Selection du process</Typography>
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
            </Stack>
          </Paper>

          {reportLoading || !report ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Grid container spacing={2} columns={12}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
                      Informations du process
                    </Typography>
                    <Stack spacing={0.7}>
                      <Typography><strong>Nom process:</strong> {processInfo?.name || '-'}</Typography>
                      <Typography><strong>Date analyse:</strong> {analysisDate}</Typography>
                      <Typography><strong>LSL:</strong> {toFixed2(Number(processInfo?.lsl ?? 0))}</Typography>
                      <Typography><strong>USL:</strong> {toFixed2(Number(processInfo?.usl ?? 0))}</Typography>
                    </Stack>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
                      Statistiques
                    </Typography>
                    <Stack spacing={0.7}>
                      <Typography><strong>Nombre mesures:</strong> {stats?.sampleSize ?? 0}</Typography>
                      <Typography><strong>Moyenne:</strong> {toFixed2(Number(stats?.mean ?? 0))}</Typography>
                      <Typography><strong>Ecart type:</strong> {toFixed2(Number(stats?.stdDev ?? 0))}</Typography>
                      <Typography><strong>Cp:</strong> {cpValue === null || cpValue === undefined ? 'N/A' : toFixed2(cpValue)}</Typography>
                      <Typography><strong>Cpk:</strong> {cpkValue === null || cpkValue === undefined ? 'N/A' : toFixed2(cpkValue)}</Typography>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>

              <Grid container spacing={2} columns={12}>
                <Grid size={{ xs: 12, lg: 7 }}>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
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
                </Grid>
                <Grid size={{ xs: 12, lg: 5 }}>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
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
                </Grid>
              </Grid>

              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                  Conclusion
                </Typography>
                <Alert severity={capable ? 'success' : 'warning'}>
                  {report.conclusion.message}
                </Alert>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
                  Alertes process
                </Typography>
                <Stack spacing={1}>
                  {report.alerts.length === 0 && (
                    <Typography color="text.secondary">Aucune alerte pour ce process.</Typography>
                  )}
                  {report.alerts.map((item) => (
                    <Alert 
                      key={item._id || Math.random()} 
                      severity={
                        item.status === 'system' ? 'info' :
                        item.status === 'not_treated' ? 'warning' : 
                        'success'
                      }
                    >
                      <strong>
                        [{item.status === 'system' ? '🤖 Système' : item.status === 'not_treated' ? '⚠️ Ouvert' : '✓ Traité'}]
                      </strong>
                      {' '}
                      {new Date(item.date).toLocaleString('fr-FR')} - {item.message}
                    </Alert>
                  ))}
                </Stack>
              </Paper>
            </>
          )}
        </>
      )}
    </Stack>
  );
}