import { BenefitCategoryCode } from "../value-objects/military-types";

export interface BenefitRuleDefinition {
  id: string;
  ruleCode: string;
  ruleName: string;
  category: BenefitCategoryCode;
  categoryName: string;
  categoryThaiName: string;
  description: string;
  legalBasis: string;
  paymentType: "ONE_TIME_LUMP_SUM" | "MONTHLY_PENSION" | "ANNUAL_GRANT" | "NON_MONETARY";

  formulaType: "EXPRESSION" | "MULTIPLIER_BASED" | "FIXED_AMOUNT" | "NON_MONETARY";
  formulaExpression: string;
  multiplierFactor: number;
  baseAmount: number;
  minAmount?: number;
  maxAmount?: number;

  conditions: {
    allowedLossTypes?: string[];
    allowedMissions?: string[];
    allowedRanks?: string[];
    minServiceYears?: number;
    requiresSpouse?: boolean;
    requiresChildren?: boolean;
  };

  isActive: boolean;
  priorityOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
