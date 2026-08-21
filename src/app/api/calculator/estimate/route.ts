import { NextRequest, NextResponse } from "next/server";
import { BenefitEstimationEngine } from "@/core/use-cases/estimation/BenefitEstimationEngine";
import { PrismaEstimateRepository } from "@/infrastructure/database/repositories/PrismaEstimateRepository";
import { AuditLogger } from "@/infrastructure/logging/audit-logger";
import { EstimateInput } from "@/core/domain/value-objects/types";

const estimateRepo = new PrismaEstimateRepository();

export async function POST(req: NextRequest) {
  try {
    const body: EstimateInput = await req.json();
    const result = BenefitEstimationEngine.calculate(body);

    // Save calculation history
    try {
      await estimateRepo.create(result);
    } catch {
      // non-blocking
    }

    // Audit log
    await AuditLogger.log({
      action: "CALCULATE_ESTIMATE",
      resource: "BenefitEstimate",
      details: {
        age: body.age,
        monthlyIncome: body.monthlyIncome,
        eligibleCount: result.eligibleProgramsCount,
        totalMonthly: result.totalMonthlyEstimate,
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to calculate estimate" },
      { status: 400 }
    );
  }
}
