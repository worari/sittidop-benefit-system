import { PrismaBenefitProgramRepository } from "../../../infrastructure/database/repositories/PrismaBenefitProgramRepository";
import { BenefitCatalog } from "../../../presentation/components/benefits/BenefitCatalog";

export const dynamic = "force-dynamic";

export default async function BenefitsPage() {
  const repo = new PrismaBenefitProgramRepository();
  const programs = await repo.findAll();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          ทำเนียบโครงการสวัสดิการและเงินสงเคราะห์ผู้สูงอายุ
        </h1>
        <p className="text-xs text-muted-foreground">
          ข้อมูลระเบียบ วงเงิน เกณฑ์คุณสมบัติ และการเบิกจ่ายงบประมาณ 7 โครงการหลัก
        </p>
      </div>

      <BenefitCatalog programs={programs} />
    </div>
  );
}
