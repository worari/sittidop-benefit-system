import { NextRequest, NextResponse } from "next/server";
import { BenefitTrackingService } from "@/core/use-cases/benefit-tracking/BenefitTrackingService";
import { LineNotificationService } from "@/infrastructure/services/LineNotificationService";
import { authorizePermission } from "@/infrastructure/auth/rbac-guard";
import { Permission } from "@/core/domain/security/rbac";
import { BenefitTrackingStatus } from "@/core/domain/value-objects/enums";

const trackingService = new BenefitTrackingService();

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await authorizePermission(Permission.UPDATE_BENEFIT_STATUS, req);
    if (!auth.authorized) return auth.response!;

    try {
        const { id } = await params;
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
            updatedByUserId: auth.user?.id,
            updatedByUserName: auth.user?.name,
            updatedByRole: auth.user?.role,
        });

        // Dispatch LINE Notification Asynchronously
        try {
            LineNotificationService.sendBenefitStatusAlert({
                trackingNumber: updated.trackingNumber,
                recipientName: updated.recipientName || updated.citizenName || "กำลังพล/ทายาท",
                benefitName: updated.benefitName,
                benefitCategory: updated.benefitCategory,
                status: updated.status,
                amount: updated.approvedAmount ?? updated.disbursedAmount ?? updated.requestedAmount,
                officerNotes: updated.officerNotes,
            }).catch((lineErr) => {
                console.error("Failed to send LINE benefit status alert:", lineErr);
            });
        } catch (lineErr) {
            console.error("LINE status alert dispatch error:", lineErr);
        }

        return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || "Failed to update tracking status" },
            { status: 400 }
        );
    }
}
