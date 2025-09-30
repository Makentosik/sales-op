import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Divider,
  Avatar,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  PersonAdd,
  Assessment,
  Close as CloseIcon,
} from '@mui/icons-material';
import { gradeTransitionsAPI, PeriodGradeTransitions, GradeTransition } from '../services/gradeTransitions';

interface GradeTransitionsProps {
  open: boolean;
  onClose: () => void;
  periodId: string | null;
  periodName: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`grade-transitions-tabpanel-${index}`}
      aria-labelledby={`grade-transitions-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const GradeTransitions: React.FC<GradeTransitionsProps> = ({ open, onClose, periodId, periodName }) => {
  const [data, setData] = useState<PeriodGradeTransitions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (open && periodId) {
      fetchTransitions();
    }
  }, [open, periodId]);

  const fetchTransitions = async () => {
    if (!periodId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await gradeTransitionsAPI.getPeriodTransitions(periodId);
      setData(result);
    } catch (err: any) {
      console.error('Error fetching grade transitions:', err);
      setError('Ошибка при загрузке данных о переходах грейдов');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRevenue = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const renderTransitionCard = (transition: GradeTransition) => (
    <Card key={transition.id} sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar 
            sx={{ 
              bgcolor: transition.display.statusColor,
              mr: 2,
              width: 40,
              height: 40
            }}
          >
            {transition.display.directionIcon}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="div">
              {transition.participant.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              @{transition.participant.telegramId}
            </Typography>
          </Box>
          <Chip
            label={`${transition.completionPercentage.toFixed(1)}%`}
            color={transition.completionPercentage >= 100 ? 'success' : 
                   transition.completionPercentage >= 90 ? 'warning' : 'error'}
            variant="outlined"
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            bgcolor: transition.fromGrade ? transition.fromGrade.color + '20' : 'grey.100',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            mr: 1
          }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {transition.fromGrade?.name || 'Без грейда'}
            </Typography>
          </Box>
          
          <Typography variant="h6" sx={{ mx: 1, color: transition.display.statusColor }}>
            →
          </Typography>

          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            bgcolor: transition.toGrade.color + '20',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            ml: 1
          }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {transition.toGrade.name}
            </Typography>
          </Box>
        </Box>

        <Typography variant="body2" sx={{ mb: 1, fontStyle: 'italic' }}>
          {transition.reason}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Выручка: {formatRevenue(transition.revenue)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatDate(transition.createdAt)}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <CircularProgress />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h5">
          Переходы грейдов: {periodName}
        </Typography>
        <Button onClick={onClose} sx={{ minWidth: 'auto', p: 1 }}>
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {data && (
          <>
            {/* Статистика */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={3}>
                <Card sx={{ textAlign: 'center', bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                  <CardContent>
                    <Typography variant="h4">{data.stats.totalTransitions}</Typography>
                    <Typography variant="body2">Всего переходов</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Card sx={{ textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
                  <CardContent>
                    <Typography variant="h4">{data.stats.promotions}</Typography>
                    <Typography variant="body2">⬆️ Повышений</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Card sx={{ textAlign: 'center', bgcolor: 'error.light', color: 'error.contrastText' }}>
                  <CardContent>
                    <Typography variant="h4">{data.stats.demotions}</Typography>
                    <Typography variant="body2">⬇️ Понижений</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Card sx={{ textAlign: 'center', bgcolor: 'info.light', color: 'info.contrastText' }}>
                  <CardContent>
                    <Typography variant="h4">{data.stats.initialAssignments}</Typography>
                    <Typography variant="body2">🎯 Назначений</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Divider sx={{ mb: 2 }} />

            {/* Вкладки с переходами */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab 
                  label={`Все (${data.stats.totalTransitions})`} 
                  icon={<Assessment />} 
                  iconPosition="start" 
                />
                <Tab 
                  label={`Повышения (${data.stats.promotions})`} 
                  icon={<TrendingUp />} 
                  iconPosition="start" 
                />
                <Tab 
                  label={`Понижения (${data.stats.demotions})`} 
                  icon={<TrendingDown />} 
                  iconPosition="start" 
                />
                <Tab 
                  label={`Назначения (${data.stats.initialAssignments})`} 
                  icon={<PersonAdd />} 
                  iconPosition="start" 
                />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Все переходы ({data.transitions.all.length})
              </Typography>
              {data.transitions.all.length > 0 ? (
                data.transitions.all.map(renderTransitionCard)
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  Переходы грейдов не найдены
                </Typography>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Typography variant="h6" sx={{ mb: 2, color: 'success.main' }}>
                ⬆️ Повышения ({data.transitions.promotions.length})
              </Typography>
              {data.transitions.promotions.length > 0 ? (
                data.transitions.promotions.map(renderTransitionCard)
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  Повышений не было
                </Typography>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Typography variant="h6" sx={{ mb: 2, color: 'error.main' }}>
                ⬇️ Понижения ({data.transitions.demotions.length})
              </Typography>
              {data.transitions.demotions.length > 0 ? (
                data.transitions.demotions.map(renderTransitionCard)
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  Понижений не было
                </Typography>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
              <Typography variant="h6" sx={{ mb: 2, color: 'info.main' }}>
                🎯 Начальные назначения ({data.transitions.initialAssignments.length})
              </Typography>
              {data.transitions.initialAssignments.length > 0 ? (
                data.transitions.initialAssignments.map(renderTransitionCard)
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  Начальных назначений не было
                </Typography>
              )}
            </TabPanel>

            {data.stats.averageCompletionPercentage > 0 && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="body2" sx={{ textAlign: 'center' }}>
                  Средний процент выполнения плана: {data.stats.averageCompletionPercentage}%
                </Typography>
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Закрыть
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GradeTransitions;