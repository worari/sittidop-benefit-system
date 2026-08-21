import { PrismaApplicationRepository } from "../../../infrastructure/database/repositories/PrismaApplicationRepository";
import { ApplicationTable } from "../../../presentation/components/applications/ApplicationTable";
import { Button } from "../../../presentation/components/ui/button";
import { Sparkles, Plus } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const repo = new PrismaApplicationRepository();
  const { applications } = await repo.findAll({ take: 100 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            ระบบบริหารจัดการคำขอรับสิทธิและการอนุมัติ (Claims & Approvals)
          </h1>
          <p className="text-xs text-muted-foreground">
            ติดตาม ตรวจสอบเอกสาร และพิจารณาอนุมัติคำขอรับเงินสวัสดิการตามระเบียบ
          </p>
        </div>

        <Link href="/calculator">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            ยื่นคำขอรับสิทธิใหม่
          </Button>
        </Link>
      </div>

      <ApplicationTable initialApplications={applications} />
    </div>
  );
}
