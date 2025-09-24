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
  Box
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
  const [formData, setFormData] = useState<CreateParticipantDto>({
    telegramId: '',
    firstName: '',
    lastName: '',
    username: '',
    phoneNumber: '',
    revenue: 0,
    gradeId: '',
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
                value={formData.revenue}
                onChange={(e) => setFormData(prev => ({ ...prev, revenue: Number(e.target.value) }))}
                InputProps={{
                  startAdornment: '₽',
                }}
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