import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';

export default function Search() {
  return (
    <FormControl sx={{ width: { xs: '100%', md: '28ch' } }} variant="outlined">
      <OutlinedInput
        size="small"
        id="search"
        placeholder="Search…"
        sx={(theme) => ({
          flexGrow: 1,
          borderRadius: 3,
          backdropFilter: 'blur(8px)',
          backgroundColor: theme.vars
            ? `rgba(${theme.vars.palette.background.defaultChannel} / 0.55)`
            : 'rgba(255, 255, 255, 0.55)',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: (theme.vars || theme).palette.divider,
          },
        })}
        startAdornment={
          <InputAdornment position="start" sx={{ color: 'text.primary' }}>
            <SearchRoundedIcon fontSize="small" />
          </InputAdornment>
        }
        inputProps={{
          'aria-label': 'search',
        }}
      />
    </FormControl>
  );
}
