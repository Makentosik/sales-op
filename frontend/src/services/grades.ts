import api from './api';

export const gradesAPI = {
  getAll: async (): Promise<any[]> => {
    const response = await api.get('/grades');
    return response.data;
  },

  getById: async (id: string): Promise<any> => {
    const response = await api.get(`/grades/${id}`);
    return response.data;
  },

  create: async (grade: any): Promise<any> => {
    const response = await api.post('/grades', grade);
    return response.data;
  },

  update: async (id: string, grade: any): Promise<any> => {
    const response = await api.patch(`/grades/${id}`, grade);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/grades/${id}`);
  },

  getStats: async (): Promise<any[]> => {
    const response = await api.get('/grades/stats');
    return response.data;
  },

  getByRevenue: async (revenue: number): Promise<any | null> => {
    const response = await api.get(`/grades/by-revenue?revenue=${revenue}`);
    return response.data;
  },
};
