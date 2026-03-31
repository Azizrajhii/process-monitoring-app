import * as React from 'react';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import InsightsIcon from '@mui/icons-material/Insights';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { LineChart } from '@mui/x-charts/LineChart';
import { api } from '../../api/http';

const toFixed2 = (value: number) => Number.isFinite(value) ? value.toFixed(2) : '0.00';

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
        setProcesses(cpkRes.data.map((p: any) => {
          const validCpk = p.dailyCpk
            .map((d: any) => d.cpk)
            .filter((value: any) => Number.isFinite(value));
          const avgCpk = validCpk.length > 0
            ? validCpk.reduce((acc: number, value: number) => acc + value, 0) / validCpk.length
            : null;

          return {
            _id: p.processId,
            name: p.processName,
            dailyCpk: p.dailyCpk,
            avgCpk,
          };
        }));

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
  const hasCpkData = cpkSeries.some((series: any) =>
    series.data.some((value: any) => Number.isFinite(value)),
  );

  // Top 5 process les moins capables (Cpk moyen)
  const topWorst = [...processes]
    .filter((p) => Number.isFinite(p.avgCpk))
    .sort((a, b) => a.avgCpk - b.avgCpk)
    .slice(0, 5);

  // Taux de process non capable
  const incapablePercent = incapableRate ? Math.round(incapableRate.incapableRate * 100) : 0;

  return (
    <Stack spacing={2.5} sx={{ width: '100%', pb: 2 }}>
      <Box
        sx={{
          p: { xs: 2, md: 2.6 },
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          background: 'linear-gradient(130deg, rgba(25,118,210,0.18), rgba(124,77,255,0.08))',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ md: 'center' }} justifyContent="space-between" gap={1.5}>
          <Box>
            <Typography variant="h4" fontWeight={900}>
              Dashboard Manager
            </Typography>
            <Typography color="text.secondary">
              Vue avancée des performances, Cpk et taux de process non capable.
            </Typography>
          </Box>
          <Chip
            icon={<InsightsIcon />}
            label="Analytics temps réel"
            color="primary"
            variant="outlined"
            sx={{ width: 'fit-content', fontWeight: 700 }}
          />
        </Stack>
      </Box>

      {error && <Alert severity="warning">{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={2} columns={12}>
            <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
              <Card
                variant="outlined"
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  borderColor: 'primary.light',
                  background: 'linear-gradient(145deg, rgba(25,118,210,0.12), rgba(25,118,210,0.03))',
                }}
              >
                <CardContent>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Nombre de process actifs</Typography>
                    <PrecisionManufacturingIcon color="primary" />
                  </Stack>
                  <Typography variant="h4" fontWeight={900} sx={{ mt: 0.8 }}>{processes.length}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
              <Card
                variant="outlined"
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  borderColor: incapablePercent >= 30 ? 'error.light' : 'warning.light',
                  background: incapablePercent >= 30
                    ? 'linear-gradient(145deg, rgba(244,67,54,0.12), rgba(244,67,54,0.03))'
                    : 'linear-gradient(145deg, rgba(255,152,0,0.12), rgba(255,152,0,0.03))',
                }}
              >
                <CardContent>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Taux de process non capable</Typography>
                    <TrendingDownIcon color={incapablePercent >= 30 ? 'error' : incapablePercent >= 10 ? 'warning' : 'success'} />
                  </Stack>
                  <Typography variant="h4" fontWeight={800} color={incapablePercent >= 30 ? 'error' : incapablePercent >= 10 ? 'warning.main' : 'success.main'}>
                    {incapablePercent}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 12, lg: 4 }}>
              <Card
                variant="outlined"
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  borderColor: 'divider',
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.03), rgba(124,77,255,0.04))',
                }}
              >
                <CardContent>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Top 5 process les moins capables (Cpk)</Typography>
                    <BubbleChartIcon color="info" />
                  </Stack>
                  <Stack spacing={1} mt={1.2}>
                    {topWorst.length === 0 && <Typography color="success.main">Aucun process à risque</Typography>}
                    {topWorst.map((proc) => (
                      <Box
                        key={proc._id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 1,
                          p: 1,
                          borderRadius: 2,
                          bgcolor: 'rgba(255,255,255,0.02)',
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Chip size="small" color={proc.avgCpk < 1 ? 'error' : 'warning'} label={proc.avgCpk < 1 ? 'Non capable' : 'Sous surveillance'} />
                        <Typography fontWeight={700} sx={{ flex: 1 }}>{proc.name}</Typography>
                        <Typography fontWeight={800} color={proc.avgCpk < 1 ? 'error' : 'warning.main'}>Cpk: {toFixed2(proc.avgCpk)}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: 4,
              mt: 2,
              borderColor: 'primary.light',
              background: 'linear-gradient(180deg, rgba(25,118,210,0.08), rgba(124,77,255,0.03))',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <AutoGraphIcon color="primary" />
              <Typography variant="h6" fontWeight={800}>
                Evolution du Cpk sur 7 jours (tous process)
              </Typography>
            </Stack>
            {!hasCpkData ? (
              <Alert severity="info">
                Donnees insuffisantes pour tracer la courbe Cpk sur les 7 derniers jours.
              </Alert>
            ) : (
              <LineChart
                xAxis={[{ scaleType: 'point', data: cpkLabels }]}
                series={cpkSeries}
                height={320}
                margin={{ left: 40, right: 20, top: 20, bottom: 20 }}
                grid={{ horizontal: true }}
              />
            )}
          </Paper>
        </>
      )}
    </Stack>
  );
}
