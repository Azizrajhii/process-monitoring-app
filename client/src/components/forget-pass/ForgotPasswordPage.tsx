import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Link from '@mui/material/Link';
import { Link as RouterLink } from 'react-router-dom';
import { api } from '../../api/http';

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [resetUrl, setResetUrl] = React.useState('');

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setResetUrl('');

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Veuillez saisir un email valide.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email });
      setMessage(response.data?.message || 'Demande envoyee.');
      if (response.data?.resetUrl) {
        setResetUrl(response.data.resetUrl);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de la demande.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 10 }}>
      <Stack spacing={2}>
        <Typography variant="h4" component="h1">
          Forgot password
        </Typography>
        <Typography color="text.secondary">
          Entrez votre email pour generer un lien de reinitialisation.
        </Typography>

        <Box component="form" onSubmit={onSubmit} sx={{ display: 'grid', gap: 2 }}>
          <TextField
            required
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
          />

          {error && <Alert severity="error">{error}</Alert>}
          {message && <Alert severity="success">{message}</Alert>}
          {resetUrl && (
            <Alert severity="info">
              Lien de reinitialisation: <a href={resetUrl}>{resetUrl}</a>
            </Alert>
          )}

          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Envoi...' : 'Generer le lien'}
          </Button>
        </Box>

        <Link component={RouterLink} to="/signin" variant="body2">
          Retour a Sign in
        </Link>
      </Stack>
    </Container>
  );
}
