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
  AppBar,
  Toolbar,
  LinearProgress,
  Card,
  CardContent,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Calculate as CalculateIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { 
  salaryCalculatorAPI, 
  SalaryCalculationResponse,
  ParticipantSalaryCalculation,
  ParticipantSalaryDetailsResponse 
} from '../services/salaryCalculator';
import { periodsAPI, Period } from '../services/periods';

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

const SummaryCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

const SalaryCalculator: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [salaryData, setSalaryData] = useState<SalaryCalculationResponse | null>(null);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [detailsDialog, setDetailsDialog] = useState<{
    open: boolean;
    data: ParticipantSalaryDetailsResponse | null;
  }>({ open: false, data: null });

  useEffect(() => {
    loadPeriods();
  }, []);

  const loadPeriods = async () => {
    try {
      const data = await periodsAPI.getAll();
      setPeriods(data);
      // Автоматически выбираем активный период
      const activePeriod = data.find(p => p.status === 'ACTIVE');
      if (activePeriod) {
        setSelectedPeriodId(activePeriod.id);
        calculateSalaries(activePeriod.id);
      }
    } catch (error) {
      console.error('Error loading periods:', error);
    }
  };

  const calculateSalaries = async (periodId?: string) => {
    try {
      setLoading(true);
      const data = await salaryCalculatorAPI.calculate(periodId);
      setSalaryData(data);
    } catch (error) {
      console.error('Error calculating salaries:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadParticipantDetails = async (participantId: string) => {
    try {
      const data = await salaryCalculatorAPI.getParticipantDetails(participantId);
      setDetailsDialog({ open: true, data });
    } catch (error) {
      console.error('Error loading participant details:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatCommissionPercentage = (value: number) => {
    // Убираем округление для процента комиссии - показываем точное значение
    return `${value}%`;
  };

  const getPerformanceColor = (completion: number): string => {
    if (completion >= 120) return '#4caf50';
    if (completion >= 100) return '#2196f3';
    if (completion >= 80) return '#ff9800';
    if (completion >= 60) return '#ff5722';
    return '#f44336';
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <StyledAppBar position="sticky">
        <Toolbar>
          <MoneyIcon sx={{ mr: 2, color: '#006657' }} />
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
            Расчет заработной платы
          </Typography>
          <Button variant="outlined" onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
            ← Назад к Dashboard
          </Button>
        </Toolbar>
      </StyledAppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Управление периодом */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="period-select">Выберите период</InputLabel>
                <Select
                  labelId="period-select"
                  value={selectedPeriodId}
                  onChange={(e) => {
                    setSelectedPeriodId(e.target.value);
                    calculateSalaries(e.target.value);
                  }}
                  label="Выберите период"
                >
                  {periods.map((period) => (
                    <MenuItem key={period.id} value={period.id}>
                      {period.name} ({period.status === 'ACTIVE' ? 'Активный' : period.status})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <Button
                variant="contained"
                startIcon={<CalculateIcon />}
                onClick={() => calculateSalaries(selectedPeriodId)}
                disabled={loading || !selectedPeriodId}
                fullWidth
              >
                Рассчитать зарплаты
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {loading && <LinearProgress sx={{ mb: 3 }} />}

        {salaryData && (
          <>
            {/* Сводная информация */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={4}>
                <SummaryCard>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom variant="h6">
                      💰 Общая ЗП
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ color: '#006657' }}>
                      {formatCurrency(salaryData.summary.totalSalary)}
                    </Typography>
                  </CardContent>
                </SummaryCard>
              </Grid>
              <Grid item xs={12} md={4}>
                <SummaryCard>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom variant="h6">
                      📊 Комиссии
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ color: '#2196f3' }}>
                      {formatCurrency(salaryData.summary.totalCommission)}
                    </Typography>
                  </CardContent>
                </SummaryCard>
              </Grid>
              <Grid item xs={12} md={4}>
                <SummaryCard>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom variant="h6">
                      💵 Оклады
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ color: '#ff9800' }}>
                      {formatCurrency(salaryData.summary.totalFixedSalary)}
                    </Typography>
                  </CardContent>
                </SummaryCard>
              </Grid>
            </Grid>

            {/* Таблица с расчетами */}
            <Paper elevation={0}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <StyledTableCell>Менеджер</StyledTableCell>
                      <StyledTableCell>Грейд</StyledTableCell>
                      <StyledTableCell align="right">Выручка</StyledTableCell>
                      <StyledTableCell align="center">% выполнения</StyledTableCell>
                      <StyledTableCell align="center">Уровень</StyledTableCell>
                      <StyledTableCell align="right">% комиссии</StyledTableCell>
                      <StyledTableCell align="right">Комиссия</StyledTableCell>
                      <StyledTableCell>Грейд оклада</StyledTableCell>
                      <StyledTableCell align="right">Оклад</StyledTableCell>
                      <StyledTableCell align="right">Итого ЗП</StyledTableCell>
                      <StyledTableCell align="center">Действия</StyledTableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {salaryData.calculations.map((calc) => (
                      <TableRow key={calc.participantId} hover>
                        <TableCell>{calc.participantName}</TableCell>
                        <TableCell>
                          <Chip 
                            label={calc.currentGrade} 
                            size="small"
                            sx={{ backgroundColor: '#006657', color: 'white' }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(calc.revenue)}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={formatPercentage(calc.planCompletion)}
                            size="small"
                            sx={{ 
                              backgroundColor: getPerformanceColor(calc.planCompletion),
                              color: 'white',
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" color="textSecondary">
                            {calc.performanceLevel}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <strong>{formatCommissionPercentage(calc.commissionRate)}</strong>
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#2196f3', fontWeight: 600 }}>
                          {formatCurrency(calc.commission)}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="textSecondary">
                            {calc.fixedSalaryGrade}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#ff9800', fontWeight: 600 }}>
                          {formatCurrency(calc.fixedSalary)}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="h6" sx={{ color: '#006657', fontWeight: 700 }}>
                            {formatCurrency(calc.totalSalary)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Подробная информация">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => loadParticipantDetails(calc.participantId)}
                            >
                              <InfoIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </>
        )}
      </Container>

      {/* Диалог с детальной информацией */}
      <Dialog
        open={detailsDialog.open}
        onClose={() => setDetailsDialog({ open: false, data: null })}
        maxWidth="md"
        fullWidth
      >
        {detailsDialog.data && (
          <>
            <DialogTitle>
              Детали расчета ЗП - {detailsDialog.data.currentCalculation.participantName}
            </DialogTitle>
            <DialogContent dividers>
              <Typography variant="h6" gutterBottom>
                Уровни производительности грейда "{detailsDialog.data.currentCalculation.currentGrade}":
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Диапазон выполнения</TableCell>
                      <TableCell align="right">% комиссии</TableCell>
                      <TableCell align="right">Оклад</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detailsDialog.data.performanceLevels.map((level, index) => (
                      <TableRow 
                        key={index}
                        sx={{
                          backgroundColor: 
                            detailsDialog.data!.currentCalculation.planCompletion >= level.minPercentage &&
                            detailsDialog.data!.currentCalculation.planCompletion < level.maxPercentage
                              ? 'rgba(0, 102, 87, 0.08)' : 'inherit'
                        }}
                      >
                        <TableCell>
                          {level.minPercentage}% - {level.maxPercentage}%
                        </TableCell>
                        <TableCell align="right">{level.commissionRate}%</TableCell>
                        <TableCell align="right">{formatCurrency(level.fixedSalary)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsDialog({ open: false, data: null })}>
                Закрыть
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default SalaryCalculator;