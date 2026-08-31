import { NextRequest, NextResponse } from "next/server";
import { BenefitTrackingService } from "@/core/use-cases/benefit-tracking/BenefitTrackingService";

const trackingService = new BenefitTrackingService();

/**
 * GET /api/benefit-tracking/estimates
 * ภาพรวมบูรณาการ: ผลประมาณการสิทธิล่าสุด พร้อมสถานะการเสนอขอรับสิทธิของแต่ละรายการ
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 20;

        const overview = await trackingService.getEstimationOverview(limit);

        return NextResponse.json({ success: true, data: overview });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch estimation overview" },
            { status: 500 }
        );
    }
}
