import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/http';

interface ProcessItem {
  _id: string;
  name: string;
  productionLine: string;
  lsl: number;
  usl: number;
  cpTarget: number;
  cpkTarget: number;
  status?: string;
  description?: string;
}

const toFixed2 = (value: number) => Number.isFinite(value) ? value.toFixed(2) : '0.00';

export default function OperatorProcessDetailPage() {
  const { processId } = useParams<{ processId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [process, setProcess] = React.useState<ProcessItem | null>(null);

  React.useEffect(() => {
    const fetchProcess = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get(`/processes/${processId}`);
        setProcess(res.data.process);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Processus introuvable.');
      } finally {
        setLoading(false);
      }
    };

    if (processId) {
      fetchProcess();
    }
  }, [processId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !process) {
    return (
      <Stack spacing={2}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Détails du Processus</Typography>
        </Box>
        <Alert severity="error">{error || 'Processus non trouvé.'}</Alert>
        <Button variant="contained" onClick={() => navigate('/operator/processes')}>
          Retour aux processus
        </Button>
      </Stack>
    );
  }

  const targetValue = (process.lsl + process.usl) / 2;
  const rangeWidth = process.usl - process.lsl;

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            {process.name}
          </Typography>
          <Typography color="text.secondary">
            Ligne: {process.productionLine}
          </Typography>
        </Box>
        <Button variant="contained" onClick={() => navigate('/operator')}>
          Tableau de bord
        </Button>
      </Box>

      {process.description && (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, backgroundColor: '#fafafa' }}>
          <Typography variant="body2" color="text.secondary">
            {process.description}
          </Typography>
        </Paper>
      )}

      {/* Limits Overview */}
      <Grid container spacing={2} columns={12}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" variant="caption" display="block">
                Limite Inférieure (LSL)
              </Typography>
              <Typography variant="h5" sx={{ color: '#d32f2f' }}>
                {toFixed2(process.lsl)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" variant="caption" display="block">
                Valeur Cible
              </Typography>
              <Typography variant="h5" sx={{ color: '#388e3c' }}>
                {toFixed2(targetValue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" variant="caption" display="block">
                Limite Supérieure (USL)
              </Typography>
              <Typography variant="h5" sx={{ color: '#d32f2f' }}>
                {toFixed2(process.usl)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" variant="caption" display="block">
                Plage acceptable
              </Typography>
              <Typography variant="h5">
                {toFixed2(rangeWidth)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Specifications */}
      <Grid container spacing={2} columns={12}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Spécifications principales
            </Typography>
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  LSL (Limite Inférieure)
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {toFixed2(process.lsl)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  USL (Limite Supérieure)
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {toFixed2(process.usl)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Valeur Cible
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {toFixed2(targetValue)}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Objectifs de performance
            </Typography>
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Cp Cible
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {toFixed2(process.cpTarget)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Cpk Cible
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {toFixed2(process.cpkTarget)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Statut
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {process.status === 'active' ? '✓ Actif' : '✗ Inactif'}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Stack direction="row" spacing={1.5}>
        <Button
          variant="contained"
          onClick={() => navigate('/operator/add-measurement', { state: { process: processId } })}
          fullWidth
        >
          Ajouter une mesure
        </Button>
        <Button
          variant="outlined"
          onClick={() => navigate('/operator/measurements', { state: { processFilter: processId } })}
          fullWidth
        >
          Voir mesures
        </Button>
      </Stack>
    </Stack>
  );
}
