import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { LineChart } from '@mui/x-charts/LineChart';
import { api } from '../../api/http';

interface ProcessCapabilityItem {
  _id: string;
  name: string;
  cp: number | null;
  cpk: number | null;
  capabilityStatus: 'ok' | 'warning' | 'non_capable' | 'insufficient_data';
  sampleSize: number;
}

interface DashboardResponse {
  overview?: {
    activeProcesses: number;
    openAlerts: number;
  };
  sessionsChart?: {
    labels: string[];
    total: number;
    series: {
      measurements: number[];
      alerts: number[];
      users: number[];
    };
  };
  processCapability?: ProcessCapabilityItem[];
}

const toFixed2 = (value: number) => (Number.isFinite(value) ? value.toFixed(2) : '0.00');

const average = (values: number[]) => {
  if (values.length === 0) return 0;
  return values.reduce((sum, current) => sum + current, 0) / values.length;
};

export default function QualityDashboardPage() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [dashboard, setDashboard] = React.useState<DashboardResponse | null>(null);
  const [processCapability, setProcessCapability] = React.useState<ProcessCapabilityItem[]>([]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const dashboardRes = await api.get('/dashboard');
        setDashboard(dashboardRes.data);
        setProcessCapability(dashboardRes.data.processCapability || []);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Erreur lors du chargement du dashboard qualite.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const cpAverage = average(processCapability.filter((p) => p.cp !== null).map((p) => p.cp as number));
  const cpkAverage = average(processCapability.filter((p) => p.cpk !== null).map((p) => p.cpk as number));

  const nonCapableCount = processCapability.filter((p) => p.capabilityStatus === 'non_capable').length;
  const warningCount = processCapability.filter((p) => p.capabilityStatus === 'warning').length;

  const riskyProcesses = [...processCapability]
    .filter((p) => p.cpk !== null)
    .sort((a, b) => (a.cpk as number) - (b.cpk as number))
    .slice(0, 6);

  const labels = dashboard?.sessionsChart?.labels || [];
  const measurementsSeries = dashboard?.sessionsChart?.series?.measurements || [];
  const alertsSeries = dashboard?.sessionsChart?.series?.alerts || [];

  return (
    <Stack spacing={2.5} sx={{ width: '100%', pb: 2 }}>
      <Box>
        <Typography variant="h4" fontWeight={800}>
          Dashboard Qualite
        </Typography>
        <Typography color="text.secondary">
          Suivi dynamique de la capabilite, des alertes et de la stabilite des processus.
        </Typography>
      </Box>

      {error && <Alert severity="warning">{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={2} columns={12}>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Processus actifs</Typography>
                  <Typography variant="h4" fontWeight={800}>{dashboard?.overview?.activeProcesses || 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Alertes ouvertes</Typography>
                  <Typography variant="h4" fontWeight={800}>{dashboard?.overview?.openAlerts || 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Cp moyen (reel)</Typography>
                  <Typography variant="h4" fontWeight={800}>{toFixed2(cpAverage)}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Cpk moyen (reel)</Typography>
                  <Typography variant="h4" fontWeight={800}>{toFixed2(cpkAverage)}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2}>
              <Chip color="error" label={`Non capables: ${nonCapableCount}`} />
              <Chip color="warning" label={`Sous surveillance: ${warningCount}`} />
              <Chip color="info" label={`Mesures 30 jours: ${dashboard?.sessionsChart?.total || 0}`} />
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
              Evolution mesures vs alertes (30 jours)
            </Typography>
            <LineChart
              xAxis={[{ scaleType: 'point', data: labels }]}
              series={[
                { data: measurementsSeries, label: 'Mesures', showMark: false, curve: 'monotoneX' },
                { data: alertsSeries, label: 'Alertes', showMark: false, curve: 'linear' },
              ]}
              height={300}
              margin={{ left: 40, right: 20, top: 20, bottom: 20 }}
              grid={{ horizontal: true }}
            />
          </Paper>

          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
              Processus les plus a risque (Cpk reel)
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Process</TableCell>
                    <TableCell>Sample</TableCell>
                    <TableCell>Cp</TableCell>
                    <TableCell>Cpk</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {riskyProcesses.map((item) => {
                    const label =
                      item.capabilityStatus === 'ok'
                        ? 'OK'
                        : item.capabilityStatus === 'warning'
                          ? 'Warning'
                          : item.capabilityStatus === 'non_capable'
                            ? 'Non capable'
                            : 'Insuffisant';

                    const color =
                      item.capabilityStatus === 'ok'
                        ? 'success'
                        : item.capabilityStatus === 'warning'
                          ? 'warning'
                          : item.capabilityStatus === 'non_capable'
                            ? 'error'
                            : 'default';

                    return (
                      <TableRow key={item._id} hover>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.sampleSize}</TableCell>
                        <TableCell>{item.cp === null ? 'N/A' : toFixed2(item.cp)}</TableCell>
                        <TableCell>{item.cpk === null ? 'N/A' : toFixed2(item.cpk)}</TableCell>
                        <TableCell><Chip size="small" color={color} label={label} /></TableCell>
                      </TableRow>
                    );
                  })}
                  {riskyProcesses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">Aucun process disponible.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Stack>
  );
}