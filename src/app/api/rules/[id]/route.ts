import { NextRequest, NextResponse } from "next/server";
import { militaryRuleRepository } from "@/infrastructure/database/repositories/PrismaMilitaryRuleRepository";
import { AuditLogger } from "@/infrastructure/logging/audit-logger";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rule = militaryRuleRepository.getRuleById(id);
    if (!rule) {
      return NextResponse.json({ success: false, error: "Rule not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: rule });
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

    const updated = militaryRuleRepository.updateRule(id, body);

    await AuditLogger.log({
      action: "UPDATE",
      resource: "BenefitRule",
      resourceId: updated.ruleCode,
      details: {
        ruleCode: updated.ruleCode,
        formula: updated.formulaExpression,
        multiplierFactor: updated.multiplierFactor,
        baseAmount: updated.baseAmount,
        isActive: updated.isActive,
      },
      user: auth.user,
      req,
    });

    return NextResponse.json({ success: true, data: updated });
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
    const deleted = militaryRuleRepository.deleteRule(id);
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
