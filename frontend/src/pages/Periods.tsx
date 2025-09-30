import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  AppBar,
  Toolbar,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Alert,
  LinearProgress,
  Tooltip,
  Fade,
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  DateRange as DateRangeIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { periodsAPI, Period, CreatePeriodDto, UpdatePeriodDto, PeriodStats } from '../services/periods';
import PeriodForm from '../components/PeriodForm';
import GradeTransitions from '../components/GradeTransitions';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: '#ffffff',
  color: theme.palette.text.primary,
  boxShadow: '0 1px 3px rgba(0, 102, 87, 0.08)',
  borderBottom: '1px solid rgba(0, 102, 87, 0.08)',
}));

const PeriodCard = styled(Card)<{ status: string }>(({ theme, status }) => ({
  marginBottom: theme.spacing(2),
  borderLeft: `5px solid ${
    status === 'ACTIVE' ? '#4caf50' :
    status === 'COMPLETED' ? '#2196f3' :
    status === 'CANCELLED' ? '#f44336' :
    '#ff9800'
  }`,
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

const StatusChip = styled(Chip)<{ status: string }>(({ status }) => ({
  fontWeight: 600,
  ...(status === 'ACTIVE' && { backgroundColor: '#e8f5e8', color: '#2e7d32' }),
  ...(status === 'COMPLETED' && { backgroundColor: '#e3f2fd', color: '#1565c0' }),
  ...(status === 'PENDING' && { backgroundColor: '#fff3e0', color: '#ef6c00' }),
  ...(status === 'CANCELLED' && { backgroundColor: '#ffebee', color: '#c62828' }),
}));

const Periods: React.FC = () => {
  const navigate = useNavigate();
  const [periods, setPeriods] = useState<Period[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<Period | null>(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; period: Period | null }>({
    open: false,
    period: null,
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [periodStats, setPeriodStats] = useState<Record<string, PeriodStats>>({});
  const [gradeTransitionsDialog, setGradeTransitionsDialog] = useState<{
    open: boolean;
    periodId: string | null;
    periodName: string;
  }>({ open: false, periodId: null, periodName: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [periodsData, currentData] = await Promise.all([
        periodsAPI.getAll(),
        periodsAPI.getCurrent(),
      ]);
      
      setPeriods(periodsData);
      setCurrentPeriod(currentData);

      // Load stats for completed periods
      for (const period of periodsData.filter(p => p.status === 'COMPLETED')) {
        try {
          const stats = await periodsAPI.getStats(period.id);
          setPeriodStats(prev => ({ ...prev, [period.id]: stats }));
        } catch (error) {
          console.error(`Error loading stats for period ${period.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error loading periods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePeriod = async (data: CreatePeriodDto) => {
    try {
      await periodsAPI.create(data);
      await loadData();
    } catch (error: any) {
      console.error('Error creating period:', error);
      throw error;
    }
  };

  const handleUpdatePeriod = async (data: UpdatePeriodDto) => {
    if (!editingPeriod) return;
    
    try {
      await periodsAPI.update(editingPeriod.id, data);
      await loadData();
    } catch (error: any) {
      console.error('Error updating period:', error);
      throw error;
    }
  };

  // ✅ Единый обработчик с юнион-параметром
  const handleSubmit: (data: CreatePeriodDto | UpdatePeriodDto) => Promise<void> = async (data) => {
    if ('id' in data) {
      // обновление
      return handleUpdatePeriod(data as UpdatePeriodDto);
    }
    // создание
    return handleCreatePeriod(data as CreatePeriodDto);
  };

  const handleActivatePeriod = async (period: Period) => {
    try {
      setActionLoading(period.id);
      await periodsAPI.activate(period.id);
      await loadData();
    } catch (error) {
      console.error('Error activating period:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompletePeriod = async (period: Period) => {
    try {
      setActionLoading(period.id);
      await periodsAPI.complete(period.id, { saveSnapshot: true });
      await loadData();
    } catch (error) {
      console.error('Error completing period:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelPeriod = async (period: Period) => {
    try {
      setActionLoading(period.id);
      await periodsAPI.cancel(period.id);
      await loadData();
    } catch (error) {
      console.error('Error cancelling period:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeletePeriod = async () => {
    if (!deleteDialog.period) return;
    
    try {
      setActionLoading(deleteDialog.period.id);
      await periodsAPI.delete(deleteDialog.period.id);
      setDeleteDialog({ open: false, period: null });
      await loadData();
    } catch (error) {
      console.error('Error deleting period:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Ожидает';
      case 'ACTIVE':
        return 'Активный';
      case 'COMPLETED':
        return 'Завершен';
      case 'CANCELLED':
        return 'Отменен';
      default:
        return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'MONTHLY':
        return 'Месячный';
      case 'TEN_DAYS':
        return '10-дневный';
      case 'CUSTOM':
        return 'Пользовательский';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const canActivate = (period: Period) => period.status === 'PENDING' && !currentPeriod;
  const canComplete = (period: Period) => period.status === 'ACTIVE';
  const canCancel = (period: Period) => ['PENDING', 'ACTIVE'].includes(period.status);
  const canDelete = (period: Period) => ['PENDING', 'CANCELLED', 'COMPLETED'].includes(period.status);
  const canEdit = (period: Period) => ['PENDING'].includes(period.status);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <StyledAppBar position="sticky">
        <Toolbar>
          <DateRangeIcon sx={{ mr: 2, color: '#006657' }} />
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
Управление периодами
          </Typography>
          <Button variant="outlined" onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
            ← Назад к Dashboard
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setFormOpen(true)}
            disabled={!!currentPeriod}
          >
            Новый период
          </Button>
        </Toolbar>
      </StyledAppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Текущий активный период */}
        {currentPeriod && (
          <Fade in timeout={500}>
            <Alert severity="info" sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                🎯 Активный период: {currentPeriod.name}
              </Typography>
              <Typography variant="body2">
                {formatDate(currentPeriod.startDate)} - {formatDate(currentPeriod.endDate)} • {' '}
                Тип: {getTypeLabel(currentPeriod.type)}
              </Typography>
            </Alert>
          </Fade>
        )}

        {loading ? (
          <Box sx={{ width: '100%', mt: 4 }}>
            <LinearProgress />
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
              Загрузка периодов...
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {periods.length === 0 ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <DateRangeIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Периоды не созданы
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Создайте первый период для начала работы с системой
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setFormOpen(true)}
                  >
                    Создать период
                  </Button>
                </Paper>
              </Grid>
            ) : (
              periods.map((period, index) => (
                <Grid item xs={12} md={6} lg={4} key={period.id}>
                  <Fade in timeout={500 + index * 100}>
                    <PeriodCard status={period.status}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="h6" fontWeight={600} sx={{ flex: 1, mr: 1 }}>
                            {period.name}
                          </Typography>
                          <StatusChip
                            label={getStatusLabel(period.status)}
                            size="small"
                            status={period.status}
                          />
                        </Box>

                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Тип:</strong> {getTypeLabel(period.type)}
                        </Typography>

                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Период:</strong> {formatDate(period.startDate)} - {formatDate(period.endDate)}
                        </Typography>

                        {period._count && (
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            <strong>Платежи:</strong> {period._count.payments} • <strong>Логи:</strong> {period._count.logs}
                          </Typography>
                        )}

                        {/* Статистика для завершенных периодов */}
                        {period.status === 'COMPLETED' && periodStats[period.id] && (
                          <Box sx={{ mt: 2, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Статистика:
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              👥 {periodStats[period.id].totalParticipants} участников • {' '}
                              💰 {formatCurrency(periodStats[period.id].totalRevenue)} • {' '}
                              ✅ {periodStats[period.id].completedPlans} планов выполнено
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              📈 {Math.round(periodStats[period.id].completionRate)}% успешность
                            </Typography>
                          </Box>
                        )}
                      </CardContent>

                      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                        <Box>
                          {canActivate(period) && (
                            <Tooltip title="Активировать период">
                              <IconButton
                                color="primary"
                                onClick={() => handleActivatePeriod(period)}
                                disabled={actionLoading === period.id}
                              >
                                <PlayIcon />
                              </IconButton>
                            </Tooltip>
                          )}

                          {canComplete(period) && (
                            <Tooltip title="Завершить период">
                              <IconButton
                                color="success"
                                onClick={() => handleCompletePeriod(period)}
                                disabled={actionLoading === period.id}
                              >
                                <StopIcon />
                              </IconButton>
                            </Tooltip>
                          )}

                          {canEdit(period) && (
                            <Tooltip title="Редактировать">
                              <IconButton
                                onClick={() => {
                                  setEditingPeriod(period);
                                  setFormOpen(true);
                                }}
                                disabled={actionLoading === period.id}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                          )}

                          {period.status === 'COMPLETED' && (
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              startIcon={<TrendingUpIcon />}
                              onClick={() => {
                                setGradeTransitionsDialog({
                                  open: true,
                                  periodId: period.id,
                                  periodName: period.name
                                });
                              }}
                              sx={{ ml: 1 }}
                            >
                              🔥 ПЕРЕХОДЫ
                            </Button>
                          )}
                        </Box>

                        <Box>
                          {canCancel(period) && (
                            <Tooltip title="Отменить период">
                              <IconButton
                                color="warning"
                                onClick={() => handleCancelPeriod(period)}
                                disabled={actionLoading === period.id}
                              >
                                <CancelIcon />
                              </IconButton>
                            </Tooltip>
                          )}

                          {canDelete(period) && (
                            <Tooltip title="Удалить период">
                              <IconButton
                                color="error"
                                onClick={() => setDeleteDialog({ open: true, period })}
                                disabled={actionLoading === period.id}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </CardActions>
                    </PeriodCard>
                  </Fade>
                </Grid>
              ))
            )}
          </Grid>
        )}

        {/* Форма создания/редактирования периода */}
        <PeriodForm
          open={formOpen}
          onClose={() => {
            setFormOpen(false);
            setEditingPeriod(null);
          }}
          onSubmit={handleSubmit}
          period={editingPeriod}
        />

        {/* Диалог подтверждения удаления */}
        <Dialog
          open={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, period: null })}
        >
          <DialogTitle>Подтвердите удаление</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Вы уверены, что хотите удалить период "{deleteDialog.period?.name}"?
              {deleteDialog.period?.status === 'COMPLETED' && (
                <>
                  <br /><br />
                  <strong>Внимание:</strong> Это завершенный период со статистикой и историей переходов. После удаления все связанные данные будут потеряны.
                </>
              )}
              <br />
              Это действие нельзя отменить.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog({ open: false, period: null })}>
              Отмена
            </Button>
            <Button
              onClick={handleDeletePeriod}
              color="error"
              variant="contained"
              disabled={!!actionLoading}
            >
              Удалить
            </Button>
          </DialogActions>
        </Dialog>

        {/* Диалог переходов грейдов */}
        <GradeTransitions
          open={gradeTransitionsDialog.open}
          onClose={() => setGradeTransitionsDialog({ open: false, periodId: null, periodName: '' })}
          periodId={gradeTransitionsDialog.periodId}
          periodName={gradeTransitionsDialog.periodName}
        />
      </Container>
    </Box>
  );
};

export default Periods;
