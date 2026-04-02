import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MuiCard from '@mui/material/Card';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { GoogleIcon } from '../CustomIcons';
import { useAuth } from '../../context/AuthContext';
import { ensureGoogleSdk } from '../../utils/oauthSdk';

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  [theme.breakpoints.up('sm')]: {
    width: '450px',
  },
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

export default function SignInCard() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [serverError, setServerError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [oauthLoading, setOAuthLoading] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateInputs()) return;

    const data = new FormData(event.currentTarget);
    setServerError('');
    setLoading(true);

    try {
      await login(data.get('email') as string, data.get('password') as string);
      navigate('/');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Erreur lors de la connexion.';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  const validateInputs = () => {
    const email = document.getElementById('email') as HTMLInputElement;
    const password = document.getElementById('password') as HTMLInputElement;

    let isValid = true;

    if (!email.value || !/\S+@\S+\.\S+/.test(email.value)) {
      setEmailError(true);
      setEmailErrorMessage('Please enter a valid email address.');
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage('');
    }

    if (!password.value || password.value.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage('Password must be at least 6 characters long.');
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }

    return isValid;
  };

  const handleGoogleSignIn = async () => {
    try {
      setOAuthLoading(true);
      setServerError('');

      await ensureGoogleSdk();

      // Initialize Google Sign-In
      const google = (window as any).google;
      if (!google) {
        setServerError('Google SDK not loaded. Please refresh the page.');
        return;
      }

      const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!googleClientId || googleClientId === 'YOUR_GOOGLE_CLIENT_ID') {
        setServerError('Configurez VITE_GOOGLE_CLIENT_ID dans client/.env puis redemarrez le frontend.');
        return;
      }

      const credential = await new Promise<string>((resolve, reject) => {
        google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response: any) => {
            if (response?.credential) {
              resolve(response.credential);
              return;
            }
            reject(new Error('Aucun ID token Google recu.'));
          },
          ux_mode: 'popup',
        });

        google.accounts.id.prompt((notification: any) => {
          if (notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.()) {
            reject(new Error('Google Sign-In indisponible sur ce navigateur.'));
          }
        });
      });

      await loginWithGoogle(credential);
      navigate('/');
    } catch (err: any) {
      setServerError(err?.response?.data?.message || 'Erreur lors de la connexion Google.');
    } finally {
      setOAuthLoading(false);
    }
  };

  return (
    <Card variant="outlined">
      <Typography
        component="h1"
        variant="h4"
        sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
      >
        Sign in
      </Typography>
      <Box
        component="form"
        onSubmit={handleSubmit}
        noValidate
        sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 2 }}
      >
        <FormControl>
          <FormLabel htmlFor="email">Email</FormLabel>
          <TextField
            error={emailError}
            helperText={emailErrorMessage}
            id="email"
            type="email"
            name="email"
            placeholder="your@email.com"
            autoComplete="email"
            autoFocus
            required
            fullWidth
            variant="outlined"
            color={emailError ? 'error' : 'primary'}
          />
        </FormControl>
        <FormControl>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <FormLabel htmlFor="password">Password</FormLabel>
            <Link
              component={RouterLink}
              to="/forgot-password"
              variant="body2"
              sx={{ alignSelf: 'baseline' }}
            >
              Forgot your password?
            </Link>
          </Box>
          <TextField
            error={passwordError}
            helperText={passwordErrorMessage}
            name="password"
            placeholder="••••••"
            type="password"
            id="password"
            autoComplete="current-password"
            autoFocus
            required
            fullWidth
            variant="outlined"
            color={passwordError ? 'error' : 'primary'}
          />
        </FormControl>
        <FormControlLabel
          control={<Checkbox value="remember" color="primary" />}
          label="Remember me"
        />
        {serverError && (
          <Typography color="error" variant="body2" sx={{ textAlign: 'center' }}>
            {serverError}
          </Typography>
        )}
        <Button type="submit" fullWidth variant="contained" disabled={loading}>
          {loading ? 'Connexion...' : 'Sign in'}
        </Button>
        <Typography sx={{ textAlign: 'center' }}>
          Don&apos;t have an account?{' '}
          <span>
            <Link
              component={RouterLink}
              to="/signup"
              variant="body2"
              sx={{ alignSelf: 'center' }}
            >
              Sign up
            </Link>
          </span>
        </Typography>
      </Box>
      <Divider>or</Divider>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          onClick={handleGoogleSignIn}
          disabled={oauthLoading}
          startIcon={<GoogleIcon />}
        >
          {oauthLoading ? 'Connexion...' : 'Sign in with Google'}
        </Button>
      </Box>
    </Card>
  );
}