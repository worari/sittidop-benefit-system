import { NextRequest, NextResponse } from "next/server";
import { claimStoreManager } from "@/infrastructure/database/repositories/ClaimStoreManager";
import { getServerSession } from "next-auth";
import { authOptions } from "@/infrastructure/auth/auth-options";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const { type, amount, refNumber, slipUrl, insuranceCompany, heirAccountIds } = body;

    if (!type || !refNumber) {
      return NextResponse.json({ success: false, error: "กรุณาระบุประเภทการเบิกจ่ายและเลขที่อ้างอิงธุรกรรมการโอนเงิน" }, { status: 400 });
    }

    const updated = claimStoreManager.recordDisbursement(id, type, {
      amount: Number(amount || 0),
      refNumber,
      slipUrl,
      insuranceCompany,
      heirAccountIds,
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: "ไม่พบคำขอรับสิทธิที่ระบุ" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: "บันทึกผลการโอนเงินและปรับสถานะเรียบร้อยแล้ว",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to record disbursement" }, { status: 500 });
  }
}
