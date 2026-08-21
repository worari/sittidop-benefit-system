import { IAuditLogRepository } from "../../../core/domain/repositories/IAuditLogRepository";
import { AuditLogEntity } from "../../../core/domain/entities/AuditLog";
import { storeManager } from "./StoreManager";
import { prisma } from "../prisma";

export class PrismaAuditLogRepository implements IAuditLogRepository {
  async create(data: Omit<AuditLogEntity, "id" | "timestamp">): Promise<AuditLogEntity> {
    const newLog: AuditLogEntity = {
      ...data,
      id: `aud-${Date.now()}`,
      timestamp: new Date(),
    };

    try {
      await prisma.auditLog.create({
        data: {
          userId: data.userId || null,
          userName: data.userName || null,
          role: data.role || null,
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId || null,
          detailsJson: data.detailsJson || null,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
        },
      });
    } catch {
      // fallback
    }

    storeManager.auditLogs.unshift(newLog);
    return newLog;
  }

  async findAll(params?: {
    action?: string;
    resource?: string;
    userId?: string;
    limit?: number;
  }): Promise<AuditLogEntity[]> {
    try {
      const where: any = {};
      if (params?.action) where.action = params.action;
      if (params?.resource) where.resource = params.resource;
      if (params?.userId) where.userId = params.userId;

      const items = await prisma.auditLog.findMany({
        where,
        take: params?.limit ?? 50,
        orderBy: { timestamp: "desc" },
      });
      if (items.length > 0) return items as unknown as AuditLogEntity[];
    } catch {
      // fallback
    }

    let list = [...storeManager.auditLogs];
    if (params?.action) list = list.filter((l) => l.action.toLowerCase().includes(params.action!.toLowerCase()));
    if (params?.resource) list = list.filter((l) => l.resource === params.resource);
    if (params?.userId) list = list.filter((l) => l.userId === params.userId);

    return list.slice(0, params?.limit ?? 50);
  }
}
