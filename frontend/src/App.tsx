import { ThemeProvider, CssBaseline } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import theme from './theme/theme';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Grades from './pages/Grades';
import Participants from './pages/Participants';
import Leaderboard from './pages/Leaderboard';
import Periods from './pages/Periods';
import SalaryCalculator from './pages/SalaryCalculator';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/grades" element={<Grades />} />
          <Route path="/participants" element={<Participants />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/periods" element={<Periods />} />
          <Route path="/salary-calculator" element={<SalaryCalculator />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App
