import { NextRequest, NextResponse } from "next/server";
import { EnhancedBenefitCalculationEngine } from "@/core/use-cases/estimation/EnhancedBenefitCalculationEngine";
import { PrismaEstimateRepository } from "@/infrastructure/database/repositories/PrismaEstimateRepository";
import { AuditLogger } from "@/infrastructure/logging/audit-logger";
import { EstimateInput } from "@/core/domain/value-objects/types";
import { MilitaryPersonnelInput } from "@/core/domain/value-objects/military-types";
import { BenefitRuleDefinition } from "@/core/domain/entities/BenefitRule";

const estimateRepo = new PrismaEstimateRepository();

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validate input
        const validation = EnhancedBenefitCalculationEngine.validateInput(
            body as EstimateInput,
            body.militaryData as MilitaryPersonnelInput
        );

        if (!validation.isValid) {
            return NextResponse.json(
                { success: false, error: "Invalid input", details: validation.errors },
                { status: 400 }
            );
        }

        // Get military rules if military data is provided
        let militaryRules: BenefitRuleDefinition[] = [];
        if (body.militaryData) {
            try {
                const { PrismaBenefitRuleRepository } = require("@/infrastructure/database/repositories/PrismaBenefitRuleRepository");
                const ruleRepo = new PrismaBenefitRuleRepository();
                militaryRules = await ruleRepo.findAll({ isActive: true });
            } catch (error) {
                // If rules repository doesn't exist, continue without military rules
                console.warn("Could not load military rules:", error);
            }
        }

        // Calculate comprehensive benefits
        const result = EnhancedBenefitCalculationEngine.calculateComprehensive(
            body as EstimateInput,
            body.militaryData as MilitaryPersonnelInput,
            militaryRules
        );

        // Save calculation history
        try {
            await estimateRepo.create(result);
        } catch {
            // non-blocking
        }

        // Get calculation statistics for monitoring
        const stats = EnhancedBenefitCalculationEngine.getCalculationStats(
            result,
            body.militaryData ? result : null
        );

        // Audit log
        await AuditLogger.log({
            action: "CALCULATE_COMPREHENSIVE_ESTIMATE",
            resource: "BenefitEstimate",
            details: {
                age: body.age,
                monthlyIncome: body.monthlyIncome,
                hasMilitaryData: !!body.militaryData,
                eligibleCount: result.eligibleProgramsCount,
                totalMonthly: result.totalMonthlyEstimate,
                totalAnnual: result.totalAnnualEstimate,
                totalOneTime: result.totalOneTimeEstimate,
                calculationStats: stats,
            },
        });

        return NextResponse.json({
            success: true,
            data: result,
            stats,
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || "Failed to calculate comprehensive estimate" },
            { status: 400 }
        );
    }
}