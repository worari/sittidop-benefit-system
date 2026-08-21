import { NextRequest, NextResponse } from "next/server";
import { ApplicationService } from "@/core/use-cases/applications/ApplicationService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/infrastructure/auth/auth-options";

const appService = new ApplicationService();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as any;
    const programId = searchParams.get("programId") || undefined;
    const province = searchParams.get("province") || undefined;
    const search = searchParams.get("search") || undefined;

    const result = await appService.getApplications({
      status: status || undefined,
      programId,
      province,
      search,
    });

    return NextResponse.json({
      success: true,
      data: result.applications,
      total: result.total,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch applications" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const created = await appService.submitClaim({
      ...body,
      userId: (session?.user as any)?.id || null,
      userName: session?.user?.name || "Online Applicant",
    });

    return NextResponse.json({
      success: true,
      data: created,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit application" },
      { status: 400 }
    );
  }
}
