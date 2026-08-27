import { PrismaBenefitTrackingRepository } from "../../../infrastructure/database/repositories/PrismaBenefitTrackingRepository";
import { BenefitTrackingDashboard } from "../../../presentation/components/benefit-tracking/BenefitTrackingDashboard";

export const dynamic = "force-dynamic";

export default async function BenefitTrackingPage() {
    const repo = new PrismaBenefitTrackingRepository();
    const { trackings } = await repo.findAll({ take: 100 });
    const counts = await repo.countByStatus();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    ติดตามสถานะรายการสิทธิและเงินสงเคราะห์
                </h1>
                <p className="text-xs text-muted-foreground">
                    ตรวจสอบรายการสิทธิประโยชน์และเงินสงเคราะห์ที่ได้รับ อนุมัติ หรืออยู่ระหว่างดำเนินการ
                </p>
            </div>

            <BenefitTrackingDashboard initialTrackings={trackings} initialCounts={counts} />
        </div>
    );
}
