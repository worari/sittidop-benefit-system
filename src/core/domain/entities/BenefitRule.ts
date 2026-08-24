import { BenefitCategoryCode } from "../value-objects/military-types";

export type BenefitScopeType = "IN_ARMY" | "OUTSIDE_ARMY" | "BOTH";
export type ActionCauseType = "ENEMY_ACTION" | "NON_ENEMY_ACTION" | "BOTH";

export interface InsuranceTierConfig {
  scope: BenefitScopeType;
  cause: ActionCauseType;
  lossType: string;
  amount: number;
}

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

  // 1. ประเภทสิทธิ (Benefit Scope)
  benefitScope?: BenefitScopeType; // "IN_ARMY" (ใน ทบ.) | "OUTSIDE_ARMY" (นอก ทบ.) | "BOTH"

  // 2. ถูกกระทำ (Action Cause / Perpetrator)
  causeType?: ActionCauseType; // "ENEMY_ACTION" (ข้าศึก) | "NON_ENEMY_ACTION" (มิใช่ข้าศึก) | "BOTH"

  formulaType: "EXPRESSION" | "MULTIPLIER_BASED" | "FIXED_AMOUNT" | "NON_MONETARY";
  formulaExpression: string;
  multiplierFactor: number;
  baseAmount: number;
  minAmount?: number;
  maxAmount?: number;

  // 5 Dimensions & Conditions
  conditions: {
    // 3. ประเภทภารกิจ (Mission Types - extensible)
    allowedMissions?: string[]; // e.g. ["SOUTHERN_BORDER", "BORDER_DEFENSE", "INTERNAL_SECURITY", ...]
    
    // 4. ประเภทกำลังพล (Personnel Categories - extensible)
    allowedPersonnelCategories?: string[]; // e.g. ["COMMISSIONED_OFFICER", "NON_COMMISSIONED_OFFICER", "VOLUNTEER_RANGER", "CONSCRIPT_SOLDIER", ...]

    // 5. ประเภทการสูญเสีย (Loss / Casualty Types)
    allowedLossTypes?: string[]; // e.g. ["DEATH", "TOTAL_DISABILITY", "PARTIAL_DISABILITY", "INJURY_SEVERE", "INJURY_MODERATE"]

    allowedRanks?: string[];
    minServiceYears?: number;
    requiresSpouse?: boolean;
    requiresChildren?: boolean;
  };

  // Matrix Configuration for Insurance / Tiered Rates
  insuranceMatrix?: InsuranceTierConfig[];

  isActive: boolean;
  priorityOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
