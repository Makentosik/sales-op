import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Toolbar,
  AppBar,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { participantsAPI } from '../services/participants';

// Локальные интерфейсы
interface Grade {
  id: string;
  name: string;
  color: string;
}

interface Participant {
  id: string;
  telegramId: string;
  username?: string;
  firstName: string;
  lastName?: string;
  phoneNumber?: string;
  revenue: number;
  isActive: boolean;
  gradeId?: string;
  grade?: Grade;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  // Warning system fields
  warningStatus?: 'WARNING_90' | 'WARNING_80' | null;
  warningPeriodsLeft?: number;
  lastCompletionPercentage?: number;
}

interface CreateParticipantDto {
  telegramId: string;
  username?: string;
  firstName: string;
  lastName?: string;
  phoneNumber?: string;
  revenue?: number;
  gradeId?: string;
  userId?: string;
}

interface UpdateParticipantDto extends Partial<CreateParticipantDto> {
  isActive?: boolean;
}
import ParticipantForm from '../components/ParticipantForm';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: '#ffffff',
  color: theme.palette.text.primary,
  boxShadow: '0 1px 3px rgba(0, 102, 87, 0.08)',
  borderBottom: '1px solid rgba(0, 102, 87, 0.08)',
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
  backgroundColor: theme.palette.grey[50],
}));

const Participants: React.FC = () => {
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [participantToDelete, setParticipantToDelete] = useState<Participant | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    loadParticipants();
  }, []);

  const loadParticipants = async () => {
    try {
      setLoading(true);
      const data = await participantsAPI.getAll();
      setParticipants(data);
    } catch (error) {
      console.error('Error loading participants:', error);
      showSnackbar('Ошибка при загрузке менеджеров', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleCreate = async (data: CreateParticipantDto) => {
    try {
      setSubmitLoading(true);
      await participantsAPI.create(data);
      await loadParticipants();
      showSnackbar('Менеджер успешно создан', 'success');
      setFormOpen(false);
    } catch (error) {
      console.error('Error creating participant:', error);
      showSnackbar('Ошибка при создании менеджера', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdate = async (data: UpdateParticipantDto) => {
    if (!editingParticipant) return;
    try {
      setSubmitLoading(true);
      await participantsAPI.update(editingParticipant.id, data);
      await loadParticipants();
      showSnackbar('Менеджер успешно обновлен', 'success');
      setFormOpen(false);
      setEditingParticipant(null);
    } catch (error) {
      console.error('Error updating participant:', error);
      showSnackbar('Ошибка при обновлении менеджера', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!participantToDelete) return;
    try {
      await participantsAPI.delete(participantToDelete.id);
      await loadParticipants();
      showSnackbar('Менеджер успешно удален', 'success');
      setDeleteDialogOpen(false);
      setParticipantToDelete(null);
    } catch (error) {
      console.error('Error deleting participant:', error);
      showSnackbar('Ошибка при удалении менеджера', 'error');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <StyledAppBar position="sticky">
        <Toolbar>
          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              fontWeight: 600,
              background: 'linear-gradient(135deg, #006657 0%, #008570 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Управление менеджерами
          </Typography>
          <Button variant="outlined" onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
            ← Назад к Dashboard
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingParticipant(null);
              setFormOpen(true);
            }}
          >
            Добавить менеджера
          </Button>
        </Toolbar>
      </StyledAppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={0} sx={{ overflow: 'hidden' }}>
          {loading && <LinearProgress />}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <StyledTableCell width="150px">Имя</StyledTableCell>
                  <StyledTableCell width="240px">Грейд</StyledTableCell>
                  <StyledTableCell align="right" width="120px">Выручка</StyledTableCell>
                  <StyledTableCell width="180px">Предупреждения</StyledTableCell>
                  <StyledTableCell width="100px">Статус</StyledTableCell>
                  <StyledTableCell width="80px" align="center" sx={{ position: 'sticky', right: 0, backgroundColor: 'inherit', zIndex: 1 }}>Действия</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {participants.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell sx={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.firstName} {p.lastName}
                    </TableCell>
                    <TableCell>
                      {p.grade ? (
                        <Chip 
                          label={p.grade.name} 
                          style={{ backgroundColor: p.grade.color, color: 'white' }} 
                          size="small"
                        />
                      ) : (
                        <Chip label="Не назначен" size="small" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {new Intl.NumberFormat('ru-RU', { 
                        style: 'currency', 
                        currency: 'RUB',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(p.revenue || 0)}
                    </TableCell>
                    <TableCell>
                      {p.warningStatus ? (
                        <Tooltip title={`Выполнение плана: ${p.lastCompletionPercentage?.toFixed(1) ?? 'н/д'}%. Осталось ${p.warningPeriodsLeft ?? 0} ${p.warningPeriodsLeft === 1 ? 'период' : 'периода'} до понижения.`}>
                          <Chip
                            icon={<WarningIcon />}
                            label={`${p.warningStatus === 'WARNING_90' ? '90%' : '80%'} • ${p.warningPeriodsLeft ?? 0}`}
                            color={p.warningStatus === 'WARNING_90' ? 'warning' : 'error'}
                            size="small"
                            variant="outlined"
                          />
                        </Tooltip>
                      ) : (
                        <Chip label="Нет" size="small" variant="outlined" color="default" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={p.isActive ? 'Активный' : 'Неактивный'} 
                        color={p.isActive ? 'success' : 'default'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ position: 'sticky', right: 0, backgroundColor: 'inherit', zIndex: 1 }}>
                      <Tooltip title="Редактировать">
                        <IconButton size="small" color="primary" onClick={() => { setEditingParticipant(p); setFormOpen(true); }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Удалить">
                        <IconButton size="small" color="error" onClick={() => { setParticipantToDelete(p); setDeleteDialogOpen(true); }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>

      <ParticipantForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={editingParticipant ? handleUpdate : handleCreate}
        participant={editingParticipant}
        loading={submitLoading}
      />

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы уверены, что хотите удалить менеджера "{participantToDelete?.firstName} {participantToDelete?.lastName}"?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Удалить
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Participants;