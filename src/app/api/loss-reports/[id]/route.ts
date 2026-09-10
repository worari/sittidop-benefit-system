import { NextRequest, NextResponse } from "next/server";
import { Role } from "@/core/domain/value-objects/enums";
import { authorizeRoles } from "@/infrastructure/auth/rbac-guard";
import { AuditLogger } from "@/infrastructure/logging/audit-logger";
import { LossIncidentReportRepository } from "@/infrastructure/database/repositories/LossIncidentReportRepository";
import * as mgrs from "mgrs";

const lossReportRepo = new LossIncidentReportRepository();

function normalizeDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function toResponseModel(row: any) {
  return {
    id: row.id,
    personnelId: row.personnelId,
    militaryId: row.militaryId,
    rankAbbr: row.rankAbbr,
    fullName: row.fullName,
    incidentDate: normalizeDate(row.incidentDate),
    incidentTime: row.incidentTime,
    mgrsCoordinate: row.mgrsCoordinate,
    latitude: row.latitude,
    longitude: row.longitude,
    village: row.village,
    houseNo: row.houseNo,
    road: row.road,
    subdistrict: row.subdistrict,
    district: row.district,
    province: row.province,
    eventSummary: row.eventSummary,
    behaviorSummary: row.behaviorSummary,
    engagementBehavior: row.engagementBehavior,
    enemyAction: row.enemyAction,
    casualties: row.casualties || [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toLatLon(mgrsText?: string): { latitude: number | null; longitude: number | null } {
  if (!mgrsText || !mgrsText.trim()) return { latitude: null, longitude: null };
  try {
    const point = mgrs.toPoint(mgrsText.trim());
    return { latitude: Number(point[1]), longitude: Number(point[0]) };
  } catch {
    return { latitude: null, longitude: null };
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const report = await lossReportRepo.findById(id);

    if (!report) {
      return NextResponse.json({ success: false, error: "ไม่พบรายงานการสูญเสียที่ระบุ" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: toResponseModel(report) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch report" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeRoles([Role.SUPERADMIN, Role.ADMIN, Role.STAFF, Role.COMMANDER], req);
  if (!auth.authorized) return auth.response!;

  try {
    const { id } = await params;
    const body = await req.json();

    if (!body.incidentDate || !body.incidentTime || !body.mgrsCoordinate || !body.eventSummary) {
      return NextResponse.json({ success: false, error: "กรุณากรอกข้อมูลสำคัญให้ครบ: วันเกิดเหตุ เวลา พิกัด MGRS และรายละเอียดเหตุการณ์" }, { status: 400 });
    }

    const { latitude, longitude } = toLatLon(body.mgrsCoordinate);

    const updated = await lossReportRepo.update(id, {
      personnelId: body.personnelId || null,
      militaryId: body.militaryId || null,
      rankAbbr: body.rankAbbr || null,
      fullName: body.fullName || null,
      incidentDate: new Date(body.incidentDate),
      incidentTime: body.incidentTime,
      mgrsCoordinate: body.mgrsCoordinate,
      latitude,
      longitude,
      village: body.village || null,
      houseNo: body.houseNo || null,
      road: body.road || null,
      subdistrict: body.subdistrict || null,
      district: body.district || null,
      province: body.province || null,
      eventSummary: body.eventSummary,
      behaviorSummary: body.behaviorSummary || null,
      engagementBehavior: body.engagementBehavior || "ปะทะ+ยิงต่อสู้",
      enemyAction: body.enemyAction || "ENEMY",
      casualties: Array.isArray(body.casualties) ? body.casualties : undefined,
      updatedByUserId: auth.user?.id || null,
      updatedByUserName: auth.user?.name || null,
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: "ไม่พบรายงานการสูญเสียที่ระบุ" }, { status: 404 });
    }

    await AuditLogger.log({
      action: "UPDATE",
      resource: "LossIncidentReport",
      resourceId: updated.id,
      details: {
        militaryId: updated.militaryId,
        fullName: updated.fullName,
        incidentDate: updated.incidentDate,
      },
      req,
    });

    return NextResponse.json({ success: true, data: toResponseModel(updated) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to update report" }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeRoles([Role.SUPERADMIN, Role.ADMIN, Role.STAFF], req);
  if (!auth.authorized) return auth.response!;

  try {
    const { id } = await params;
    const deleted = await lossReportRepo.delete(id);

    if (!deleted) {
      return NextResponse.json({ success: false, error: "ไม่พบรายงานการสูญเสียที่ระบุ" }, { status: 404 });
    }

    await AuditLogger.log({
      action: "DELETE",
      resource: "LossIncidentReport",
      resourceId: deleted.id,
      details: {
        militaryId: deleted.militaryId,
        fullName: deleted.fullName,
      },
      req,
    });

    return NextResponse.json({ success: true, message: "ลบรายงานการสูญเสียสำเร็จ" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to delete report" }, { status: 400 });
  }
}
