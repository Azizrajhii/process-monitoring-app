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
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import { api } from '../../api/http';

interface DashboardResponse {
  sessionsChart?: {
    labels: string[];
    total: number;
    series: {
      measurements: number[];
      alerts: number[];
      users: number[];
    };
  };
  processCapability?: ProcessItem[];
}

interface ProcessItem {
  _id: string;
  name: string;
  cp: number | null;
  cpk: number | null;
  sampleSize: number;
  capabilityStatus: 'ok' | 'warning' | 'non_capable' | 'insufficient_data';
  cpTarget: number;
  cpkTarget: number;
  status: 'active' | 'inactive';
}

const histogramBucketLabels = ['0-5', '6-10', '11-20', '21-30', '31-50', '51+'];

const toFixed2 = (value: number) => Number.isFinite(value) ? value.toFixed(2) : '0.00';

const average = (values: number[]) => {
  if (values.length === 0) return 0;
  return values.reduce((sum, current) => sum + current, 0) / values.length;
};

export default function ManagerDashboardPage() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Nouveaux états pour les endpoints avancés
  const [cpkEvolution, setCpkEvolution] = React.useState<any[]>([]);
  const [incapableRate, setIncapableRate] = React.useState<any | null>(null);
  const [processes, setProcesses] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Récupère l'évolution Cpk 7 jours
        const cpkRes = await api.get('/reports/cpk-evolution-7days');
        setCpkEvolution(cpkRes.data);
        setProcesses(cpkRes.data.map((p: any) => ({
          _id: p.processId,
          name: p.processName,
          dailyCpk: p.dailyCpk,
          avgCpk: p.dailyCpk.reduce((acc: number, d: any) => acc + (d.cpk ?? 0), 0) / (p.dailyCpk.filter((d: any) => d.cpk !== null).length || 1),
        })));

        // Récupère le taux de process non capable
        const incapableRes = await api.get('/reports/incapable-rate-7days');
        setIncapableRate(incapableRes.data);
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Erreur lors du chargement du dashboard manager.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Pour le graphique d'évolution Cpk (ligne)
  const cpkLabels = cpkEvolution[0]?.dailyCpk?.map((d: any) => d.date) || [];
  const cpkSeries = cpkEvolution.map((proc: any) => ({
    label: proc.processName,
    data: proc.dailyCpk.map((d: any) => d.cpk ?? null),
  }));

  // Top 5 process les moins capables (Cpk moyen)
  const topWorst = [...processes]
    .filter((p) => Number.isFinite(p.avgCpk))
    .sort((a, b) => a.avgCpk - b.avgCpk)
    .slice(0, 5);

  // Taux de process non capable
  const incapablePercent = incapableRate ? Math.round(incapableRate.incapableRate * 100) : 0;

  return (
    <Stack spacing={2.5} sx={{ width: '100%', pb: 2 }}>
      <Box>
        <Typography variant="h4" fontWeight={800}>
          Dashboard Manager
        </Typography>
        <Typography color="text.secondary">
          Vue avancée des performances, Cpk et taux de process non capable.
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
            <Grid item xs={12} sm={6} lg={4}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Nombre de process actifs</Typography>
                  <Typography variant="h4" fontWeight={800}>{processes.length}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} lg={4}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Taux de process non capable</Typography>
                  <Typography variant="h4" fontWeight={800} color={incapablePercent >= 30 ? 'error' : incapablePercent >= 10 ? 'warning.main' : 'success.main'}>
                    {incapablePercent}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={12} lg={4}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Top 5 process les moins capables (Cpk)</Typography>
                  <Stack spacing={0.5} mt={1}>
                    {topWorst.length === 0 && <Typography color="success.main">Aucun process à risque</Typography>}
                    {topWorst.map((proc) => (
                      <Box key={proc._id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip size="small" color={proc.avgCpk < 1 ? 'error' : 'warning'} label={proc.avgCpk < 1 ? 'Non capable' : 'Sous surveillance'} />
                        <Typography fontWeight={700}>{proc.name}</Typography>
                        <Typography color={proc.avgCpk < 1 ? 'error' : 'warning.main'}>Cpk: {toFixed2(proc.avgCpk)}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, mt: 2 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
              Evolution du Cpk sur 7 jours (tous process)
            </Typography>
            <LineChart
              xAxis={[{ scaleType: 'point', data: cpkLabels }]}
              series={cpkSeries}
              height={320}
              margin={{ left: 40, right: 20, top: 20, bottom: 20 }}
              grid={{ horizontal: true }}
            />
          </Paper>
        </>
      )}
    </Stack>
  );
}
