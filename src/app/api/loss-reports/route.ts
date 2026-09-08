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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const personnelId = searchParams.get("personnelId") || undefined;

    const rows = await lossReportRepo.findMany({ search, personnelId });

    return NextResponse.json({
      success: true,
      data: rows.map(toResponseModel),
      total: rows.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch loss reports" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await authorizeRoles([Role.SUPERADMIN, Role.ADMIN, Role.STAFF, Role.COMMANDER], req);
  if (!auth.authorized) return auth.response!;

  try {
    const body = await req.json();
    if (!body.incidentDate || !body.incidentTime || !body.mgrsCoordinate || !body.eventSummary) {
      return NextResponse.json({ success: false, error: "กรุณากรอกข้อมูลสำคัญให้ครบ: วันเกิดเหตุ เวลา พิกัด MGRS และรายละเอียดเหตุการณ์" }, { status: 400 });
    }

    const { latitude, longitude } = toLatLon(body.mgrsCoordinate);

    const created = await lossReportRepo.create({
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
      createdByUserId: auth.user?.id || null,
      createdByUserName: auth.user?.name || null,
      updatedByUserId: null,
      updatedByUserName: null,
    });

    await AuditLogger.log({
      action: "CREATE",
      resource: "LossIncidentReport",
      resourceId: created.id,
      details: {
        militaryId: created.militaryId,
        fullName: created.fullName,
        incidentDate: created.incidentDate,
        mgrsCoordinate: created.mgrsCoordinate,
      },
      req,
    });

    return NextResponse.json({ success: true, data: toResponseModel(created) }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to create loss report" }, { status: 400 });
  }
}
