import { NextRequest, NextResponse } from "next/server";
import { ApplicationService } from "@/core/use-cases/applications/ApplicationService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/infrastructure/auth/auth-options";

const appService = new ApplicationService();

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await appService.getApplicationById(id);

    if (!item) {
      return NextResponse.json({ success: false, error: "ไม่พบคำขอ" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch application" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const updated = await appService.updateClaim({
      id,
      programId: body.programId,
      requestedAmount: body.requestedAmount,
      applicantRemarks: body.applicantRemarks,
      documents: body.documents,
      userId: (session?.user as any)?.id || null,
      userName: session?.user?.name || "System User",
      role: (session?.user as any)?.role || "OFFICER",
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update application" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    await appService.deleteClaim({
      id,
      userId: (session?.user as any)?.id || null,
      userName: session?.user?.name || "System User",
      role: (session?.user as any)?.role || "OFFICER",
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete application" },
      { status: 400 }
    );
  }
}
