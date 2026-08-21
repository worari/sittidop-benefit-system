import { NextRequest, NextResponse } from "next/server";
import { militaryStore } from "@/infrastructure/database/repositories/MilitaryStoreManager";
import { AuditLogger } from "@/infrastructure/logging/audit-logger";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase();
    const branch = searchParams.get("branch");
    const lossType = searchParams.get("lossType");

    let list = militaryStore.getAllPersonnel();

    if (search) {
      list = list.filter(
        (p) =>
          p.firstName.toLowerCase().includes(search) ||
          p.lastName.toLowerCase().includes(search) ||
          p.militaryId.includes(search) ||
          p.citizenId.includes(search) ||
          p.normalUnit.toLowerCase().includes(search) ||
          (p.fieldUnit && p.fieldUnit.toLowerCase().includes(search))
      );
    }

    if (branch) {
      list = list.filter((p) => p.militaryBranch === branch);
    }

    if (lossType) {
      list = list.filter((p) => p.lossType === lossType);
    }

    return NextResponse.json({
      success: true,
      data: list,
      total: list.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { Role } from "@/core/domain/value-objects/enums";
import { authorizeRoles } from "@/infrastructure/auth/rbac-guard";

export async function POST(req: NextRequest) {
  try {
    const auth = await authorizeRoles([Role.SUPERADMIN, Role.ADMIN, Role.STAFF], req);
    if (!auth.authorized) return auth.response!;

    const body = await req.json();

    const created = militaryStore.createPersonnel(body);

    await AuditLogger.log({
      action: "PERSONNEL_CREATED",
      resource: "MilitaryPersonnel",
      resourceId: created.id,
      details: {
        militaryId: created.militaryId,
        name: `${created.rankAbbr} ${created.firstName} ${created.lastName}`,
        lossType: created.lossType,
      },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
