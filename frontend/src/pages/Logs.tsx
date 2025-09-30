import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  AppBar,
  Toolbar,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Fade,
} from '@mui/material';
import {
  History as HistoryIcon,
  Person as PersonIcon,
  Payment as PaymentIcon,
  TrendingUp as GradeChangeIcon,
  DateRange as PeriodIcon,
  Settings as SystemIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { logsAPI, Log, LogType } from '../services/logs';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: '#ffffff',
  color: theme.palette.text.primary,
  boxShadow: '0 1px 3px rgba(0, 102, 87, 0.08)',
  borderBottom: '1px solid rgba(0, 102, 87, 0.08)',
}));

const LogItem = styled(ListItem)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  borderRadius: theme.spacing(1),
  border: '1px solid',
  borderColor: theme.palette.divider,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const getLogTypeIcon = (type: LogType) => {
  switch (type) {
    case LogType.PAYMENT:
      return <PaymentIcon />;
    case LogType.PARTICIPANT_JOIN:
    case LogType.PARTICIPANT_LEAVE:
      return <PersonIcon />;
    case LogType.GRADE_CHANGE:
      return <GradeChangeIcon />;
    case LogType.PERIOD_START:
    case LogType.PERIOD_END:
      return <PeriodIcon />;
    case LogType.ERROR:
      return <ErrorIcon />;
    case LogType.SYSTEM:
    default:
      return <SystemIcon />;
  }
};

const getLogTypeColor = (type: LogType) => {
  switch (type) {
    case LogType.PAYMENT:
      return 'success';
    case LogType.PARTICIPANT_JOIN:
      return 'info';
    case LogType.PARTICIPANT_LEAVE:
      return 'warning';
    case LogType.GRADE_CHANGE:
      return 'primary';
    case LogType.PERIOD_START:
    case LogType.PERIOD_END:
      return 'secondary';
    case LogType.ERROR:
      return 'error';
    case LogType.SYSTEM:
    default:
      return 'default';
  }
};

const getLogTypeLabel = (type: LogType) => {
  switch (type) {
    case LogType.PAYMENT:
      return 'Платеж';
    case LogType.PARTICIPANT_JOIN:
      return 'Присоединение';
    case LogType.PARTICIPANT_LEAVE:
      return 'Уход участника';
    case LogType.GRADE_CHANGE:
      return 'Изменение грейда';
    case LogType.PERIOD_START:
      return 'Начало периода';
    case LogType.PERIOD_END:
      return 'Конец периода';
    case LogType.ERROR:
      return 'Ошибка';
    case LogType.SYSTEM:
    default:
      return 'Система';
  }
};

const Logs: React.FC = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<LogType | ''>('');
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    loadLogs();
  }, [typeFilter, limit]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await logsAPI.getAll({
        type: typeFilter || undefined,
        limit,
      });
      setLogs(data);
    } catch (err: any) {
      console.error('Error loading logs:', err);
      setError('Ошибка при загрузке логов');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <StyledAppBar position="sticky">
        <Toolbar>
          <HistoryIcon sx={{ mr: 2, color: '#006657' }} />
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
            Системные логи
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
            startIcon={<RefreshIcon />}
            onClick={loadLogs}
            disabled={loading}
          >
            Обновить
          </Button>
        </Toolbar>
      </StyledAppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Фильтры */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Тип лога</InputLabel>
                  <Select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as LogType | '')}
                    label="Тип лога"
                  >
                    <MenuItem value="">Все типы</MenuItem>
                    {Object.values(LogType).map((type) => (
                      <MenuItem key={type} value={type}>
                        {getLogTypeLabel(type)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Количество записей"
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  inputProps={{ min: 10, max: 500 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">
                  Всего записей: {logs.length}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Ошибки */}
        {error && (
          <Fade in>
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          </Fade>
        )}

        {/* Индикатор загрузки */}
        {loading && <LinearProgress sx={{ mb: 3 }} />}

        {/* Список логов */}
        <Paper elevation={0}>
          {logs.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <HistoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Логи не найдены
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Попробуйте изменить фильтры или обновить данные
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 2 }}>
              {logs.map((log) => (
                <LogItem key={log.id}>
                  <ListItemIcon>
                    {getLogTypeIcon(log.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Chip
                          label={getLogTypeLabel(log.type)}
                          size="small"
                          color={getLogTypeColor(log.type) as any}
                          variant="outlined"
                        />
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(log.createdAt)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          {log.message}
                        </Typography>
                        {log.participant && (
                          <Typography variant="body2" color="text.secondary">
                            👤 {log.participant.firstName} {log.participant.lastName}
                          </Typography>
                        )}
                        {log.period && (
                          <Typography variant="body2" color="text.secondary">
                            📅 Период: {log.period.name}
                          </Typography>
                        )}
                        {log.details && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            🔍 Детали: {JSON.stringify(log.details)}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </LogItem>
              ))}
            </List>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default Logs;