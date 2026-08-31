import { BenefitCalculationSummary } from "../value-objects/types";

export interface BenefitEstimateRecord {
  id: string;
  estimateNumber?: string | null;
  citizenId?: string | null;
  citizenName?: string | null;
  citizenNationalId?: string | null;
  province?: string | null;
  nationalId?: string | null;
  calculatedAge: number;
  inputMonthlyIncome: number;
  hasDisability: boolean;
  hasStateWelfareCard: boolean;
  hardshipScore: number;
  totalMonthlyEstimate: number;
  totalAnnualEstimate: number;
  totalOneTimeEstimate: number;
  breakdownJson: string;
  summaryNotes?: string | null;
  createdAt: Date;
}

export interface IEstimateRepository {
  create(summary: BenefitCalculationSummary, citizenId?: string): Promise<BenefitEstimateRecord>;
  findById(id: string): Promise<BenefitEstimateRecord | null>;
  findByNationalId(nationalId: string): Promise<BenefitEstimateRecord[]>;
  findByCitizenId(citizenId: string): Promise<BenefitEstimateRecord[]>;
  findRecent(limit?: number): Promise<BenefitEstimateRecord[]>;
}
