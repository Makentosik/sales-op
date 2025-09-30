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
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  TableSortLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { participantsAPI, ParticipantFilters } from '../services/participants';
import { gradesAPI } from '../services/grades';

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
  const [grades, setGrades] = useState<Grade[]>([]);
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

  // Состояние фильтров
  const [filters, setFilters] = useState<ParticipantFilters>({
    search: '',
    gradeId: '',
    isActive: undefined,
    warningStatus: undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  useEffect(() => {
    loadParticipants();
    loadGrades();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadParticipants();
    }, 300); // debounce для поиска

    return () => clearTimeout(timeoutId);
  }, [filters]);

  const loadParticipants = async () => {
    try {
      setLoading(true);
      const data = await participantsAPI.getAll(filters);
      setParticipants(data);
    } catch (error) {
      console.error('Error loading participants:', error);
      showSnackbar('Ошибка при загрузке менеджеров', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadGrades = async () => {
    try {
      const data = await gradesAPI.getAll();
      setGrades(data);
    } catch (error) {
      console.error('Error loading grades:', error);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // Обработчики фильтров
  const handleFilterChange = (field: keyof ParticipantFilters, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSortChange = (field: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field as any,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      gradeId: '',
      isActive: undefined,
      warningStatus: undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
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

  // ✅ Единый обработчик с юнион-параметром
  const handleSubmit: (data: CreateParticipantDto | UpdateParticipantDto) => Promise<void> = async (data) => {
    if (editingParticipant) {
      // обновление
      return handleUpdate(data as UpdateParticipantDto);
    }
    // создание
    return handleCreate(data as CreateParticipantDto);
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
        {/* Панель фильтров */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              {/* Поиск */}
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Поиск по имени..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Фильтр по грейду */}
              <Grid item xs={12} sm={6} md={2}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Грейд</InputLabel>
                  <Select
                    value={filters.gradeId}
                    onChange={(e) => handleFilterChange('gradeId', e.target.value)}
                    label="Грейд"
                  >
                    <MenuItem value="">Все</MenuItem>
                    {grades.map(grade => (
                      <MenuItem key={grade.id} value={grade.id}>
                        {grade.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Фильтр по статусу */}
              <Grid item xs={12} sm={6} md={2}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Статус</InputLabel>
                  <Select
                    value={filters.isActive === undefined ? '' : filters.isActive ? 'true' : 'false'}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleFilterChange('isActive', value === '' ? undefined : value === 'true');
                    }}
                    label="Статус"
                  >
                    <MenuItem value="">Все</MenuItem>
                    <MenuItem value="true">Активные</MenuItem>
                    <MenuItem value="false">Неактивные</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Фильтр по предупреждениям */}
              <Grid item xs={12} sm={6} md={2}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Предупреждения</InputLabel>
                  <Select
                    value={filters.warningStatus || ''}
                    onChange={(e) => handleFilterChange('warningStatus', e.target.value || undefined)}
                    label="Предупреждения"
                  >
                    <MenuItem value="">Все</MenuItem>
                    <MenuItem value="NO_WARNING">Нет</MenuItem>
                    <MenuItem value="WARNING_90">90%</MenuItem>
                    <MenuItem value="WARNING_80">80%</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Кнопка очистки */}
              <Grid item xs={12} sm={6} md={2}>
                <Button
                  variant="outlined"
                  onClick={clearFilters}
                  startIcon={<FilterListIcon />}
                  fullWidth
                >
                  Очистить
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        <Paper elevation={0} sx={{ overflow: 'hidden' }}>
          {loading && <LinearProgress />}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <StyledTableCell width="150px">
                    <TableSortLabel
                      active={filters.sortBy === 'name'}
                      direction={filters.sortBy === 'name' ? filters.sortOrder : 'asc'}
                      onClick={() => handleSortChange('name')}
                    >
                      Имя
                    </TableSortLabel>
                  </StyledTableCell>
                  <StyledTableCell width="240px">Грейд</StyledTableCell>
                  <StyledTableCell align="right" width="120px">
                    <TableSortLabel
                      active={filters.sortBy === 'revenue'}
                      direction={filters.sortBy === 'revenue' ? filters.sortOrder : 'asc'}
                      onClick={() => handleSortChange('revenue')}
                    >
                      Выручка
                    </TableSortLabel>
                  </StyledTableCell>
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
        onSubmit={handleSubmit}
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