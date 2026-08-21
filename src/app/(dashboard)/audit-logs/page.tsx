import { PrismaAuditLogRepository } from "../../../infrastructure/database/repositories/PrismaAuditLogRepository";
import { AuditLogViewer } from "../../../presentation/components/audit/AuditLogViewer";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage() {
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
