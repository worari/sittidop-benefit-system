import { NextRequest, NextResponse } from "next/server";
import { PrismaAuditLogRepository } from "@/infrastructure/database/repositories/PrismaAuditLogRepository";
import { Role } from "@/core/domain/value-objects/enums";
import { authorizeRoles } from "@/infrastructure/auth/rbac-guard";
import { AuditLogger } from "@/infrastructure/logging/audit-logger";

const auditRepo = new PrismaAuditLogRepository();

export async function GET(req: NextRequest) {
  try {
    const auth = await authorizeRoles([Role.SUPERADMIN, Role.AUDITOR], req);
    if (!auth.authorized) return auth.response!;

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || undefined;
    const resource = searchParams.get("resource") || undefined;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 100;

    const logs = await auditRepo.findAll({
      action,
      resource,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: logs,
      total: logs.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, resource, resourceId, details } = body;

    await AuditLogger.log({
      action: action || "CREATE",
      resource: resource || "System",
      resourceId: resourceId || null,
      details: details || null,
      req,
    });

    return NextResponse.json({ success: true, message: "Audit log recorded successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
