import { NextRequest } from "next/server";
import { PrismaAuditLogRepository } from "../database/repositories/PrismaAuditLogRepository";
import { getAuthenticatedUser, AuthenticatedUser } from "../auth/rbac-guard";

const auditRepo = new PrismaAuditLogRepository();

export type AuditActionType =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "EXPORT_PDF"
  | "EXPORT_DOCX"
  | "LOGIN"
  | string;

export interface AuditLogPayload {
  action: AuditActionType;
  resource: string;
  resourceId?: string | null;
  details?: Record<string, any> | any;
  req?: NextRequest;
  user?: AuthenticatedUser | { id?: string; name?: string; email?: string; role?: string } | null;
  userId?: string | null;
  userName?: string | null;
  role?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class AuditLogger {
  /**
   * Helper to extract real IP Address from NextRequest headers
   */
  public static extractIpAddress(req?: NextRequest): string {
    if (!req) return "127.0.0.1";
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }
    const realIp = req.headers.get("x-real-ip");
    if (realIp) return realIp.trim();
    return "127.0.0.1";
  }

  /**
   * Helper to extract User Agent from NextRequest headers
   */
  public static extractUserAgent(req?: NextRequest): string {
    if (!req) return "Internal Service / System";
    return req.headers.get("user-agent") || "Unknown Browser";
  }

  /**
   * Core Logging function
   */
  public static async log(payload: AuditLogPayload) {
    try {
      let resolvedUser = payload.user;
      if (!resolvedUser && payload.req) {
        resolvedUser = await getAuthenticatedUser(payload.req);
      }

      const userId = payload.userId || resolvedUser?.id || "usr-system";
      const userName = payload.userName || resolvedUser?.name || "ระบบงานอัตโนมัติ (System)";
      const role = payload.role || resolvedUser?.role || "SYSTEM";

      const ipAddress = payload.ipAddress || this.extractIpAddress(payload.req);
      const userAgent = payload.userAgent || this.extractUserAgent(payload.req);

      await auditRepo.create({
        userId,
        userName,
        role,
        action: payload.action,
        resource: payload.resource,
        resourceId: payload.resourceId || null,
        detailsJson: payload.details ? JSON.stringify(payload.details) : null,
        ipAddress: ipAddress,
        userAgent: userAgent,
      });
    } catch (err) {
      console.error("[AuditLogger Error]:", err);
    }
  }

  // --- Convenience Methods for the 6 tracked actions ---

  public static async logCreate(resource: string, resourceId: string, details?: any, req?: NextRequest) {
    return this.log({ action: "CREATE", resource, resourceId, details, req });
  }

  public static async logUpdate(resource: string, resourceId: string, details?: any, req?: NextRequest) {
    return this.log({ action: "UPDATE", resource, resourceId, details, req });
  }

  public static async logDelete(resource: string, resourceId: string, details?: any, req?: NextRequest) {
    return this.log({ action: "DELETE", resource, resourceId, details, req });
  }

  public static async logExportPdf(resource: string, resourceId: string, details?: any, req?: NextRequest) {
    return this.log({ action: "EXPORT_PDF", resource, resourceId, details, req });
  }

  public static async logExportDocx(resource: string, resourceId: string, details?: any, req?: NextRequest) {
    return this.log({ action: "EXPORT_DOCX", resource, resourceId, details, req });
  }

  public static async logLogin(user: { id?: string; name?: string; email?: string; role?: string }, req?: NextRequest, success: boolean = true) {
    return this.log({
      action: "LOGIN",
      resource: "Auth",
      resourceId: user.id || "usr-login",
      details: { email: user.email, role: user.role, status: success ? "SUCCESS" : "FAILED" },
      user,
      req,
    });
  }
}
