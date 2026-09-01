import { NextRequest, NextResponse } from "next/server";
import { Prisma, BenefitRule as PrismaBenefitRule } from "@prisma/client";
import { PrismaBenefitRuleRepository } from "@/infrastructure/database/repositories/PrismaBenefitRuleRepository";
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
    category: rule.category as BenefitRuleDefinition["category"],
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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ruleRepository = new PrismaBenefitRuleRepository();
    const prismaRule = await ruleRepository.findById(id);
    if (!prismaRule) {
      return NextResponse.json({ success: false, error: "Rule not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: toDomainRule(prismaRule) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { Role } from "@/core/domain/value-objects/enums";
import { authorizeRoles } from "@/infrastructure/auth/rbac-guard";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorizeRoles([Role.SUPERADMIN, Role.ADMIN], req);
    if (!auth.authorized) return auth.response!;

    const { id } = await params;
    const body = await req.json();

    const ruleRepository = new PrismaBenefitRuleRepository();
    const existing = await ruleRepository.findById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Rule not found" }, { status: 404 });
    }

    const conditions = body.conditions || {};

    const data: Prisma.BenefitRuleUncheckedUpdateInput = {
      ...(body.ruleCode !== undefined ? { ruleCode: body.ruleCode } : {}),
      ...(body.ruleName !== undefined ? { ruleName: body.ruleName } : {}),
      ...(body.category !== undefined ? { category: body.category } : {}),
      ...(body.categoryName !== undefined ? { categoryName: body.categoryName } : {}),
      ...(body.categoryThaiName !== undefined ? { categoryThaiName: body.categoryThaiName } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.legalBasis !== undefined ? { legalBasis: body.legalBasis } : {}),
      ...(body.paymentType !== undefined ? { paymentType: body.paymentType } : {}),
      ...(body.benefitScope !== undefined ? { benefitScope: body.benefitScope } : {}),
      ...(body.causeType !== undefined ? { causeType: body.causeType } : {}),
      ...(body.formulaType !== undefined ? { formulaType: body.formulaType } : {}),
      ...(body.formulaExpression !== undefined ? { formulaExpression: body.formulaExpression } : {}),
      ...(body.multiplierFactor !== undefined ? { multiplierFactor: Number(body.multiplierFactor) } : {}),
      ...(body.baseAmount !== undefined ? { baseAmount: Number(body.baseAmount) } : {}),
      ...(body.minAmount !== undefined ? { minAmount: Number(body.minAmount) } : {}),
      ...(body.maxAmount !== undefined ? { maxAmount: Number(body.maxAmount) } : {}),
      ...(conditions.allowedMissions !== undefined ? { allowedMissions: conditions.allowedMissions } : {}),
      ...(conditions.allowedPersonnelCategories !== undefined ? { allowedPersonnelCategories: conditions.allowedPersonnelCategories } : {}),
      ...(conditions.allowedLossTypes !== undefined ? { allowedLossTypes: conditions.allowedLossTypes } : {}),
      ...(conditions.allowedRanks !== undefined ? { allowedRanks: conditions.allowedRanks } : {}),
      ...(conditions.minServiceYears !== undefined ? { minServiceYears: conditions.minServiceYears } : {}),
      ...(conditions.requiresSpouse !== undefined ? { requiresSpouse: conditions.requiresSpouse } : {}),
      ...(conditions.requiresChildren !== undefined ? { requiresChildren: conditions.requiresChildren } : {}),
      ...(body.insuranceMatrix !== undefined ? { insuranceMatrix: body.insuranceMatrix } : {}),
      ...(body.formulaTiers !== undefined ? { formulaTiers: body.formulaTiers } : {}),
      ...(body.priorityOrder !== undefined ? { priorityOrder: Number(body.priorityOrder) } : {}),
      ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
    };

    const updated = await ruleRepository.update(id, data);

    await AuditLogger.log({
      action: "UPDATE",
      resource: "BenefitRule",
      resourceId: updated.ruleCode,
      details: {
        ruleCode: updated.ruleCode,
        category: updated.category,
        formula: updated.formulaExpression,
        isActive: updated.isActive,
      },
      user: auth.user,
      req,
    });

    return NextResponse.json({ success: true, data: toDomainRule(updated) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorizeRoles([Role.SUPERADMIN, Role.ADMIN], req);
    if (!auth.authorized) return auth.response!;

    const { id } = await params;
    const ruleRepository = new PrismaBenefitRuleRepository();
    const deleted = await ruleRepository.delete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Rule not found" }, { status: 404 });
    }

    await AuditLogger.log({
      action: "DELETE",
      resource: "BenefitRule",
      resourceId: id,
      user: auth.user,
      req,
    });

    return NextResponse.json({ success: true, message: "Rule deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
