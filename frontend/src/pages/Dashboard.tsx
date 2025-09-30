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
  TrendingUp,
  Assessment,
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

// Компонент логотипа (можно легко заменить на изображение)
const Logo: React.FC = () => {
  const logoPath = '/logo.png'; // Путь к логотипу
  const hasLogo = false; // Измените на true, когда добавите логотип
  
  if (hasLogo) {
    return (
      <img 
        src={logoPath} 
        alt="Company Logo" 
        style={{ 
          width: 36, 
          height: 36, 
          borderRadius: '50%',
          objectFit: 'cover'
        }} 
      />
    );
  }
  
  // По умолчанию показываем иконку
  return (
    <Avatar 
      sx={{ 
        width: 36, 
        height: 36, 
        bgcolor: '#006657',
      }}
    >
      <MenuRounded sx={{ fontSize: 20 }} />
    </Avatar>
  );
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [user, setUser] = useState<User | null>(null);

  // Функция для расчета оставшихся дней в месяце
  const getDaysLeftInMonth = () => {
    const today = new Date();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return lastDayOfMonth.getDate() - today.getDate();
  };

  // Функция для форматирования текущего месяца
  const getCurrentMonthYear = () => {
    return new Date().toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  };

  // Навигационные карточки
  const navigationCards = [
    {
      title: 'Менеджеры',
      description: 'Управление участниками',
      icon: <PeopleRounded />,
      color: '#3498db',
      route: '/participants',
      badge: '42 активных'
    },
    {
      title: 'Грейды',
      description: 'Настройка уровней',
      icon: <AssessmentRounded />,
      color: '#27ae60', 
      route: '/grades',
      badge: '6 уровней'
    },
    {
      title: 'Лидерборд',
      description: 'Рейтинг продаж',
      icon: <DashboardRounded />,
      color: '#f39c12',
      route: '/leaderboard',
      badge: '🏆'
    },
    {
      title: 'Периоды',
      description: 'Управление временем',
      icon: <SettingsRounded />,
      color: '#9b59b6',
      route: '/periods',
      badge: getCurrentMonthYear()
    },
    {
      title: 'Расчет ЗП',
      description: 'Калькулятор зарплат',
      icon: <PaymentsRounded />,
      color: '#e74c3c',
      route: '/salary-calculator',
      badge: '₽ 2.45M'
    }
  ];

  useEffect(() => {
    console.log('🚀 Dashboard useEffect started');
    // Проверяем авторизацию - сначала токен, затем данные пользователя
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    console.log('🔍 Dashboard Auth Check:', { 
      hasToken: !!token, 
      hasUser: !!storedUser,
      tokenLength: token?.length,
      userInfo: storedUser ? JSON.parse(storedUser) : null
    });
    
    if (!token) {
      // Если токена нет, перенаправляем на страницу входа
      console.log('🔴 No token found, redirecting to login');
      navigate('/login');
      return;
    }
    
    if (storedUser) {
      // Если есть сохраненные данные пользователя, используем их
      setUser(JSON.parse(storedUser));
    } else {
      // Если токен есть, но данных пользователя нет, создаем базовый объект пользователя
      // В реальном приложении здесь можно сделать запрос к API для получения данных пользователя
      const defaultUser: User = {
        id: 'guest',
        email: 'guest@system.com',
        name: 'Гость',
        role: 'GUEST'
      };
      setUser(defaultUser);
      // Сохраняем базовые данные пользователя для следующих посещений
      localStorage.setItem('user', JSON.stringify(defaultUser));
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


  return (
    <DashboardContainer>
      <StyledAppBar position="sticky">
        <Toolbar>
          {/* Место для логотипа */}
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
            <Box sx={{ mr: 1.5 }}>
              <Logo />
            </Box>
            
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                background: 'linear-gradient(135deg, #006657 0%, #008570 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Payment System
            </Typography>
          </Box>
          
          {/* Пробел для отталкивания правых элементов */}
          <Box sx={{ flexGrow: 1 }} />

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
              <Typography variant="body1" sx={{ mb: 2, opacity: 0.95 }}>
                Сегодня {new Date().toLocaleDateString('ru-RU', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Выберите нужный раздел для работы
              </Typography>
            </WelcomeCard>

            {/* Navigation Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {navigationCards.map((card, index) => (
                <Grid item xs={12} sm={6} md={4} lg={2.4} key={index}>
                  <Fade in timeout={500 + index * 100}>
                    <StatCard 
                      onClick={() => navigate(card.route)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <Box
                          sx={{
                            width: 56,
                            height: 56,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: `${card.color}15`,
                            color: card.color,
                            margin: '0 auto 16px auto',
                            fontSize: '24px'
                          }}
                        >
                          {card.icon}
                        </Box>
                        
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                          {card.title}
                        </Typography>
                        
                        <Typography 
                          color="text.secondary" 
                          variant="body2" 
                          sx={{ mb: 2, minHeight: '32px' }}
                        >
                          {card.description}
                        </Typography>
                        
                        <Chip
                          label={card.badge}
                          size="small"
                          sx={{
                            backgroundColor: `${card.color}20`,
                            color: card.color,
                            fontWeight: 500,
                          }}
                        />
                      </CardContent>
                    </StatCard>
                  </Fade>
                </Grid>
              ))}
            </Grid>

            {/* Quick Summary */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingUp sx={{ mr: 1, color: '#006657' }} />
                    Краткая сводка
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="primary" fontWeight={600}>42</Typography>
                        <Typography variant="caption" color="text.secondary">Активных менеджеров</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="success.main" fontWeight={600}>6</Typography>
                        <Typography variant="caption" color="text.secondary">Грейдов</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="warning.main" fontWeight={600}>15</Typography>
                        <Typography variant="caption" color="text.secondary">Дней в периоде</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="error.main" fontWeight={600}>₽2.45M</Typography>
                        <Typography variant="caption" color="text.secondary">Общая ЗП</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <Assessment sx={{ mr: 1, color: '#006657' }} />
                    Текущий период
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="h5" fontWeight={600} color="primary">
                      {getCurrentMonthYear()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Осталось {getDaysLeftInMonth()} дней
                    </Typography>
                    
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Chip label="Активный" color="success" size="small" />
                      <Chip label="Месячный" variant="outlined" size="small" />
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Fade>
      </MainContent>
    </DashboardContainer>
  );
};

export default Dashboard;