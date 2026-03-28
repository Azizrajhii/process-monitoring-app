import * as React from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import { useDrawingArea } from '@mui/x-charts/hooks';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded';
import PrecisionManufacturingRoundedIcon from '@mui/icons-material/PrecisionManufacturingRounded';

interface RoleDistributionItem {
  role: 'manager' | 'quality' | 'operator';
  count: number;
}

interface ChartUserByCountryProps {
  roles: RoleDistributionItem[];
}

interface StyledTextProps {
  variant: 'primary' | 'secondary';
}

const StyledText = styled('text', {
  shouldForwardProp: (prop) => prop !== 'variant',
})<StyledTextProps>(({ theme }) => ({
  textAnchor: 'middle',
  dominantBaseline: 'central',
  fill: (theme.vars || theme).palette.text.secondary,
  variants: [
    {
      props: {
        variant: 'primary',
      },
      style: {
        fontSize: theme.typography.h5.fontSize,
      },
    },
    {
      props: ({ variant }) => variant !== 'primary',
      style: {
        fontSize: theme.typography.body2.fontSize,
      },
    },
    {
      props: {
        variant: 'primary',
      },
      style: {
        fontWeight: theme.typography.h5.fontWeight,
      },
    },
    {
      props: ({ variant }) => variant !== 'primary',
      style: {
        fontWeight: theme.typography.body2.fontWeight,
      },
    },
  ],
}));

interface PieCenterLabelProps {
  primaryText: string;
  secondaryText: string;
}

function PieCenterLabel({ primaryText, secondaryText }: PieCenterLabelProps) {
  const { width, height, left, top } = useDrawingArea();
  const primaryY = top + height / 2 - 10;
  const secondaryY = primaryY + 24;

  return (
    <React.Fragment>
      <StyledText variant="primary" x={left + width / 2} y={primaryY}>
        {primaryText}
      </StyledText>
      <StyledText variant="secondary" x={left + width / 2} y={secondaryY}>
        {secondaryText}
      </StyledText>
    </React.Fragment>
  );
}

const colors = [
  'hsl(220, 20%, 65%)',
  'hsl(220, 20%, 42%)',
  'hsl(220, 20%, 35%)',
  'hsl(220, 20%, 25%)',
];

const roleMeta = {
  manager: {
    label: 'Manager',
    color: 'hsl(220, 25%, 65%)',
    icon: <ManageAccountsRoundedIcon fontSize="small" />,
  },
  quality: {
    label: 'Quality',
    color: 'hsl(220, 25%, 45%)',
    icon: <VerifiedUserRoundedIcon fontSize="small" />,
  },
  operator: {
    label: 'Operator',
    color: 'hsl(220, 25%, 30%)',
    icon: <PrecisionManufacturingRoundedIcon fontSize="small" />,
  },
};

export default function ChartUserByCountry({ roles }: ChartUserByCountryProps) {
  const totalUsers = roles.reduce((sum, item) => sum + item.count, 0);
  const pieData = roles.map((item) => ({
    label: roleMeta[item.role].label,
    value: item.count,
  }));

  return (
    <Card
      variant="outlined"
      sx={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}
    >
      <CardContent>
        <Typography component="h2" variant="subtitle2">
          Users by role
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PieChart
            colors={colors}
            margin={{
              left: 80,
              right: 80,
              top: 80,
              bottom: 80,
            }}
            series={[
              {
                data: pieData,
                innerRadius: 75,
                outerRadius: 100,
                paddingAngle: 0,
                highlightScope: { fade: 'global', highlight: 'item' },
              },
            ]}
            height={260}
            width={260}
            hideLegend
          >
            <PieCenterLabel primaryText={totalUsers.toLocaleString('en-US')} secondaryText="Users" />
          </PieChart>
        </Box>
        {roles.map((item, index) => {
          const pct = totalUsers > 0 ? Math.round((item.count / totalUsers) * 100) : 0;
          const meta = roleMeta[item.role];

          return (
          <Stack
            key={index}
            direction="row"
            sx={{ alignItems: 'center', gap: 2, pb: 2 }}
          >
            {meta.icon}
            <Stack sx={{ gap: 1, flexGrow: 1 }}>
              <Stack
                direction="row"
                sx={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: '500' }}>
                  {meta.label}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {pct}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                aria-label="Number of users by role"
                value={pct}
                sx={{
                  [`& .${linearProgressClasses.bar}`]: {
                    backgroundColor: meta.color,
                  },
                }}
              />
            </Stack>
          </Stack>
          );
        })}
      </CardContent>
    </Card>
  );
}
