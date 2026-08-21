import { BenefitCategory, PaymentFrequency, VulnerabilityLevel, ApplicationStatus, ApprovalDecision, Role } from "./enums";

export interface EstimateInput {
  nationalId?: string;
  birthDate?: string;
  age: number;
  monthlyIncome: number;
  hasDisability: boolean;
  disabilityType?: string;
  hasStateWelfareCard: boolean;
  livingCondition?: "ALONE" | "FAMILY" | "BEDRIDDEN" | "NURSING_HOME";
  hardshipFactors?: {
    noCaregiver?: boolean;
    inadequateHousing?: boolean;
    chronicIllness?: boolean;
    unemployed?: boolean;
    debtBurden?: boolean;
  };
  province?: string;
}

export interface BenefitEligibilityResult {
  programId: string;
  programCode: string;
  programName: string;
  category: BenefitCategory;
  isEligible: boolean;
  estimatedAmount: number;
  frequency: PaymentFrequency;
  monthlyAmountEquivalent: number;
  annualAmountEquivalent: number;
  eligibilityReasons: string[];
  ineligibilityReasons: string[];
  legalBasis?: string;
  requiredDocuments: string[];
  priorityLevel: "HIGH" | "MEDIUM" | "STANDARD";
}

export interface BenefitCalculationSummary {
  input: EstimateInput;
  calculatedAt: string;
  totalMonthlyEstimate: number;
  totalAnnualEstimate: number;
  totalOneTimeEstimate: number;
  vulnerabilityScore: number;
  vulnerabilityLevel: VulnerabilityLevel;
  eligibleProgramsCount: number;
  eligiblePrograms: BenefitEligibilityResult[];
  ineligiblePrograms: BenefitEligibilityResult[];
  summaryRecommendations: string[];
}

export interface DashboardMetrics {
  totalEstimatedFunds: number;
  totalBeneficiariesCount: number;
  activeClaimsCount: number;
  approvedClaimsCount: number;
  totalDisbursedAmount: number;
  approvalRatePercent: number;
  averageProcessingDays: number;
  claimsByStatus: Record<ApplicationStatus, number>;
  beneficiariesByAgeCohort: {
    cohort: string;
    count: number;
    amount: number;
  }[];
  disbursementsByCategory: {
    category: BenefitCategory;
    categoryLabel: string;
    totalAmount: number;
    beneficiaryCount: number;
  }[];
  monthlyTrends: {
    month: string;
    estimatedAmount: number;
    disbursedAmount: number;
    newApplications: number;
  }[];
  topProvinces: {
    province: string;
    beneficiaries: number;
    disbursedAmount: number;
  }[];
}
