import { NextRequest, NextResponse } from "next/server";
import { ApplicationService } from "@/core/use-cases/applications/ApplicationService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/infrastructure/auth/auth-options";
import { ApprovalDecision } from "@/core/domain/value-objects/enums";

const appService = new ApplicationService();

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const updated = await appService.reviewClaim({
      applicationId: id,
      decision: body.decision as ApprovalDecision,
      notes: body.notes,
      approvedAmount: body.approvedAmount,
      reviewerId: (session?.user as any)?.id || "usr-officer",
      reviewerName: session?.user?.name || "น.ส.กนกพร พัฒนไพบูลย์ (Officer)",
      reviewerRole: (session?.user as any)?.role || "OFFICER",
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update status" },
      { status: 400 }
    );
  }
}
