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

  // 1. ประเภทสิทธิ (Benefit Scope)
  benefitScope?: "IN_ARMY" | "OUTSIDE_ARMY" | "BOTH";

  // 2. ถูกกระทำ (Action Cause / Perpetrator)
  actionCause?: "ENEMY_ACTION" | "NON_ENEMY_ACTION" | "BOTH";

  // 3. ประเภทภารกิจ (Mission Type)
  missionType: string; // e.g. "SOUTHERN_BORDER", "BORDER_DEFENSE", "INTERNAL_SECURITY", "COUNTER_INSURGENCY"

  // 4. ประเภทกำลังพล (Personnel Category / Rank Group)
  personnelCategory?: string; // e.g. "COMMISSIONED_OFFICER", "NON_COMMISSIONED_OFFICER", "VOLUNTEER_RANGER", "CONSCRIPT_SOLDIER"
  personnelType?: string;
  conscriptionBatch?: number | null; // ผลัดที่ 1 หรือ 2 (สำหรับพลทหาร/ทหารกองประจำการ)

  // 5. ประเภทการสูญเสีย (Loss / Casualty Type)
  lossType: string; // e.g. "KIA_COMBAT_DEATH", "TOTAL_PERMANENT_DISABILITY", "SEVERE_WOUND_WIA", "DUTY_DEATH"

  dateOfBirth?: string;
  age?: number;
  maritalStatus?: string;
  religion?: string;
  educationLevel?: string;
  phone?: string;
  profilePhotoUrl?: string;

  abbreviatedPosition: string; // e.g. "ผบ.พัน.ร.1911"
  normalUnit: string; // e.g. "ร.19 พัน.1"
  fieldPosition?: string; // e.g. "ผบ.ฉก.นราธิวาส 30"
  fieldUnit?: string; // e.g. "ฉก.นราธิวาส"
  fieldDutyOrderNo?: string;
  fieldDutyOrderDate?: string;
  fieldDutyOrderIssuer?: string;
  missionCategory?: string;
  salary: number; // เงินเดือนพื้นฐาน
  salaryLevel: string; // e.g. "น.3" (ระดับชั้นเงินเดือน)
  salaryStep: number; // e.g. 21.5
  compensation?: string; // e.g. "พ.ช.ท."
  compensationLevel?: string; // ระดับเงินเยียวยา
  compensationAmount: number; // จำนวนเงินเยียวยา
  additionalPay: number; // e.g. ค่าเสี่ยงภัยสนาม

  // Dates
  appointmentDate: string; // วันบรรจุ
  incidentDate?: string; // วันเกิดเหตุ
  multiplierDate?: string; // วันทวีคูณ

  // Service time breakdown (calculated from appointment/incident dates)
  serviceYearsNormal: number;
  serviceMonthsNormal?: number;
  serviceDaysNormal?: number;
  serviceYearsMultiplier: number;
  serviceMonthsMultiplier?: number;
  serviceDaysMultiplier?: number;
  totalServiceYears: number;
  totalServiceMonths?: number;
  totalServiceDays?: number;

  actionType: string; // e.g. "DIRECT_COMBAT"
  incidentType: string; // e.g. "COMBAT_ENGAGEMENT"

  // Special pension / promotion details
  specialPensionType?: "EMERGENCY_TIME" | "NORMAL_TIME"; // การปูนบำเหน็จพิเศษ: ในเวลาเหตุฉุกเฉิน / ในเวลาเหตุปกติ
  specialPensionTier?: number; // ปูนบำเหน็จพิเศษกี่ชั้น
  rankAppointmentTo?: string; // แต่งตั้ง/เลื่อนชั้นยศ เป็น
  salaryLevelAdjustment?: string; // ปรับระดับ (ชั้นเงิน)
  promotionSteps: number; // e.g. 7 or 8 steps (legacy alias for specialPensionTier)
  promotedRank?: string;
  promotedRankAbbr?: string;
  promotedSalary?: number;

  // Hospitalization / Inpatient Stay
  hospitalAdmissionDate?: string;
  hospitalDischargeDate?: string;
  hospitalStayDays?: number;

  // Family Info
  spouse?: {
    nationalId: string;
    fullName: string;
    dateOfBirth?: string | null;
    age?: number | null;
    phone?: string | null;
    bankName?: string | null;
    bankAccountNumber?: string | null;
    isLegallyMarried: boolean;
    hasPensionRights: boolean;
    allocationPercentage: number;
    isAlive?: boolean;
    marriageCertNumber?: string | null;
  } | null;

  children?: {
    nationalId: string;
    fullName: string;
    dateOfBirth?: string | null;
    age: number;
    isStudying: boolean;
    educationLevel: "PRIMARY" | "SECONDARY" | "VOCATIONAL" | "HIGH_SCHOOL" | "BACHELOR" | "OTHER";
    allocationPercentage: number;
    annualScholarship?: number | null;
    hasSuccessorRight?: boolean;
  }[];

  heirs?: {
    nationalId: string;
    fullName?: string;
    title?: string;
    firstName?: string;
    lastName?: string;
    relationship: string;
    allocationPercentage: number;
    dateOfBirth?: string | Date | null;
    age?: number | null;
    phone?: string | null;
    address?: string | null;
    bankName?: string | null;
    bankAccountNumber?: string | null;
    isDesignatedSuccessor?: boolean;
    documentsVerified?: boolean;
    isAlive?: boolean;
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

  // 5 Dimensions context
  benefitScope?: string;
  actionCause?: string;
  missionType?: string;
  personnelCategory?: string;
  lossType?: string;

  // Hospital Stay Days
  hospitalStayDays?: number;
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
  benefitScope?: "IN_ARMY" | "OUTSIDE_ARMY" | "BOTH";
}

export interface BenefitScopeComparison {
  scope: "IN_ARMY" | "OUTSIDE_ARMY";
  scopeThaiName: string;
  lumpSumTotal: number;
  monthlyPensionTotal: number;
  annualScholarshipTotal: number;
  nonMonetaryCount: number;
  categoryTotals: Record<BenefitCategoryCode, number>;
  items: EvaluatedBenefitItem[];
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
    totalServiceMonths: number;
    totalServiceDays: number;
    serviceYearsNormal: number;
    serviceMonthsNormal: number;
    serviceDaysNormal: number;
    serviceYearsMultiplier: number;
    serviceMonthsMultiplier: number;
    serviceDaysMultiplier: number;
    appointmentDate: string;
    incidentDate?: string;
    multiplierDate?: string;
    specialPensionType?: string;
    specialPensionTier?: number;
    rankAppointmentTo?: string;
    salaryLevelAdjustment?: string;
    compensationLevel?: string;
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
  scopeComparison?: {
    inArmy: BenefitScopeComparison;
    outsideArmy: BenefitScopeComparison;
    recommendedScope: "IN_ARMY" | "OUTSIDE_ARMY" | "BOTH";
    differenceLumpSum: number;
  };
  calculatedAt: string;
}
