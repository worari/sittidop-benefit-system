import { NextRequest, NextResponse } from "next/server";
import { storeManager } from "@/infrastructure/database/repositories/StoreManager";
import { AuditLogger } from "@/infrastructure/logging/audit-logger";
import { Role } from "@/core/domain/value-objects/enums";
import { authorizeRoles } from "@/infrastructure/auth/rbac-guard";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  try {
    const auth = await authorizeRoles([Role.SUPERADMIN, Role.ADMIN], req);
    if (!auth.authorized) return auth.response!;

    const users = storeManager.users.map((u) => {
      const { passwordHash, ...rest } = u;
      return rest;
    });
    return NextResponse.json({ success: true, data: users, total: users.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authorizeRoles([Role.SUPERADMIN, Role.ADMIN], req);
    if (!auth.authorized) return auth.response!;

    const body = await req.json();

    const hashedPassword = bcrypt.hashSync(body.password || "password1234", 10);
    const newUser = {
      id: `usr-${Date.now().toString().slice(-6)}`,
      name: body.name,
      email: body.email,
      passwordHash: hashedPassword,
      role: body.role || Role.STAFF,
      department: body.department || "หน่วยงานกำลังพล",
      phone: body.phone || null,
      avatarUrl: body.avatarUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
      isActive: body.isActive !== undefined ? body.isActive : true,
      citizenId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    storeManager.users.unshift(newUser);

    await AuditLogger.log({
      action: "USER_CREATED",
      resource: "User",
      resourceId: newUser.id,
      details: { email: newUser.email, role: newUser.role, createdBy: auth.user?.email },
    });

    const { passwordHash, ...safeUser } = newUser;
    return NextResponse.json({ success: true, data: safeUser });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
