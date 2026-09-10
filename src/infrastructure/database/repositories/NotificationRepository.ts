import { prisma } from "@/infrastructure/database/prisma";

export interface SystemNotificationRecord {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  isRead: boolean;
  metadata: string | null;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNotificationInput {
  title: string;
  message: string;
  type?: string;
  link?: string | null;
  metadata?: any;
  userId?: string | null;
}

const globalForNotificationStore = globalThis as unknown as {
  systemNotificationsStore?: SystemNotificationRecord[];
};

const fallbackNotifications: SystemNotificationRecord[] =
  globalForNotificationStore.systemNotificationsStore ?? [];
if (process.env.NODE_ENV !== "production") {
  globalForNotificationStore.systemNotificationsStore = fallbackNotifications;
}

function getPrismaModel(): any {
  return (prisma as any).systemNotification;
}

export class NotificationRepository {
  async create(input: CreateNotificationInput): Promise<SystemNotificationRecord> {
    const model = getPrismaModel();
    const metaString = input.metadata
      ? typeof input.metadata === "string"
        ? input.metadata
        : JSON.stringify(input.metadata)
      : null;

    if (model?.create) {
      try {
        const created = await model.create({
          data: {
            title: input.title,
            message: input.message,
            type: input.type || "INFO",
            link: input.link || null,
            metadata: metaString,
            userId: input.userId || null,
            isRead: false,
          },
        });
        return {
          id: created.id,
          title: created.title,
          message: created.message,
          type: created.type,
          link: created.link,
          isRead: created.isRead,
          metadata: created.metadata,
          userId: created.userId,
          createdAt: new Date(created.createdAt),
          updatedAt: new Date(created.updatedAt),
        };
      } catch (err) {
        console.warn("Prisma systemNotification.create failed, falling back to memory:", err);
      }
    }

    const fallbackRecord: SystemNotificationRecord = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: input.title,
      message: input.message,
      type: input.type || "INFO",
      link: input.link || null,
      isRead: false,
      metadata: metaString,
      userId: input.userId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    fallbackNotifications.unshift(fallbackRecord);
    return fallbackRecord;
  }

  async findMany(params?: {
    userId?: string | null;
    unreadOnly?: boolean;
    limit?: number;
  }): Promise<SystemNotificationRecord[]> {
    const model = getPrismaModel();
    const limit = params?.limit || 50;

    if (model?.findMany) {
      try {
        const where: any = {};
        if (params?.unreadOnly) {
          where.isRead = false;
        }
        if (params?.userId !== undefined) {
          // match user specific or broadcast (null)
          where.OR = [{ userId: params.userId }, { userId: null }];
        }

        const rows = await model.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: limit,
        });

        return rows.map((r: any) => ({
          id: r.id,
          title: r.title,
          message: r.message,
          type: r.type,
          link: r.link,
          isRead: r.isRead,
          metadata: r.metadata,
          userId: r.userId,
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt),
        }));
      } catch {
        // fallback
      }
    }

    let items = [...fallbackNotifications];
    if (params?.unreadOnly) {
      items = items.filter((n) => !n.isRead);
    }
    if (params?.userId !== undefined) {
      items = items.filter((n) => n.userId === params.userId || n.userId === null);
    }
    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return items.slice(0, limit);
  }

  async getUnreadCount(userId?: string | null): Promise<number> {
    const model = getPrismaModel();
    if (model?.count) {
      try {
        const where: any = { isRead: false };
        if (userId !== undefined) {
          where.OR = [{ userId }, { userId: null }];
        }
        return await model.count({ where });
      } catch {
        // fallback
      }
    }

    return fallbackNotifications.filter(
      (n) => !n.isRead && (userId === undefined || n.userId === userId || n.userId === null)
    ).length;
  }

  async markAsRead(id: string): Promise<boolean> {
    const model = getPrismaModel();
    if (model?.update) {
      try {
        await model.update({
          where: { id },
          data: { isRead: true },
        });
        return true;
      } catch {
        // fallback
      }
    }

    const item = fallbackNotifications.find((n) => n.id === id);
    if (item) {
      item.isRead = true;
      item.updatedAt = new Date();
      return true;
    }
    return false;
  }

  async markAllAsRead(userId?: string | null): Promise<number> {
    const model = getPrismaModel();
    if (model?.updateMany) {
      try {
        const where: any = { isRead: false };
        if (userId !== undefined) {
          where.OR = [{ userId }, { userId: null }];
        }
        const result = await model.updateMany({
          where,
          data: { isRead: true },
        });
        return result.count;
      } catch {
        // fallback
      }
    }

    let count = 0;
    for (const item of fallbackNotifications) {
      if (!item.isRead && (userId === undefined || item.userId === userId || item.userId === null)) {
        item.isRead = true;
        item.updatedAt = new Date();
        count++;
      }
    }
    return count;
  }

  async delete(id: string): Promise<boolean> {
    const model = getPrismaModel();
    if (model?.delete) {
      try {
        await model.delete({ where: { id } });
        return true;
      } catch {
        // fallback
      }
    }

    const idx = fallbackNotifications.findIndex((n) => n.id === id);
    if (idx !== -1) {
      fallbackNotifications.splice(idx, 1);
      return true;
    }
    return false;
  }
}
