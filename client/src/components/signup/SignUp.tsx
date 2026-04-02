import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import AppTheme from '../../theme/AppTheme';
import ColorModeSelect from '../../theme/ColorModeSelect';
import { GoogleIcon } from '../CustomIcons';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/http';
import { useAuth } from '../../context/AuthContext';
import { ensureGoogleSdk } from '../../utils/oauthSdk';

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(2.5),
  gap: theme.spacing(1.2),
  margin: 'auto',
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

const SignUpContainer = styled(Stack)(({ theme }) => ({
  minHeight: '100%',
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(2),
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(4),
    paddingLeft: theme.spacing(4),
    paddingRight: theme.spacing(4),
  },
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage:
      'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
    backgroundRepeat: 'no-repeat',
    ...theme.applyStyles('dark', {
      backgroundImage:
        'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
    }),
  },
}));

export default function SignUp(props: { disableCustomTheme?: boolean }) {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const [role, setRole] = React.useState<'operator' | 'quality' | 'manager' | ''>('');
  const [roleError, setRoleError] = React.useState(false);
  const [roleErrorMessage, setRoleErrorMessage] = React.useState('');
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [nameError, setNameError] = React.useState(false);
  const [nameErrorMessage, setNameErrorMessage] = React.useState('');
  const [serverError, setServerError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [oauthLoading, setOAuthLoading] = React.useState(false);

  const validateInputs = () => {
    const email = document.getElementById('email') as HTMLInputElement;
    const password = document.getElementById('password') as HTMLInputElement;
    const name = document.getElementById('name') as HTMLInputElement;

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

    if (!name.value || name.value.length < 1) {
      setNameError(true);
      setNameErrorMessage('Name is required.');
      isValid = false;
    } else {
      setNameError(false);
      setNameErrorMessage('');
    }

    if (!role) {
      setRoleError(true);
      setRoleErrorMessage('Role is required.');
      isValid = false;
    } else {
      setRoleError(false);
      setRoleErrorMessage('');
    }

    return isValid;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateInputs()) return;

    const data = new FormData(event.currentTarget);
    setServerError('');
    setLoading(true);

    try {
      const email = String(data.get('email') || '');
      const password = String(data.get('password') || '');

      await api.post('/auth/register', {
        fullName: data.get('name'),
        email,
        password,
        role,
      });

      // Keep one auth source of truth through AuthContext
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Erreur lors de l\'inscription.';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setOAuthLoading(true);
      setServerError('');

      await ensureGoogleSdk();

      const google = (window as any).google;
      if (!google) {
        setServerError('Google SDK non charge. Rechargez la page.');
        return;
      }

      const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!googleClientId || googleClientId === 'YOUR_GOOGLE_CLIENT_ID') {
        setServerError('Configurez VITE_GOOGLE_CLIENT_ID dans client/.env puis redemarrez le frontend.');
        return;
      }

      const credential = await new Promise<string>((resolve, reject) => {
        let settled = false;
        google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response: any) => {
            settled = true;
            if (response?.credential) {
              resolve(response.credential);
              return;
            }
            reject(new Error('Aucun ID token Google recu.'));
          },
        });

        google.accounts.id.prompt();

        window.setTimeout(() => {
          if (!settled) {
            reject(new Error('Google Sign-In indisponible sur ce navigateur.'));
          }
        }, 10000);
      });

      await loginWithGoogle(credential, role || undefined);
      navigate('/');
    } catch (_err: any) {
      setServerError('Erreur lors de l\'inscription Google.');
    } finally {
      setOAuthLoading(false);
    }
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />
      <SignUpContainer direction="column" justifyContent="flex-start" alignItems="center">
        <Card variant="outlined">
          <Typography
            component="h1"
            variant="h4"
            sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
          >
            Sign up
          </Typography>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}
          >
            <FormControl>
              <FormLabel htmlFor="name">Full name</FormLabel>
              <TextField
                autoComplete="name"
                name="name"
                required
                fullWidth
                id="name"
                placeholder="Jon Snow"
                error={nameError}
                helperText={nameErrorMessage}
                color={nameError ? 'error' : 'primary'}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="email">Email</FormLabel>
              <TextField
                required
                fullWidth
                id="email"
                placeholder="your@email.com"
                name="email"
                autoComplete="email"
                variant="outlined"
                error={emailError}
                helperText={emailErrorMessage}
                color={passwordError ? 'error' : 'primary'}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="password">Password</FormLabel>
              <TextField
                required
                fullWidth
                name="password"
                placeholder="••••••"
                type="password"
                id="password"
                autoComplete="new-password"
                variant="outlined"
                error={passwordError}
                helperText={passwordErrorMessage}
                color={passwordError ? 'error' : 'primary'}
              />
            </FormControl>
            <FormControl fullWidth error={roleError}>
              <FormLabel htmlFor="role">Role</FormLabel>
              <Select
                id="role"
                name="role"
                value={role}
                displayEmpty
                onChange={(event) => {
                  const nextRole = String(event.target.value) as 'operator' | 'quality' | 'manager' | '';
                  setRole(nextRole);
                  if (nextRole) {
                    setRoleError(false);
                    setRoleErrorMessage('');
                  }
                }}
                required
              >
                <MenuItem value="" disabled>
                  Select your role
                </MenuItem>
                <MenuItem value="operator">Operator</MenuItem>
                <MenuItem value="quality">Quality Manager</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
              </Select>
              {roleError && (
                <Typography color="error" variant="caption">
                  {roleErrorMessage}
                </Typography>
              )}
            </FormControl>
            <FormControlLabel
              control={<Checkbox value="allowExtraEmails" color="primary" />}
              label="I want to receive updates via email."
            />
            {serverError && (
              <Typography color="error" variant="body2" sx={{ textAlign: 'center' }}>
                {serverError}
              </Typography>
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
            >
              {loading ? 'Inscription...' : 'Sign up'}
            </Button>
          </Box>
          <Divider>
            <Typography sx={{ color: 'text.secondary' }}>or</Typography>
          </Divider>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleGoogleSignUp}
              disabled={oauthLoading || !role}
              startIcon={<GoogleIcon />}
            >
              {oauthLoading ? 'Connexion...' : 'Sign up with Google'}
            </Button>
            <Typography sx={{ textAlign: 'center' }}>
              Already have an account?{' '}
              <Link
                href="/signin"
                variant="body2"
                sx={{ alignSelf: 'center' }}
              >
                Sign in
              </Link>
            </Typography>
          </Box>
        </Card>
      </SignUpContainer>
    </AppTheme>
  );
}