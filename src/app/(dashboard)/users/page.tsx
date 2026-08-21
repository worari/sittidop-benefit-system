import { Metadata } from "next";
import { UserManagementTable } from "@/presentation/components/users/UserManagementTable";

export const metadata: Metadata = {
  title: "การจัดการผู้ใช้งานระบบ | User Management",
  description: "ระบบกำหนดระดับสิทธิ์การเข้าถึงข้อมูลกำลังพลและการรักษาความลับทางราชการ",
};

export default function UsersPage() {
  return <UserManagementTable />;
}
