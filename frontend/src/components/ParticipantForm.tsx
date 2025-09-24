import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Divider,
  Typography,
  FormControlLabel,
  Switch
} from '@mui/material';
import { participantsAPI } from '../services/participants';
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
  userId?: string;
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
  // Warning system fields  
  warningStatus?: 'WARNING_90' | 'WARNING_80' | null;
  warningPeriodsLeft?: number;
  lastCompletionPercentage?: number;
}

interface ParticipantFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateParticipantDto | UpdateParticipantDto) => Promise<void>;
  participant?: Participant | null;
  loading?: boolean;
}

const ParticipantForm: React.FC<ParticipantFormProps> = ({
  open,
  onClose,
  onSubmit,
  participant,
  loading = false,
}) => {
  const [formData, setFormData] = useState<CreateParticipantDto & { warningStatus?: 'WARNING_90' | 'WARNING_80' | null; warningPeriodsLeft?: number; lastCompletionPercentage?: number; }>({
    telegramId: '',
    firstName: '',
    lastName: '',
    username: '',
    phoneNumber: '',
    revenue: 0,
    gradeId: '',
    warningStatus: null,
    warningPeriodsLeft: 0,
    lastCompletionPercentage: 0,
  });
  const [grades, setGrades] = useState<Grade[]>([]);

  useEffect(() => {
    if (open) {
      gradesAPI.getAll().then(setGrades).catch(console.error);
    }
  }, [open]);

  useEffect(() => {
    if (participant) {
      setFormData({
        telegramId: participant.telegramId,
        firstName: participant.firstName,
        lastName: participant.lastName || '',
        username: participant.username || '',
        phoneNumber: participant.phoneNumber || '',
        revenue: participant.revenue || 0,
        gradeId: participant.gradeId || '',
        warningStatus: participant.warningStatus || null,
        warningPeriodsLeft: participant.warningPeriodsLeft || 0,
        lastCompletionPercentage: participant.lastCompletionPercentage || 0,
      });
    } else {
      setFormData({
        telegramId: '',
        firstName: '',
        lastName: '',
        username: '',
        phoneNumber: '',
        revenue: 0,
        gradeId: '',
        warningStatus: null,
        warningPeriodsLeft: 0,
        lastCompletionPercentage: 0,
      });
    }
  }, [participant, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name as string]: value as string }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{participant ? 'Редактировать менеджера' : 'Добавить менеджера'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Имя"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Фамилия"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Выручка"
                name="revenue"
                type="number"
                value={Math.round(formData.revenue || 0)}
                onChange={(e) => setFormData(prev => ({ ...prev, revenue: Number(e.target.value) }))}
                InputProps={{
                  startAdornment: '₽',
                }}
                inputProps={{ step: 1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="grade-select-label">Грейд</InputLabel>
                <Select
                  labelId="grade-select-label"
                  name="gradeId"
                  value={formData.gradeId}
                  onChange={handleChange}
                  label="Грейд"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      <Chip 
                        key={selected}
                        label={grades.find(g => g.id === selected)?.name}
                        style={{ backgroundColor: grades.find(g => g.id === selected)?.color, color: 'white' }}
                      />
                    </Box>
                  )}
                >
                  {grades.map((grade) => (
                    <MenuItem key={grade.id} value={grade.id}>
                      {grade.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telegram ID"
                name="telegramId"
                value={formData.telegramId}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Username (Telegram)"
                name="username"
                value={formData.username}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Номер телефона"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </Grid>
            
            {participant && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom color="primary">
                    🚨 Управление предупреждениями
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Система предупреждений о последующем понижении грейда
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="warning-status-label">Статус предупреждения</InputLabel>
                    <Select
                      labelId="warning-status-label"
                      name="warningStatus"
                      value={formData.warningStatus || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, warningStatus: e.target.value === '' ? null : e.target.value as any }))}
                      label="Статус предупреждения"
                    >
                      <MenuItem value="">Нет предупреждений</MenuItem>
                      <MenuItem value="WARNING_90">⚠️ Предупреждение 90%</MenuItem>
                      <MenuItem value="WARNING_80">🚨 Критическое предупреждение 80%</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Периодов осталось"
                    name="warningPeriodsLeft"
                    type="number"
                    value={formData.warningPeriodsLeft || 0}
                    onChange={(e) => setFormData(prev => ({ ...prev, warningPeriodsLeft: Number(e.target.value) }))}
                    disabled={!formData.warningStatus}
                    helperText="Количество периодов до понижения"
                    inputProps={{ min: 0, max: 10 }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Процент выполнения плана (последний период)"
                    name="lastCompletionPercentage"
                    type="number"
                    value={Math.round((formData.lastCompletionPercentage || 0) * 10) / 10}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastCompletionPercentage: Number(e.target.value) }))}
                    helperText="Последний результат выполнения плана"
                    InputProps={{
                      endAdornment: '%',
                    }}
                    inputProps={{ min: 0, max: 1000, step: 0.1 }}
                  />
                </Grid>
              </>
            )}
            
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>Отмена</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Сохранение...' : (participant ? 'Обновить' : 'Создать')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ParticipantForm;