import { NextRequest, NextResponse } from "next/server";
import { MilitaryRuleEngine } from "@/core/use-cases/estimation/MilitaryRuleEngine";
import { militaryRuleRepository } from "@/infrastructure/database/repositories/PrismaMilitaryRuleRepository";
import { MilitaryPersonnelInput } from "@/core/domain/value-objects/military-types";
import { AuditLogger } from "@/infrastructure/logging/audit-logger";

export async function POST(req: NextRequest) {
  try {
    const input: MilitaryPersonnelInput = await req.json();
    const rules = militaryRuleRepository.getAllRules();

    const result = MilitaryRuleEngine.calculate(input, rules);

    await AuditLogger.log({
      action: "MILITARY_BENEFIT_ESTIMATED",
      resource: "MilitaryPersonnel",
      resourceId: input.militaryId,
      details: {
        rank: input.rank,
        lossType: input.lossType,
        grandTotalLumpSum: result.grandTotalLumpSum,
        grandTotalMonthlyPension: result.grandTotalMonthlyPension,
        grandTotalAnnualScholarship: result.grandTotalAnnualScholarship,
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute calculation" },
      { status: 400 }
    );
  }
}
