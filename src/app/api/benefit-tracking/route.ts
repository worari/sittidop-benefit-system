import { NextRequest, NextResponse } from "next/server";
import { BenefitTrackingService } from "@/core/use-cases/benefit-tracking/BenefitTrackingService";
import { authorizePermission } from "@/infrastructure/auth/rbac-guard";
import { Permission } from "@/core/domain/security/rbac";
import { BenefitTrackingStatus } from "@/core/domain/value-objects/enums";

const trackingService = new BenefitTrackingService();

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status") as BenefitTrackingStatus | undefined;
        const citizenId = searchParams.get("citizenId") || undefined;
        const programId = searchParams.get("programId") || undefined;
        const estimateId = searchParams.get("estimateId") || undefined;
        const sourceType = searchParams.get("sourceType") || undefined;
        const search = searchParams.get("search") || undefined;
        const skip = searchParams.get("skip") ? Number(searchParams.get("skip")) : undefined;
        const take = searchParams.get("take") ? Number(searchParams.get("take")) : undefined;

        const result = await trackingService.getTrackings({
            status,
            citizenId,
            programId,
            estimateId,
            sourceType,
            search,
            skip,
            take,
        });

        return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch trackings" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    const auth = await authorizePermission(Permission.MANAGE_BENEFIT_TRACKING, req);
    if (!auth.authorized) return auth.response!;

    try {
        const body = await req.json();

        const newTracking = await trackingService.createTracking({
            applicationId: body.applicationId,
            citizenId: body.citizenId,
            citizenNationalId: body.citizenNationalId,
            programId: body.programId,
            benefitName: body.benefitName,
            requestedAmount: Number(body.requestedAmount),
            paymentMethod: body.paymentMethod,
            bankName: body.bankName,
            bankAccountNumber: body.bankAccountNumber,
            recipientName: body.recipientName,
            notes: body.notes,
            expectedReceiveDate: body.expectedReceiveDate,
            userId: auth.user?.id,
            userName: auth.user?.name,
        });

        return NextResponse.json({ success: true, data: newTracking }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || "Failed to create tracking" },
            { status: 400 }
        );
    }
}
