import { PrismaCitizenRepository } from "../../../infrastructure/database/repositories/PrismaCitizenRepository";
import { CitizenTable } from "../../../presentation/components/citizens/CitizenTable";

export const dynamic = "force-dynamic";

export default async function CitizensPage() {
  const repo = new PrismaCitizenRepository();
  const { citizens } = await repo.findAll({ take: 100 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          ฐานข้อมูลทะเบียนสิทธิสวัสดิการผู้สูงอายุ (Beneficiary Registry)
        </h1>
        <p className="text-xs text-muted-foreground">
          ตรวจสอบประวัติการรับสิทธิ ดัชนีความเปราะบาง และข้อมูลสิทธิรายบุคคล
        </p>
      </div>

      <CitizenTable citizens={citizens} />
    </div>
  );
}
