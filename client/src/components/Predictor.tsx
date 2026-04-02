import React, { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { api } from '../api/http';

interface PredictorProps {
  initialValues?: number[];
  initialUsl?: number;
  showMeasurementsInput?: boolean;
  showUslInput?: boolean;
}

const Predictor: React.FC<PredictorProps> = ({
  initialValues = [],
  initialUsl = 510,
  showMeasurementsInput = true,
  showUslInput = true,
}) => {
  const [values, setValues] = useState<string>(initialValues.length > 0 ? initialValues.join(',') : '');
  const [usl, setUsl] = useState<number>(initialUsl);
  const [prediction, setPrediction] = useState<number | null>(null);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isPredicting, setIsPredicting] = useState(false);

  const handlePredict = async () => {
    setError('');
    setPrediction(null);
    setStatus('');
    setIsPredicting(true);
    try {
      const vals = values.split(',').map(v => Number(v.trim())).filter(v => !isNaN(v));
      const response = await api.post('/predict', { values: vals, usl });
      setPrediction(response.data.prediction);
      setStatus(response.data.status);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Prediction failed');
    } finally {
      setIsPredicting(false);
    }
  };

  React.useEffect(() => {
    if (initialValues.length > 0) setValues(initialValues.join(','));
    if (initialUsl) setUsl(initialUsl);
    // eslint-disable-next-line
  }, [initialValues.join(','), initialUsl]);

  return (
    <Box
      sx={{
        borderRadius: 3,
        p: { xs: 2, md: 2.5 },
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} justifyContent="space-between">
          <Typography variant="h6" fontWeight={700}>
            Process Capability Predictor
          </Typography>
          {!showUslInput && (
            <Typography variant="body2" color="text.secondary">
              USL: {usl.toFixed(2)}
            </Typography>
          )}
        </Stack>

        {showMeasurementsInput && (
          <TextField
            fullWidth
            label="Measurements"
            type="text"
            value={values}
            onChange={e => setValues(e.target.value)}
            placeholder="500,502,501,503,504,505"
            helperText="Separate values with commas"
            size="small"
          />
        )}

        {showUslInput && (
          <TextField
            label="USL"
            type="number"
            value={usl}
            onChange={e => setUsl(Number(e.target.value))}
            size="small"
            sx={{ maxWidth: 220 }}
          />
        )}

        <Button
          variant="contained"
          size="large"
          onClick={handlePredict}
          disabled={isPredicting}
          sx={{
            alignSelf: 'flex-start',
            px: 3,
            fontWeight: 700,
            textTransform: 'none',
            borderRadius: 2,
          }}
        >
          {isPredicting ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={18} color="inherit" />
              <span>Predicting...</span>
            </Stack>
          ) : (
            'Predict'
          )}
        </Button>

        {prediction !== null && (
          <Box
            sx={{
              borderRadius: 2,
              p: 1.8,
              bgcolor: status === 'WARNING' ? 'warning.50' : 'success.50',
              border: '1px solid',
              borderColor: status === 'WARNING' ? 'warning.light' : 'success.light',
            }}
          >
            <Typography variant="body1" sx={{ mb: 0.5 }}>
              Prediction: <strong>{prediction.toFixed(2)}</strong>
            </Typography>
            <Typography variant="body2" fontWeight={700} color={status === 'WARNING' ? 'warning.dark' : 'success.dark'}>
              Status: {status === 'WARNING' ? 'Future Risk' : 'OK'}
            </Typography>
            {status === 'WARNING' && (
              <Typography variant="body2" color="warning.dark" sx={{ mt: 0.5 }}>
                Prediction exceeds USL.
              </Typography>
            )}
          </Box>
        )}

        {error && <Alert severity="error">{error}</Alert>}
      </Stack>
    </Box>
  );
};

export default Predictor;
