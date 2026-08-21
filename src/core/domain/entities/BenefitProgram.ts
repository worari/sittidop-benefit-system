import { BenefitCategory, PaymentFrequency } from "../value-objects/enums";

export interface BenefitRuleEntity {
  id: string;
  programId: string;
  ruleName: string;
  minAge?: number | null;
  maxAge?: number | null;
  maxIncome?: number | null;
  requiresDisability: boolean;
  requiresStateWelfareCard: boolean;
  requiresHardship: boolean;
  baseAmount: number;
  formulaType: "FIXED" | "AGE_TIERED" | "INCOME_SCALED" | "CUSTOM";
  conditionsJson?: string | null;
  isActive: boolean;
}

export interface BenefitProgramEntity {
  id: string;
  code: string;
  name: string;
  thaiName: string;
  description: string;
  category: BenefitCategory;
  targetGroup: string;
  budgetTotal: number;
  budgetDisbursed: number;
  maxAmount: number;
  paymentFrequency: PaymentFrequency;
  legalBasis?: string | null;
  isActive: boolean;
  rules?: BenefitRuleEntity[];
  createdAt: Date;
  updatedAt: Date;
}
