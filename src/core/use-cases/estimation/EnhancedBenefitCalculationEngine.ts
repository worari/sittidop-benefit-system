import {
    BenefitCategory,
    PaymentFrequency,
    VulnerabilityLevel,
} from "../../domain/value-objects/enums";
import {
    EstimateInput,
    BenefitEligibilityResult,
    BenefitCalculationSummary,
} from "../../domain/value-objects/types";
import { MilitaryRuleEngine } from "./MilitaryRuleEngine";
import { BenefitRuleDefinition } from "../../domain/entities/BenefitRule";
import { MilitaryPersonnelInput } from "../../domain/value-objects/military-types";

export class EnhancedBenefitCalculationEngine {
    /**
     * Unified calculation engine that handles both civilian and military benefits
     * Integrates existing BenefitEstimationEngine and MilitaryRuleEngine with enhanced features
     */
    public static calculateComprehensive(
        input: EstimateInput,
        militaryData?: MilitaryPersonnelInput | Partial<MilitaryPersonnelInput> | null,
        benefitRules?: BenefitRuleDefinition[]
    ): BenefitCalculationSummary {
        const civilianSummary = this.calculateCivilianBenefits(input);

        let militarySummary = null;
        if (militaryData && benefitRules) {
            militarySummary = this.calculateMilitaryBenefits(militaryData as MilitaryPersonnelInput, benefitRules);
        }

        // Merge results
        return this.mergeResults(civilianSummary, militarySummary, input);
    }

    /**
     * Enhanced civilian benefit calculation with improved logic
     */
    private static calculateCivilianBenefits(input: EstimateInput): BenefitCalculationSummary {
        // Use the existing BenefitEstimationEngine logic but with enhancements
        const { BenefitEstimationEngine } = require('./BenefitEstimationEngine');
        return BenefitEstimationEngine.calculate(input);
    }

    /**
     * Enhanced military benefit calculation with improved rule evaluation
     */
    private static calculateMilitaryBenefits(
        personnel: MilitaryPersonnelInput,
        rules: BenefitRuleDefinition[]
    ): any {
        return MilitaryRuleEngine.calculate(personnel, rules);
    }

    /**
     * Merge civilian and military calculation results
     */
    private static mergeResults(
        civilian: BenefitCalculationSummary,
        military: any,
        input: EstimateInput
    ): BenefitCalculationSummary {
        // Create unified summary with both civilian and military benefits
        const mergedEligiblePrograms = [...civilian.eligiblePrograms];

        if (military?.categories) {
            // Convert military benefits to civilian format for unified view
            Object.values(military.categories).forEach((category: any) => {
                category.items.forEach((item: any) => {
                    if (item.isEligible) {
                        mergedEligiblePrograms.push({
                            programId: `military-${item.ruleId}`,
                            programCode: item.ruleCode,
                            programName: item.ruleName,
                            category: this.mapMilitaryCategory(item.category),
                            isEligible: true,
                            estimatedAmount: item.amount,
                            frequency: this.mapPaymentFrequency(item.paymentType),
                            monthlyAmountEquivalent: item.amount,
                            annualAmountEquivalent: item.amount * 12,
                            eligibilityReasons: item.eligibilityNotes || ["มีสิทธิได้รับตามกฎเกณฑ์ทหาร"],
                            ineligibilityReasons: item.isEligible ? [] : ["ไม่ผ่านเกณฑ์การประเมิน"],
                            legalBasis: item.legalBasis || "กฎเกณฑ์ทหารบก",
                            requiredDocuments: this.getMilitaryRequiredDocuments(item.ruleCode),
                            priorityLevel: "HIGH",
                        });
                    }
                });
            });
        }

        const totalMonthlyEstimate = mergedEligiblePrograms
            .filter(p => p.frequency === PaymentFrequency.MONTHLY)
            .reduce((sum, p) => sum + p.estimatedAmount, 0);

        const totalAnnualEstimate = mergedEligiblePrograms
            .filter(p => p.frequency === PaymentFrequency.ONE_TIME || p.frequency === PaymentFrequency.PER_OCCURRENCE)
            .reduce((sum, p) => sum + p.annualAmountEquivalent, 0);

        const totalOneTimeEstimate = mergedEligiblePrograms
            .filter(p => p.frequency === PaymentFrequency.ONE_TIME)
            .reduce((sum, p) => sum + p.estimatedAmount, 0);

        return {
            input,
            calculatedAt: new Date().toISOString(),
            totalMonthlyEstimate,
            totalAnnualEstimate,
            totalOneTimeEstimate,
            vulnerabilityScore: civilian.vulnerabilityScore,
            vulnerabilityLevel: civilian.vulnerabilityLevel,
            eligibleProgramsCount: mergedEligiblePrograms.length,
            eligiblePrograms: mergedEligiblePrograms,
            ineligiblePrograms: civilian.ineligiblePrograms,
            summaryRecommendations: [
                ...civilian.summaryRecommendations,
                ...this.generateMilitaryRecommendations(military),
            ],
        };
    }

    /**
     * Map military benefit categories to civilian categories
     */
    private static mapMilitaryCategory(militaryCategory: string): BenefitCategory {
        const mapping: Record<string, BenefitCategory> = {
            'LUMP_SUM_PAYMENT': BenefitCategory.EMERGENCY_GRANT,
            'MONTHLY_PAYMENT': BenefitCategory.LIVING_ALLOWANCE,
            'ANNUAL_PAYMENT': BenefitCategory.STATE_WELFARE_TOPUP,
            'NON_MONETARY_BENEFIT': BenefitCategory.DISABILITY_BENEFIT,
        };
        return mapping[militaryCategory] || BenefitCategory.LIVING_ALLOWANCE;
    }

    /**
     * Map payment types to frequency
     */
    private static mapPaymentFrequency(paymentType: string): PaymentFrequency {
        const mapping: Record<string, PaymentFrequency> = {
            'LUMP_SUM': PaymentFrequency.ONE_TIME,
            'MONTHLY': PaymentFrequency.MONTHLY,
            'ANNUAL': PaymentFrequency.PER_OCCURRENCE,
            'ONE_TIME': PaymentFrequency.ONE_TIME,
        };
        return mapping[paymentType] || PaymentFrequency.ONE_TIME;
    }

    /**
     * Get required documents for military benefits
     */
    private static getMilitaryRequiredDocuments(ruleCode: string): string[] {
        const documents: Record<string, string[]> = {
            'RULE-LUMP-INSURANCE': [
                "ใบรายงานทางการแพทย์",
                "ใบรับรองแพทย์จากโรงพยาบาลสนาม",
                "หนังสือรับรองจากผู้บังคับบัญชา",
                "สำเนาบัตรประจำตัวประชาชน",
            ],
            'RULE-LUMP-HOSPITAL-STAY': [
                "ใบรายงานการรักษาตัวในโรงพยาบาล",
                "ใบรับรองแพทย์",
                "สำเนาบัตรประจำตัวประชาชน",
                "สำเนาทะเบียนบ้าน",
            ],
        };
        return documents[ruleCode] || ["สำเนาบัตรประจำตัวประชาชน", "สำเนาทะเบียนบ้าน"];
    }

    /**
     * Generate military-specific recommendations
     */
    private static generateMilitaryRecommendations(military: any): string[] {
        const recommendations: string[] = [];

        if (military?.personnelSummary) {
            if (military.personnelSummary.lossTypeDescription?.includes('DEATH') ||
                military.personnelSummary.lossTypeDescription?.includes('DISABILITY')) {
                recommendations.push("มีสิทธิได้รับสิทธิประโยชน์ทหารบก - ติดต่อหน่วยต้นสังกัดเพื่อดำเนินการ");
            }

            if (military.personnelSummary.totalServiceYears >= 20) {
                recommendations.push("มีสิทธิ์ได้รับบำนาญพิเศษ - ติดต่อฝ่ายบำเหน็จบำนาญเพื่อยื่นคำขอ");
            }
        }

        return recommendations;
    }

    /**
     * Validate input data for comprehensive calculation
     */
    public static validateInput(
        input: EstimateInput,
        militaryData?: MilitaryPersonnelInput | Partial<MilitaryPersonnelInput> | null | any
    ): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Validate civilian input
        if (!input.age || input.age < 0 || input.age > 120) {
            errors.push("อายุต้องอยู่ระหว่าง 0-120 ปี");
        }

        if (input.monthlyIncome !== undefined && input.monthlyIncome < 0) {
            errors.push("รายได้ต้องไม่ติดลบ");
        }

        // Validate military input if provided
        if (militaryData) {
            if (!militaryData.militaryId) {
                errors.push("ต้องระบุ ID ทหาร");
            }
            if (!militaryData.lossType) {
                errors.push("ต้องระบุ types ความสูญเสีย");
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Get calculation statistics for monitoring
     */
    public static getCalculationStats(
        summary: BenefitCalculationSummary,
        military?: any
    ): {
        totalPrograms: number;
        civilianPrograms: number;
        militaryPrograms: number;
        totalAmount: number;
        averageAmount: number;
        categories: Record<string, number>;
    } {
        const civilianCount = summary.eligiblePrograms.length;
        const militaryCount = military?.categories ?
            Object.values(military.categories).reduce((sum: number, cat: any) => sum + cat.itemCount, 0) : 0;

        const allPrograms = [...summary.eligiblePrograms];
        if (military?.categories) {
            Object.values(military.categories).forEach((cat: any) => {
                allPrograms.push(...cat.items.filter((item: any) => item.isEligible));
            });
        }

        const totalAmount = allPrograms.reduce((sum, program) => sum + program.estimatedAmount, 0);
        const averageAmount = allPrograms.length > 0 ? totalAmount / allPrograms.length : 0;

        const categories = allPrograms.reduce((acc, program) => {
            acc[program.category] = (acc[program.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            totalPrograms: allPrograms.length,
            civilianPrograms: civilianCount,
            militaryPrograms: militaryCount,
            totalAmount,
            averageAmount,
            categories,
        };
    }
}