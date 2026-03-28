import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { BarChart } from '@mui/x-charts/BarChart';
import { useTheme } from '@mui/material/styles';

interface PageViewsBarChartProps {
  labels: string[];
  total: number;
  deltaLabel: string;
  deltaTrend: 'up' | 'down' | 'neutral';
  series: {
    measurements: number[];
    alerts: number[];
    users: number[];
  };
}

export default function PageViewsBarChart({
  labels,
  total,
  deltaLabel,
  deltaTrend,
  series,
}: PageViewsBarChartProps) {
  const theme = useTheme();
  const colorPalette = [
    (theme.vars || theme).palette.primary.dark,
    (theme.vars || theme).palette.primary.main,
    (theme.vars || theme).palette.primary.light,
  ];
  return (
    <Card variant="outlined" sx={{ width: '100%' }}>
      <CardContent>
        <Typography component="h2" variant="subtitle2" gutterBottom>
          Monthly activity
        </Typography>
        <Stack sx={{ justifyContent: 'space-between' }}>
          <Stack
            direction="row"
            sx={{
              alignContent: { xs: 'center', sm: 'flex-start' },
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Typography variant="h4" component="p">
              {total.toLocaleString('en-US')}
            </Typography>
            <Chip
              size="small"
              color={deltaTrend === 'down' ? 'error' : deltaTrend === 'up' ? 'success' : 'default'}
              label={deltaLabel}
            />
          </Stack>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Measurements, alerts and users over the last 7 months
          </Typography>
        </Stack>
        <BarChart
          borderRadius={8}
          colors={colorPalette}
          xAxis={[
            {
              scaleType: 'band',
              categoryGapRatio: 0.5,
              data: labels,
              height: 24,
            },
          ]}
          yAxis={[{ width: 50 }]}
          series={[
            {
              id: 'measurements',
              label: 'Measurements',
              data: series.measurements,
              stack: 'A',
            },
            {
              id: 'alerts',
              label: 'Alerts',
              data: series.alerts,
              stack: 'A',
            },
            {
              id: 'users',
              label: 'Users',
              data: series.users,
              stack: 'A',
            },
          ]}
          height={250}
          margin={{ left: 0, right: 0, top: 20, bottom: 0 }}
          grid={{ horizontal: true }}
          hideLegend
        />
      </CardContent>
    </Card>
  );
}
