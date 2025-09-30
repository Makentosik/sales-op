import api from './api';

export const LogType = {
  PAYMENT: 'PAYMENT',
  PARTICIPANT_JOIN: 'PARTICIPANT_JOIN',
  PARTICIPANT_LEAVE: 'PARTICIPANT_LEAVE',
  GRADE_CHANGE: 'GRADE_CHANGE',
  PERIOD_START: 'PERIOD_START',
  PERIOD_END: 'PERIOD_END',
  SYSTEM: 'SYSTEM',
  ERROR: 'ERROR',
} as const;

export type LogType = typeof LogType[keyof typeof LogType];

export interface Log {
  id: string;
  type: LogType;
  message: string;
  details?: any;
  participantId?: string;
  periodId?: string;
  createdAt: string;
  participant?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  period?: {
    id: string;
    name: string;
  };
}

interface GetLogsParams {
  participantId?: string;
  periodId?: string;
  type?: LogType;
  limit?: number;
}

export const logsAPI = {
  getAll: async (params?: GetLogsParams): Promise<Log[]> => {
    const searchParams = new URLSearchParams();
    if (params?.participantId) searchParams.append('participantId', params.participantId);
    if (params?.periodId) searchParams.append('periodId', params.periodId);
    if (params?.type) searchParams.append('type', params.type);
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const query = searchParams.toString();
    const url = query ? `/logs?${query}` : '/logs';
    
    const response = await api.get(url);
    return response.data;
  },

  getRecent: async (limit: number = 20): Promise<Log[]> => {
    const response = await api.get(`/logs/recent?limit=${limit}`);
    return response.data;
  },
};