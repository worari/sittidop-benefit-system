import { NextRequest, NextResponse } from "next/server";
import { BenefitTrackingService } from "@/core/use-cases/benefit-tracking/BenefitTrackingService";
import { authorizePermission } from "@/infrastructure/auth/rbac-guard";
import { Permission } from "@/core/domain/security/rbac";

const trackingService = new BenefitTrackingService();

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const tracking = await trackingService.getTrackingById(id);
        if (!tracking) {
            return NextResponse.json(
                { success: false, error: "ไม่พบรายการติดตามสถานะที่ระบุ" },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true, data: tracking });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch tracking" },
            { status: 500 }
        );
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await authorizePermission(Permission.UPDATE_BENEFIT_STATUS, req);
    if (!auth.authorized) return auth.response!;

    try {
        const { id } = await params;
        const body = await req.json();

        const updated = await trackingService.updateTracking({
            trackingId: id,
            benefitName: body.benefitName,
            requestedAmount: body.requestedAmount !== undefined ? Number(body.requestedAmount) : undefined,
            notes: body.notes,
            officerNotes: body.officerNotes,
            expectedReceiveDate: body.expectedReceiveDate,
            paymentMethod: body.paymentMethod,
            bankName: body.bankName,
            bankAccountNumber: body.bankAccountNumber,
            recipientName: body.recipientName,
            updatedByUserId: auth.user?.id,
            updatedByUserName: auth.user?.name,
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || "Failed to update tracking" },
            { status: 400 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await authorizePermission(Permission.MANAGE_BENEFIT_TRACKING, req);
    if (!auth.authorized) return auth.response!;

    try {
        const { id } = await params;
        await trackingService.deleteTracking({
            trackingId: id,
            deletedByUserId: auth.user?.id,
            deletedByUserName: auth.user?.name,
        });

        return NextResponse.json({ success: true, message: "ลบรายการติดตามสถานะสำเร็จ" });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || "Failed to delete tracking" },
            { status: 400 }
        );
    }
}
