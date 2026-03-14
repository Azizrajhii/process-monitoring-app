import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <Box
      id="home"
      sx={(theme) => ({
        pt: { xs: 10, sm: 14 },
        pb: { xs: 8, sm: 10 },
        backgroundImage:
          'radial-gradient(ellipse 80% 55% at 50% -20%, hsl(210, 100%, 92%), transparent)',
        ...theme.applyStyles('dark', {
          backgroundImage:
            'radial-gradient(ellipse 80% 55% at 50% -20%, hsl(210, 100%, 16%), transparent)',
        }),
      })}
    >
      <Container maxWidth="md">
        <Stack spacing={3} sx={{ textAlign: 'center', alignItems: 'center' }}>
          <Typography
            component="h1"
            variant="h2"
            sx={{ fontWeight: 700, fontSize: { xs: '2rem', sm: '3rem' } }}
          >
            Bienvenue sur votre plateforme
          </Typography>
          <Typography variant="h6" sx={{ color: 'text.secondary', maxWidth: 720 }}>
            Gerez vos workflows, centralisez vos donnees et suivez vos indicateurs
            depuis une interface simple et rapide.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button variant="contained" size="large" onClick={() => navigate('/signup')}>
              Commencer
            </Button>
            <Button variant="outlined" size="large" component="a" href="#footer">
              Nous contacter
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
