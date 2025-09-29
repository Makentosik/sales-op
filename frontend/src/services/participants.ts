import api from './api';

// Типы для фильтрации
export interface ParticipantFilters {
  search?: string;
  gradeId?: string;
  isActive?: boolean;
  warningStatus?: 'WARNING_90' | 'WARNING_80' | 'NO_WARNING';
  sortBy?: 'name' | 'revenue' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  includeGrade?: boolean;
}

export const participantsAPI = {
  getAll: async (filters: ParticipantFilters = {}): Promise<any[]> => {
    // Создаем query параметры
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    
    // Устанавливаем значения по умолчанию
    if (!filters.includeGrade && filters.includeGrade !== false) {
      params.set('includeGrade', 'true');
    }
    
    const response = await api.get(`/participants?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<any> => {
    const response = await api.get(`/participants/${id}`);
    return response.data;
  },

  create: async (participant: any): Promise<any> => {
    const response = await api.post('/participants', participant);
    return response.data;
  },

  update: async (id: string, participant: any): Promise<any> => {
    const response = await api.patch(`/participants/${id}`, participant);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/participants/${id}`);
  },
};
