import { AuditLogEntity } from "../entities/AuditLog";

export interface IAuditLogRepository {
  create(data: Omit<AuditLogEntity, "id" | "timestamp">): Promise<AuditLogEntity>;
  findAll(params?: {
    action?: string;
    resource?: string;
    userId?: string;
    limit?: number;
  }): Promise<AuditLogEntity[]>;
}
