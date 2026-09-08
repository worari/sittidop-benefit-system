import { NextRequest, NextResponse } from "next/server";
import { Prisma, BenefitRule as PrismaBenefitRule } from "@prisma/client";
import { MilitaryRuleEngine } from "@/core/use-cases/estimation/MilitaryRuleEngine";
import { PrismaBenefitRuleRepository } from "@/infrastructure/database/repositories/PrismaBenefitRuleRepository";
import { MilitaryPersonnelInput } from "@/core/domain/value-objects/military-types";
import { AuditLogger } from "@/infrastructure/logging/audit-logger";
import { BenefitRuleDefinition } from "@/core/domain/entities/BenefitRule";

type FormulaType = "EXPRESSION" | "MULTIPLIER_BASED" | "FIXED_AMOUNT" | "NON_MONETARY";
type PaymentType = "ONE_TIME_LUMP_SUM" | "MONTHLY_PENSION" | "ANNUAL_GRANT" | "NON_MONETARY";

function toStringArray(value: Prisma.JsonValue | undefined | null): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string");
  }
  return [];
}

function toDomainRule(rule: PrismaBenefitRule): BenefitRuleDefinition {
  return {
    id: rule.id,
    ruleCode: rule.ruleCode,
    ruleName: rule.ruleName,
    category: rule.category as BenefitRuleDefinition["category"],
    categoryName: rule.categoryName || "",
    categoryThaiName: rule.categoryThaiName || "",
    description: rule.description || "",
    legalBasis: rule.legalBasis || "",
    paymentType: rule.paymentType as PaymentType,
    benefitScope: rule.benefitScope ? (rule.benefitScope as BenefitRuleDefinition["benefitScope"]) : undefined,
    causeType: rule.causeType ? (rule.causeType as BenefitRuleDefinition["causeType"]) : undefined,
    formulaType: rule.formulaType as FormulaType,
    formulaExpression: rule.formulaExpression,
    multiplierFactor: rule.multiplierFactor,
    baseAmount: rule.baseAmount,
    minAmount: rule.minAmount ?? undefined,
    maxAmount: rule.maxAmount ?? undefined,
    conditions: {
      allowedMissions: toStringArray(rule.allowedMissions),
      allowedPersonnelCategories: toStringArray(rule.allowedPersonnelCategories),
      allowedLossTypes: toStringArray(rule.allowedLossTypes),
      allowedRanks: toStringArray(rule.allowedRanks),
      minServiceYears: rule.minServiceYears ?? undefined,
      requiresSpouse: rule.requiresSpouse ?? undefined,
      requiresChildren: rule.requiresChildren ?? undefined,
    },
    insuranceMatrix:
      rule.insuranceMatrix && typeof rule.insuranceMatrix === "object"
        ? (rule.insuranceMatrix as unknown as BenefitRuleDefinition["insuranceMatrix"])
        : undefined,
    formulaTiers:
      rule.formulaTiers && typeof rule.formulaTiers === "object"
        ? (rule.formulaTiers as unknown as BenefitRuleDefinition["formulaTiers"])
        : undefined,
    isActive: rule.isActive,
    priorityOrder: rule.priorityOrder,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt,
  };
}

export async function POST(req: NextRequest) {
  try {
    const input: MilitaryPersonnelInput = await req.json();

    // Source of truth = benefitRule table in DB (same set managed by the RTA Rules Engine CRUD page).
    const dbRules = await new PrismaBenefitRuleRepository().findAll();
    if (!dbRules.length) {
      return NextResponse.json(
        { success: false, error: "ไม่พบข้อมูลกฎเกณฑ์ในฐานข้อมูล กรุณาเพิ่มหรือ seed ข้อมูล rules ก่อนใช้งาน" },
        { status: 404 }
      );
    }

    const rules: BenefitRuleDefinition[] = dbRules.map(toDomainRule);

    const result = MilitaryRuleEngine.calculate(input, rules);

    await AuditLogger.log({
      action: "MILITARY_BENEFIT_ESTIMATED",
      resource: "MilitaryPersonnel",
      resourceId: input.militaryId,
      details: {
        rank: input.rank,
        lossType: input.lossType,
        specialPensionType: input.specialPensionType,
        specialPensionTier: input.specialPensionTier,
        totalServiceYears: input.totalServiceYears,
        benefitScope: input.benefitScope,
        grandTotalLumpSum: result.grandTotalLumpSum,
        grandTotalMonthlyPension: result.grandTotalMonthlyPension,
        grandTotalAnnualScholarship: result.grandTotalAnnualScholarship,
        hasScopeComparison: !!result.scopeComparison,
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
