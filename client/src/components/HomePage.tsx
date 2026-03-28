import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import AutoGraphRoundedIcon from '@mui/icons-material/AutoGraphRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import { useNavigate } from 'react-router-dom';

const kpiItems = [
  { value: '98%', label: 'Conformite des controles' },
  { value: '24h', label: 'Delai moyen de traitement des alertes' },
  { value: '3x', label: 'Visibilite operationnelle acceleree' },
  { value: '99.9%', label: 'Disponibilite de la plateforme' },
];

const featureItems = [
  {
    icon: <AutoGraphRoundedIcon fontSize="small" />,
    title: 'Pilotage des processus',
    description:
      'Structurez vos processus, suivez les mesures en temps reel et detectez rapidement les derives.',
  },
  {
    icon: <NotificationsActiveRoundedIcon fontSize="small" />,
    title: 'Alertes et actions correctives',
    description:
      'Centralisez les alertes, assignez les actions et mesurez l avancement avec des responsabilites claires.',
  },
  {
    icon: <TaskAltRoundedIcon fontSize="small" />,
    title: 'Tableaux de bord par role',
    description:
      'Chaque profil accede aux bonnes informations au bon moment pour decider vite et mieux.',
  },
];

const workflowSteps = [
  {
    step: '01',
    title: 'Collecter',
    description: 'Capture des mesures et evenements terrain dans une vue unifiee.',
  },
  {
    step: '02',
    title: 'Analyser',
    description: 'Visualisation des tendances, ecarts et capacites des processus.',
  },
  {
    step: '03',
    title: 'Ameliorer',
    description: 'Mise en place d actions correctives et suivi des resultats.',
  },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <Box
      id="home"
      sx={(theme) => ({
        pt: { xs: 10, sm: 14 },
        pb: { xs: 8, sm: 12 },
        overflow: 'hidden',
        position: 'relative',
        backgroundImage:
          'radial-gradient(ellipse 85% 55% at 50% -20%, hsl(210, 100%, 92%), transparent), linear-gradient(180deg, hsl(210, 35%, 99%) 0%, hsl(220, 35%, 97%) 55%, hsl(220, 30%, 95%) 100%)',
        ...theme.applyStyles('dark', {
          backgroundImage:
            'radial-gradient(ellipse 85% 55% at 50% -20%, hsl(210, 100%, 16%), transparent), linear-gradient(180deg, hsl(220, 33%, 8%) 0%, hsl(220, 28%, 7%) 55%, hsl(220, 30%, 5%) 100%)',
        }),
      })}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Stack spacing={{ xs: 6, md: 9 }}>
          <Paper
            variant="outlined"
            sx={(theme) => ({
              borderRadius: 6,
              p: { xs: 3, sm: 4, md: 5 },
              position: 'relative',
              overflow: 'hidden',
              borderColor: 'divider',
              background: theme.vars
                ? `linear-gradient(130deg, rgba(${theme.vars.palette.background.paperChannel} / 0.92), rgba(${theme.vars.palette.primary.mainChannel} / 0.08))`
                : 'background.paper',
              boxShadow: (theme.vars || theme).shadows[4],
            })}
          >
            <Box
              sx={(theme) => ({
                position: 'absolute',
                right: -80,
                top: -80,
                width: 260,
                height: 260,
                borderRadius: '50%',
                background: theme.vars
                  ? `radial-gradient(circle, rgba(${theme.vars.palette.info.mainChannel} / 0.28), transparent 68%)`
                  : 'transparent',
                pointerEvents: 'none',
              })}
            />
            <Stack spacing={3} sx={{ textAlign: 'center', alignItems: 'center', position: 'relative' }}>
              <Chip
                icon={<BoltRoundedIcon />}
                label="Plateforme Qualite et Operations"
                color="info"
                variant="filled"
                sx={{ borderRadius: 99, px: 0.8, fontWeight: 700 }}
              />
              <Typography
                component="h1"
                variant="h2"
                sx={{
                  fontWeight: 900,
                  maxWidth: 920,
                  fontSize: { xs: '2rem', sm: '2.8rem', md: '3.4rem' },
                  lineHeight: 1.08,
                  letterSpacing: '-0.02em',
                }}
              >
                Pilotez vos processus avec un design moderne et des decisions plus rapides
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: 'text.secondary',
                  maxWidth: 820,
                  fontWeight: 500,
                  fontSize: { xs: '1rem', sm: '1.1rem' },
                }}
              >
                Mesures, alertes et actions correctives dans une seule experience premium, pensee pour
                les equipes terrain et management.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button variant="contained" size="large" onClick={() => navigate('/signup')}>
                  Commencer maintenant
                </Button>
                <Button variant="outlined" size="large" onClick={() => navigate('/signin')}>
                  Acceder a mon espace
                </Button>
                <Button variant="text" size="large" component="a" href="#footer">
                  Nous contacter
                </Button>
              </Stack>
            </Stack>
          </Paper>

          <Grid container spacing={1.5}>
            {kpiItems.map((item) => (
              <Grid size={{ xs: 6, md: 3 }} key={item.label}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2.2,
                    borderRadius: 3,
                    height: '100%',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.main' }}>
                    {item.value}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                    {item.label}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 4 }}>
            <Stack spacing={1.5}>
              <Typography variant="h4" sx={{ fontWeight: 800, textAlign: 'center' }}>
                Pourquoi cette plateforme change la donne
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: 840, mx: 'auto' }}>
                Une interface plus simple, des decisions plus fiables et une execution plus rapide des actions
                correctives.
              </Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ pt: 1 }}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, flex: 1 }}>
                  <Stack direction="row" spacing={1.2} alignItems="center">
                    <InsightsRoundedIcon color="primary" />
                    <Typography fontWeight={700}>Visibilite en temps reel</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.8 }}>
                    Suivi clair des tendances process, ecarts et performances de chaque ligne.
                  </Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, flex: 1 }}>
                  <Stack direction="row" spacing={1.2} alignItems="center">
                    <ShieldRoundedIcon color="primary" />
                    <Typography fontWeight={700}>Gouvernance qualite renforcee</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.8 }}>
                    Alertes tracees, responsabilites explicites et historique centralise.
                  </Typography>
                </Paper>
              </Stack>
            </Stack>
          </Paper>

          <Stack spacing={2.5}>
            <Typography variant="h4" sx={{ fontWeight: 800, textAlign: 'center' }}>
              Tout ce dont vous avez besoin pour agir vite
            </Typography>
            <Grid container spacing={2}>
              {featureItems.map((item) => (
                <Grid size={{ xs: 12, md: 4 }} key={item.title}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 3,
                      borderRadius: 3.5,
                      height: '100%',
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip size="small" color="primary" icon={item.icon} label="Feature" />
                    </Stack>
                    <Typography variant="h6" sx={{ fontWeight: 800, mt: 1.4, mb: 1 }}>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                      {item.description}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Stack>

          <Paper
            variant="outlined"
            sx={{
              p: { xs: 2.5, sm: 3.5 },
              borderRadius: 4.5,
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <Stack spacing={2.5}>
              <Typography variant="h4" sx={{ fontWeight: 800, textAlign: 'center' }}>
                Une methode simple en trois etapes
              </Typography>
              <Divider />
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                {workflowSteps.map((item) => (
                  <Box
                    key={item.step}
                    sx={{
                      flex: 1,
                      p: 2.2,
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.default',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ color: 'primary.main', fontWeight: 900, letterSpacing: 1.1 }}
                    >
                      ETAPE {item.step}
                    </Typography>
                    <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 700 }}>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                      {item.description}
                    </Typography>
                  </Box>
                ))}
              </Stack>
              <Box sx={{ textAlign: 'center', pt: 1 }}>
                <Button variant="contained" size="large" onClick={() => navigate('/signup')}>
                  Creer mon compte
                </Button>
              </Box>
            </Stack>
          </Paper>

          <Paper
            variant="outlined"
            sx={(theme) => ({
              p: { xs: 3, md: 4 },
              borderRadius: 5,
              textAlign: 'center',
              background: theme.vars
                ? `linear-gradient(120deg, rgba(${theme.vars.palette.primary.mainChannel} / 0.16), rgba(${theme.vars.palette.info.mainChannel} / 0.12))`
                : 'background.paper',
            })}
          >
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
              Donnez un nouveau niveau a vos operations
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 760, mx: 'auto', mb: 2.5 }}>
              Lancez votre espace en quelques minutes et passez d une gestion reactive a une execution
              proactive.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} justifyContent="center">
              <Button variant="contained" size="large" onClick={() => navigate('/signup')}>
                Demarrer gratuitement
              </Button>
              <Button variant="outlined" size="large" onClick={() => navigate('/signin')}>
                Se connecter
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
