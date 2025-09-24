import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface GradeTransitionParticipant {
  id: string;
  name: string;
  telegramId: string;
}

export interface GradeInfo {
  id: string;
  name: string;
  plan: number;
  color: string;
  order: number;
}

export interface GradeTransition {
  id: string;
  participant: GradeTransitionParticipant;
  fromGrade: GradeInfo | null;
  toGrade: GradeInfo;
  transitionType: 'PROMOTION' | 'DEMOTION' | 'INITIAL';
  reason: string;
  completionPercentage: number;
  revenue: number;
  createdAt: string;
  display: {
    directionIcon: string;
    statusColor: string;
    summary: string;
  };
}

export interface GradeTransitionsStats {
  totalTransitions: number;
  promotions: number;
  demotions: number;
  initialAssignments: number;
  averageCompletionPercentage: number;
}

export interface PeriodGradeTransitions {
  period: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
  };
  stats: GradeTransitionsStats;
  transitions: {
    promotions: GradeTransition[];
    demotions: GradeTransition[];
    initialAssignments: GradeTransition[];
    all: GradeTransition[];
  };
}

export interface PeriodGradeTransitionsSummary {
  period: {
    id: string;
    name: string;
    status: string;
  };
  summary: {
    totalTransitions: number;
    promotions: number;
    demotions: number;
    initialAssignments: number;
    promotionsList: string[];
    demotionsList: string[];
    initialAssignmentsList: string[];
  };
}

export interface ParticipantTransition extends GradeTransition {
  period: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  };
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

export const gradeTransitionsAPI = {
  // Получить все переходы грейдов для периода
  async getPeriodTransitions(periodId: string): Promise<PeriodGradeTransitions> {
    const response = await axios.get(`${API_URL}/periods/${periodId}/grade-transitions`);
    return response.data;
  },

  // Получить краткую сводку переходов для периода
  async getPeriodTransitionsSummary(periodId: string): Promise<PeriodGradeTransitionsSummary> {
    const response = await axios.get(`${API_URL}/periods/${periodId}/grade-transitions/summary`);
    return response.data;
  },

  // Получить историю переходов для участника
  async getParticipantTransitions(participantId: string): Promise<ParticipantTransition[]> {
    const response = await axios.get(`${API_URL}/grade-transitions/participant/${participantId}`);
    return response.data;
  },

  // Получить всех участников с предупреждениями
  async getParticipantsWithWarnings() {
    const response = await axios.get(`${API_URL}/grade-transitions/warnings`);
    return response.data;
  },
};