import { BenefitCategoryCode } from "../value-objects/military-types";

export type BenefitScopeType = "IN_ARMY" | "OUTSIDE_ARMY" | "BOTH";
export type ActionCauseType = "ENEMY_ACTION" | "NON_ENEMY_ACTION" | "BOTH";

/**
 * Extensible dimension option types used by the RTA Rules Engine.
 * - MISSION_TYPE      : ประเภทภารกิจที่ได้รับสิทธิ (Dimension 3)
 * - PERSONNEL_CATEGORY: ประเภทกำลังพลที่ได้รับสิทธิ (Dimension 4)
 * - LOSS_TYPE         : ประเภทความสูญเสียที่ได้รับสิทธิ (Dimension 5)
 */
export type DimensionType = "MISSION_TYPE" | "PERSONNEL_CATEGORY" | "LOSS_TYPE";

export interface DimensionOption {
  id: string;
  label: string;
  type: DimensionType;
  isSystem?: boolean; // system-defined options cannot be deleted from the master list
}

export interface InsuranceTierConfig {
  scope: BenefitScopeType;
  cause: ActionCauseType;
  lossType: string;
  amount: number;
}

/**
 * Generic configurable benefit tier (ระดับเงินตอบแทนตามเงื่อนไข)
 * Used to define formulas & rules such as เงินบำรุงขวัญ:
 *  - เสียชีวิต / พิการทุพพลภาพ -> 40,000 บาท
 *  - บาดเจ็บพักรักษาตัวไม่เกิน 20 วัน -> 10,000 บาท
 *  - บาดเจ็บพักรักษาตัวเกิน 20 วัน -> รับเพิ่มเติมอีก 10,000 บาท (รวม 20,000 บาท)
 */
export interface FormulaTierConfig {
  id: string;
  label: string;
  /**
   * Loss types this tier applies to.
   * Supports group keywords: "DEATH", "DISABILITY", "INJURY", "ALL"
   * or exact loss-type codes e.g. "KIA_COMBAT_DEATH", "SEVERE_WOUND_WIA".
   * Omit / empty = applies to every case.
   */
  lossTypes?: string[];
  /** Minimum hospital stay days (inclusive) */
  minDays?: number;
  /** Maximum hospital stay days (inclusive) */
  maxDays?: number;
  /** Benefit amount in THB */
  amount: number;
  /** When true, this amount is ADDED on top of the matched base tier(s) instead of replacing them */
  isAdditional?: boolean;
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

  // Configurable Benefit Tiers (สูตร & กฎเกณฑ์ระดับเงินตอบแทน เช่น เงินบำรุงขวัญ)
  formulaTiers?: FormulaTierConfig[];

  isActive: boolean;
  priorityOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
