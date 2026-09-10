import { NextRequest, NextResponse } from "next/server";
import { TelegramNotificationService } from "@/infrastructure/services/TelegramNotificationService";
import { authorizeRoles } from "@/infrastructure/auth/rbac-guard";
import { Role } from "@/core/domain/value-objects/enums";

function maskToken(token: string): string {
  if (!token) return "";
  if (token.length <= 10) return "******";
  return `${token.slice(0, 6)}...${token.slice(-4)}`;
}

export async function GET(req: NextRequest) {
  try {
    const config = await TelegramNotificationService.getConfig();
    return NextResponse.json({
      success: true,
      data: {
        botTokenMasked: maskToken(config.botToken),
        hasBotToken: Boolean(config.botToken && config.botToken.trim().length > 0),
        chatId: config.chatId,
        enabled: config.enabled,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get Telegram settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await authorizeRoles([Role.SUPERADMIN, Role.ADMIN, Role.STAFF, Role.COMMANDER], req);
  if (!auth.authorized) return auth.response!;

  try {
    const body = await req.json();
    const updated = await TelegramNotificationService.saveConfig({
      botToken: body.botToken,
      chatId: body.chatId,
      enabled: body.enabled,
    });

    return NextResponse.json({
      success: true,
      data: {
        botTokenMasked: maskToken(updated.botToken),
        hasBotToken: Boolean(updated.botToken && updated.botToken.trim().length > 0),
        chatId: updated.chatId,
        enabled: updated.enabled,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save Telegram settings" },
      { status: 500 }
    );
  }
}
