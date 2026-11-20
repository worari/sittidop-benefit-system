import { NextRequest, NextResponse } from "next/server";
import { claimStoreManager } from "@/infrastructure/database/repositories/ClaimStoreManager";
import { getServerSession } from "next-auth";
import { authOptions } from "@/infrastructure/auth/auth-options";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const session = await getServerSession(authOptions);

    const { orderNumber, approverName, approverPosition, approvedAmount, notes } = body;

    if (!orderNumber || !approverName) {
      return NextResponse.json({ success: false, error: "กรุณาระบุเลขที่คำสั่งและชื่อผู้มีอำนาจลงนามอนุมัติ" }, { status: 400 });
    }

    const updated = claimStoreManager.approvePayment(
      id,
      orderNumber,
      approverName,
      approverPosition || "เจ้ากรมกำลังพลทหารบก",
      Number(approvedAmount || 0),
      notes
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: "ไม่พบคำขอรับสิทธิที่ระบุ" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: "บันทึกการอนุมัติจ่ายเงินสำเร็จ ส่งเรื่องเข้าสู่ สก.ทบ. และ บ.ประกัน เพื่อดำเนินการโอนเงินแล้ว",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to approve payment" }, { status: 500 });
  }
}
