import { BenefitTrackingService } from "../../../core/use-cases/benefit-tracking/BenefitTrackingService";
import { BenefitTrackingDashboard } from "../../../presentation/components/benefit-tracking/BenefitTrackingDashboard";
import type { EstimationOverviewItem } from "../../../core/domain/value-objects/types";
import { getServerSession } from "next-auth";
import { authOptions } from "@/infrastructure/auth/auth-options";
import { Role } from "@/core/domain/value-objects/enums";

export const dynamic = "force-dynamic";

export default async function BenefitTrackingPage() {
    const session = await getServerSession(authOptions);
    const currentRole = ((session?.user as any)?.role as Role) || Role.STAFF;

    const trackingService = new BenefitTrackingService();
    const { trackings } = await trackingService.getTrackings({ take: 100 });
    const counts = await trackingService.getStatusCounts();

    let estimationOverview: EstimationOverviewItem[] = [];
    try {
        estimationOverview = await trackingService.getEstimationOverview(10);
    } catch {
        estimationOverview = [];
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    ติดตามสถานะรายการสิทธิและเงินสงเคราะห์
                </h1>
                <p className="text-xs text-muted-foreground">
                    รวมข้อมูลรายการสิทธิและสวัสดิการที่ได้รับการพิจารณาประมาณการสิทธิ และได้เสนอขอรับสิทธิแล้ว
                    เชื่อมโยงข้อมูลตั้งแต่ผลประมาณการ → คำขอ → การอนุมัติ → การจ่ายเงิน แบบบูรณาการ
                </p>
            </div>

            <BenefitTrackingDashboard
                initialTrackings={trackings}
                initialCounts={counts}
                initialEstimationOverview={estimationOverview}
                userRole={currentRole}
            />
        </div>
    );
}
