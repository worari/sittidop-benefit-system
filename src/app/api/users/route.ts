import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";
import { storeManager } from "@/infrastructure/database/repositories/StoreManager";
import { AuditLogger } from "@/infrastructure/logging/audit-logger";
import { Role } from "@/core/domain/value-objects/enums";
import { authorizeRoles } from "@/infrastructure/auth/rbac-guard";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  try {
    const auth = await authorizeRoles([Role.SUPERADMIN, Role.ADMIN], req);
    if (!auth.authorized) return auth.response!;

    let users: any[] = [];
    try {
      users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          unit: true,
          phone: true,
          avatarUrl: true,
          isActive: true,
          citizenId: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch {
      users = storeManager.users.map((u) => {
        const { passwordHash, ...rest } = u;
        return rest;
      });
    }

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
    const email = (body.email || "").trim().toLowerCase();

    let createdUser: any = null;
    try {
      createdUser = await prisma.user.create({
        data: {
          name: body.name,
          email,
          passwordHash: hashedPassword,
          role: body.role || Role.STAFF,
          department: body.department || "หน่วยงานกำลังพล",
          unit: body.unit || null,
          phone: body.phone || null,
          isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
        },
      });
    } catch {
      // fallback
    }

    const newUser = {
      id: createdUser?.id || `usr-${Date.now().toString().slice(-6)}`,
      name: body.name,
      email,
      passwordHash: hashedPassword,
      role: body.role || Role.STAFF,
      department: body.department || "หน่วยงานกำลังพล",
      unit: body.unit || null,
      phone: body.phone || null,
      avatarUrl: body.avatarUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      citizenId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    storeManager.users.unshift(newUser);

    await AuditLogger.log({
      action: "CREATE",
      resource: "User",
      resourceId: newUser.email,
      details: { email: newUser.email, role: newUser.role, createdBy: auth.user?.email },
      user: auth.user,
      req,
    });

    const { passwordHash, ...safeUser } = newUser;
    return NextResponse.json({ success: true, data: safeUser });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
