import { PrismaAuditLogRepository } from "../database/repositories/PrismaAuditLogRepository";

const auditRepo = new PrismaAuditLogRepository();

export class AuditLogger {
  public static async log(data: {
    userId?: string | null;
    userName?: string | null;
    role?: string | null;
    action: string;
    resource: string;
    resourceId?: string | null;
    details?: any;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    try {
      await auditRepo.create({
        userId: data.userId || null,
        userName: data.userName || null,
        role: data.role || null,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId || null,
        detailsJson: data.details ? JSON.stringify(data.details) : null,
        ipAddress: data.ipAddress || "127.0.0.1",
        userAgent: data.userAgent || "Internal Service",
      });
    } catch (err) {
      console.error("[AuditLogger Error]:", err);
    }
  }
}
