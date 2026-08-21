import { NextRequest, NextResponse } from "next/server";
import { PrismaAuditLogRepository } from "@/infrastructure/database/repositories/PrismaAuditLogRepository";

import { Role } from "@/core/domain/value-objects/enums";
import { authorizeRoles } from "@/infrastructure/auth/rbac-guard";

const auditRepo = new PrismaAuditLogRepository();

export async function GET(req: NextRequest) {
  try {
    const auth = await authorizeRoles([Role.SUPERADMIN, Role.AUDITOR], req);
    if (!auth.authorized) return auth.response!;

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || undefined;
    const resource = searchParams.get("resource") || undefined;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 50;

    const logs = await auditRepo.findAll({
      action,
      resource,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: logs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
