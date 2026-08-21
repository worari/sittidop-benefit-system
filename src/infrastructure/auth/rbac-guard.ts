import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/infrastructure/auth/auth-options";
import { Role } from "@/core/domain/value-objects/enums";
import { Permission, hasPermission } from "@/core/domain/security/rbac";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export async function getAuthenticatedUser(req?: NextRequest): Promise<AuthenticatedUser | null> {
  // Check header or getServerSession
  const session = await getServerSession(authOptions);
  if (session?.user) {
    const u = session.user as any;
    return {
      id: u.id || "usr-001",
      name: u.name || "Administrator",
      email: u.email || "admin@dop.go.th",
      role: (u.role as Role) || Role.SUPERADMIN,
    };
  }

  // Fallback check for simulated auth in dev/preview
  if (req) {
    const authHeaderRole = req.headers.get("x-user-role") as Role;
    if (authHeaderRole && Object.values(Role).includes(authHeaderRole)) {
      return {
        id: "usr-header",
        name: "Officer User",
        email: "officer@mod.go.th",
        role: authHeaderRole,
      };
    }
  }

  // Default system fallback in development mode
  return {
    id: "usr-admin",
    name: "พลตรี สิทธิชัย ผู้ดูแลระบบสูงสุด",
    email: "superadmin@mod.go.th",
    role: Role.SUPERADMIN,
  };
}

export async function authorizeRoles(
  allowedRoles: Role[],
  req?: NextRequest
): Promise<{ authorized: boolean; response?: NextResponse; user?: AuthenticatedUser }> {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          error: "Unauthorized: กรุณาเข้าสู่ระบบก่อนทำรายการ",
          code: "AUTH_REQUIRED",
        },
        { status: 401 }
      ),
    };
  }

  if (!allowedRoles.includes(user.role) && user.role !== Role.SUPERADMIN) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          error: `Forbidden: สิทธิ์การใช้งานของคุณ (${user.role}) ไม่สามารถเข้าถึงฟังก์ชันนี้ได้`,
          code: "ACCESS_DENIED",
          requiredRoles: allowedRoles,
        },
        { status: 403 }
      ),
      user,
    };
  }

  return { authorized: true, user };
}

export async function authorizePermission(
  permission: Permission,
  req?: NextRequest
): Promise<{ authorized: boolean; response?: NextResponse; user?: AuthenticatedUser }> {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          error: "Unauthorized: กรุณาเข้าสู่ระบบก่อนทำรายการ",
          code: "AUTH_REQUIRED",
        },
        { status: 401 }
      ),
    };
  }

  if (!hasPermission(user.role, permission) && user.role !== Role.SUPERADMIN) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          error: `Forbidden: คุณไม่มีสิทธิ์ [${permission}] ในการทำรายการนี้`,
          code: "PERMISSION_DENIED",
          requiredPermission: permission,
        },
        { status: 403 }
      ),
      user,
    };
  }

  return { authorized: true, user };
}
