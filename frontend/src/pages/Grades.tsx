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
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { gradesAPI } from '../services/grades';

// Локальные интерфейсы для обхода проблемы с кэшем Vite
interface PerformanceLevel {
  completionPercentage: number;
  requiredRevenue: number;
  bonusPercentage: number;
  bonus: number;
  salary: number;
  totalSalary: number;
}

interface Grade {
  id: string;
  name: string;
  description?: string;
  plan: number;
  minRevenue: number;
  maxRevenue: number;
  performanceLevels: PerformanceLevel[];
  color: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    participants: number;
  };
  participantPercentage?: number;
}

interface CreateGradeDto {
  name: string;
  description?: string;
  plan: number;
  minRevenue: number;
  maxRevenue: number;
  performanceLevels: PerformanceLevel[];
  color?: string;
  order?: number;
}

interface UpdateGradeDto extends Partial<CreateGradeDto> {
  isActive?: boolean;
}

import GradeForm from '../components/GradeForm';

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


const Grades: React.FC = () => {
  const navigate = useNavigate();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [gradeToDelete, setGradeToDelete] = useState<Grade | null>(null);
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
    loadGrades();
  }, []);

  const loadGrades = async () => {
    try {
      setLoading(true);
      const data = await gradesAPI.getAll();
      setGrades(data);
    } catch (error) {
      console.error('Error loading grades:', error);
      showSnackbar('Ошибка при загрузке грейдов', 'error');
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

  const handleCreateGrade = async (data: CreateGradeDto) => {
    try {
      setSubmitLoading(true);
      await gradesAPI.create(data);
      await loadGrades();
      showSnackbar('Грейд успешно создан', 'success');
      setFormOpen(false);
    } catch (error) {
      console.error('Error creating grade:', error);
      showSnackbar('Ошибка при создании грейда', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdateGrade = async (data: UpdateGradeDto) => {
    if (!editingGrade) return;
    
    try {
      setSubmitLoading(true);
      await gradesAPI.update(editingGrade.id, data);
      await loadGrades();
      showSnackbar('Грейд успешно обновлен', 'success');
      setFormOpen(false);
      setEditingGrade(null);
    } catch (error) {
      console.error('Error updating grade:', error);
      showSnackbar('Ошибка при обновлении грейда', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  // ✅ Единый обработчик с юнион-параметром
  const handleSubmit: (data: CreateGradeDto | UpdateGradeDto) => Promise<void> = async (data) => {
    if (editingGrade) {
      // обновление
      return handleUpdateGrade(data as UpdateGradeDto);
    }
    // создание
    return handleCreateGrade(data as CreateGradeDto);
  };

  const handleDeleteGrade = async () => {
    if (!gradeToDelete) return;

    try {
      await gradesAPI.delete(gradeToDelete.id);
      await loadGrades();
      showSnackbar('Грейд успешно удален', 'success');
      setDeleteDialogOpen(false);
      setGradeToDelete(null);
    } catch (error: any) {
      console.error('Error deleting grade:', error);
      if (error.response?.status === 409) {
        showSnackbar('Нельзя удалить грейд, к которому привязаны участники', 'warning');
      } else {
        showSnackbar('Ошибка при удалении грейда', 'error');
      }
    }
  };

  const openEditForm = (grade: Grade) => {
    setEditingGrade(grade);
    setFormOpen(true);
  };

  const openDeleteDialog = (grade: Grade) => {
    setGradeToDelete(grade);
    setDeleteDialogOpen(true);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('ru-RU').format(num);
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
            Управление грейдами
          </Typography>
          <Button
            variant="outlined"
            onClick={() => navigate('/dashboard')}
            sx={{ mr: 2 }}
          >
            ← Назад к Dashboard
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingGrade(null);
              setFormOpen(true);
            }}
          >
            Добавить грейд
          </Button>
        </Toolbar>
      </StyledAppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>

        <Paper elevation={0} sx={{ overflow: 'hidden' }}>
          {loading && <LinearProgress />}
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <StyledTableCell>Грейд</StyledTableCell>
                  <StyledTableCell align="right">План</StyledTableCell>
                  <StyledTableCell align="center">Участники</StyledTableCell>
                  <StyledTableCell align="center">Статус</StyledTableCell>
                  <StyledTableCell align="center">Действия</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {grades.map((grade) => (
                    <TableRow key={grade.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              backgroundColor: grade.color,
                              mr: 2,
                            }}
                          />
                          <Box>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {grade.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatNumber(grade.minRevenue)} - {formatNumber(grade.maxRevenue)} ₽
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>
                          {formatCurrency(grade.plan)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={grade._count?.participants || 0}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={grade.isActive ? 'Активный' : 'Неактивный'}
                          color={grade.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Просмотр">
                          <IconButton size="small" color="info">
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Редактировать">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => openEditForm(grade)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Удалить">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => openDeleteDialog(grade)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>

          {grades.length === 0 && !loading && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Грейды не найдены
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Создайте первый грейд для начала работы
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingGrade(null);
                  setFormOpen(true);
                }}
              >
                Создать грейд
              </Button>
            </Box>
          )}
        </Paper>
      </Container>

      {/* Форма создания/редактирования */}
      <GradeForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingGrade(null);
        }}
        onSubmit={handleSubmit}
        grade={editingGrade}
        loading={submitLoading}
      />

      {/* Диалог подтверждения удаления */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы уверены, что хотите удалить грейд "{gradeToDelete?.name}"?
            {gradeToDelete?._count?.participants && gradeToDelete._count.participants > 0 && (
              <>
                <br />
                <strong>Внимание:</strong> К этому грейду привязано {gradeToDelete._count.participants} участников.
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Отмена
          </Button>
          <Button onClick={handleDeleteGrade} color="error" variant="contained">
            Удалить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Уведомления */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Grades;