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
  Box,
  Typography,
  Alert,
  Chip,
} from '@mui/material';
import { CreatePeriodDto, UpdatePeriodDto, Period, periodsAPI } from '../services/periods';

interface PeriodFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePeriodDto | UpdatePeriodDto) => Promise<void>;
  period?: Period | null;
  loading?: boolean;
}

const PeriodForm: React.FC<PeriodFormProps> = ({
  open,
  onClose,
  onSubmit,
  period,
  loading = false,
}) => {
  const [formData, setFormData] = useState<CreatePeriodDto>({
    name: '',
    startDate: '',
    endDate: '',
    type: 'MONTHLY',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autoGenerateName, setAutoGenerateName] = useState(true);

  useEffect(() => {
    if (period) {
      setFormData({
        name: period.name,
        startDate: period.startDate.split('T')[0], // Extract date part
        endDate: period.endDate.split('T')[0],
        type: period.type,
      });
      setAutoGenerateName(false);
    } else {
      // Reset form for new period
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      setFormData({
        name: '',
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        type: 'MONTHLY',
      });
      setAutoGenerateName(true);
    }
    setErrors({});
  }, [period, open]);

  // Auto-generate period name when type or startDate changes
  useEffect(() => {
    if (autoGenerateName && formData.startDate && formData.type) {
      generatePeriodName();
    }
  }, [formData.type, formData.startDate, autoGenerateName]);

  const generatePeriodName = async () => {
    if (!formData.startDate || !formData.type) return;
    
    try {
      const result = await periodsAPI.generateName(formData.type, formData.startDate);
      setFormData(prev => ({ ...prev, name: result.name }));
    } catch (error) {
      console.error('Error generating period name:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Название обязательно';
    }
    if (!formData.startDate) {
      newErrors.startDate = 'Дата начала обязательна';
    }
    if (!formData.endDate) {
      newErrors.endDate = 'Дата окончания обязательна';
    }
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        newErrors.endDate = 'Дата окончания должна быть позже даты начала';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleChange = (field: keyof CreatePeriodDto) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: unknown } }
  ) => {
    const value = e.target.value as string;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'name') {
      setAutoGenerateName(false);
    }
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
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

  const formatDuration = () => {
    if (!formData.startDate || !formData.endDate) return '';
    
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    return `${diffDays} ${diffDays === 1 ? 'день' : diffDays < 5 ? 'дня' : 'дней'}`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {period ? 'Редактировать период' : 'Создать новый период'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Тип периода</InputLabel>
                <Select
                  value={formData.type}
                  label="Тип периода"
                  onChange={handleChange('type')}
                  disabled={!!period} // Disable editing type for existing periods
                >
                  <MenuItem value="MONTHLY">📅 Месячный период</MenuItem>
                  <MenuItem value="TEN_DAYS">⚡ 10-дневный период</MenuItem>
                  <MenuItem value="CUSTOM">🔧 Пользовательский период</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Дата начала"
                type="date"
                value={formData.startDate}
                onChange={handleChange('startDate')}
                error={!!errors.startDate}
                helperText={errors.startDate}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Дата окончания"
                type="date"
                value={formData.endDate}
                onChange={handleChange('endDate')}
                error={!!errors.endDate}
                helperText={errors.endDate}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Название периода"
                value={formData.name}
                onChange={handleChange('name')}
                error={!!errors.name}
                helperText={errors.name || (autoGenerateName ? 'Название генерируется автоматически' : '')}
                required
                InputProps={{
                  endAdornment: autoGenerateName && (
                    <Chip label="Авто" size="small" color="primary" />
                  ),
                }}
              />
            </Grid>

            {/* Предварительный просмотр */}
            <Grid item xs={12}>
              <Box
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                }}
              >
                <Typography variant="subtitle1" gutterBottom>
                  📋 Предварительный просмотр
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Название:</strong> {formData.name || 'Не задано'} • {' '}
                  <strong>Тип:</strong> {getTypeLabel(formData.type)} • {' '}
                  <strong>Длительность:</strong> {formatDuration()}
                </Typography>
                {formData.startDate && formData.endDate && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    <strong>Период:</strong> {' '}
                    {new Date(formData.startDate).toLocaleDateString('ru-RU')} - {' '}
                    {new Date(formData.endDate).toLocaleDateString('ru-RU')}
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>

          {Object.keys(errors).length > 0 && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Пожалуйста, исправьте ошибки в форме
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Отмена
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
          >
            {loading ? 'Сохранение...' : (period ? 'Обновить' : 'Создать')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PeriodForm;