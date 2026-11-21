import { NextRequest, NextResponse } from "next/server";
import { LineNotificationService } from "@/infrastructure/services/LineNotificationService";
import { authorizeRoles } from "@/infrastructure/auth/rbac-guard";
import { Role } from "@/core/domain/value-objects/enums";

export async function POST(req: NextRequest) {
  const auth = await authorizeRoles([Role.SUPERADMIN, Role.ADMIN, Role.STAFF, Role.COMMANDER], req);
  if (!auth.authorized) return auth.response!;

  try {
    const body = await req.json().catch(() => ({}));
    const result = await LineNotificationService.sendTestMessage(
      body.channelAccessToken,
      body.destinationId
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to send test LINE message" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "ส่งข้อความทดสอบไปยัง LINE Messaging API เรียบร้อยแล้ว",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute LINE test" },
      { status: 500 }
    );
  }
}
