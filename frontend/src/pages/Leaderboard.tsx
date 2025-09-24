import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  AppBar,
  Toolbar,
  Button,
  LinearProgress,
  Chip,
  Avatar,
  Card,
  CardContent,
  Grid,
  Fade,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { participantsAPI } from '../services/participants';
import { gradesAPI } from '../services/grades';

// Локальные интерфейсы
interface Grade {
  id: string;
  name: string;
  color: string;
  minRevenue: number;
  maxRevenue: number;
  plan: number;
}

interface Participant {
  id: string;
  firstName: string;
  lastName?: string;
  revenue: number;
  gradeId?: string;
  grade?: Grade;
}

interface GroupedParticipants {
  grade: Grade;
  participants: Participant[];
}

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: '#ffffff',
  color: theme.palette.text.primary,
  boxShadow: '0 1px 3px rgba(0, 102, 87, 0.08)',
  borderBottom: '1px solid rgba(0, 102, 87, 0.08)',
}));

const GradeCard = styled(Card)<{ gradeColor: string }>(({ theme, gradeColor }) => ({
  marginBottom: theme.spacing(4),
  borderLeft: `5px solid ${gradeColor}`,
  backgroundColor: '#f8f9fa',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
  },
}));

const ParticipantRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2),
  marginBottom: theme.spacing(1.5),
  backgroundColor: '#ffffff',
  borderRadius: theme.spacing(1),
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    transform: 'translateX(4px)',
  },
}));

const ProgressBar = styled(LinearProgress)(({ theme }) => ({
  height: 24,
  borderRadius: 12,
  backgroundColor: 'rgba(0, 0, 0, 0.08)',
  '& .MuiLinearProgress-bar': {
    borderRadius: 12,
    background: 'linear-gradient(90deg, #27ae60 0%, #2ecc71 100%)',
  },
}));

const MoneyEmoji = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '-8px',
  fontSize: '24px',
  animation: 'bounce 2s infinite',
  '@keyframes bounce': {
    '0%, 100%': {
      transform: 'translateY(0)',
    },
    '50%': {
      transform: 'translateY(-10px)',
    },
  },
}));

const Leaderboard: React.FC = () => {
  const navigate = useNavigate();
  const [groupedParticipants, setGroupedParticipants] = useState<GroupedParticipants[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [participants, grades] = await Promise.all([
        participantsAPI.getAll(true),
        gradesAPI.getAll()
      ]);

      // Группируем участников по грейдам
      const grouped = grades.map(grade => ({
        grade,
        participants: participants
          .filter(p => p.gradeId === grade.id)
          .sort((a, b) => b.revenue - a.revenue)
      })).filter(group => group.participants.length > 0);

      setGroupedParticipants(grouped);
      setTotalRevenue(participants.reduce((sum, p) => sum + (p.revenue || 0), 0));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCompletionPercentage = (revenue: number, plan: number) => {
    return Math.round((revenue / plan) * 100);
  };

  const getMoneyEmojis = (percentage: number) => {
    const emojis = [];
    const count = Math.floor(percentage / 20);
    for (let i = 0; i < count; i++) {
      emojis.push(
        <MoneyEmoji key={i} sx={{ left: `${i * 20 + 10}%` }}>
          💰
        </MoneyEmoji>
      );
    }
    return emojis;
  };

  const getMedalEmoji = (position: number) => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${position} место`;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <StyledAppBar position="sticky">
        <Toolbar>
          <TrophyIcon sx={{ mr: 2, color: '#f39c12' }} />
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
            Битва менеджеров — {new Date().toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
          </Typography>
          <Button variant="outlined" onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
            ← Назад к Dashboard
          </Button>
        </Toolbar>
      </StyledAppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Общая статистика */}
        <Fade in timeout={500}>
          <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #006657 0%, #008570 100%)', color: 'white' }}>
            <CardContent>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={8}>
                  <Typography variant="h4" fontWeight={600} gutterBottom>
                    Итог: {formatCurrency(totalRevenue)}
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    Общая выручка всех менеджеров за текущий период
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
                  <TrendingUpIcon sx={{ fontSize: 80, opacity: 0.3 }} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Fade>

        {/* Группы по грейдам */}
        {groupedParticipants.map((group, groupIndex) => (
          <Fade key={group.grade.id} in timeout={500 + groupIndex * 100}>
            <GradeCard gradeColor={group.grade.color}>
              <CardContent>
                <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: group.grade.color, width: 48, height: 48, mr: 2 }}>
                      {group.grade.name[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="h5" fontWeight={600}>
                        Битва {group.grade.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        продаж план {formatCurrency(group.grade.plan)}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip 
                    label={`${group.participants.length} участников`}
                    color="primary"
                    variant="outlined"
                  />
                </Box>

                {/* Участники */}
                {group.participants.map((participant, index) => {
                  const percentage = getCompletionPercentage(participant.revenue, group.grade.plan);
                  
                  return (
                    <ParticipantRow key={participant.id}>
                      <Box sx={{ width: 80, mr: 2 }}>
                        <Typography variant="h6" fontWeight={600} color="text.secondary">
                          {getMedalEmoji(index + 1)}
                        </Typography>
                      </Box>

                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {participant.firstName} {participant.lastName}
                          </Typography>
                          {percentage >= 100 && (
                            <Chip
                              label="✅ План выполнен"
                              color="success"
                              size="small"
                              sx={{
                                fontSize: '12px',
                                fontWeight: 600,
                                animation: 'pulse 2s infinite',
                                '@keyframes pulse': {
                                  '0%': { opacity: 1 },
                                  '50%': { opacity: 0.7 },
                                  '100%': { opacity: 1 },
                                },
                              }}
                            />
                          )}
                        </Box>
                        
                        <Box sx={{ position: 'relative', mt: 1 }}>
                          <ProgressBar 
                            variant="determinate" 
                            value={Math.min(percentage, 100)}
                            sx={{
                              '& .MuiLinearProgress-bar': {
                                background: percentage >= 100 
                                  ? 'linear-gradient(90deg, #27ae60 0%, #2ecc71 100%)'
                                  : 'linear-gradient(90deg, #3498db 0%, #2980b9 100%)',
                              }
                            }}
                          />
                          {getMoneyEmojis(Math.min(percentage, 100))}
                          <Box sx={{ 
                            position: 'absolute', 
                            top: '50%', 
                            left: '50%', 
                            transform: 'translate(-50%, -50%)',
                            color: 'white',
                            fontWeight: 600,
                            textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                          }}>
                            {percentage}%
                          </Box>
                        </Box>
                      </Box>

                      <Box sx={{ ml: 3, textAlign: 'right', minWidth: 150 }}>
                        <Typography variant="h6" fontWeight={600}>
                          {formatCurrency(participant.revenue)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          из {formatCurrency(group.grade.plan)}
                        </Typography>
                      </Box>
                    </ParticipantRow>
                  );
                })}
              </CardContent>
            </GradeCard>
          </Fade>
        ))}

        {groupedParticipants.length === 0 && !loading && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Нет данных для отображения
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Добавьте менеджеров с грейдами для просмотра лидерборда
            </Typography>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default Leaderboard;