import * as React from 'react';
import { fetchProcessHistory, compareProcessVersions } from '../../api/processHistory';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import PersonIcon from '@mui/icons-material/Person';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';

interface Version {
  version: number;
  data: any;
  modifiedAt: string;
  modifiedBy?: { fullName: string; role: string };
}

interface Props {
  processId: string;
  open: boolean;
  onClose: () => void;
}

export default function ProcessHistoryDialog({ processId, open, onClose }: Props) {
  const [history, setHistory] = React.useState<Version[]>([]);
  const [selected, setSelected] = React.useState<number[]>([]);
  const [diff, setDiff] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      fetchProcessHistory(processId).then(setHistory);
      setSelected([]);
      setDiff(null);
    }
  }, [open, processId]);

  const handleCompare = async () => {
    if (selected.length === 2) {
      setLoading(true);
      const res = await compareProcessVersions(processId, selected[0], selected[1]);
      setDiff(res.diff);
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Historique des versions</DialogTitle>
      <DialogContent>
        {history.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
            <HistoryEduIcon sx={{ fontSize: 60, mb: 1 }} />
            <Typography variant="h6" fontWeight={700} color="text.primary">
              Aucune version enregistrée pour ce process.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Créez ou modifiez le process pour voir l'historique ici.
            </Typography>
            <Button
              variant="outlined"
              disabled
              sx={{ mt: 4, bgcolor: '#f5f5f5', color: '#888', fontWeight: 600, fontSize: 18, borderRadius: 2, boxShadow: 1, opacity: 1 }}
              fullWidth
            >
              Comparer les versions
            </Button>
          </Box>
        ) : (
          <Timeline position="alternate">
            {history.map((v, idx) => (
              <TimelineItem key={v.version}>
                <TimelineSeparator>
                  <TimelineDot color={idx === 0 ? 'primary' : 'grey'}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                      {v.version}
                    </Avatar>
                  </TimelineDot>
                  {idx < history.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent>
                  <Box sx={{ mb: 1 }}>
                    <Typography fontWeight={700}>
                      Version {v.version} {idx === 0 && '(Initiale)'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(v.modifiedAt).toLocaleString('fr-FR')}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1} mt={0.5}>
                      <PersonIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {v.modifiedBy?.fullName || 'Utilisateur inconnu'}
                      </Typography>
                    </Stack>
                  </Box>
                  <Button
                    size="small"
                    variant={selected.includes(v.version) ? 'contained' : 'outlined'}
                    color={selected.includes(v.version) ? 'primary' : 'inherit'}
                    sx={{ mt: 1, mr: 1 }}
                    disabled={selected.length === 2 && !selected.includes(v.version)}
                    onClick={() => {
                      setDiff(null);
                      setSelected((prev) =>
                        prev.includes(v.version)
                          ? prev.filter((ver) => ver !== v.version)
                          : prev.length < 2
                          ? [...prev, v.version]
                          : prev
                      );
                    }}
                  >
                    {selected.includes(v.version) ? 'Sélectionnée' : 'Sélectionner'}
                  </Button>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        )}
        {history.length > 0 && (
          <Stack direction="row" spacing={2} mt={2} alignItems="center" justifyContent="center">
            <Button
              variant="contained"
              disabled={selected.length !== 2 || loading}
              onClick={handleCompare}
            >
              Comparer les versions
            </Button>
            {diff && (
              <Typography color="primary">Différences détectées : {Object.keys(diff).length}</Typography>
            )}
          </Stack>
        )}
        {diff && (
          <Box mt={2}>
            <Typography variant="subtitle1">Différences :</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Champ</TableCell>
                  <TableCell>Avant</TableCell>
                  <TableCell>Après</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(diff).map(([key, value]: any) => (
                  <TableRow key={key}>
                    <TableCell>{key}</TableCell>
                    <TableCell>{String(value.before)}</TableCell>
                    <TableCell>{String(value.after)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );
}
