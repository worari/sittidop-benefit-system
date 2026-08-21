export enum BenefitCategoryCode {
  LUMP_SUM_PAYMENT = "LUMP_SUM_PAYMENT",       // 1. รับเงินครั้งเดียว (One-Time Lump Sum)
  MONTHLY_PAYMENT = "MONTHLY_PAYMENT",         // 2. รับเงินรายเดือน (Monthly Recurring)
  ANNUAL_PAYMENT = "ANNUAL_PAYMENT",           // 3. รับเงินรายปี (Annual Grants)
  NON_MONETARY_BENEFIT = "NON_MONETARY_BENEFIT", // 4. สิทธิมิใช่ตัวเงิน (Non-Monetary Rights)
}

export interface MilitaryPersonnelInput {
  militaryId: string;
  citizenId: string;
  rank: string; // e.g. "LIEUTENANT_COLONEL"
  rankAbbr: string; // e.g. "พ.ท."
  firstName: string;
  lastName: string;
  militaryBranch: string; // e.g. "ROYAL_THAI_ARMY"
  abbreviatedPosition: string; // e.g. "ผบ.พัน.ร.1911"
  normalUnit: string; // e.g. "ร.19 พัน.1"
  fieldPosition?: string; // e.g. "ผบ.ฉก.นราธิวาส 30"
  fieldUnit?: string; // e.g. "ฉก.นราธิวาส"
  salary: number; // เงินเดือนพื้นฐาน
  salaryLevel: string; // e.g. "น.3"
  salaryStep: number; // e.g. 21.5
  compensation?: string; // e.g. "พ.ช.ท."
  compensationAmount: number;
  additionalPay: number; // e.g. ค่าเสี่ยงภัยสนาม
  appointmentDate: string;
  multiplierDate?: string;
  serviceYearsNormal: number;
  serviceYearsMultiplier: number;
  totalServiceYears: number;
  missionType: string; // e.g. "COUNTER_INSURGENCY"
  actionType: string; // e.g. "DIRECT_COMBAT"
  incidentType: string; // e.g. "COMBAT_ENGAGEMENT"
  incidentDate?: string;
  lossType: string; // e.g. "KIA_COMBAT_DEATH"
  promotionSteps: number; // e.g. 7 or 8 steps
  promotedRank?: string;
  promotedRankAbbr?: string;
  promotedSalary?: number;

  // Family Info
  spouse?: {
    nationalId: string;
    fullName: string;
    isLegallyMarried: boolean;
    hasPensionRights: boolean;
    allocationPercentage: number;
  } | null;

  children?: {
    nationalId: string;
    fullName: string;
    age: number;
    isStudying: boolean;
    educationLevel: "PRIMARY" | "SECONDARY" | "HIGH_SCHOOL" | "BACHELOR" | "OTHER";
    allocationPercentage: number;
  }[];

  heirs?: {
    nationalId: string;
    fullName: string;
    relationship: "SPOUSE_LEGAL" | "CHILD_LEGITIMATE" | "FATHER" | "MOTHER" | "OTHER_HEIR";
    allocationPercentage: number;
  }[];
}

export interface RuleFormulaContext {
  salary: number;
  promotedSalary: number;
  serviceYears: number;
  serviceYearsMultiplier: number;
  totalServiceYears: number;
  compensationAmount: number;
  additionalPay: number;
  promotionSteps: number;
  childrenCount: number;
  studyingChildrenCount: number;
  multiplierFactor: number;
  baseAmount: number;
}

export interface EvaluatedBenefitItem {
  ruleId: string;
  ruleCode: string;
  ruleName: string;
  category: BenefitCategoryCode;
  categoryName: string;
  isEligible: boolean;
  amount: number;
  paymentType: "ONE_TIME_LUMP_SUM" | "MONTHLY_PENSION" | "ANNUAL_GRANT" | "NON_MONETARY";
  formulaUsed: string;
  legalBasis: string;
  eligibilityNotes: string[];
}

export interface CategorySummaryResult {
  category: BenefitCategoryCode;
  categoryName: string;
  categoryThaiName: string;
  description: string;
  totalAmount: number;
  itemCount: number;
  items: EvaluatedBenefitItem[];
}

export interface MilitaryBenefitCalculationResult {
  personnelSummary: {
    militaryId: string;
    fullName: string;
    rankWithAbbr: string;
    promotedRankWithAbbr: string;
    lossTypeDescription: string;
    normalUnit: string;
    fieldUnit: string;
    baseSalary: number;
    promotedSalary: number;
    totalServiceYears: number;
  };
  grandTotalLumpSum: number;
  grandTotalMonthlyPension: number;
  grandTotalAnnualScholarship: number;
  nonMonetaryRightsCount: number;
  categories: Record<BenefitCategoryCode, CategorySummaryResult>;
  heirDistribution: {
    heirName: string;
    relationship: string;
    sharePercentage: number;
    allocatedLumpSum: number;
    allocatedMonthlyPension: number;
  }[];
  successorJobRight: {
    isEligible: boolean;
    candidateName?: string;
    conditionText: string;
  };
  calculatedAt: string;
}
