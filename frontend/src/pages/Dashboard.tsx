import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Chip,
  Button,
  Fade,
} from '@mui/material';
import {
  LogoutRounded,
  PersonOutline,
  DashboardRounded,
  PeopleRounded,
  PaymentsRounded,
  AssessmentRounded,
  SettingsRounded,
  NotificationsRounded,
  MenuRounded,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

const DashboardContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  backgroundColor: theme.palette.background.default,
  display: 'flex',
  flexDirection: 'column',
}));

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: '#ffffff',
  color: theme.palette.text.primary,
  boxShadow: '0 1px 3px rgba(0, 102, 87, 0.08)',
  borderBottom: '1px solid rgba(0, 102, 87, 0.08)',
}));

const MainContent = styled(Container)(({ theme }) => ({
  flex: 1,
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
}));

const StatCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  border: '1px solid transparent',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 24px rgba(0, 102, 87, 0.15)',
    borderColor: theme.palette.primary.main,
  },
}));

const WelcomeCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  background: 'linear-gradient(135deg, #006657 0%, #008570 100%)',
  color: 'white',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '-50%',
    right: '-10%',
    width: '60%',
    height: '200%',
    background: 'rgba(255, 255, 255, 0.05)',
    transform: 'rotate(35deg)',
  },
}));

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Получаем данные пользователя из localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      // Если пользователь не авторизован, перенаправляем на страницу входа
      navigate('/login');
    }
  }, [navigate]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Заглушка для статистики
  const stats = [
    {
      title: 'Всего участников',
      value: '156',
      change: '+12%',
      icon: <PeopleRounded />,
      color: '#3498db',
    },
    {
      title: 'Активные платежи',
      value: '₽ 2,450,000',
      change: '+8%',
      icon: <PaymentsRounded />,
      color: '#27ae60',
    },
    {
      title: 'Текущий период',
      value: 'Декабрь 2024',
      change: '15 дней',
      icon: <AssessmentRounded />,
      color: '#9b59b6',
    },
    {
      title: 'Средний грейд',
      value: 'Middle',
      change: '65,000 ₽',
      icon: <DashboardRounded />,
      color: '#e74c3c',
    },
  ];

  return (
    <DashboardContainer>
      <StyledAppBar position="sticky">
        <Toolbar>
          <IconButton edge="start" color="inherit" sx={{ mr: 2 }}>
            <MenuRounded />
          </IconButton>
          
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
            Payment System
          </Typography>

          <IconButton color="inherit" sx={{ mr: 1 }}>
            <NotificationsRounded />
          </IconButton>

          <IconButton color="inherit" sx={{ mr: 1 }}>
            <SettingsRounded />
          </IconButton>

          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

          <Chip
            label={user?.role === 'ADMIN' ? 'Администратор' : 'Пользователь'}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ mr: 2 }}
          />

          <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
            <Avatar sx={{ bgcolor: '#006657' }}>
              {user?.name?.[0] || user?.email[0].toUpperCase()}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                {user?.name || 'Пользователь'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={handleMenuClose}>
              <PersonOutline sx={{ mr: 1.5, fontSize: 20 }} />
              Профиль
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutRounded sx={{ mr: 1.5, fontSize: 20 }} />
              Выйти
            </MenuItem>
          </Menu>
        </Toolbar>
      </StyledAppBar>

      <MainContent>
        <Fade in timeout={500}>
          <Box>
            {/* Welcome Section */}
            <WelcomeCard elevation={0} sx={{ mb: 4 }}>
              <Typography variant="h4" fontWeight={600} gutterBottom>
                Добро пожаловать, {user?.name || 'Пользователь'}! 👋
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, opacity: 0.95 }}>
                Сегодня {new Date().toLocaleDateString('ru-RU', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: 'white',
                    color: '#006657',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    },
                  }}
                  onClick={() => navigate('/grades')}
                >
                  Управление грейдами
                </Button>
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: 'white',
                    color: '#006657',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    },
                  }}
                  onClick={() => navigate('/participants')}
                >
                  Управление менеджерами
                </Button>
                <Button
                  variant="outlined"
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                  onClick={() => navigate('/leaderboard')}
                >
                  Лидерборд 🏆
                </Button>
                <Button
                  variant="outlined"
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                  onClick={() => navigate('/periods')}
                >
                  Периоды 📅
                </Button>
              </Box>
            </WelcomeCard>

            {/* Statistics Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {stats.map((stat, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Fade in timeout={500 + index * 100}>
                    <StatCard>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 2,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: `${stat.color}20`,
                              color: stat.color,
                            }}
                          >
                            {stat.icon}
                          </Box>
                        </Box>
                        <Typography color="text.secondary" variant="body2" gutterBottom>
                          {stat.title}
                        </Typography>
                        <Typography variant="h4" fontWeight={600} sx={{ mb: 1 }}>
                          {stat.value}
                        </Typography>
                        <Chip
                          label={stat.change}
                          size="small"
                          sx={{
                            backgroundColor: '#27ae6020',
                            color: '#27ae60',
                            fontWeight: 500,
                          }}
                        />
                      </CardContent>
                    </StatCard>
                  </Fade>
                </Grid>
              ))}
            </Grid>

            {/* Placeholder for future content */}
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h5" color="text.secondary" gutterBottom>
                Здесь будет основной контент
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Таблицы участников, графики, управление периодами и другие функции
              </Typography>
            </Paper>
          </Box>
        </Fade>
      </MainContent>
    </DashboardContainer>
  );
};

export default Dashboard;