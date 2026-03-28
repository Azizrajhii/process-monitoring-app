import { useTheme } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { LineChart } from '@mui/x-charts/LineChart';

interface SessionsChartProps {
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

function AreaGradient({ color, id }: { color: string; id: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor={color} stopOpacity={0.5} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </linearGradient>
    </defs>
  );
}

function getDaysInMonth(month: number, year: number) {
  const date = new Date(year, month, 0);
  const monthName = date.toLocaleDateString('en-US', {
    month: 'short',
  });
  const daysInMonth = date.getDate();
  const days = [];
  let i = 1;
  while (days.length < daysInMonth) {
    days.push(`${monthName} ${i}`);
    i += 1;
  }
  return days;
}

export default function SessionsChart({
  labels,
  total,
  deltaLabel,
  deltaTrend,
  series,
}: SessionsChartProps) {
  const theme = useTheme();
  const data = labels.length > 0 ? labels : getDaysInMonth(4, 2024);

  const colorPalette = [
    theme.palette.primary.light,
    theme.palette.primary.main,
    theme.palette.primary.dark,
  ];

  return (
    <Card variant="outlined" sx={{ width: '100%' }}>
      <CardContent>
        <Typography component="h2" variant="subtitle2" gutterBottom>
          Sessions
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
            Measurements, alerts and new users for the last 30 days
          </Typography>
        </Stack>
        <LineChart
          colors={colorPalette}
          xAxis={[
            {
              scaleType: 'point',
              data,
              tickInterval: (_index, i) => (i + 1) % 5 === 0,
              height: 24,
            },
          ]}
          yAxis={[{ width: 50 }]}
          series={[
            {
              id: 'measurements',
              label: 'Measurements',
              showMark: false,
              curve: 'linear',
              stack: 'total',
              area: true,
              stackOrder: 'ascending',
              data: series.measurements,
            },
            {
              id: 'alerts',
              label: 'Alerts',
              showMark: false,
              curve: 'linear',
              stack: 'total',
              area: true,
              stackOrder: 'ascending',
              data: series.alerts,
            },
            {
              id: 'users',
              label: 'New users',
              showMark: false,
              curve: 'linear',
              stack: 'total',
              stackOrder: 'ascending',
              data: series.users,
              area: true,
            },
          ]}
          height={250}
          margin={{ left: 0, right: 20, top: 20, bottom: 0 }}
          grid={{ horizontal: true }}
          sx={{
            '& .MuiAreaElement-series-users': {
              fill: "url('#users')",
            },
            '& .MuiAreaElement-series-alerts': {
              fill: "url('#alerts')",
            },
            '& .MuiAreaElement-series-measurements': {
              fill: "url('#measurements')",
            },
          }}
          hideLegend
        >
          <AreaGradient color={theme.palette.primary.dark} id="users" />
          <AreaGradient color={theme.palette.primary.main} id="alerts" />
          <AreaGradient color={theme.palette.primary.light} id="measurements" />
        </LineChart>
      </CardContent>
    </Card>
  );
}
