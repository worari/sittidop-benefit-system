import { NextRequest, NextResponse } from "next/server";
import { LineNotificationService } from "@/infrastructure/services/LineNotificationService";
import { authorizeRoles } from "@/infrastructure/auth/rbac-guard";
import { Role } from "@/core/domain/value-objects/enums";

function maskToken(token: string): string {
  if (!token) return "";
  if (token.length <= 12) return "******";
  return `${token.slice(0, 8)}...${token.slice(-6)}`;
}

export async function GET(req: NextRequest) {
  try {
    const config = await LineNotificationService.getConfig();
    return NextResponse.json({
      success: true,
      data: {
        channelAccessTokenMasked: maskToken(config.channelAccessToken),
        hasChannelAccessToken: Boolean(config.channelAccessToken && config.channelAccessToken.trim().length > 0),
        destinationId: config.destinationId,
        enabled: config.enabled,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get LINE settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await authorizeRoles([Role.SUPERADMIN, Role.ADMIN, Role.STAFF, Role.COMMANDER], req);
  if (!auth.authorized) return auth.response!;

  try {
    const body = await req.json();
    const updated = await LineNotificationService.saveConfig({
      channelAccessToken: body.channelAccessToken,
      destinationId: body.destinationId,
      enabled: body.enabled,
      channelSecret: body.channelSecret,
    });

    return NextResponse.json({
      success: true,
      data: {
        channelAccessTokenMasked: maskToken(updated.channelAccessToken),
        hasChannelAccessToken: Boolean(updated.channelAccessToken && updated.channelAccessToken.trim().length > 0),
        destinationId: updated.destinationId,
        enabled: updated.enabled,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save LINE settings" },
      { status: 500 }
    );
  }
}
