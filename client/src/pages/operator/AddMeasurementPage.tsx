import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { api } from '../../api/http';
import { useNavigate } from 'react-router-dom';

interface ProcessItem {
  _id: string;
  name: string;
}

export default function AddMeasurementPage() {
  const navigate = useNavigate();
  const [processes, setProcesses] = React.useState<ProcessItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const [formData, setFormData] = React.useState({
    processId: '',
    value: '',
    date: new Date().toISOString().split('T')[0],
    comment: '',
  });

  React.useEffect(() => {
    const fetchProcesses = async () => {
      try {
        const res = await api.get('/processes');
        setProcesses(res.data.processes || []);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Erreur lors du chargement des processus.');
      } finally {
        setLoading(false);
      }
    };

    fetchProcesses();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: any) => {
    setFormData(prev => ({ ...prev, processId: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.processId || !formData.value || !formData.date) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/measurements', {
        process: formData.processId,
        value: parseFloat(formData.value),
        date: new Date(formData.date).toISOString(),
        comment: formData.comment || undefined,
      });

      setSuccess(true);
      setFormData({
        processId: '',
        value: '',
        date: new Date().toISOString().split('T')[0],
        comment: '',
      });

      // Redirect after success
      setTimeout(() => {
        navigate('/operator/measurements');
      }, 2000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de l\'ajout de la mesure.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" fontWeight={800}>
          Ajouter une Mesure
        </Typography>
        <Typography color="text.secondary">
          Enregistrez une nouvelle mesure pour un processus.
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              {error && <Alert severity="error">{error}</Alert>}
              {success && <Alert severity="success">Mesure enregistrée avec succès! Redirection en cours...</Alert>}

              <FormControl fullWidth required>
                <InputLabel>Processus</InputLabel>
                <Select
                  value={formData.processId}
                  label="Processus"
                  onChange={handleSelectChange}
                  disabled={submitting}
                >
                  <MenuItem value="">Sélectionnez un processus</MenuItem>
                  {processes.map(process => (
                    <MenuItem key={process._id} value={process._id}>
                      {process.name}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>Le processus pour lequel vous mesurez</FormHelperText>
              </FormControl>

              <TextField
                fullWidth
                label="Valeur mesure"
                name="value"
                type="number"
                inputProps={{ step: '0.01', min: '0' }}
                value={formData.value}
                onChange={handleInputChange}
                disabled={submitting}
                required
                variant="outlined"
                helperText="La valeur mesurée (ex: 10.05)"
              />

              <TextField
                fullWidth
                label="Date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                disabled={submitting}
                required
                variant="outlined"
                InputLabelProps={{
                  shrink: true,
                }}
              />

              <TextField
                fullWidth
                label="Commentaire"
                name="comment"
                value={formData.comment}
                onChange={handleInputChange}
                disabled={submitting}
                multiline
                rows={3}
                placeholder="Ajoutez des notes optionnelles (observations, conditions, etc.)"
                variant="outlined"
              />

              <Stack direction="row" spacing={1.5} sx={{ pt: 1 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={submitting}
                  sx={{ flex: 1 }}
                >
                  {submitting ? <CircularProgress size={24} /> : 'Enregistrer'}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/operator')}
                  disabled={submitting}
                >
                  Annuler
                </Button>
              </Stack>
            </Stack>
          </form>
        </Paper>
      )}
    </Stack>
  );
}
