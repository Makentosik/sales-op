import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Period {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  type: 'MONTHLY' | 'TEN_DAYS' | 'CUSTOM';
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  participantSnapshots?: ParticipantSnapshot[] | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    payments: number;
    logs: number;
  };
}

export interface ParticipantSnapshot {
  id: string;
  firstName: string;
  lastName: string | null;
  revenue: number;
  grade: {
    id: string;
    name: string;
    plan: number;
  } | null;
  completionPercentage: number;
  snapshotAt: string;
}

export interface CreatePeriodDto {
  name: string;
  startDate: string;
  endDate: string;
  type: 'MONTHLY' | 'TEN_DAYS' | 'CUSTOM';
}

export interface UpdatePeriodDto {
  name?: string;
  startDate?: string;
  endDate?: string;
  type?: 'MONTHLY' | 'TEN_DAYS' | 'CUSTOM';
  status?: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}

export interface CompletePeriodDto {
  saveSnapshot?: boolean;
}

export interface PeriodStats {
  totalParticipants: number;
  totalRevenue: number;
  completedPlans: number;
  completionRate: number;
}

// Настройка axios interceptors для автоматического добавления токена
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const periodsAPI = {
  // Получить все периоды
  async getAll(): Promise<Period[]> {
    const response = await axios.get(`${API_URL}/periods`);
    return response.data;
  },

  // Получить текущий активный период
  async getCurrent(): Promise<Period | null> {
    const response = await axios.get(`${API_URL}/periods/current`);
    return response.data;
  },

  // Получить период по ID
  async getOne(id: string): Promise<Period> {
    const response = await axios.get(`${API_URL}/periods/${id}`);
    return response.data;
  },

  // Получить статистику периода
  async getStats(id: string): Promise<PeriodStats> {
    const response = await axios.get(`${API_URL}/periods/${id}/stats`);
    return response.data;
  },

  // Создать новый период
  async create(data: CreatePeriodDto): Promise<Period> {
    const response = await axios.post(`${API_URL}/periods`, data);
    return response.data;
  },

  // Обновить период
  async update(id: string, data: UpdatePeriodDto): Promise<Period> {
    const response = await axios.patch(`${API_URL}/periods/${id}`, data);
    return response.data;
  },

  // Активировать период
  async activate(id: string): Promise<Period> {
    const response = await axios.post(`${API_URL}/periods/${id}/activate`);
    return response.data;
  },

  // Завершить период
  async complete(id: string, data: CompletePeriodDto = {}): Promise<Period> {
    const response = await axios.post(`${API_URL}/periods/${id}/complete`, data);
    return response.data;
  },

  // Отменить период
  async cancel(id: string): Promise<Period> {
    const response = await axios.post(`${API_URL}/periods/${id}/cancel`);
    return response.data;
  },

  // Удалить период
  async delete(id: string): Promise<void> {
    await axios.delete(`${API_URL}/periods/${id}`);
  },

  // Сгенерировать название периода
  async generateName(type: string, startDate: string): Promise<{ name: string }> {
    const response = await axios.post(`${API_URL}/periods/generate-name`, {
      type,
      startDate,
    });
    return response.data;
  },
};