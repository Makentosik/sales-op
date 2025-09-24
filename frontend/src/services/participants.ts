import api from './api';

export const participantsAPI = {
  getAll: async (includeGrade: boolean = true): Promise<any[]> => {
    const response = await api.get(`/participants?includeGrade=${includeGrade}`);
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
