import { NextRequest, NextResponse } from "next/server";
import { TelegramNotificationService } from "@/infrastructure/services/TelegramNotificationService";
import { authorizeRoles } from "@/infrastructure/auth/rbac-guard";
import { Role } from "@/core/domain/value-objects/enums";

export async function POST(req: NextRequest) {
  const auth = await authorizeRoles([Role.SUPERADMIN, Role.ADMIN, Role.STAFF, Role.COMMANDER], req);
  if (!auth.authorized) return auth.response!;

  try {
    const body = await req.json().catch(() => ({}));
    const result = await TelegramNotificationService.sendTestMessage(body.chatId, body.botToken);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to send test Telegram message" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "ส่งข้อความทดสอบไปยัง Telegram เรียบร้อยแล้ว",
      messageId: (result as any).messageId,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute test" },
      { status: 500 }
    );
  }
}
