import { NextRequest, NextResponse } from "next/server";
import { NotificationRepository } from "@/infrastructure/database/repositories/NotificationRepository";

const notificationRepo = new NotificationRepository();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50;

    const [items, unreadCount] = await Promise.all([
      notificationRepo.findMany({ unreadOnly, limit }),
      notificationRepo.getUnreadCount(),
    ]);

    return NextResponse.json({
      success: true,
      data: items,
      unreadCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.all) {
      const count = await notificationRepo.markAllAsRead();
      const unreadCount = await notificationRepo.getUnreadCount();
      return NextResponse.json({ success: true, updatedCount: count, unreadCount });
    }

    if (body.id) {
      const updated = await notificationRepo.markAsRead(body.id);
      const unreadCount = await notificationRepo.getUnreadCount();
      return NextResponse.json({ success: updated, unreadCount });
    }

    return NextResponse.json(
      { success: false, error: "Missing 'id' or 'all' in request body" },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update notification status" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.title || !body.message) {
      return NextResponse.json(
        { success: false, error: "Missing title or message" },
        { status: 400 }
      );
    }

    const created = await notificationRepo.create({
      title: body.title,
      message: body.message,
      type: body.type || "INFO",
      link: body.link,
      metadata: body.metadata,
      userId: body.userId,
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create notification" },
      { status: 500 }
    );
  }
}
