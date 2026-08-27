import { NextRequest, NextResponse } from "next/server";
import { BenefitTrackingService } from "@/core/use-cases/benefit-tracking/BenefitTrackingService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/infrastructure/auth/auth-options";
import { BenefitTrackingStatus } from "@/core/domain/value-objects/enums";

const trackingService = new BenefitTrackingService();

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        const body = await req.json();

        const updated = await trackingService.updateTrackingStatus({
            trackingId: id,
            status: body.status as BenefitTrackingStatus,
            approvedAmount: body.approvedAmount !== undefined ? Number(body.approvedAmount) : undefined,
            disbursedAmount: body.disbursedAmount !== undefined ? Number(body.disbursedAmount) : undefined,
            paymentReference: body.paymentReference,
            paymentMethod: body.paymentMethod,
            bankName: body.bankName,
            bankAccountNumber: body.bankAccountNumber,
            recipientName: body.recipientName,
            notes: body.notes,
            officerNotes: body.officerNotes,
            expectedReceiveDate: body.expectedReceiveDate,
            updatedByUserId: (session?.user as any)?.id || "usr-staff-army",
            updatedByUserName: session?.user?.name || "พันตรี นพดล สายสวัสดิการ",
            updatedByRole: (session?.user as any)?.role || "STAFF",
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || "Failed to update tracking status" },
            { status: 400 }
        );
    }
}
