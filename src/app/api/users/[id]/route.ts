import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";
import { storeManager } from "@/infrastructure/database/repositories/StoreManager";
import { AuditLogger } from "@/infrastructure/logging/audit-logger";
import { Role } from "@/core/domain/value-objects/enums";
import { authorizeRoles } from "@/infrastructure/auth/rbac-guard";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorizeRoles([Role.SUPERADMIN, Role.ADMIN], req);
    if (!auth.authorized) return auth.response!;

    const { id } = await params;
    const body = await req.json();

    let updatedUser: any = null;
    try {
      updatedUser = await prisma.user.update({
        where: { id },
        data: {
          isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
          role: body.role ? body.role : undefined,
          department: body.department ? body.department : undefined,
          unit: body.unit ? body.unit : undefined,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          unit: true,
          isActive: true,
          updatedAt: true,
        },
      });
    } catch {
      // fallback to storeManager
      const idx = storeManager.users.findIndex((u) => u.id === id);
      if (idx >= 0) {
        if (body.isActive !== undefined) storeManager.users[idx].isActive = Boolean(body.isActive);
        if (body.role) storeManager.users[idx].role = body.role;
        if (body.department) storeManager.users[idx].department = body.department;
        storeManager.users[idx].updatedAt = new Date();
        const { passwordHash: _, ...rest } = storeManager.users[idx];
        updatedUser = rest;
      }
    }

    if (!updatedUser) {
      return NextResponse.json({ success: false, error: "ไม่พบผู้ใช้งาน" }, { status: 404 });
    }

    await AuditLogger.log({
      action: "UPDATE",
      resource: "User",
      resourceId: id,
      details: {
        userId: id,
        changes: body,
        updatedBy: auth.user?.email,
      },
      user: auth.user,
      req,
    });

    return NextResponse.json({
      success: true,
      message: body.isActive ? "อนุมัติผู้ใช้งานเข้าสู่ระบบเรียบร้อยแล้ว" : "อัปเดตข้อมูลผู้ใช้งานเรียบร้อยแล้ว",
      data: updatedUser,
    });
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

    try {
      await prisma.user.delete({ where: { id } });
    } catch {
      const idx = storeManager.users.findIndex((u) => u.id === id);
      if (idx >= 0) storeManager.users.splice(idx, 1);
    }

    await AuditLogger.log({
      action: "DELETE",
      resource: "User",
      resourceId: id,
      details: { deletedBy: auth.user?.email },
      user: auth.user,
      req,
    });

    return NextResponse.json({ success: true, message: "ลบผู้ใช้งานสำเร็จ" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
