import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';

type RoleKey = 'manager' | 'operator' | 'quality';

interface StatItem {
  label: string;
  value: string;
  delta: string;
  positive: boolean;
  color: string;
  trend: number[];
}

const roleContent: Record<RoleKey, { title: string; subtitle: string; stats: StatItem[] }> = {
  manager: {
    title: 'Dashboard manager',
    subtitle: 'Vue globale des equipes, processus et indicateurs de performance.',
    stats: [
      { label: 'Utilisateurs actifs', value: '42', delta: '+12%', positive: true, color: '#22c55e', trend: [18, 20, 21, 24, 23, 26, 30, 32] },
      { label: 'Taches ouvertes', value: '17', delta: '-8%', positive: true, color: '#60a5fa', trend: [31, 28, 29, 26, 24, 23, 20, 17] },
      { label: 'Alertes critiques', value: '3', delta: '+1', positive: false, color: '#f59e0b', trend: [1, 1, 2, 2, 2, 3, 3, 3] },
      { label: 'Conformite globale', value: '91%', delta: '+4%', positive: true, color: '#a78bfa', trend: [78, 80, 83, 84, 86, 88, 90, 91] },
    ],
  },
  operator: {
    title: 'Dashboard operateur',
    subtitle: 'Suivi des productions, mesures de terrain et incidents de poste.',
    stats: [
      { label: 'Ordres termines', value: '128', delta: '+9%', positive: true, color: '#22c55e', trend: [70, 72, 78, 83, 92, 102, 118, 128] },
      { label: 'Mesures saisies', value: '2 480', delta: '+15%', positive: true, color: '#38bdf8', trend: [1300, 1460, 1550, 1700, 1850, 2050, 2280, 2480] },
      { label: 'Non conformites', value: '6', delta: '-2', positive: true, color: '#f97316', trend: [12, 11, 10, 9, 9, 8, 7, 6] },
      { label: 'Disponibilite ligne', value: '96%', delta: '+3%', positive: true, color: '#a78bfa', trend: [88, 89, 91, 92, 93, 94, 95, 96] },
    ],
  },
  quality: {
    title: 'Dashboard qualite',
    subtitle: 'Controle des validations, alertes qualite et stabilite des process.',
    stats: [
      { label: 'Lots valides', value: '84', delta: '+11%', positive: true, color: '#22c55e', trend: [44, 48, 50, 55, 62, 69, 77, 84] },
      { label: 'Dossiers en attente', value: '9', delta: '-3', positive: true, color: '#60a5fa', trend: [18, 17, 16, 14, 13, 12, 11, 9] },
      { label: 'Alertes qualite', value: '5', delta: '+1', positive: false, color: '#f59e0b', trend: [2, 3, 3, 4, 4, 4, 5, 5] },
      { label: 'Taux capabilite', value: '89%', delta: '+5%', positive: true, color: '#a78bfa', trend: [74, 76, 79, 82, 84, 86, 88, 89] },
    ],
  },
};

const lineData = [2600, 3200, 4100, 5300, 6200, 7000, 8300, 9000, 10400, 11200, 12400, 13700];
const barData = [42, 55, 48, 62, 66, 58, 70, 64, 59, 67, 72, 68];

function sparkPoints(values: number[]): string {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 118 + 1;
      const y = 34 - ((value - min) / range) * 28;
      return `${x},${y}`;
    })
    .join(' ');
}

export default function StaticDashboard({ role }: { role: RoleKey }) {
  const content = roleContent[role];

  return (
    <Stack spacing={2.2}>
      <Typography color="text.secondary" sx={{ px: 0.4 }}>
        Dashboard {'>'} Home
      </Typography>

      <Paper sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.2}>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              {content.title}
            </Typography>
            <Typography color="text.secondary" mt={0.8}>
              {content.subtitle}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ alignSelf: { xs: 'flex-start', md: 'center' } }}>
            <Chip icon={<PeopleAltRoundedIcon />} label="Equipe active" variant="outlined" size="small" />
            <Chip icon={<TaskAltRoundedIcon />} label="Mise a jour: Auj." color="success" variant="outlined" size="small" />
          </Stack>
        </Stack>
      </Paper>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' } }}>
        {content.stats.map((item) => (
          <Paper key={item.label} sx={{ p: 2.2, borderRadius: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography fontWeight={600}>{item.label}</Typography>
              <Chip
                label={item.delta}
                color={item.positive ? 'success' : 'error'}
                size="small"
                variant="outlined"
              />
            </Stack>
            <Typography variant="h4" fontWeight={700} mb={0.7}>
              {item.value}
            </Typography>
            <Box sx={{ height: 40, display: 'flex', alignItems: 'center' }}>
              <svg width="100%" height="40" viewBox="0 0 120 36" preserveAspectRatio="none" aria-hidden>
                <polyline
                  fill="none"
                  stroke={item.color}
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={sparkPoints(item.trend)}
                />
              </svg>
            </Box>
          </Paper>
        ))}
      </Box>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', xl: '1.25fr 1fr' } }}>
        <Paper sx={{ p: 2.5, borderRadius: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.6}>
            <Typography variant="h6" fontWeight={700}>Activite mensuelle</Typography>
            <TrendingUpRoundedIcon color="primary" fontSize="small" />
          </Stack>
          <Stack spacing={1.2}>
            {lineData.map((value, index) => (
              <Box key={index} sx={{ display: 'grid', gridTemplateColumns: '58px 1fr 62px', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" color="text.secondary">M{index + 1}</Typography>
                <Box sx={{ height: 8, borderRadius: 99, bgcolor: 'action.hover', overflow: 'hidden' }}>
                  <Box
                    sx={{
                      width: `${(value / 14000) * 100}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #2563eb 0%, #38bdf8 100%)',
                    }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" textAlign="right">{value.toLocaleString('fr-FR')}</Typography>
              </Box>
            ))}
          </Stack>
        </Paper>

        <Paper sx={{ p: 2.5, borderRadius: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.6}>
            <Typography variant="h6" fontWeight={700}>Volume hebdomadaire</Typography>
            <WarningAmberRoundedIcon color="warning" fontSize="small" />
          </Stack>
          <Box sx={{ height: 220, display: 'flex', alignItems: 'flex-end', gap: 1 }}>
            {barData.map((value, index) => (
              <Box key={index} sx={{ flex: 1, minWidth: 14 }}>
                <Box
                  sx={{
                    height: `${(value / 80) * 180}px`,
                    borderRadius: '8px 8px 0 0',
                    background: 'linear-gradient(180deg, #60a5fa 0%, #1d4ed8 100%)',
                  }}
                />
              </Box>
            ))}
          </Box>
          <Typography variant="caption" color="text.secondary" mt={1.2} display="block">
            Donnees statiques de demonstration
          </Typography>
        </Paper>
      </Box>
    </Stack>
  );
}