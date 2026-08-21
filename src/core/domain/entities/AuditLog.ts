export interface AuditLogEntity {
  id: string;
  userId?: string | null;
  userName?: string | null;
  role?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  detailsJson?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  timestamp: Date;
}
