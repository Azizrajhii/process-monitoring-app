import * as React from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Copyright from '../internals/components/Copyright';
import ChartUserByCountry from './ChartUserByCountry';
import CustomizedTreeView from './CustomizedTreeView';
import CustomizedDataGrid from './CustomizedDataGrid';
import HighlightedCard from './HighlightedCard';
import PageViewsBarChart from './PageViewsBarChart';
import SessionsChart from './SessionsChart';
import StatCard, { StatCardProps } from './StatCard';
import { api } from '../../../api/http';

interface DashboardPayload {
  cards: Array<{
    title: string;
    value: number;
    interval: string;
    trend: 'up' | 'down' | 'neutral';
    trendLabel: string;
    data: number[];
  }>;
  sessionsChart: {
    labels: string[];
    total: number;
    deltaLabel: string;
    deltaTrend: 'up' | 'down' | 'neutral';
    series: {
      measurements: number[];
      alerts: number[];
      users: number[];
    };
  };
  monthlyChart: {
    labels: string[];
    total: number;
    deltaLabel: string;
    deltaTrend: 'up' | 'down' | 'neutral';
    series: {
      measurements: number[];
      alerts: number[];
      users: number[];
    };
  };
  roleDistribution: Array<{
    role: 'manager' | 'quality' | 'operator';
    count: number;
  }>;
}

const FALLBACK_DASHBOARD: DashboardPayload = {
  cards: [
    {
      title: 'Active users',
      value: 0,
      interval: 'Current total',
      trend: 'neutral',
      trendLabel: '+0%',
      data: Array.from({ length: 30 }, () => 0),
    },
    {
      title: 'Measurements',
      value: 0,
      interval: 'Last 30 days',
      trend: 'neutral',
      trendLabel: '+0%',
      data: Array.from({ length: 30 }, () => 0),
    },
    {
      title: 'New alerts',
      value: 0,
      interval: 'Last 30 days',
      trend: 'neutral',
      trendLabel: '+0%',
      data: Array.from({ length: 30 }, () => 0),
    },
  ],
  sessionsChart: {
    labels: Array.from({ length: 30 }, (_, i) => `D${i + 1}`),
    total: 0,
    deltaLabel: '+0%',
    deltaTrend: 'neutral',
    series: {
      measurements: Array.from({ length: 30 }, () => 0),
      alerts: Array.from({ length: 30 }, () => 0),
      users: Array.from({ length: 30 }, () => 0),
    },
  },
  monthlyChart: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    total: 0,
    deltaLabel: '+0%',
    deltaTrend: 'neutral',
    series: {
      measurements: Array.from({ length: 7 }, () => 0),
      alerts: Array.from({ length: 7 }, () => 0),
      users: Array.from({ length: 7 }, () => 0),
    },
  },
  roleDistribution: [
    { role: 'manager', count: 0 },
    { role: 'quality', count: 0 },
    { role: 'operator', count: 0 },
  ],
};

export default function MainGrid() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [dashboard, setDashboard] = React.useState<DashboardPayload>(FALLBACK_DASHBOARD);

  React.useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('/dashboard');
        setDashboard(res.data as DashboardPayload);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load dashboard statistics.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const cards: StatCardProps[] = dashboard.cards.map((card) => ({
    title: card.title,
    value: card.value.toLocaleString('en-US'),
    interval: card.interval,
    trend: card.trend,
    trendLabel: card.trendLabel,
    data: card.data,
  }));

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Stack direction="row" justifyContent="center" sx={{ py: 2 }}>
          <CircularProgress size={24} />
        </Stack>
      )}

      {/* cards */}
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        Overview
      </Typography>
      <Grid
        container
        spacing={2}
        columns={12}
        sx={{ mb: (theme) => theme.spacing(2) }}
      >
        {cards.map((card, index) => (
          <Grid key={index} size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard {...card} />
          </Grid>
        ))}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <HighlightedCard />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <SessionsChart {...dashboard.sessionsChart} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <PageViewsBarChart {...dashboard.monthlyChart} />
        </Grid>
      </Grid>
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        Details
      </Typography>
      <Grid container spacing={2} columns={12}>
        <Grid size={{ xs: 12, lg: 9 }}>
          <CustomizedDataGrid />
        </Grid>
        <Grid size={{ xs: 12, lg: 3 }}>
          <Stack gap={2} direction={{ xs: 'column', sm: 'row', lg: 'column' }}>
            <CustomizedTreeView />
            <ChartUserByCountry roles={dashboard.roleDistribution} />
          </Stack>
        </Grid>
      </Grid>
      <Copyright sx={{ my: 4 }} />
    </Box>
  );
}
