import { NextRequest, NextResponse } from "next/server";
import { militaryRuleRepository } from "@/infrastructure/database/repositories/PrismaMilitaryRuleRepository";
import { BenefitCategoryCode } from "@/core/domain/value-objects/military-types";
import { AuditLogger } from "@/infrastructure/logging/audit-logger";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") as BenefitCategoryCode;

    let rules = militaryRuleRepository.getAllRules();
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.ruleCode || !body.ruleName || !body.category || !body.formulaExpression) {
      return NextResponse.json(
        { success: false, error: "Missing required rule fields (ruleCode, ruleName, category, formulaExpression)" },
        { status: 400 }
      );
    }

    const created = militaryRuleRepository.createRule({
      ruleCode: body.ruleCode,
      ruleName: body.ruleName,
      category: body.category,
      categoryName: body.categoryName || "Benefit Category",
      categoryThaiName: body.categoryThaiName || "หมวดสิทธิประโยชน์",
      description: body.description || "",
      legalBasis: body.legalBasis || "",
      paymentType: body.paymentType || "ONE_TIME_LUMP_SUM",
      formulaType: body.formulaType || "EXPRESSION",
      formulaExpression: body.formulaExpression,
      multiplierFactor: Number(body.multiplierFactor) || 1,
      baseAmount: Number(body.baseAmount) || 0,
      minAmount: body.minAmount !== undefined ? Number(body.minAmount) : undefined,
      maxAmount: body.maxAmount !== undefined ? Number(body.maxAmount) : undefined,
      conditions: body.conditions || {},
      isActive: body.isActive !== undefined ? body.isActive : true,
      priorityOrder: Number(body.priorityOrder) || 10,
    });

    await AuditLogger.log({
      action: "RULE_CREATED",
      resource: "BenefitRule",
      resourceId: created.id,
      details: {
        ruleCode: created.ruleCode,
        category: created.category,
        formula: created.formulaExpression,
      },
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
