import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Link from '@mui/material/Link';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/http';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError('Token manquant.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/auth/reset-password/${token}`, { password });
      const jwt = response.data?.token as string | undefined;
      if (jwt) {
        localStorage.setItem('token', jwt);
      }
      setMessage('Mot de passe reinitialise avec succes.');
      setTimeout(() => navigate('/signin'), 1000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de la reinitialisation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 10 }}>
      <Stack spacing={2}>
        <Typography variant="h4" component="h1">
          Reset password
        </Typography>
        <Typography color="text.secondary">
          Saisissez votre nouveau mot de passe.
        </Typography>

        <Box component="form" onSubmit={onSubmit} sx={{ display: 'grid', gap: 2 }}>
          <TextField
            required
            type="password"
            label="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <TextField
            required
            type="password"
            label="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {error && <Alert severity="error">{error}</Alert>}
          {message && <Alert severity="success">{message}</Alert>}

          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Mise a jour...' : 'Reset password'}
          </Button>
        </Box>

        <Link component={RouterLink} to="/signin" variant="body2">
          Retour a Sign in
        </Link>
      </Stack>
    </Container>
  );
}
