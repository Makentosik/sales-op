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