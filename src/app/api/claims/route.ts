import { NextRequest, NextResponse } from "next/server";
import { claimStoreManager } from "@/infrastructure/database/repositories/ClaimStoreManager";
import { getServerSession } from "next-auth";
import { authOptions } from "@/infrastructure/auth/auth-options";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const stage = searchParams.get("stage");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    let claims = claimStoreManager.getAll();

    if (stage && stage !== "ALL") {
      claims = claims.filter((c) => c.currentStage === stage);
    }

    if (status && status !== "ALL") {
      claims = claims.filter((c) => c.status === status);
    }

    if (search) {
      const q = search.toLowerCase();
      claims = claims.filter(
        (c) =>
          c.claimNumber.toLowerCase().includes(q) ||
          c.personnelName.toLowerCase().includes(q) ||
          c.personnelCitizenId.includes(q) ||
          c.personnelMilitaryId.toLowerCase().includes(q) ||
          c.submittingUnitName.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      success: true,
      data: claims,
      total: claims.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch claims" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const created = claimStoreManager.create({
      ...body,
      submittingOfficerName: body.submittingOfficerName || session?.user?.name || "นายทหารฝ่ายกำลังพล",
    });

    return NextResponse.json({
      success: true,
      data: created,
      message: "ยื่นเสนอขอรับสิทธิและสวัสดิการสำเร็จ ส่งเรื่องเข้าสู่ กพ.ทบ. เรียบร้อยแล้ว",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit claim" },
      { status: 400 }
    );
  }
}
