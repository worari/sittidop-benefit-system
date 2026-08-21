import { getServerSession } from "next-auth";
import { authOptions } from "@/infrastructure/auth/auth-options";
import { Role } from "@/core/domain/value-objects/enums";
import { PrismaAuditLogRepository } from "../../../infrastructure/database/repositories/PrismaAuditLogRepository";
import { AuditLogViewer } from "../../../presentation/components/audit/AuditLogViewer";
import { AccessDenied } from "@/presentation/components/auth/AccessDenied";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage() {
  const session = await getServerSession(authOptions);
  const currentRole = ((session?.user as any)?.role as Role) || Role.SUPERADMIN;

  const allowedRoles = [Role.SUPERADMIN, Role.AUDITOR];
  if (!allowedRoles.includes(currentRole)) {
    return (
      <AccessDenied
        requiredRoles={allowedRoles}
        currentRole={currentRole}
        message="หน้านี้สงวนสิทธิ์เฉพาะผู้ดูแลระบบสูงสุด (SUPERADMIN) และผู้ตรวจสอบภายใน (AUDITOR) เท่านั้น"
      />
    );
  }

  const repo = new PrismaAuditLogRepository();
  const logs = await repo.findAll({ limit: 100 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          บันทึกประวัติการปฏิบัติงานและความปลอดภัย (Audit Trail)
        </h1>
        <p className="text-xs text-muted-foreground">
          ระบบบันทึก Log การเข้าใช้งาน การคำนวณสิทธิ และการอนุมัติตามมาตรฐาน ISO 27001 และ พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล
        </p>
      </div>

      <AuditLogViewer logs={logs} />
    </div>
  );
}
