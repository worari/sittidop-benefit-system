import { NextRequest, NextResponse } from "next/server";
import { Prisma, BenefitRule as PrismaBenefitRule } from "@prisma/client";
import { PrismaBenefitRuleRepository } from "@/infrastructure/database/repositories/PrismaBenefitRuleRepository";
import { BenefitCategoryCode } from "@/core/domain/value-objects/military-types";
import { AuditLogger } from "@/infrastructure/logging/audit-logger";
import {
  BenefitRuleDefinition,
  BenefitScopeType,
  ActionCauseType,
} from "@/core/domain/entities/BenefitRule";

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
    category: rule.category as BenefitCategoryCode,
    categoryName: rule.categoryName || "",
    categoryThaiName: rule.categoryThaiName || "",
    description: rule.description || "",
    legalBasis: rule.legalBasis || "",
    paymentType: rule.paymentType as PaymentType,
    benefitScope: rule.benefitScope ? (rule.benefitScope as BenefitScopeType) : undefined,
    causeType: rule.causeType ? (rule.causeType as ActionCauseType) : undefined,
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") as BenefitCategoryCode | null;

    const ruleRepository = new PrismaBenefitRuleRepository();
    const prismaRules = await ruleRepository.findAll();

    let rules = prismaRules.map(toDomainRule);

    if (category) {
      rules = rules.filter((r) => r.category === category);
    }

    return NextResponse.json({
      success: true,
      data: rules,
      total: rules.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch rules" },
      { status: 500 }
    );
  }
}

import { Role } from "@/core/domain/value-objects/enums";
import { authorizeRoles } from "@/infrastructure/auth/rbac-guard";

export async function POST(req: NextRequest) {
  try {
    const auth = await authorizeRoles([Role.SUPERADMIN, Role.ADMIN], req);
    if (!auth.authorized) return auth.response!;

    const body = await req.json();

    if (!body.ruleCode || !body.ruleName || !body.category || !body.formulaExpression) {
      return NextResponse.json(
        { success: false, error: "Missing required rule fields (ruleCode, ruleName, category, formulaExpression)" },
        { status: 400 }
      );
    }

    const ruleRepository = new PrismaBenefitRuleRepository();
    const existingRules = await ruleRepository.findAll();
    const nextPriority = existingRules.length + 1;

    const conditions = body.conditions || {};

    const data: Prisma.BenefitRuleUncheckedCreateInput = {
      ruleCode: body.ruleCode,
      ruleName: body.ruleName,
      category: body.category,
      categoryName: body.categoryName || "Benefit Category",
      categoryThaiName: body.categoryThaiName || "หมวดสิทธิประโยชน์",
      description: body.description || "",
      legalBasis: body.legalBasis || "",
      paymentType: body.paymentType || "ONE_TIME_LUMP_SUM",
      benefitScope: body.benefitScope || undefined,
      causeType: body.causeType || undefined,
      formulaType: body.formulaType || "EXPRESSION",
      formulaExpression: body.formulaExpression,
      multiplierFactor: Number(body.multiplierFactor) || 1,
      baseAmount: Number(body.baseAmount) || 0,
      minAmount: body.minAmount !== undefined ? Number(body.minAmount) : null,
      maxAmount: body.maxAmount !== undefined ? Number(body.maxAmount) : null,
      allowedMissions: Array.isArray(conditions.allowedMissions) ? conditions.allowedMissions : [],
      allowedPersonnelCategories: Array.isArray(conditions.allowedPersonnelCategories) ? conditions.allowedPersonnelCategories : [],
      allowedLossTypes: Array.isArray(conditions.allowedLossTypes) ? conditions.allowedLossTypes : [],
      allowedRanks: Array.isArray(conditions.allowedRanks) ? conditions.allowedRanks : [],
      minServiceYears: conditions.minServiceYears ?? null,
      requiresSpouse: conditions.requiresSpouse ?? null,
      requiresChildren: conditions.requiresChildren ?? null,
      insuranceMatrix: body.insuranceMatrix || undefined,
      formulaTiers: Array.isArray(body.formulaTiers) ? body.formulaTiers : undefined,
      priorityOrder: Number(body.priorityOrder) || nextPriority,
      isActive: body.isActive !== undefined ? body.isActive : true,
    };

    const created = await ruleRepository.create(data);

    await AuditLogger.log({
      action: "CREATE",
      resource: "BenefitRule",
      resourceId: created.ruleCode,
      details: {
        ruleCode: created.ruleCode,
        category: created.category,
        formula: created.formulaExpression,
      },
      user: auth.user,
      req,
    });

    return NextResponse.json({
      success: true,
      data: created,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create rule" },
      { status: 400 }
    );
  }
}
