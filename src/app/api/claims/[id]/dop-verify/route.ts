import { NextRequest, NextResponse } from "next/server";
import { claimStoreManager } from "@/infrastructure/database/repositories/ClaimStoreManager";
import { getServerSession } from "next-auth";
import { authOptions } from "@/infrastructure/auth/auth-options";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const session = await getServerSession(authOptions);

    const reviewerName = body.reviewerName || session?.user?.name || "พ.อ. สมเกียรติ ยุติธรรม (กพ.ทบ.)";
    const action = body.action as "ACCEPT" | "RETURN_FOR_EDIT";

    if (!action) {
      return NextResponse.json({ success: false, error: "กรุณาระบุ action: ACCEPT หรือ RETURN_FOR_EDIT" }, { status: 400 });
    }

    const updated = claimStoreManager.verifyByDOP(id, action, reviewerName, {
      returnComment: body.returnComment,
      rejectedDocCodes: body.rejectedDocCodes,
      additionalDoc: body.additionalDoc,
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: "ไม่พบคำขอรับสิทธิที่ระบุ" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: action === "ACCEPT" ? "กพ.ทบ. ตรวจรับเรื่องเอกสารเรียบร้อยแล้ว ส่งต่อไปยังขั้นตอนขออนุมัติจ่ายเงิน" : "กพ.ทบ. ตีกลับให้หน่วยต้นสังกัดแก้ไขเอกสารเรียบร้อยแล้ว",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to process DOP verification" }, { status: 500 });
  }
}
