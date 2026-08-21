import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/infrastructure/auth/auth-options";
import { Role } from "@/core/domain/value-objects/enums";
import { UserManagementTable } from "@/presentation/components/users/UserManagementTable";
import { AccessDenied } from "@/presentation/components/auth/AccessDenied";

export const metadata: Metadata = {
  title: "การจัดการผู้ใช้งานระบบ | User Management",
  description: "ระบบกำหนดระดับสิทธิ์การเข้าถึงข้อมูลกำลังพลและการรักษาความลับทางราชการ",
};

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  const currentRole = (session?.user as any)?.role as Role || Role.SUPERADMIN;

  const allowedRoles = [Role.SUPERADMIN, Role.ADMIN];
  if (!allowedRoles.includes(currentRole)) {
    return (
      <AccessDenied
        requiredRoles={allowedRoles}
        currentRole={currentRole}
        message="หน้านี้สงวนสิทธิ์เฉพาะผู้ดูแลระบบสูงสุด (SUPERADMIN) และผู้ดูแลระบบกำลังพล (ADMIN) เท่านั้น"
      />
    );
  }

  return <UserManagementTable />;
}
