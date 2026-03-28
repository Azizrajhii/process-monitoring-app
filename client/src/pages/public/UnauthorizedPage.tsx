import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function UnauthorizedPage() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 2,
      }}
    >
      <Typography variant="h4" fontWeight={700} color="error">
        Acces refuse
      </Typography>
      <Typography color="text.secondary">
        Vous n'avez pas la permission d'acceder a cette page.
      </Typography>
    </Box>
  );
}