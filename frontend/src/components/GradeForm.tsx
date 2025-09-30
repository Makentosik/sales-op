import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  Alert,
  InputAdornment,
  Paper,
  Grid2,
} from '@mui/material';
// Определяем все интерфейсы локально

// Подуровень выполнения для каждого грейда
interface PerformanceLevel {
  completionPercentage: number; // 70, 80, 90, 100, 110, 120
  requiredRevenue: number; // Необходимая выручка для достижения этого %
  bonusPercentage: number; // Процент премии
  bonus: number; // Сумма премии в рублях
  salary: number; // Оклад
  totalSalary: number; // Общая ЗП
}

interface Grade {
  id: string;
  name: string;
  description?: string;
  plan: number;
  minRevenue: number;
  maxRevenue: number;
  performanceLevels: PerformanceLevel[]; // Массив подуровней выполнения
  color: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    participants: number;
  };
  participantPercentage?: number;
}

interface CreateGradeDto {
  name: string;
  description?: string;
  plan: number;
  minRevenue: number;
  maxRevenue: number;
  performanceLevels: PerformanceLevel[];
  color?: string;
  order?: number;
}

interface UpdateGradeDto extends Partial<CreateGradeDto> {
  isActive?: boolean;
}

interface GradeFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateGradeDto | UpdateGradeDto) => Promise<void>;
  grade?: Grade | null;
  loading?: boolean;
}

const GradeForm: React.FC<GradeFormProps> = ({
  open,
  onClose,
  onSubmit,
  grade,
  loading = false,
}) => {
  // Подуровни по умолчанию (как на скриншоте)
  const getDefaultPerformanceLevels = (plan: number): PerformanceLevel[] => [
    { 
      completionPercentage: 70, 
      requiredRevenue: Math.round(plan * 0.70), 
      bonusPercentage: 5.14, 
      bonus: 64800, 
      salary: 15000, 
      totalSalary: 79800 
    },
    { 
      completionPercentage: 80, 
      requiredRevenue: Math.round(plan * 0.80), 
      bonusPercentage: 5.63, 
      bonus: 87000, 
      salary: 21000, 
      totalSalary: 108000 
    },
    { 
      completionPercentage: 90, 
      requiredRevenue: Math.round(plan * 0.90), 
      bonusPercentage: 6.00, 
      bonus: 97200, 
      salary: 27000, 
      totalSalary: 124200 
    },
    { 
      completionPercentage: 100, 
      requiredRevenue: plan, 
      bonusPercentage: 6.00, 
      bonus: 108000, 
      salary: 27000, 
      totalSalary: 135000 
    },
    { 
      completionPercentage: 110, 
      requiredRevenue: Math.round(plan * 1.10), 
      bonusPercentage: 6.27, 
      bonus: 124200, 
      salary: 27000, 
      totalSalary: 151200 
    },
    { 
      completionPercentage: 120, 
      requiredRevenue: Math.round(plan * 1.20), 
      bonusPercentage: 6.50, 
      bonus: 140400, 
      salary: 27000, 
      totalSalary: 167400 
    }
  ];

  const [formData, setFormData] = useState<CreateGradeDto & { isActive?: boolean }>({
    name: '',
    description: '',
    plan: 1260000,
    minRevenue: 1000000,
    maxRevenue: 1400000, // Округлил до ровного числа
    performanceLevels: getDefaultPerformanceLevels(1260000),
    color: '#006657',
    order: 0,
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Обновить конкретный подуровень
  const updatePerformanceLevel = (index: number, field: keyof PerformanceLevel, value: number) => {
    setFormData(prev => {
      const newLevels = [...prev.performanceLevels];
      newLevels[index] = { ...newLevels[index], [field]: value };
      
      // Автоматически пересчитываем totalSalary при изменении bonus или salary
      if (field === 'bonus' || field === 'salary') {
        newLevels[index].totalSalary = newLevels[index].bonus + newLevels[index].salary;
      }
      
      return { ...prev, performanceLevels: newLevels };
    });
  };

  useEffect(() => {
    if (grade) {
      // Проверяем, что подуровни корректны (от 70% до 120%)
      let performanceLevels = grade.performanceLevels || getDefaultPerformanceLevels(grade.plan);
      
      // Если подуровни начинаются не с 70%, исправляем их
      if (performanceLevels.length === 0 || performanceLevels[0].completionPercentage !== 70) {
        performanceLevels = getDefaultPerformanceLevels(grade.plan);
      }
      
      setFormData({
        name: grade.name,
        description: grade.description || '',
        plan: grade.plan,
        minRevenue: grade.minRevenue,
        maxRevenue: grade.maxRevenue,
        performanceLevels,
        color: grade.color,
        order: grade.order,
        isActive: grade.isActive,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        plan: 1260000,
        minRevenue: 1000000,
        maxRevenue: 1400000,
        performanceLevels: getDefaultPerformanceLevels(1260000),
        color: '#006657',
        order: 0,
        isActive: true,
      });
    }
    setErrors({});
  }, [grade, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Название обязательно';
    }
    if (formData.plan <= 0) {
      newErrors.plan = 'План должен быть больше 0';
    }
    if (formData.minRevenue < 0) {
      newErrors.minRevenue = 'Минимальная выручка не может быть отрицательной';
    }
    if (formData.maxRevenue <= 0) {
      newErrors.maxRevenue = 'Максимальная выручка должна быть больше 0';
    }
    if (formData.maxRevenue <= formData.minRevenue) {
      newErrors.maxRevenue = 'Максимальная выручка должна быть больше минимальной';
    }
    
    // Проверяем подуровни выполнения
    if (formData.performanceLevels.length === 0) {
      newErrors.performanceLevels = 'Необходим хотя бы один подуровень выполнения';
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

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('ru-RU').format(num);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {grade ? 'Редактировать грейд' : 'Создать новый грейд'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid2 container spacing={3}>
            <Grid2 size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Название"
                value={formData.name}
                onChange={handleChange('name')}
                error={!!errors.name}
                helperText={errors.name}
                required
              />
            </Grid2>
            <Grid2 size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Описание"
                value={formData.description}
                onChange={handleChange('description')}
                multiline
                rows={2}
              />
            </Grid2>
            
            <Grid2 size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="План"
                type="number"
                value={formData.plan}
                onChange={handleChange('plan')}
                error={!!errors.plan}
                helperText={errors.plan}
                InputProps={{
                  endAdornment: <InputAdornment position="end">₽</InputAdornment>,
                }}
                required
                sx={{ mb: 3 }}
              />
            </Grid2>

            <Grid2 size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h6" color="primary" gutterBottom>
                    📈 Подуровни выполнения
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Настройте премии и оклады для каждого процента выполнения
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      performanceLevels: getDefaultPerformanceLevels(prev.plan)
                    }));
                  }}
                >
                  Сбросить к 70-120%
                </Button>
              </Box>
              
              {formData.performanceLevels.map((level, index) => (
                <Paper 
                  key={index}
                  sx={{ 
                    p: 2, 
                    mb: 2, 
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    🏆 {level.completionPercentage}% выполнения
                  </Typography>
                  
                  <Grid2 container spacing={2}>
                    <Grid2 size=\{\{ xs: {12, md: 2.4}}\}>
                      <TextField
                        fullWidth
                        label="Выручка"
                        type="number"
                        value={level.requiredRevenue}
                        onChange={(e) => updatePerformanceLevel(index, 'requiredRevenue', parseFloat(e.target.value) || 0)}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">₽</InputAdornment>,
                        }}
                        size="small"
                      />
                    </Grid2>
                    
                    <Grid2 size=\{\{ xs: {12, md: 2.4}}\}>
                      <TextField
                        fullWidth
                        label="% Премии"
                        type="number"
                        value={level.bonusPercentage}
                        onChange={(e) => updatePerformanceLevel(index, 'bonusPercentage', parseFloat(e.target.value) || 0)}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        }}
                        inputProps={{ step: 0.01, min: 0, max: 100 }}
                        size="small"
                      />
                    </Grid2>
                    
                    <Grid2 size=\{\{ xs: {12, md: 2.4}}\}>
                      <TextField
                        fullWidth
                        label="Премия"
                        type="number"
                        value={level.bonus}
                        onChange={(e) => updatePerformanceLevel(index, 'bonus', parseFloat(e.target.value) || 0)}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">₽</InputAdornment>,
                        }}
                        size="small"
                      />
                    </Grid2>
                    
                    <Grid2 size=\{\{ xs: {12, md: 2.4}}\}>
                      <TextField
                        fullWidth
                        label="Оклад"
                        type="number"
                        value={level.salary}
                        onChange={(e) => updatePerformanceLevel(index, 'salary', parseFloat(e.target.value) || 0)}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">₽</InputAdornment>,
                        }}
                        size="small"
                      />
                    </Grid2>
                    
                    <Grid2 size=\{\{ xs: {12, md: 2.4}}\}>
                      <TextField
                        fullWidth
                        label="Всего ЗП"
                        type="number"
                        value={level.totalSalary}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">₽</InputAdornment>,
                          readOnly: true,
                        }}
                        disabled
                        size="small"
                        sx={{
                          '& .MuiInputBase-input': {
                            fontWeight: 'bold',
                            color: '#006657',
                          }
                        }}
                      />
                    </Grid2>
                  </Grid2>
                </Paper>
              ))}
              
              {errors.performanceLevels && (
                <Typography color="error" variant="body2">
                  {errors.performanceLevels}
                </Typography>
              )}
            </Grid2>

            <Grid2 size=\{\{ xs: {12}}\}>
              <Typography variant="h6" color="primary" gutterBottom>
                📊 Диапазон выручки
              </Typography>
            </Grid2>

            <Grid2 size=\{\{ xs: {12, md: 6}}\}>
              <TextField
                fullWidth
                label="Минимальная выручка"
                type="number"
                value={formData.minRevenue}
                onChange={handleChange('minRevenue')}
                error={!!errors.minRevenue}
                helperText={errors.minRevenue}
                InputProps={{
                  endAdornment: <InputAdornment position="end">₽</InputAdornment>,
                }}
                required
              />
            </Grid2>

            <Grid2 size=\{\{ xs: {12, md: 6}}\}>
              <TextField
                fullWidth
                label="Максимальная выручка"
                type="number"
                value={formData.maxRevenue}
                onChange={handleChange('maxRevenue')}
                error={!!errors.maxRevenue}
                helperText={errors.maxRevenue}
                InputProps={{
                  endAdornment: <InputAdornment position="end">₽</InputAdornment>,
                }}
                required
              />
            </Grid2>

            <Grid2 size=\{\{ xs: {12}}\}>
              <Typography variant="h6" color="primary" gutterBottom>
                🎨 Настройки отображения
              </Typography>
            </Grid2>

            <Grid2 size=\{\{ xs: {12, md: 4}}\}>
              <TextField
                fullWidth
                label="Цвет"
                type="color"
                value={formData.color}
                onChange={handleChange('color')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid2>

            <Grid2 size=\{\{ xs: {12, md: 4}}\}>
              <TextField
                fullWidth
                label="Порядок"
                type="number"
                value={formData.order}
                onChange={handleChange('order')}
                inputProps={{ min: 0 }}
              />
            </Grid2>

            {grade && (
              <Grid2 size=\{\{ xs: {12, md: 4}}\}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData(prev => ({ ...prev, isActive: e.target.checked }))
                      }
                    />
                  }
                  label="Активный"
                />
              </Grid2>
            )}

            {/* Предварительный просмотр */}
            <Grid2 size=\{\{ xs: {12}}\}>
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
                  <strong>{formData.name}</strong> • 
                  План: {formatNumber(formData.plan)} ₽ • 
                  Диапазон: {formatNumber(formData.minRevenue)} - {formatNumber(formData.maxRevenue)} ₽
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  <strong>Подуровни:</strong> {formData.performanceLevels.map(level => 
                    `${level.completionPercentage}% (${formatNumber(level.totalSalary)} ₽)`
                  ).join(' • ')}
                </Typography>
              </Box>
            </Grid2>
          </Grid2>

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
            {loading ? 'Сохранение...' : (grade ? 'Обновить' : 'Создать')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default GradeForm;




