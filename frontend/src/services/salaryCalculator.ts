import api from './api';

export interface GradePerformanceLevel {
  minPercentage: number;
  maxPercentage: number;
  commissionRate: number;
  fixedSalary: number;
  bonusAmount?: number;
  description?: string;
}

export interface ParticipantSalaryCalculation {
  participantId: string;
  participantName: string;
  currentGrade: string;
  currentGradeId: string;
  currentGradeColor?: string;
  revenue: number;
  planCompletion: number;
  commissionRate: number;
  commission: number;
  fixedSalary: number;
  fixedSalaryGrade: string;
  bonus: number;
  totalSalary: number;
  performanceLevel: string;
}

export interface SalaryCalculationResponse {
  calculations: ParticipantSalaryCalculation[];
  summary: {
    totalCommission: number;
    totalFixedSalary: number;
    totalBonus: number;
    totalSalary: number;
    periodName: string;
    periodId: string;
  };
}

export interface ParticipantSalaryDetailsResponse {
  participant: any;
  currentCalculation: ParticipantSalaryCalculation;
  performanceLevels: GradePerformanceLevel[];
}

export const salaryCalculatorAPI = {
  /**
   * Получить расчет зарплат для всех участников
   */
  calculate: async (periodId?: string): Promise<SalaryCalculationResponse> => {
    const params = periodId ? `?periodId=${periodId}` : '';
    const response = await api.get(`/salary-calculator/calculate${params}`);
    return response.data;
  },

  /**
   * Получить детальный расчет для конкретного участника
   */
  getParticipantDetails: async (participantId: string): Promise<ParticipantSalaryDetailsResponse> => {
    const response = await api.get(`/salary-calculator/participant/${participantId}`);
    return response.data;
  },
};