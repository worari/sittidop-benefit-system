import { NextRequest, NextResponse } from "next/server";
import { militaryStore } from "@/infrastructure/database/repositories/MilitaryStoreManager";
import { AuditLogger } from "@/infrastructure/logging/audit-logger";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const personnel = militaryStore.getPersonnelById(id);
    if (!personnel) {
      return NextResponse.json({ success: false, error: "Personnel not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: personnel });
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
    const auth = await authorizeRoles([Role.SUPERADMIN, Role.ADMIN, Role.STAFF], req);
    if (!auth.authorized) return auth.response!;

    const { id } = await params;
    const body = await req.json();

    const updated = militaryStore.updatePersonnel(id, body);

    await AuditLogger.log({
      action: "UPDATE",
      resource: "MilitaryPersonnel",
      resourceId: updated.militaryId,
      details: {
        rank: updated.rank,
        promotedRank: updated.promotedRank,
        lossType: updated.lossType,
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
    const auth = await authorizeRoles([Role.SUPERADMIN, Role.ADMIN, Role.STAFF], req);
    if (!auth.authorized) return auth.response!;

    const { id } = await params;
    const deleted = militaryStore.deletePersonnel(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Personnel not found" }, { status: 404 });
    }

    await AuditLogger.log({
      action: "DELETE",
      resource: "MilitaryPersonnel",
      resourceId: id,
      details: { deletedAt: new Date().toISOString() },
      user: auth.user,
      req,
    });

    return NextResponse.json({ success: true, message: "Personnel deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
