import { NextRequest, NextResponse } from "next/server";
import { BenefitTrackingService } from "@/core/use-cases/benefit-tracking/BenefitTrackingService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/infrastructure/auth/auth-options";
import { BenefitCalculationSummary } from "@/core/domain/value-objects/types";

const trackingService = new BenefitTrackingService();

/**
 * POST /api/benefit-tracking/propose
 * เสนอขอรับสิทธิต่อจากผลประมาณการสิทธิและสวัสดิการ (บูรณาการ Estimate -> Application -> BenefitTracking)
 *
 * Body:
 *  - estimateId?: string        (Mode A: ผลประมาณการที่บันทึกไว้แล้ว)
 *  - summary?: CalculationSummary (Mode B: บันทึกผลประมาณการใหม่ก่อนเสนอขอ)
 *  - programIds?: string[]      (รายการสิทธิที่เลือกเสนอขอ; ถ้าไม่ระบุ = ทุกรายการที่ผ่านเกณฑ์)
 *  - notes?: string
 *  - citizenNationalId?: string
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const body = await req.json();

        const result = await trackingService.proposeFromEstimate({
            estimateId: body.estimateId,
            summary: body.summary as BenefitCalculationSummary | undefined,
            programIds: Array.isArray(body.programIds) ? body.programIds.map(String) : undefined,
            notes: body.notes,
            citizenNationalId: body.citizenNationalId,
            userId: (session?.user as any)?.id || "usr-staff-army",
            userName: session?.user?.name || "พันตรี นพดล สายสวัสดิการ",
        });

        return NextResponse.json(
            {
                success: true,
                data: {
                    estimate: result.estimate,
                    trackings: result.trackings,
                    trackingNumbers: result.trackings.map((t) => t.trackingNumber),
                },
            },
            { status: 201 }
        );
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || "Failed to propose benefits from estimate" },
            { status: 400 }
        );
    }
}
